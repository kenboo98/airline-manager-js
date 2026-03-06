import type { HubLevel } from '@/types/hub'

export const hubLevels: HubLevel[] = [
  { level: 1, maxRoutes: 5, upgradeCost: 0 },
  { level: 2, maxRoutes: 15, upgradeCost: 500_000 },
  { level: 3, maxRoutes: 30, upgradeCost: 1_500_000 },
]

/** Cost to purchase a hub at an airport: $50,000 + totalDemand × $200 */
export function computeHubCost(totalDemand: number): number {
  return 50_000 + totalDemand * 200
}
