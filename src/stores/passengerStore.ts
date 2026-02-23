import { defineStore } from 'pinia'
import { useAirportStore } from './airportStore'
import { useFlightStore } from './flightStore'
import { usePlaneStore } from './planeStore'
import { computeFairPrice, computeBookingRate } from '@/utils/pricing'

export const usePassengerStore = defineStore('passenger', () => {
  function computeDemand(
    fromCode: string,
    toCode: string,
    pricing: { economy: number; business: number; firstClass: number },
  ) {
    const airportStore = useAirportStore()
    const from = airportStore.getByCode(fromCode)
    const to = airportStore.getByCode(toCode)
    if (!from || !to) return { economy: 0, business: 0, firstClass: 0 }

    const distance = airportStore.getDistanceNm(fromCode, toCode)
    const avgDemand = {
      business: Math.floor((from.demand.business + to.demand.business) / 2),
      leisure: Math.floor((from.demand.leisure + to.demand.leisure) / 2),
      firstClass: Math.floor((from.demand.firstClass + to.demand.firstClass) / 2),
    }

    const fairEconomy = computeFairPrice(distance, 'economy')
    const fairBusiness = computeFairPrice(distance, 'business')
    const fairFirst = computeFairPrice(distance, 'firstClass')

    const economyRate = computeBookingRate(pricing.economy, fairEconomy, 5, avgDemand.leisure)
    const businessRate = computeBookingRate(pricing.business, fairBusiness, 5, avgDemand.business)
    const firstClassRate = computeBookingRate(pricing.firstClass, fairFirst, 5, avgDemand.firstClass)

    return { economy: economyRate, business: businessRate, firstClass: firstClassRate }
  }

  function processTick(totalMinutes: number) {
    const flightStore = useFlightStore()
    const planeStore = usePlaneStore()
    const airportStore = useAirportStore()

    for (const flight of flightStore.flights.values()) {
      if (flight.status !== 'scheduled') continue

      const plane = planeStore.getPlane(flight.planeId)
      if (!plane) continue
      const model = planeStore.getModel(plane.modelId)
      if (!model) continue

      const daysUntilDeparture = Math.max(0, (flight.departureTime - totalMinutes) / 1440)
      const distance = airportStore.getDistanceNm(
        flight.departureAirportCode,
        flight.arrivalAirportCode,
      )

      const from = airportStore.getByCode(flight.departureAirportCode)
      const to = airportStore.getByCode(flight.arrivalAirportCode)
      if (!from || !to) continue

      const avgDemand = {
        leisure: Math.floor((from.demand.leisure + to.demand.leisure) / 2),
        business: Math.floor((from.demand.business + to.demand.business) / 2),
        firstClass: Math.floor((from.demand.firstClass + to.demand.firstClass) / 2),
      }

      const fairEconomy = computeFairPrice(distance, 'economy')
      const fairBusiness = computeFairPrice(distance, 'business')
      const fairFirst = computeFairPrice(distance, 'firstClass')

      const eRate = computeBookingRate(
        flight.ticketPricing.economy,
        fairEconomy,
        daysUntilDeparture,
        avgDemand.leisure,
      )
      const bRate = computeBookingRate(
        flight.ticketPricing.business,
        fairBusiness,
        daysUntilDeparture,
        avgDemand.business,
      )
      const fRate = computeBookingRate(
        flight.ticketPricing.firstClass,
        fairFirst,
        daysUntilDeparture,
        avgDemand.firstClass,
      )

      flight.passengers.economy = Math.min(
        flight.passengers.economy + eRate,
        plane.seats.economy,
      )
      flight.passengers.business = Math.min(
        flight.passengers.business + bRate,
        plane.seats.business,
      )
      flight.passengers.firstClass = Math.min(
        flight.passengers.firstClass + fRate,
        plane.seats.firstClass,
      )
    }
  }

  return {
    computeDemand,
    processTick,
  }
})
