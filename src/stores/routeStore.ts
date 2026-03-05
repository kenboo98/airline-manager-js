import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Route, RouteMetrics, TicketPricing } from '@/types'
import { generateId } from '@/utils/id'
import { usePlaneStore } from './planeStore'
import { useFlightStore } from './flightStore'
import { useAirportStore } from './airportStore'
import { useCompanyStore } from './companyStore'
import { useGameStore } from './gameStore'
import { useUiStore } from './uiStore'
import { formatCurrency } from '@/utils/format'
import { computeFairPrice } from '@/utils/pricing'

// Track which routes have active flights (plane is currently flying)
// routeId -> { flightId, direction: 'outbound' | 'return', departureTime }
interface ActiveRouteFlight {
  flightId: string
  direction: 'outbound' | 'return'
  departureTime: number
}

export const useRouteStore = defineStore('route', () => {
  const routes = ref<Map<string, Route>>(new Map())
  const activeRouteFlights = ref<Map<string, ActiveRouteFlight[]>>(new Map())

  const routeList = computed(() => Array.from(routes.value.values()))

  const enabledRoutes = computed(() => routeList.value.filter((r) => r.enabled))

  function getRoute(id: string): Route | undefined {
    return routes.value.get(id)
  }

  function getRoutesForAirport(airportCode: string): Route[] {
    return routeList.value.filter(
      (r) => r.originCode === airportCode || r.destinationCode === airportCode,
    )
  }

  function getRoutesForPlane(planeId: string): Route[] {
    return routeList.value.filter((r) => r.planeIds.includes(planeId))
  }

  function createRoute(params: {
    originCode: string
    destinationCode: string
    ticketPricing: TicketPricing
  }): Route {
    const route: Route = {
      id: generateId(),
      originCode: params.originCode,
      destinationCode: params.destinationCode,
      planeIds: [],
      ticketPricing: { ...params.ticketPricing },
      enabled: true,
      totalRevenue: 0,
      totalCost: 0,
      flightCount: 0,
      createdAt: Date.now(),
    }
    routes.value.set(route.id, route)
    activeRouteFlights.value.set(route.id, [])
    return route
  }

  function deleteRoute(routeId: string): boolean {
    const route = routes.value.get(routeId)
    if (!route) return false

    const planeStore = usePlaneStore()

    // Unassign all planes from this route
    for (const planeId of route.planeIds) {
      const plane = planeStore.getPlane(planeId)
      if (plane) {
        plane.assignedRouteId = null
      }
    }

    routes.value.delete(routeId)
    activeRouteFlights.value.delete(routeId)
    return true
  }

  function assignPlane(routeId: string, planeId: string): boolean {
    const route = routes.value.get(routeId)
    if (!route) return false

    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) return false

    // If plane is already assigned to a different route, unassign it
    if (plane.assignedRouteId && plane.assignedRouteId !== routeId) {
      unassignPlane(plane.assignedRouteId, planeId)
    }

    // Add plane to route if not already there
    if (!route.planeIds.includes(planeId)) {
      route.planeIds.push(planeId)
    }

    plane.assignedRouteId = routeId
    return true
  }

  function unassignPlane(routeId: string, planeId: string): boolean {
    const route = routes.value.get(routeId)
    if (!route) return false

    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)

    route.planeIds = route.planeIds.filter((id) => id !== planeId)

    if (plane) {
      plane.assignedRouteId = null
    }

    return true
  }

  function toggleRouteEnabled(routeId: string): boolean {
    const route = routes.value.get(routeId)
    if (!route) return false
    route.enabled = !route.enabled
    return true
  }

  function updateTicketPricing(routeId: string, pricing: TicketPricing): boolean {
    const route = routes.value.get(routeId)
    if (!route) return false
    route.ticketPricing = { ...pricing }
    return true
  }

  function getMetrics(routeId: string): RouteMetrics | null {
    const route = routes.value.get(routeId)
    if (!route) return null

    const profit = route.totalRevenue - route.totalCost
    const flightCount = Math.max(route.flightCount, 1) // Avoid division by zero

    return {
      routeId,
      totalRevenue: route.totalRevenue,
      totalCost: route.totalCost,
      profit,
      flightCount: route.flightCount,
      averageRevenuePerFlight: route.totalRevenue / flightCount,
      averageCostPerFlight: route.totalCost / flightCount,
      averageProfitPerFlight: profit / flightCount,
    }
  }

  // Get all routes as polylines for map display
  const routePolylines = computed(() => {
    const airportStore = useAirportStore()
    return routeList.value
      .map((route) => {
        const origin = airportStore.getByCode(route.originCode)
        const dest = airportStore.getByCode(route.destinationCode)
        if (!origin || !dest) return null
        return {
          id: route.id,
          latLngs: [
            [origin.lat, origin.lng],
            [dest.lat, dest.lng],
          ] as [number, number][],
          enabled: route.enabled,
          planeCount: route.planeIds.length,
        }
      })
      .filter(Boolean)
  })

  // Process tick - create flights for routes that have available planes
  function processTick(totalMinutes: number) {
    const planeStore = usePlaneStore()
    const flightStore = useFlightStore()
    const airportStore = useAirportStore()
    const companyStore = useCompanyStore()
    const gameStore = useGameStore()
    const uiStore = useUiStore()

    for (const route of enabledRoutes.value) {
      // Skip if no planes assigned
      if (route.planeIds.length === 0) continue

      // Get active flights for this route
      let activeFlights = activeRouteFlights.value.get(route.id) || []

      // Clean up completed flights
      activeFlights = activeFlights.filter((af) => {
        const flight = flightStore.flights.get(af.flightId)
        return flight && flight.status !== 'arrived'
      })

      // Try to launch new flights for available planes
      for (const planeId of route.planeIds) {
        const plane = planeStore.getPlane(planeId)
        if (!plane || plane.status !== 'available') continue

        // Check if this plane already has an active flight on this route
        const hasActiveFlight = activeFlights.some((af) => {
          const flight = flightStore.flights.get(af.flightId)
          return flight?.planeId === planeId && flight?.status !== 'arrived'
        })
        if (hasActiveFlight) continue

        // Determine direction based on plane's current location
        const isAtOrigin = plane.currentAirportCode === route.originCode
        const isAtDestination = plane.currentAirportCode === route.destinationCode

        if (!isAtOrigin && !isAtDestination) {
          // Plane is somewhere else, skip (shouldn't happen in normal gameplay)
          continue
        }

        const departureCode = isAtOrigin ? route.originCode : route.destinationCode
        const arrivalCode = isAtOrigin ? route.destinationCode : route.originCode
        const direction = isAtOrigin ? 'outbound' : 'return'

        // Validate plane can make this flight
        const model = planeStore.getModel(plane.modelId)
        if (!model) continue

        const distance = airportStore.getDistanceNm(departureCode, arrivalCode)
        const arrAirport = airportStore.getByCode(arrivalCode)

        if (distance > model.range) continue
        if (arrAirport && model.minRunwayLength > arrAirport.runwayLength) continue

        // Create the flight
        const flightNumber = `AM${flightStore.flightList.length + 101}`
        const departureTime = totalMinutes + 5 // Depart in 5 minutes

        const flight = flightStore.createFlight({
          flightNumber,
          departureAirportCode: departureCode,
          arrivalAirportCode: arrivalCode,
          planeId,
          departureTime,
          ticketPricing: route.ticketPricing,
        })

        if (flight) {
          activeFlights.push({
            flightId: flight.id,
            direction,
            departureTime,
          })

          // Track route metrics when flight completes (we'll update on arrival via flightStore)
          // For now, just track that we created a flight
        }
      }

      activeRouteFlights.value.set(route.id, activeFlights)
    }

    // Update route metrics from completed flights
    updateRouteMetricsFromFlights(flightStore, companyStore, uiStore, gameStore)
  }

  function updateRouteMetricsFromFlights(
    flightStore: ReturnType<typeof useFlightStore>,
    companyStore: ReturnType<typeof useCompanyStore>,
    uiStore: ReturnType<typeof useUiStore>,
    gameStore: ReturnType<typeof useGameStore>,
  ) {
    // Check for newly arrived flights that belong to routes
    for (const route of routes.value.values()) {
      const activeFlights = activeRouteFlights.value.get(route.id) || []

      for (const af of [...activeFlights]) {
        const flight = flightStore.flights.get(af.flightId)
        if (flight && flight.status === 'arrived' && flight.revenue > 0) {
          // This flight just completed - update route metrics
          route.totalRevenue += flight.revenue
          route.totalCost += flight.cost
          route.flightCount += 1

          // Remove from active flights
          const idx = activeFlights.indexOf(af)
          if (idx > -1) {
            activeFlights.splice(idx, 1)
          }
        }
      }

      activeRouteFlights.value.set(route.id, activeFlights)
    }
  }

  // Compute suggested ticket pricing for a route based on distance
  function computeSuggestedPricing(originCode: string, destinationCode: string): TicketPricing {
    const airportStore = useAirportStore()
    const distance = airportStore.getDistanceNm(originCode, destinationCode)

    return {
      economy: computeFairPrice(distance, 'economy'),
      business: computeFairPrice(distance, 'business'),
      firstClass: computeFairPrice(distance, 'firstClass'),
    }
  }

  return {
    routes,
    routeList,
    enabledRoutes,
    routePolylines,
    getRoute,
    getRoutesForAirport,
    getRoutesForPlane,
    createRoute,
    deleteRoute,
    assignPlane,
    unassignPlane,
    toggleRouteEnabled,
    updateTicketPricing,
    getMetrics,
    processTick,
    computeSuggestedPricing,
  }
})
