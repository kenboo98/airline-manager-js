<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHubStore } from '@/stores/hubStore'
import { useAirportStore } from '@/stores/airportStore'
import { useGameStore } from '@/stores/gameStore'
import { formatCurrency } from '@/utils/format'
import { hubLevels } from '@/data/hubs'

const hubStore = useHubStore()
const airportStore = useAirportStore()
const gameStore = useGameStore()

const showPurchaseModal = ref(false)
const selectedAirportCode = ref('')
const searchQuery = ref('')

function totalDemand(airport: { demand: { business: number; leisure: number; firstClass: number } }) {
  return airport.demand.business + airport.demand.leisure + airport.demand.firstClass
}

const availableAirports = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return airportStore.sortedByDemand.filter((a) => {
    if (hubStore.isHub(a.code)) return false
    if (!q) return true
    return (
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q)
    )
  })
})

function openPurchaseModal() {
  selectedAirportCode.value = ''
  searchQuery.value = ''
  showPurchaseModal.value = true
}

function confirmPurchase() {
  if (!selectedAirportCode.value) return
  hubStore.purchaseHub(selectedAirportCode.value, gameStore.totalMinutes)
  showPurchaseModal.value = false
}

function getNextLevel(currentLevel: number) {
  return hubLevels.find((l) => l.level === currentLevel + 1)
}
</script>

<template>
  <div class="hubs-page">
    <h1>Hubs</h1>

    <p v-if="!hubStore.hubList.length" class="empty">No hubs established yet.</p>

    <!-- Owned Hubs -->
    <div class="hub-grid">
      <div v-for="hub in hubStore.hubList" :key="hub.id" class="card hub-card">
        <div class="hub-header">
          <strong>{{ hub.airportCode }}</strong>
          <span class="badge badge-blue">Level {{ hub.level }}</span>
        </div>
        <div class="hub-name">
          {{ airportStore.getByCode(hub.airportCode)?.city }}
        </div>
        <div class="hub-stats">
          <div class="stat-row">
            <span class="stat-label">Routes</span>
            <span>{{ hubStore.getRouteCount(hub.airportCode) }} / {{ hub.maxRoutes }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Demand</span>
            <span>{{ totalDemand(airportStore.getByCode(hub.airportCode)!) }}</span>
          </div>
        </div>
        <div v-if="getNextLevel(hub.level)" class="hub-actions">
          <button
            class="btn btn-primary"
            @click="hubStore.upgradeHub(hub.id)"
          >
            Upgrade to L{{ hub.level + 1 }} ({{ formatCurrency(getNextLevel(hub.level)!.upgradeCost) }})
          </button>
        </div>
        <div v-else class="hub-max">
          <span class="badge badge-green">Max Level</span>
        </div>
      </div>
    </div>

    <!-- Purchase New Hub -->
    <div class="purchase-section">
      <button class="btn btn-primary" @click="openPurchaseModal">
        Purchase New Hub
      </button>
    </div>

    <!-- Purchase Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="showPurchaseModal = false">
      <div class="modal card">
        <div class="modal-header">
          <h2>Purchase Hub</h2>
          <button class="close-btn" @click="showPurchaseModal = false">&times;</button>
        </div>

        <div class="form-group">
          <input
            v-model="searchQuery"
            class="input"
            placeholder="Search airports..."
          />
        </div>

        <div class="airport-list">
          <div
            v-for="airport in availableAirports"
            :key="airport.code"
            :class="['airport-row', { selected: selectedAirportCode === airport.code }]"
            @click="selectedAirportCode = airport.code"
          >
            <div class="airport-info">
              <strong>{{ airport.code }}</strong>
              <span>{{ airport.city }}</span>
            </div>
            <div class="airport-meta">
              <span>Demand: {{ totalDemand(airport) }}</span>
              <span>{{ formatCurrency(hubStore.getHubCost(airport.code)) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn" @click="showPurchaseModal = false">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!selectedAirportCode"
            @click="confirmPurchase"
          >
            Purchase
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hubs-page {
  max-width: 900px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty {
  opacity: 0.7;
  margin-bottom: 1rem;
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.hub-header strong {
  font-size: 1.2rem;
}

.hub-name {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 0.75rem;
}

.hub-stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.75rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.stat-label {
  opacity: 0.6;
}

.hub-actions {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.hub-max {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.purchase-section {
  margin-top: 1rem;
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
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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

.form-group {
  margin-bottom: 0.75rem;
}

.airport-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.airport-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.airport-row:hover {
  background: var(--color-background-mute);
}

.airport-row.selected {
  background: var(--color-accent-hover);
}

.airport-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.airport-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  opacity: 0.7;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
