import type { TicketPricing } from './flight'

export interface Route {
  id: string
  originCode: string
  destinationCode: string
  planeIds: string[]
  ticketPricing: TicketPricing
  enabled: boolean
  // Metrics
  totalRevenue: number
  totalCost: number
  flightCount: number
  // Timestamps for tracking
  createdAt: number
}

export interface RouteMetrics {
  routeId: string
  totalRevenue: number
  totalCost: number
  profit: number
  flightCount: number
  averageRevenuePerFlight: number
  averageCostPerFlight: number
  averageProfitPerFlight: number
}
