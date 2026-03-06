import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MaintenanceCheckType, MaintenanceRecord } from '@/types/maintenance'
import { maintenanceChecks, computeMaintenanceCost } from '@/data/maintenance'
import { usePlaneStore } from './planeStore'
import { useCompanyStore } from './companyStore'
import { useHubStore } from './hubStore'
import { useUiStore } from './uiStore'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const activeMaintenances = ref<Map<string, MaintenanceRecord>>(new Map())
  // Track last notification day per plane to throttle warnings
  const lastNotificationDay = ref<Map<string, number>>(new Map())

  function getCheck(type: MaintenanceCheckType) {
    return maintenanceChecks.find((c) => c.type === type)!
  }

  function isCheckDue(planeId: string, checkType: MaintenanceCheckType): boolean {
    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) return false

    const check = getCheck(checkType)
    const state = plane.maintenanceState

    let lastCheck: number
    switch (checkType) {
      case 'A':
        lastCheck = state.lastACheck
        break
      case 'C':
        lastCheck = state.lastCCheck
        break
      case 'D':
        lastCheck = state.lastDCheck
        break
    }

    return plane.totalFlightHours - lastCheck >= check.intervalHours
  }

  function isCheckOverdue(planeId: string, checkType: MaintenanceCheckType): boolean {
    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) return false

    const check = getCheck(checkType)
    const state = plane.maintenanceState

    let lastCheck: number
    switch (checkType) {
      case 'A':
        lastCheck = state.lastACheck
        break
      case 'C':
        lastCheck = state.lastCCheck
        break
      case 'D':
        lastCheck = state.lastDCheck
        break
    }

    return plane.totalFlightHours - lastCheck >= check.intervalHours * 1.1
  }

  function getMaintenanceCost(planeId: string, checkType: MaintenanceCheckType): number {
    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) return 0
    const model = planeStore.getModel(plane.modelId)
    if (!model) return 0
    const check = getCheck(checkType)
    return computeMaintenanceCost(check.baseCost, model.purchasePrice)
  }

  function getConditionPenalty(planeId: string): number {
    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) return 1.0

    let penalty = 1.0
    for (const checkType of ['A', 'C', 'D'] as MaintenanceCheckType[]) {
      if (isCheckOverdue(planeId, checkType)) {
        penalty += 0.15
      } else if (isCheckDue(planeId, checkType)) {
        penalty += 0.05
      }
    }
    return Math.min(penalty, 1.5)
  }

  function startMaintenance(
    planeId: string,
    checkType: MaintenanceCheckType,
    totalMinutes: number,
  ): boolean {
    const planeStore = usePlaneStore()
    const hubStore = useHubStore()
    const companyStore = useCompanyStore()

    const plane = planeStore.getPlane(planeId)
    if (!plane) return false
    if (plane.status !== 'available') return false
    if (!hubStore.isHub(plane.currentAirportCode)) return false

    const cost = getMaintenanceCost(planeId, checkType)
    if (companyStore.company.cash < cost) return false

    const check = getCheck(checkType)

    const record: MaintenanceRecord = {
      planeId,
      checkType,
      startTime: totalMinutes,
      endTime: totalMinutes + check.durationMinutes,
      cost,
    }

    companyStore.addExpense(cost)
    planeStore.setStatus(planeId, 'maintenance')
    plane.maintenanceState.currentMaintenance = record
    activeMaintenances.value.set(planeId, record)
    return true
  }

  function processTick(totalMinutes: number) {
    const planeStore = usePlaneStore()
    const uiStore = useUiStore()

    // 1. Complete finished maintenances
    for (const [planeId, record] of activeMaintenances.value) {
      if (totalMinutes >= record.endTime) {
        const plane = planeStore.getPlane(planeId)
        if (plane) {
          planeStore.setStatus(planeId, 'available')
          // Reset check counters
          switch (record.checkType) {
            case 'A':
              plane.maintenanceState.lastACheck = plane.totalFlightHours
              break
            case 'C':
              plane.maintenanceState.lastCCheck = plane.totalFlightHours
              break
            case 'D':
              plane.maintenanceState.lastDCheck = plane.totalFlightHours
              break
          }
          plane.maintenanceState.condition = 1.0
          plane.maintenanceState.currentMaintenance = null

          uiStore.addNotification(
            `${getCheck(record.checkType).name} complete for ${plane.registration}`,
            'success',
            6000,
          )
        }
        activeMaintenances.value.delete(planeId)
      }
    }

    // 2. Check fleet for due/overdue maintenance
    const currentDay = Math.floor(totalMinutes / 1440)
    for (const plane of planeStore.fleetList) {
      if (plane.status === 'maintenance' || plane.status === 'upgrading') continue

      let worstCondition = 1.0
      for (const checkType of ['A', 'C', 'D'] as MaintenanceCheckType[]) {
        if (isCheckOverdue(plane.id, checkType)) {
          worstCondition = Math.min(worstCondition, 0.6)
          // Throttled notification: once per game day per plane
          const key = `${plane.id}-${checkType}`
          const lastDay = lastNotificationDay.value.get(key) ?? -1
          if (currentDay > lastDay) {
            lastNotificationDay.value.set(key, currentDay)
            uiStore.addNotification(
              `${plane.registration}: ${getCheck(checkType).name} OVERDUE!`,
              'error',
              8000,
            )
          }
        } else if (isCheckDue(plane.id, checkType)) {
          worstCondition = Math.min(worstCondition, 0.8)
          const key = `${plane.id}-${checkType}`
          const lastDay = lastNotificationDay.value.get(key) ?? -1
          if (currentDay > lastDay) {
            lastNotificationDay.value.set(key, currentDay)
            uiStore.addNotification(
              `${plane.registration}: ${getCheck(checkType).name} due`,
              'warning',
              6000,
            )
          }
        }
      }
      plane.maintenanceState.condition = worstCondition
    }
  }

  return {
    activeMaintenances,
    getCheck,
    isCheckDue,
    isCheckOverdue,
    getMaintenanceCost,
    getConditionPenalty,
    startMaintenance,
    processTick,
  }
})
