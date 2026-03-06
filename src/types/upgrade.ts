export type UpgradeCategory = 'engines' | 'interior' | 'avionics' | 'winglets' | 'weight'

export interface UpgradeDefinition {
  id: string
  category: UpgradeCategory
  name: string
  description: string
  level: number // 1, 2, 3
  prerequisiteId: string | null
  cost: number
  installTimeMinutes: number
  effects: UpgradeEffects
}

export interface UpgradeEffects {
  operatingCostMultiplier?: number // e.g. 0.95 = 5% reduction
  fuelPerHourMultiplier?: number
  rangeBonus?: number // additive nm
  demandMultiplier?: number // e.g. 1.10 = 10% more demand
  ticketPriceMultiplier?: number // e.g. 1.05 = 5% higher willingness to pay
}

export interface InstalledUpgrade {
  upgradeId: string
  installedAt: number
}

export interface UpgradeInstallation {
  planeId: string
  upgradeId: string
  startTime: number
  endTime: number
  cost: number
}
