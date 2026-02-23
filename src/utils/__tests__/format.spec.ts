import { describe, it, expect } from 'vitest'
import { formatCurrency, formatGameTime, formatDuration } from '../format'

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(10000000)).toBe('$10,000,000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })
})

describe('formatGameTime', () => {
  it('formats day 1 midnight', () => {
    expect(formatGameTime(0)).toBe('Day 1 00:00')
  })

  it('formats day 2 at 14:30', () => {
    // Day 2 14:30 = 1440 + 14*60 + 30 = 2310
    expect(formatGameTime(2310)).toBe('Day 2 14:30')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(150)).toBe('2h 30m')
  })

  it('formats zero minutes', () => {
    expect(formatDuration(0)).toBe('0m')
  })
})
