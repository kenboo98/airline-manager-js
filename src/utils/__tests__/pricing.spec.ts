import { describe, it, expect } from 'vitest'
import { computeFairPrice, computeBookingRate } from '../pricing'

describe('computeFairPrice', () => {
  it('computes economy price for 1000nm', () => {
    const price = computeFairPrice(1000, 'economy')
    // 1000 * 0.12 + 50 = 170
    expect(price).toBe(170)
  })

  it('computes business price for 1000nm', () => {
    const price = computeFairPrice(1000, 'business')
    // 1000 * 0.35 + 150 = 500
    expect(price).toBe(500)
  })

  it('computes first class price for 1000nm', () => {
    const price = computeFairPrice(1000, 'firstClass')
    // 1000 * 0.65 + 300 = 950
    expect(price).toBe(950)
  })
})

describe('computeBookingRate', () => {
  it('returns positive bookings when price equals fair price', () => {
    const rate = computeBookingRate(170, 170, 5, 300)
    expect(rate).toBeGreaterThan(0)
  })

  it('returns lower bookings when price is higher than fair', () => {
    const highRate = computeBookingRate(100, 170, 5, 300)
    const lowRate = computeBookingRate(300, 170, 5, 300)
    expect(highRate).toBeGreaterThan(lowRate)
  })

  it('returns 0 when demand is 0', () => {
    const rate = computeBookingRate(170, 170, 5, 0)
    expect(rate).toBe(0)
  })
})
