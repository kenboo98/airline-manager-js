export type MaintenanceCheckType = 'A' | 'C' | 'D'

export interface MaintenanceCheck {
  type: MaintenanceCheckType
  name: string
  intervalHours: number
  durationMinutes: number
  baseCost: number
}

export interface MaintenanceRecord {
  planeId: string
  checkType: MaintenanceCheckType
  startTime: number
  endTime: number
  cost: number
}

export interface PlaneMaintenanceState {
  lastACheck: number // flight hours at last check
  lastCCheck: number
  lastDCheck: number
  condition: number // 0.0 to 1.0
  currentMaintenance: MaintenanceRecord | null
}
