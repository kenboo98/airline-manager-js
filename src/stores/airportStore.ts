import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Airport, Passenger, DestinationDemand } from '@/types'
import { airports as airportData } from '@/data/airports'
import { haversineDistanceNm, flightDurationMinutes } from '@/utils/geo'
import { generateId } from '@/utils/id'

export type PassengerType = 'business' | 'leisure' | 'ultraWealthy'

export const useAirportStore = defineStore('airport', () => {
  const airports = ref<Map<string, Airport>>(new Map())

  // Passengers waiting at each airport (airportCode -> Passenger[])
  const passengers = ref<Map<string, Passenger[]>>(new Map())

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
    // Initialize empty passenger lists for each airport
    passengers.value = new Map()
    for (const code of map.keys()) {
      passengers.value.set(code, [])
    }
  }

  // Get passengers waiting at an airport
  function getPassengers(airportCode: string): Passenger[] {
    return passengers.value.get(airportCode) ?? []
  }

  // Get top destinations for an airport (sorted by passenger demand)
  function getTopDestinations(airportCode: string, limit: number = 3): DestinationDemand[] {
    const waiting = getPassengers(airportCode)
    const destMap = new Map<string, DestinationDemand>()

    for (const p of waiting) {
      const dest = getByCode(p.destinationCode)
      if (!dest) continue

      const existing = destMap.get(p.destinationCode)
      if (existing) {
        existing.passengerCount++
        if (p.type === 'business') existing.businessCount++
        else if (p.type === 'leisure') existing.leisureCount++
        else if (p.type === 'ultraWealthy') existing.ultraWealthyCount++
      } else {
        destMap.set(p.destinationCode, {
          code: p.destinationCode,
          name: dest.name,
          city: dest.city,
          passengerCount: 1,
          businessCount: p.type === 'business' ? 1 : 0,
          leisureCount: p.type === 'leisure' ? 1 : 0,
          ultraWealthyCount: p.type === 'ultraWealthy' ? 1 : 0,
        })
      }
    }

    return Array.from(destMap.values())
      .sort((a, b) => b.passengerCount - a.passengerCount)
      .slice(0, limit)
  }

  // Add passengers to an airport
  function addPassenger(airportCode: string, passenger: Passenger) {
    const list = passengers.value.get(airportCode)
    if (list) {
      list.push(passenger)
    }
  }

  // Remove passengers from an airport (when they book a flight)
  function removePassengers(airportCode: string, passengerIds: string[]) {
    const list = passengers.value.get(airportCode)
    if (list) {
      const idSet = new Set(passengerIds)
      passengers.value.set(
        airportCode,
        list.filter((p) => !idSet.has(p.id)),
      )
    }
  }

  // Generate max price based on passenger type and distance
  function computeMaxPrice(type: PassengerType, distanceNm: number): number {
    // Base price per nautical mile by type
    const baseRates: Record<PassengerType, number> = {
      leisure: 0.08, // Budget-conscious
      business: 0.25, // Willing to pay more
      ultraWealthy: 0.5, // Money is no object
    }

    // Fixed fees by type
    const fixedFees: Record<PassengerType, number> = {
      leisure: 40,
      business: 120,
      ultraWealthy: 250,
    }

    // Variation factor (±20% randomness for individual preference)
    const variation = 0.8 + Math.random() * 0.4

    const base = distanceNm * baseRates[type]
    const fixed = fixedFees[type]
    return Math.round((base + fixed) * variation)
  }

  // Generate a batch of passengers for an airport
  function generatePassengers(airportCode: string, totalMinutes: number): Passenger[] {
    const airport = getByCode(airportCode)
    if (!airport) return []

    const newPassengers: Passenger[] = []
    const otherAirports = airportList.value.filter((a) => a.code !== airportCode)

    if (otherAirports.length === 0) return []

    // Generate passengers based on airport demand
    // Scale: demand numbers are per day, we generate per tick (~10 min at speed 1)
    const tickFraction = 10 / 1440 // fraction of a day per tick

    const generateForType = (type: PassengerType, count: number) => {
      const scaledCount = Math.floor(count * tickFraction)
      // Add some randomness
      const finalCount = Math.random() < 0.5 ? scaledCount : scaledCount + 1

      for (let i = 0; i < finalCount; i++) {
        // Pick random destination weighted by inverse distance (closer = more likely)
        const dest = pickWeightedDestination(airportCode, otherAirports)
        if (!dest) continue

        const distance = getDistanceNm(airportCode, dest.code)
        const maxPrice = computeMaxPrice(type, distance)

        newPassengers.push({
          id: generateId(),
          type,
          destinationCode: dest.code,
          maxPrice,
          createdAt: totalMinutes,
        })
      }
    }

    generateForType('leisure', airport.demand.leisure)
    generateForType('business', airport.demand.business)
    generateForType('ultraWealthy', airport.demand.firstClass)

    return newPassengers
  }

  // Pick a destination weighted by popularity (inverse distance)
  function pickWeightedDestination(fromCode: string, candidates: Airport[]): Airport | null {
    if (candidates.length === 0) return null

    // Weight by inverse distance - closer airports are more popular destinations
    const weights = candidates.map((dest) => {
      const dist = getDistanceNm(fromCode, dest.code)
      return { airport: dest, weight: 1 / Math.max(dist, 50) } // min 50nm to avoid infinity
    })

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * totalWeight

    for (const { airport, weight } of weights) {
      random -= weight
      if (random <= 0) return airport
    }

    return candidates[candidates.length - 1]
  }

  // Process tick - generate new passengers at each airport
  function processTick(totalMinutes: number) {
    for (const code of airports.value.keys()) {
      const newPassengers = generatePassengers(code, totalMinutes)
      for (const p of newPassengers) {
        addPassenger(code, p)
      }
    }
  }

  // Count passengers waiting for a specific destination
  function countPassengersForDestination(fromCode: string, toCode: string): number {
    const waiting = getPassengers(fromCode)
    return waiting.filter((p) => p.destinationCode === toCode).length
  }

  // Count passengers by type waiting for a destination
  function countPassengersByType(fromCode: string, toCode: string, type: PassengerType): number {
    const waiting = getPassengers(fromCode)
    return waiting.filter((p) => p.destinationCode === toCode && p.type === type).length
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
    // Passenger management
    getPassengers,
    getTopDestinations,
    addPassenger,
    removePassengers,
    generatePassengers,
    computeMaxPrice,
    processTick,
    countPassengersForDestination,
    countPassengersByType,
  }
})
