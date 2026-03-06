import type { MaintenanceCheck } from '@/types/maintenance'

export const maintenanceChecks: MaintenanceCheck[] = [
  {
    type: 'A',
    name: 'A-Check',
    intervalHours: 500,
    durationMinutes: 120, // 2 game hours
    baseCost: 15_000,
  },
  {
    type: 'C',
    name: 'C-Check',
    intervalHours: 2000,
    durationMinutes: 720, // 12 game hours
    baseCost: 150_000,
  },
  {
    type: 'D',
    name: 'D-Check',
    intervalHours: 6000,
    durationMinutes: 2880, // 48 game hours
    baseCost: 750_000,
  },
]

/** Cost scales with plane purchase price: baseCost × max(0.5, purchasePrice / $10M) */
export function computeMaintenanceCost(baseCost: number, purchasePrice: number): number {
  return Math.round(baseCost * Math.max(0.5, purchasePrice / 10_000_000))
}
