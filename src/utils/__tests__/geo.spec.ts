import { describe, it, expect } from 'vitest'
import { haversineDistanceNm, flightDurationMinutes, interpolatePosition } from '../geo'

describe('haversineDistanceNm', () => {
  it('calculates distance between JFK and LAX', () => {
    const distance = haversineDistanceNm(40.6413, -73.7781, 33.9425, -118.408)
    // JFK to LAX is roughly 2,145 nm
    expect(distance).toBeGreaterThan(2100)
    expect(distance).toBeLessThan(2200)
  })

  it('returns 0 for same point', () => {
    const distance = haversineDistanceNm(40.6413, -73.7781, 40.6413, -73.7781)
    expect(distance).toBe(0)
  })
})

describe('flightDurationMinutes', () => {
  it('calculates duration correctly', () => {
    // 1000nm at 500 knots = 2 hours = 120 minutes
    expect(flightDurationMinutes(1000, 500)).toBe(120)
  })

  it('rounds up to nearest minute', () => {
    // 100nm at 300 knots = 20 minutes exactly
    expect(flightDurationMinutes(100, 300)).toBe(20)
  })
})

describe('interpolatePosition', () => {
  it('returns start at progress 0', () => {
    const pos = interpolatePosition({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, 0)
    expect(pos.lat).toBe(0)
    expect(pos.lng).toBe(0)
  })

  it('returns end at progress 1', () => {
    const pos = interpolatePosition({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, 1)
    expect(pos.lat).toBe(10)
    expect(pos.lng).toBe(10)
  })

  it('returns midpoint at progress 0.5', () => {
    const pos = interpolatePosition({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, 0.5)
    expect(pos.lat).toBe(5)
    expect(pos.lng).toBe(5)
  })

  it('clamps progress to 0-1', () => {
    const pos = interpolatePosition({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, 2)
    expect(pos.lat).toBe(10)
    expect(pos.lng).toBe(10)
  })
})
