<script setup lang="ts">
import { computed } from 'vue'
import { useFlightStore } from '@/stores/flightStore'
import { useGameStore } from '@/stores/gameStore'
import { usePlaneStore } from '@/stores/planeStore'
import { formatDuration, formatCurrency } from '@/utils/format'

const flightStore = useFlightStore()
const gameStore = useGameStore()
const planeStore = usePlaneStore()

const flights = computed(() => {
  return [...flightStore.activeFlights].sort((a, b) => a.departureTime - b.departureTime)
})

function progress(flight: { departureTime: number; arrivalTime: number }) {
  if (flight.departureTime > gameStore.totalMinutes) return 0
  const elapsed = gameStore.totalMinutes - flight.departureTime
  const total = flight.arrivalTime - flight.departureTime
  return Math.min(100, (elapsed / total) * 100)
}

function eta(flight: { arrivalTime: number }) {
  const remaining = flight.arrivalTime - gameStore.totalMinutes
  if (remaining <= 0) return 'Arriving...'
  return formatDuration(remaining)
}

function getRegistration(planeId: string) {
  return planeStore.getPlane(planeId)?.registration ?? planeId
}
</script>

<template>
  <div class="active-flights-page">
    <h1>Active Flights</h1>

    <p v-if="!flights.length" class="empty">
      No active flights. <RouterLink to="/map">Create one on the map!</RouterLink>
    </p>

    <div v-else class="flights-list">
      <div v-for="flight in flights" :key="flight.id" class="card flight-card">
        <div class="flight-header">
          <span class="flight-number">{{ flight.flightNumber }}</span>
          <span :class="['badge', flight.status === 'in-flight' ? 'badge-blue' : 'badge-yellow']">
            {{ flight.status }}
          </span>
        </div>

        <div class="route">
          <span class="airport-code">{{ flight.departureAirportCode }}</span>
          <span class="arrow">→</span>
          <span class="airport-code">{{ flight.arrivalAirportCode }}</span>
        </div>

        <div class="flight-details">
          <span>Plane: {{ getRegistration(flight.planeId) }}</span>
          <span>Distance: {{ Math.round(flight.distanceNm).toLocaleString() }} nm</span>
          <span>
            Passengers: {{ flight.passengers.economy + flight.passengers.business + flight.passengers.firstClass }}
          </span>
        </div>

        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress(flight) + '%' }"></div>
          </div>
          <div class="progress-info">
            <span>{{ Math.round(progress(flight)) }}%</span>
            <span v-if="flight.status === 'in-flight'">ETA: {{ eta(flight) }}</span>
            <span v-else>
              Departs in {{ formatDuration(flight.departureTime - gameStore.totalMinutes) }}
            </span>
          </div>
        </div>

        <div class="flight-financials">
          <span>Cost: {{ formatCurrency(flight.cost) }}</span>
          <span>Est. Revenue: {{ formatCurrency(
            flight.passengers.economy * flight.ticketPricing.economy +
            flight.passengers.business * flight.ticketPricing.business +
            flight.passengers.firstClass * flight.ticketPricing.firstClass
          ) }}</span>
        </div>

        <button
          v-if="flight.status === 'scheduled'"
          class="btn btn-danger cancel-btn"
          @click="flightStore.cancelFlight(flight.id)"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-flights-page {
  max-width: 800px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty {
  opacity: 0.7;
}

.flights-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.flight-number {
  font-weight: 600;
  font-size: 1.1rem;
}

.route {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.airport-code {
  font-weight: 600;
  font-size: 1.2rem;
}

.arrow {
  opacity: 0.5;
}

.flight-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 0.75rem;
}

.progress-section {
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 8px;
  background: var(--color-background-mute);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.7;
}

.flight-financials {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  opacity: 0.8;
}

.cancel-btn {
  margin-top: 0.5rem;
}
</style>
