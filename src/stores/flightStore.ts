import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Flight, FlightSchedule, TicketPricing } from '@/types'
import { generateId } from '@/utils/id'
import { useAirportStore } from './airportStore'
import { usePlaneStore } from './planeStore'
import { useCompanyStore } from './companyStore'

export const useFlightStore = defineStore('flight', () => {
  const flights = ref<Map<string, Flight>>(new Map())
  const schedules = ref<Map<string, FlightSchedule>>(new Map())

  const flightList = computed(() => Array.from(flights.value.values()))

  const activeFlights = computed(() =>
    flightList.value.filter((f) => f.status === 'scheduled' || f.status === 'in-flight'),
  )

  const scheduledFlights = computed(() =>
    flightList.value.filter((f) => f.status === 'scheduled'),
  )

  const currentlyFlying = computed(() =>
    flightList.value.filter((f) => f.status === 'in-flight'),
  )

  const completedFlights = computed(() =>
    flightList.value.filter((f) => f.status === 'arrived'),
  )

  function createFlight(params: {
    flightNumber: string
    departureAirportCode: string
    arrivalAirportCode: string
    planeId: string
    departureTime: number
    ticketPricing: TicketPricing
  }): Flight | null {
    const airportStore = useAirportStore()
    const planeStore = usePlaneStore()

    const model = (() => {
      const plane = planeStore.getPlane(params.planeId)
      return plane ? planeStore.getModel(plane.modelId) : undefined
    })()
    if (!model) return null

    const distance = airportStore.getDistanceNm(
      params.departureAirportCode,
      params.arrivalAirportCode,
    )
    const duration = airportStore.getFlightDurationMinutes(
      params.departureAirportCode,
      params.arrivalAirportCode,
      model.speed,
    )

    const cost = distance * model.operatingCostPerNm
    const depAirport = airportStore.getByCode(params.departureAirportCode)
    const arrAirport = airportStore.getByCode(params.arrivalAirportCode)
    const landingFees = (depAirport?.landingFee ?? 0) + (arrAirport?.landingFee ?? 0)

    const flight: Flight = {
      id: generateId(),
      flightNumber: params.flightNumber,
      departureAirportCode: params.departureAirportCode,
      arrivalAirportCode: params.arrivalAirportCode,
      planeId: params.planeId,
      departureTime: params.departureTime,
      arrivalTime: params.departureTime + duration,
      ticketPricing: { ...params.ticketPricing },
      passengers: { economy: 0, business: 0, firstClass: 0 },
      status: 'scheduled',
      revenue: 0,
      cost: cost + landingFees,
      distanceNm: distance,
    }

    flights.value.set(flight.id, flight)
    return flight
  }

  function createSchedule(params: {
    flightNumber: string
    departureAirportCode: string
    arrivalAirportCode: string
    planeId: string
    departureTimeOfDay: number
    daysOfWeek: number[]
    ticketPricing: TicketPricing
  }): FlightSchedule {
    const schedule: FlightSchedule = {
      id: generateId(),
      ...params,
      enabled: true,
    }
    schedules.value.set(schedule.id, schedule)
    return schedule
  }

  function cancelFlight(id: string) {
    const flight = flights.value.get(id)
    if (flight && flight.status === 'scheduled') {
      flight.status = 'cancelled'
      const planeStore = usePlaneStore()
      planeStore.setStatus(flight.planeId, 'available')
    }
  }

  function processTick(totalMinutes: number) {
    const planeStore = usePlaneStore()
    const companyStore = useCompanyStore()

    for (const flight of flights.value.values()) {
      // Handle departures
      if (flight.status === 'scheduled' && totalMinutes >= flight.departureTime) {
        flight.status = 'in-flight'
        const plane = planeStore.getPlane(flight.planeId)
        if (plane) {
          planeStore.setStatus(flight.planeId, 'in-flight')
          plane.currentFlightId = flight.id
        }
        companyStore.addExpense(flight.cost)
      }

      // Handle arrivals
      if (flight.status === 'in-flight' && totalMinutes >= flight.arrivalTime) {
        flight.status = 'arrived'
        const plane = planeStore.getPlane(flight.planeId)
        if (plane) {
          planeStore.setStatus(flight.planeId, 'available')
          planeStore.updateLocation(flight.planeId, flight.arrivalAirportCode)
          plane.currentFlightId = null
          const durationHours = (flight.arrivalTime - flight.departureTime) / 60
          plane.totalFlightHours += durationHours
        }
        const revenue =
          flight.passengers.economy * flight.ticketPricing.economy +
          flight.passengers.business * flight.ticketPricing.business +
          flight.passengers.firstClass * flight.ticketPricing.firstClass
        flight.revenue = revenue
        companyStore.addRevenue(revenue)
      }
    }

    // Schedule instantiation: on new game-day, generate flights from schedules
    const currentDay = Math.floor(totalMinutes / 1440)
    const dayOfWeek = currentDay % 7
    const minuteOfDay = totalMinutes % 1440

    if (minuteOfDay < 1) {
      for (const schedule of schedules.value.values()) {
        if (!schedule.enabled) continue
        if (!schedule.daysOfWeek.includes(dayOfWeek)) continue

        const departureTime = currentDay * 1440 + schedule.departureTimeOfDay
        createFlight({
          flightNumber: schedule.flightNumber,
          departureAirportCode: schedule.departureAirportCode,
          arrivalAirportCode: schedule.arrivalAirportCode,
          planeId: schedule.planeId,
          departureTime,
          ticketPricing: schedule.ticketPricing,
        })
      }
    }
  }

  return {
    flights,
    schedules,
    flightList,
    activeFlights,
    scheduledFlights,
    currentlyFlying,
    completedFlights,
    createFlight,
    createSchedule,
    cancelFlight,
    processTick,
  }
})
