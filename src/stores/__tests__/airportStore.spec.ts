import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAirportStore } from '../airportStore'

describe('airportStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads airports', () => {
    const store = useAirportStore()
    store.loadAirports()
    expect(store.airportList.length).toBeGreaterThanOrEqual(30)
  })

  it('gets airport by code', () => {
    const store = useAirportStore()
    store.loadAirports()
    const jfk = store.getByCode('JFK')
    expect(jfk).toBeDefined()
    expect(jfk!.city).toBe('New York')
  })

  it('searches airports by city', () => {
    const store = useAirportStore()
    store.loadAirports()
    const results = store.searchAirports('new york')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((a) => a.code === 'JFK')).toBe(true)
  })

  it('calculates distance between airports', () => {
    const store = useAirportStore()
    store.loadAirports()
    const distance = store.getDistanceNm('JFK', 'LAX')
    expect(distance).toBeGreaterThan(2100)
    expect(distance).toBeLessThan(2200)
  })

  it('returns sorted by demand', () => {
    const store = useAirportStore()
    store.loadAirports()
    const sorted = store.sortedByDemand
    const firstDemand =
      sorted[0].demand.business + sorted[0].demand.leisure + sorted[0].demand.firstClass
    const lastDemand =
      sorted[sorted.length - 1].demand.business +
      sorted[sorted.length - 1].demand.leisure +
      sorted[sorted.length - 1].demand.firstClass
    expect(firstDemand).toBeGreaterThanOrEqual(lastDemand)
  })
})
