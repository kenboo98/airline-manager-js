<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAirportStore } from '@/stores/airportStore'
import { useGameStore } from '@/stores/gameStore'
import { formatCurrency } from '@/utils/format'
import { computeHubCost } from '@/data/hubs'

const router = useRouter()
const airportStore = useAirportStore()
const gameStore = useGameStore()

const step = ref(1)
const airlineName = ref('')
const selectedAirportCode = ref<string | null>(null)
const searchQuery = ref('')

const filteredAirports = computed(() => {
  const q = searchQuery.value.toLowerCase()
  const list = airportStore.sortedByDemand
  if (!q) return list
  return list.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q),
  )
})

function totalDemand(airport: { demand: { business: number; leisure: number; firstClass: number } }) {
  return airport.demand.business + airport.demand.leisure + airport.demand.firstClass
}

function nextStep() {
  if (step.value === 1 && airlineName.value.trim()) {
    step.value = 2
  }
}

function prevStep() {
  if (step.value === 2) {
    step.value = 1
  }
}

function confirmSetup() {
  if (!airlineName.value.trim() || !selectedAirportCode.value) return
  gameStore.completeSetup(airlineName.value.trim(), selectedAirportCode.value)
  router.push('/')
}
</script>

<template>
  <div class="setup-page">
    <div class="setup-container">
      <h1>New Airline</h1>

      <!-- Step 1: Airline Name -->
      <div v-if="step === 1" class="step">
        <h2>Step 1: Name Your Airline</h2>
        <div class="form-group">
          <label>Airline Name</label>
          <input
            v-model="airlineName"
            class="input"
            placeholder="e.g. Pacific Airways"
            @keyup.enter="nextStep"
          />
        </div>
        <div class="actions">
          <button class="btn btn-primary" :disabled="!airlineName.trim()" @click="nextStep">
            Next
          </button>
        </div>
      </div>

      <!-- Step 2: Select Starting Hub -->
      <div v-if="step === 2" class="step">
        <h2>Step 2: Choose Your Starting Hub</h2>
        <p class="hint">Your first hub is free. Choose wisely — higher demand airports generate more passengers.</p>

        <div class="form-group">
          <input
            v-model="searchQuery"
            class="input"
            placeholder="Search airports..."
          />
        </div>

        <div class="airport-list">
          <div
            v-for="airport in filteredAirports"
            :key="airport.code"
            :class="['airport-row card', { selected: selectedAirportCode === airport.code }]"
            @click="selectedAirportCode = airport.code"
          >
            <div class="airport-header">
              <strong>{{ airport.code }}</strong>
              <span class="city">{{ airport.city }}</span>
            </div>
            <div class="airport-name">{{ airport.name }}</div>
            <div class="airport-stats">
              <span>Demand: {{ totalDemand(airport) }}</span>
              <span>Hub Cost: {{ formatCurrency(computeHubCost(totalDemand(airport))) }}</span>
              <span class="free-tag">FREE</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn" @click="prevStep">Back</button>
          <button
            class="btn btn-primary"
            :disabled="!selectedAirportCode"
            @click="confirmSetup"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: 2rem;
}

.setup-container {
  width: 100%;
  max-width: 600px;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.airport-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.airport-row {
  cursor: pointer;
  padding: 0.75rem;
  transition: all 0.15s;
}

.airport-row:hover {
  border-color: var(--color-border-hover);
}

.airport-row.selected {
  border-color: var(--color-accent);
  background: var(--color-accent-hover);
}

.airport-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.city {
  font-size: 0.9rem;
  opacity: 0.8;
}

.airport-name {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-bottom: 0.4rem;
}

.airport-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  opacity: 0.7;
}

.free-tag {
  color: var(--color-success);
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
