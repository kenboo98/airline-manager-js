export interface Hub {
  id: string
  airportCode: string
  level: number // 1-3
  maxRoutes: number // 5 / 15 / 30
  purchasedAt: number // game totalMinutes
}

export interface HubLevel {
  level: number
  maxRoutes: number
  upgradeCost: number
}
