<script setup lang="ts">
import { ref } from 'vue'
import { usePlaneStore } from '@/stores/planeStore'
import { formatCurrency } from '@/utils/format'
import type { PlaneModel } from '@/types'

const planeStore = usePlaneStore()
const selectedModel = ref<PlaneModel | null>(null)

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
          <th>Flight Hours</th>
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
          <td>{{ plane.totalFlightHours.toFixed(1) }}h</td>
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
  </div>
</template>

<style scoped>
.fleet-page {
  max-width: 900px;
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
</style>
