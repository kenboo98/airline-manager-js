import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Airport } from '@/types'
import { airports as airportData } from '@/data/airports'
import { haversineDistanceNm, flightDurationMinutes } from '@/utils/geo'

export const useAirportStore = defineStore('airport', () => {
  const airports = ref<Map<string, Airport>>(new Map())

  const airportList = computed(() => Array.from(airports.value.values()))

  function getByCode(code: string): Airport | undefined {
    return airports.value.get(code)
  }

  function searchAirports(query: string): Airport[] {
    const q = query.toLowerCase()
    return airportList.value.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q),
    )
  }

  const sortedByDemand = computed(() =>
    [...airportList.value].sort((a, b) => {
      const demandA = a.demand.business + a.demand.leisure + a.demand.firstClass
      const demandB = b.demand.business + b.demand.leisure + b.demand.firstClass
      return demandB - demandA
    }),
  )

  function getDistanceNm(from: string, to: string): number {
    const a = airports.value.get(from)
    const b = airports.value.get(to)
    if (!a || !b) return 0
    return haversineDistanceNm(a.lat, a.lng, b.lat, b.lng)
  }

  function getFlightDurationMinutes(from: string, to: string, speed: number): number {
    const distance = getDistanceNm(from, to)
    return flightDurationMinutes(distance, speed)
  }

  function loadAirports() {
    const map = new Map<string, Airport>()
    for (const airport of airportData) {
      map.set(airport.code, airport)
    }
    airports.value = map
  }

  return {
    airports,
    airportList,
    sortedByDemand,
    getByCode,
    searchAirports,
    getDistanceNm,
    getFlightDurationMinutes,
    loadAirports,
  }
})
