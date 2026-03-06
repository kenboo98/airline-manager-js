<script setup lang="ts">
import { computed } from 'vue'
import { usePlaneStore } from '@/stores/planeStore'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { useHubStore } from '@/stores/hubStore'
import { useGameStore } from '@/stores/gameStore'
import { formatCurrency } from '@/utils/format'
import { maintenanceChecks } from '@/data/maintenance'
import type { MaintenanceCheckType } from '@/types'

const planeStore = usePlaneStore()
const maintenanceStore = useMaintenanceStore()
const hubStore = useHubStore()
const gameStore = useGameStore()

const fleet = computed(() => planeStore.fleetList)

const activeMaintenance = computed(() =>
  Array.from(maintenanceStore.activeMaintenances.values()),
)

function conditionColor(condition: number): string {
  if (condition >= 0.9) return 'badge-green'
  if (condition >= 0.7) return 'badge-yellow'
  return 'badge-red'
}

function conditionPercent(condition: number): string {
  return `${Math.round(condition * 100)}%`
}

function checkStatus(planeId: string, checkType: MaintenanceCheckType): string {
  if (maintenanceStore.isCheckOverdue(planeId, checkType)) return 'Overdue'
  if (maintenanceStore.isCheckDue(planeId, checkType)) return 'Due'
  return 'OK'
}

function checkStatusClass(planeId: string, checkType: MaintenanceCheckType): string {
  if (maintenanceStore.isCheckOverdue(planeId, checkType)) return 'badge-red'
  if (maintenanceStore.isCheckDue(planeId, checkType)) return 'badge-yellow'
  return 'badge-green'
}

function canPerformMaintenance(planeId: string): boolean {
  const plane = planeStore.getPlane(planeId)
  if (!plane) return false
  return plane.status === 'available' && hubStore.isHub(plane.currentAirportCode)
}

function doMaintenance(planeId: string, checkType: MaintenanceCheckType) {
  maintenanceStore.startMaintenance(planeId, checkType, gameStore.totalMinutes)
}

function maintenanceProgress(record: { startTime: number; endTime: number }): number {
  const total = record.endTime - record.startTime
  const elapsed = gameStore.totalMinutes - record.startTime
  return Math.min(100, (elapsed / total) * 100)
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
</script>

<template>
  <div class="maintenance-page">
    <h1>Maintenance</h1>

    <!-- Active Maintenance -->
    <div v-if="activeMaintenance.length" class="section">
      <h2>In Progress</h2>
      <div class="active-grid">
        <div v-for="record in activeMaintenance" :key="record.planeId" class="card active-card">
          <div class="active-header">
            <strong>{{ planeStore.getPlane(record.planeId)?.registration }}</strong>
            <span class="badge badge-yellow">
              {{ maintenanceChecks.find((c) => c.type === record.checkType)?.name }}
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: maintenanceProgress(record) + '%' }"
            ></div>
          </div>
          <div class="active-meta">
            <span>{{ formatCurrency(record.cost) }}</span>
            <span>{{ formatMinutes(Math.max(0, record.endTime - gameStore.totalMinutes)) }} remaining</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Fleet Maintenance Table -->
    <div class="section">
      <h2>Fleet Status</h2>
      <p v-if="!fleet.length" class="empty">
        No planes yet. <RouterLink to="/planes/buy">Buy your first plane!</RouterLink>
      </p>

      <table v-else>
        <thead>
          <tr>
            <th>Registration</th>
            <th>Model</th>
            <th>Location</th>
            <th>Hours</th>
            <th>Condition</th>
            <th>A-Check</th>
            <th>C-Check</th>
            <th>D-Check</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plane in fleet" :key="plane.id">
            <td class="registration">{{ plane.registration }}</td>
            <td>
              {{ planeStore.getModel(plane.modelId)?.manufacturer }}
              {{ planeStore.getModel(plane.modelId)?.name }}
            </td>
            <td>
              {{ plane.currentAirportCode }}
              <span v-if="hubStore.isHub(plane.currentAirportCode)" class="hub-tag">Hub</span>
            </td>
            <td>{{ plane.totalFlightHours.toFixed(1) }}h</td>
            <td>
              <span :class="['badge', conditionColor(plane.maintenanceState.condition)]">
                {{ conditionPercent(plane.maintenanceState.condition) }}
              </span>
            </td>
            <td>
              <span :class="['badge', checkStatusClass(plane.id, 'A')]">
                {{ checkStatus(plane.id, 'A') }}
              </span>
            </td>
            <td>
              <span :class="['badge', checkStatusClass(plane.id, 'C')]">
                {{ checkStatus(plane.id, 'C') }}
              </span>
            </td>
            <td>
              <span :class="['badge', checkStatusClass(plane.id, 'D')]">
                {{ checkStatus(plane.id, 'D') }}
              </span>
            </td>
            <td>
              <template v-if="plane.status === 'maintenance'">
                <span class="badge badge-yellow">In Maintenance</span>
              </template>
              <template v-else-if="plane.status === 'upgrading'">
                <span class="badge badge-blue">Upgrading</span>
              </template>
              <template v-else-if="plane.status === 'in-flight'">
                <span class="badge badge-blue">In Flight</span>
              </template>
              <template v-else-if="canPerformMaintenance(plane.id)">
                <div class="action-btns">
                  <button
                    v-for="check in maintenanceChecks"
                    :key="check.type"
                    class="btn btn-sm"
                    :disabled="!maintenanceStore.isCheckDue(plane.id, check.type) && !maintenanceStore.isCheckOverdue(plane.id, check.type)"
                    @click="doMaintenance(plane.id, check.type)"
                  >
                    {{ check.name }} ({{ formatCurrency(maintenanceStore.getMaintenanceCost(plane.id, check.type)) }})
                  </button>
                </div>
              </template>
              <template v-else>
                <span class="hint">Must be at hub</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.maintenance-page {
  max-width: 1200px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.section {
  margin-bottom: 2rem;
}

.empty {
  opacity: 0.7;
}

.active-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.active-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 6px;
  background: var(--color-background-mute);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s;
}

.active-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.7;
}

.registration {
  font-weight: 600;
  font-family: monospace;
}

.hub-tag {
  font-size: 0.7rem;
  color: #e67e22;
  font-weight: 600;
  margin-left: 0.25rem;
}

.action-btns {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.hint {
  font-size: 0.8rem;
  opacity: 0.5;
}
</style>
