import { defineStore } from 'pinia'
import type { Passenger, PassengerType } from '@/types'
import { useAirportStore } from './airportStore'
import { useFlightStore } from './flightStore'
import { usePlaneStore } from './planeStore'

export const usePassengerStore = defineStore('passenger', () => {
  // Map passenger type to seat class
  function getSeatClass(type: PassengerType): 'economy' | 'business' | 'firstClass' {
    switch (type) {
      case 'leisure':
        return 'economy'
      case 'business':
        return 'business'
      case 'ultraWealthy':
        return 'firstClass'
    }
  }

  // Check if a passenger will buy a ticket based on price
  function willBuyTicket(passenger: Passenger, ticketPrice: number): boolean {
    return ticketPrice <= passenger.maxPrice
  }

  // Compute demand preview for flight creation (how many passengers want to go there)
  function computeDemand(
    fromCode: string,
    toCode: string,
    pricing: { economy: number; business: number; firstClass: number },
  ) {
    const airportStore = useAirportStore()
    const passengers = airportStore.getPassengers(fromCode)

    let economy = 0
    let business = 0
    let firstClass = 0

    for (const p of passengers) {
      if (p.destinationCode !== toCode) continue

      const seatClass = getSeatClass(p.type)
      const price = pricing[seatClass]

      if (willBuyTicket(p, price)) {
        if (seatClass === 'economy') economy++
        else if (seatClass === 'business') business++
        else if (seatClass === 'firstClass') firstClass++
      }
    }

    return { economy, business, firstClass }
  }

  // Process bookings for all scheduled flights
  function processTick(totalMinutes: number) {
    const flightStore = useFlightStore()
    const planeStore = usePlaneStore()
    const airportStore = useAirportStore()

    // First, generate new passengers at airports
    airportStore.processTick(totalMinutes)

    // Then, book passengers onto scheduled flights
    for (const flight of flightStore.flights.values()) {
      if (flight.status !== 'scheduled') continue

      const plane = planeStore.getPlane(flight.planeId)
      if (!plane) continue

      const waitingPassengers = airportStore.getPassengers(flight.departureAirportCode)

      // Find passengers who want to go to this destination and can afford the ticket
      const eligiblePassengers = waitingPassengers.filter(
        (p) =>
          p.destinationCode === flight.arrivalAirportCode &&
          willBuyTicket(p, flight.ticketPricing[getSeatClass(p.type)]),
      )

      // Group by seat class needed
      const byClass: Record<PassengerType, Passenger[]> = {
        leisure: [],
        business: [],
        ultraWealthy: [],
      }

      for (const p of eligiblePassengers) {
        byClass[p.type].push(p)
      }

      // Book passengers into available seats (FIFO - first come, first served)
      const bookedPassengerIds: string[] = []

      // Economy seats for leisure passengers
      const economyAvailable = plane.seats.economy - flight.passengers.economy
      const economyToBook = Math.min(economyAvailable, byClass.leisure.length)
      for (let i = 0; i < economyToBook; i++) {
        bookedPassengerIds.push(byClass.leisure[i].id)
      }
      flight.passengers.economy += economyToBook

      // Business seats for business passengers
      const businessAvailable = plane.seats.business - flight.passengers.business
      const businessToBook = Math.min(businessAvailable, byClass.business.length)
      for (let i = 0; i < businessToBook; i++) {
        bookedPassengerIds.push(byClass.business[i].id)
      }
      flight.passengers.business += businessToBook

      // First class seats for ultra wealthy passengers
      const firstClassAvailable = plane.seats.firstClass - flight.passengers.firstClass
      const firstClassToBook = Math.min(firstClassAvailable, byClass.ultraWealthy.length)
      for (let i = 0; i < firstClassToBook; i++) {
        bookedPassengerIds.push(byClass.ultraWealthy[i].id)
      }
      flight.passengers.firstClass += firstClassToBook

      // Remove booked passengers from the airport
      if (bookedPassengerIds.length > 0) {
        airportStore.removePassengers(flight.departureAirportCode, bookedPassengerIds)
      }
    }
  }

  return {
    computeDemand,
    processTick,
    getSeatClass,
    willBuyTicket,
  }
})
