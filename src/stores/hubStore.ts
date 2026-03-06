import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Hub } from '@/types/hub'
import { hubLevels, computeHubCost } from '@/data/hubs'
import { generateId } from '@/utils/id'
import { useAirportStore } from './airportStore'
import { useCompanyStore } from './companyStore'
import { useFlightStore } from './flightStore'

export const useHubStore = defineStore('hub', () => {
  const hubs = ref<Map<string, Hub>>(new Map())

  const hubList = computed(() => Array.from(hubs.value.values()))

  function getHub(id: string): Hub | undefined {
    return hubs.value.get(id)
  }

  function getHubByCode(code: string): Hub | undefined {
    return hubList.value.find((h) => h.airportCode === code)
  }

  function isHub(code: string): boolean {
    return hubList.value.some((h) => h.airportCode === code)
  }

  function hubCodes(): string[] {
    return hubList.value.map((h) => h.airportCode)
  }

  function getHubCost(airportCode: string): number {
    const airportStore = useAirportStore()
    const airport = airportStore.getByCode(airportCode)
    if (!airport) return 0
    const totalDemand = airport.demand.business + airport.demand.leisure + airport.demand.firstClass
    return computeHubCost(totalDemand)
  }

  function getRouteCount(hubCode: string): number {
    const flightStore = useFlightStore()
    const uniqueRoutes = new Set<string>()
    for (const flight of flightStore.flightList) {
      if (flight.departureAirportCode === hubCode && flight.status !== 'cancelled') {
        const routeKey = `${flight.departureAirportCode}-${flight.arrivalAirportCode}`
        uniqueRoutes.add(routeKey)
      }
    }
    // Also count schedules
    for (const schedule of flightStore.schedules.values()) {
      if (schedule.departureAirportCode === hubCode) {
        const routeKey = `${schedule.departureAirportCode}-${schedule.arrivalAirportCode}`
        uniqueRoutes.add(routeKey)
      }
    }
    return uniqueRoutes.size
  }

  function canOriginateRoute(code: string): boolean {
    const hub = getHubByCode(code)
    if (!hub) return false
    return getRouteCount(code) < hub.maxRoutes
  }

  function hubLandingFeeDiscount(depCode: string, arrCode: string): number {
    if (isHub(depCode) && isHub(arrCode)) return 0.5
    return 1.0
  }

  function purchaseHub(code: string, totalMinutes: number, free = false): Hub | null {
    if (isHub(code)) return null

    const cost = getHubCost(code)

    if (!free) {
      const companyStore = useCompanyStore()
      if (companyStore.company.cash < cost) return null
      companyStore.deductCash(cost)
    }

    const hub: Hub = {
      id: generateId(),
      airportCode: code,
      level: 1,
      maxRoutes: hubLevels[0].maxRoutes,
      purchasedAt: totalMinutes,
    }

    hubs.value.set(hub.id, hub)
    return hub
  }

  function upgradeHub(hubId: string): boolean {
    const hub = hubs.value.get(hubId)
    if (!hub) return false

    const nextLevel = hubLevels.find((l) => l.level === hub.level + 1)
    if (!nextLevel) return false

    const companyStore = useCompanyStore()
    if (companyStore.company.cash < nextLevel.upgradeCost) return false

    companyStore.deductCash(nextLevel.upgradeCost)
    hub.level = nextLevel.level
    hub.maxRoutes = nextLevel.maxRoutes
    return true
  }

  return {
    hubs,
    hubList,
    getHub,
    getHubByCode,
    isHub,
    hubCodes,
    getHubCost,
    getRouteCount,
    canOriginateRoute,
    hubLandingFeeDiscount,
    purchaseHub,
    upgradeHub,
  }
})
