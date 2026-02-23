export function computeFairPrice(distanceNm: number, seatClass: 'economy' | 'business' | 'firstClass'): number {
  const basePerNm: Record<string, number> = {
    economy: 0.12,
    business: 0.35,
    firstClass: 0.65,
  }
  const base = distanceNm * basePerNm[seatClass]
  const fixed: Record<string, number> = {
    economy: 50,
    business: 150,
    firstClass: 300,
  }
  return Math.round(base + fixed[seatClass])
}

export function computeBookingRate(
  price: number,
  fairPrice: number,
  daysUntilDeparture: number,
  demand: number,
): number {
  const priceRatio = fairPrice / Math.max(price, 1)
  const priceFactor = Math.min(priceRatio ** 1.5, 2)
  const timeFactor = Math.max(0.1, 1 - daysUntilDeparture / 30)
  return Math.floor(demand * priceFactor * timeFactor * 0.05)
}
