<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlaneStore } from '@/stores/planeStore'
import { useRouteStore } from '@/stores/routeStore'
import { useAirportStore } from '@/stores/airportStore'
import { formatCurrency } from '@/utils/format'
import type { PlaneModel, OwnedPlane } from '@/types'

const planeStore = usePlaneStore()
const routeStore = useRouteStore()
const airportStore = useAirportStore()

const selectedModel = ref<PlaneModel | null>(null)
const assigningPlane = ref<OwnedPlane | null>(null)

function statusBadgeClass(status: string) {
  switch (status) {
    case 'available':
      return 'badge-green'
    case 'in-flight':
      return 'badge-blue'
    case 'maintenance':
      return 'badge-yellow'
    default:
      return ''
  }
}

function showModelStats(modelId: string) {
  const model = planeStore.getModel(modelId)
  selectedModel.value = selectedModel.value?.id === modelId ? null : (model ?? null)
}

function closeStats() {
  selectedModel.value = null
}

function openAssignModal(plane: OwnedPlane) {
  assigningPlane.value = plane
}

function closeAssignModal() {
  assigningPlane.value = null
}

function assignToRoute(routeId: string) {
  if (!assigningPlane.value) return

  routeStore.assignPlane(routeId, assigningPlane.value.id)
  assigningPlane.value = null
}

function unassignFromRoute(plane: OwnedPlane) {
  if (plane.assignedRouteId) {
    routeStore.unassignPlane(plane.assignedRouteId, plane.id)
  }
}

function getPlaneAssignedRoute(plane: OwnedPlane) {
  if (!plane.assignedRouteId) return null
  return routeStore.getRoute(plane.assignedRouteId)
}

function getRouteDisplay(routeId: string): string {
  const route = routeStore.getRoute(routeId)
  if (!route) return 'Unknown Route'
  return `${route.originCode} ↔ ${route.destinationCode}`
}

// Available routes that this plane can be assigned to
// (plane must be at one of the route's airports)
const availableRoutesForPlane = computed(() => {
  if (!assigningPlane.value) return []

  const plane = assigningPlane.value
  const planeModel = planeStore.getModel(plane.modelId)
  if (!planeModel) return []

  return routeStore.routeList.filter((route) => {
    // Check if plane is at one of the route endpoints
    const isAtOrigin = plane.currentAirportCode === route.originCode
    const isAtDest = plane.currentAirportCode === route.destinationCode
    if (!isAtOrigin && !isAtDest) return false

    // Check if plane has enough range for this route
    const distance = airportStore.getDistanceNm(route.originCode, route.destinationCode)
    if (distance > planeModel.range) return false

    // Check if plane can land at both airports
    const originAirport = airportStore.getByCode(route.originCode)
    const destAirport = airportStore.getByCode(route.destinationCode)
    if (
      (originAirport && planeModel.minRunwayLength > originAirport.runwayLength) ||
      (destAirport && planeModel.minRunwayLength > destAirport.runwayLength)
    ) {
      return false
    }

    return true
  })
})
</script>

<template>
  <div class="fleet-page">
    <h1>Fleet</h1>

    <p v-if="!planeStore.fleetList.length" class="empty">
      No planes yet. <RouterLink to="/planes/buy">Buy your first plane!</RouterLink>
    </p>

    <table v-else>
      <thead>
        <tr>
          <th>Registration</th>
          <th>Model</th>
          <th>Status</th>
          <th>Location</th>
          <th>Assigned Route</th>
          <th>Flight Hours</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="plane in planeStore.fleetList" :key="plane.id">
          <td class="registration">{{ plane.registration }}</td>
          <td>
            <button class="model-link" @click="showModelStats(plane.modelId)">
              {{ planeStore.getModel(plane.modelId)?.manufacturer }}
              {{ planeStore.getModel(plane.modelId)?.name }}
            </button>
          </td>
          <td>
            <span :class="['badge', statusBadgeClass(plane.status)]">
              {{ plane.status }}
            </span>
          </td>
          <td>{{ plane.currentAirportCode }}</td>
          <td>
            <span v-if="plane.assignedRouteId" class="route-assigned">
              {{ getRouteDisplay(plane.assignedRouteId) }}
            </span>
            <span v-else class="route-unassigned">Unassigned</span>
          </td>
          <td>{{ plane.totalFlightHours.toFixed(1) }}h</td>
          <td>
            <div class="actions">
              <button
                v-if="plane.status === 'available' && !plane.assignedRouteId"
                class="btn btn-sm btn-primary"
                @click="openAssignModal(plane)"
              >
                Assign to Route
              </button>
              <button
                v-else-if="plane.assignedRouteId && plane.status === 'available'"
                class="btn btn-sm"
                @click="unassignFromRoute(plane)"
              >
                Unassign
              </button>
              <span v-else-if="plane.status === 'in-flight'" class="action-disabled">
                In flight
              </span>
              <span v-else class="action-disabled">Unavailable</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Model Stats Modal -->
    <div v-if="selectedModel" class="modal-overlay" @click.self="closeStats">
      <div class="modal card">
        <div class="modal-header">
          <h2>{{ selectedModel.manufacturer }} {{ selectedModel.name }}</h2>
          <button class="close-btn" @click="closeStats">&times;</button>
        </div>
        <div class="stats">
          <div class="stat-row">
            <span class="stat-label">Range</span>
            <span>{{ selectedModel.range.toLocaleString() }} nm</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Speed</span>
            <span>{{ selectedModel.speed }} kt</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Seats</span>
            <span>
              {{ selectedModel.defaultSeats.economy }}E / {{ selectedModel.defaultSeats.business }}B
              <template v-if="selectedModel.defaultSeats.firstClass">
                / {{ selectedModel.defaultSeats.firstClass }}F
              </template>
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Min Runway</span>
            <span>{{ selectedModel.minRunwayLength.toLocaleString() }} ft</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Purchase Price</span>
            <span>{{ formatCurrency(selectedModel.purchasePrice) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Operating Cost</span>
            <span>{{ formatCurrency(selectedModel.operatingCostPerNm) }}/nm</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Fuel Per Hour</span>
            <span>{{ formatCurrency(selectedModel.fuelPerHour) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign to Route Modal -->
    <div v-if="assigningPlane" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal card assign-modal">
        <div class="modal-header">
          <h2>Assign Plane to Route</h2>
          <button class="close-btn" @click="closeAssignModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="plane-info">
            <p>
              <strong>{{ assigningPlane.registration }}</strong> -
              {{ planeStore.getModel(assigningPlane.modelId)?.name }}
            </p>
            <p class="location">Currently at: {{ assigningPlane.currentAirportCode }}</p>
          </div>

          <div v-if="availableRoutesForPlane.length > 0" class="routes-list">
            <h4>Available Routes</h4>
            <p class="hint">Select a route to assign this plane to:</p>
            <div
              v-for="route in availableRoutesForPlane"
              :key="route.id"
              class="route-option"
              @click="assignToRoute(route.id)"
            >
              <div class="route-info">
                <span class="route-codes">{{ route.originCode }} ↔ {{ route.destinationCode }}</span>
                <span class="route-airports">
                  {{ airportStore.getByCode(route.originCode)?.city }} ↔
                  {{ airportStore.getByCode(route.destinationCode)?.city }}
                </span>
              </div>
              <div class="route-meta">
                <span class="route-distance">
                  {{ Math.round(airportStore.getDistanceNm(route.originCode, route.destinationCode)).toLocaleString() }}
                  nm
                </span>
                <span :class="['route-status', route.enabled ? 'enabled' : 'disabled']">
                  {{ route.enabled ? 'Active' : 'Paused' }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="no-routes">
            <p>No available routes for this plane.</p>
            <p class="sub-hint">
              Routes must start/end at {{ assigningPlane.currentAirportCode }} and be within this
              plane's range.
            </p>
            <RouterLink to="/map" class="btn btn-primary" @click="closeAssignModal">
              Create a Route
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fleet-page {
  max-width: 1100px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty {
  opacity: 0.7;
}

.registration {
  font-weight: 600;
  font-family: monospace;
}

.model-link {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.model-link:hover {
  opacity: 0.8;
}

.route-assigned {
  color: var(--color-success);
  font-weight: 500;
}

.route-unassigned {
  color: var(--color-text);
  opacity: 0.5;
  font-style: italic;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-disabled {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.5;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 360px;
  max-width: 90vw;
}

.modal.assign-modal {
  width: 480px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 1.15rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.6;
  line-height: 1;
}

.close-btn:hover {
  opacity: 1;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.stat-label {
  opacity: 0.6;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plane-info {
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
}

.plane-info p {
  margin: 0;
}

.plane-info .location {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.routes-list h4 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.routes-list .hint {
  font-size: 0.8rem;
  opacity: 0.6;
  margin: 0 0 0.75rem;
}

.route-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 0.5rem;
}

.route-option:hover {
  border-color: var(--color-accent);
  background: var(--color-background-soft);
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.route-codes {
  font-weight: 600;
  font-size: 1rem;
}

.route-airports {
  font-size: 0.8rem;
  opacity: 0.7;
}

.route-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.route-distance {
  font-size: 0.8rem;
  opacity: 0.7;
}

.route-status {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 500;
}

.route-status.enabled {
  background: rgba(39, 174, 96, 0.15);
  color: var(--color-success);
}

.route-status.disabled {
  background: rgba(149, 165, 166, 0.15);
  color: var(--color-text);
  opacity: 0.6;
}

.no-routes {
  text-align: center;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border-radius: 6px;
}

.no-routes p {
  margin: 0 0 0.5rem;
}

.no-routes .sub-hint {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-bottom: 1rem;
}
</style>
