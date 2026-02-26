<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCompanyStore } from '@/stores/companyStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useFlightStore } from '@/stores/flightStore'
import { formatCurrency } from '@/utils/format'

const companyStore = useCompanyStore()
const planeStore = usePlaneStore()
const flightStore = useFlightStore()
</script>

<template>
  <div class="dashboard">
    <h1>{{ companyStore.company.name || 'My Airline' }}</h1>

    <div class="cards">
      <div class="card">
        <div class="card-label">Cash</div>
        <div class="card-value">{{ formatCurrency(companyStore.company.cash) }}</div>
      </div>
      <div class="card">
        <div class="card-label">Fleet Size</div>
        <div class="card-value">{{ planeStore.fleetList.length }}</div>
      </div>
      <div class="card">
        <div class="card-label">Active Flights</div>
        <div class="card-value">{{ flightStore.currentlyFlying.length }}</div>
      </div>
      <div class="card">
        <div class="card-label">Completed Flights</div>
        <div class="card-value">{{ flightStore.completedFlights.length }}</div>
      </div>
    </div>

    <div class="quick-links">
      <h2>Quick Actions</h2>
      <div class="link-grid">
        <RouterLink to="/planes/buy" class="action-link card">Buy Planes</RouterLink>
        <RouterLink to="/map" class="action-link card">Create Flight</RouterLink>
        <RouterLink to="/map" class="action-link card">View Map</RouterLink>
        <RouterLink to="/company" class="action-link card">Company Settings</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 1.4rem;
  font-weight: 600;
}

h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.action-link {
  text-align: center;
  font-weight: 500;
  padding: 1rem;
}
</style>
