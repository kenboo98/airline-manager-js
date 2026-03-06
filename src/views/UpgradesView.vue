<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlaneStore } from '@/stores/planeStore'
import { useUpgradeStore } from '@/stores/upgradeStore'
import { useHubStore } from '@/stores/hubStore'
import { useGameStore } from '@/stores/gameStore'
import { formatCurrency } from '@/utils/format'
import type { UpgradeCategory } from '@/types'

const planeStore = usePlaneStore()
const upgradeStore = useUpgradeStore()
const hubStore = useHubStore()
const gameStore = useGameStore()

const selectedPlaneId = ref<string | null>(null)

// Planes that are at a hub and available (or show all for viewing)
const eligiblePlanes = computed(() =>
  planeStore.fleetList.filter(
    (p) => p.status === 'available' && hubStore.isHub(p.currentAirportCode),
  ),
)

const selectedPlane = computed(() =>
  selectedPlaneId.value ? planeStore.getPlane(selectedPlaneId.value) : undefined,
)

const availableUpgrades = computed(() =>
  selectedPlaneId.value ? upgradeStore.getAvailableUpgrades(selectedPlaneId.value) : [],
)

const installedUpgrades = computed(() => {
  if (!selectedPlane.value) return []
  return selectedPlane.value.installedUpgrades
    .map((u) => upgradeStore.getUpgrade(u.upgradeId))
    .filter(Boolean)
})

const allActiveInstallations = computed(() =>
  Array.from(upgradeStore.activeInstallations.values()),
)

const categories: { key: UpgradeCategory; label: string }[] = [
  { key: 'engines', label: 'Engines' },
  { key: 'interior', label: 'Interior' },
  { key: 'avionics', label: 'Avionics' },
  { key: 'winglets', label: 'Winglets' },
  { key: 'weight', label: 'Weight Reduction' },
]

function upgradesByCategory(category: UpgradeCategory) {
  return availableUpgrades.value.filter((u) => u.category === category)
}

function installedInCategory(category: UpgradeCategory) {
  return installedUpgrades.value.filter((u) => u!.category === category)
}

function startInstall(upgradeId: string) {
  if (!selectedPlaneId.value) return
  upgradeStore.startUpgrade(selectedPlaneId.value, upgradeId, gameStore.totalMinutes)
}

function installProgress(record: { startTime: number; endTime: number }): number {
  const total = record.endTime - record.startTime
  const elapsed = gameStore.totalMinutes - record.startTime
  return Math.min(100, (elapsed / total) * 100)
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function effectDescription(effects: {
  operatingCostMultiplier?: number
  fuelPerHourMultiplier?: number
  rangeBonus?: number
  ticketPriceMultiplier?: number
  demandMultiplier?: number
}): string {
  const parts: string[] = []
  if (effects.operatingCostMultiplier != null && effects.operatingCostMultiplier !== 1) {
    parts.push(`${Math.round((1 - effects.operatingCostMultiplier) * 100)}% op cost reduction`)
  }
  if (effects.fuelPerHourMultiplier != null && effects.fuelPerHourMultiplier !== 1) {
    parts.push(`${Math.round((1 - effects.fuelPerHourMultiplier) * 100)}% fuel savings`)
  }
  if (effects.rangeBonus) {
    parts.push(`+${effects.rangeBonus}nm range`)
  }
  if (effects.ticketPriceMultiplier != null && effects.ticketPriceMultiplier !== 1) {
    parts.push(`${Math.round((effects.ticketPriceMultiplier - 1) * 100)}% ticket price boost`)
  }
  if (effects.demandMultiplier != null && effects.demandMultiplier !== 1) {
    parts.push(`${Math.round((effects.demandMultiplier - 1) * 100)}% demand boost`)
  }
  return parts.join(', ')
}
</script>

<template>
  <div class="upgrades-page">
    <h1>Plane Upgrades</h1>

    <!-- Active Installations -->
    <div v-if="allActiveInstallations.length" class="section">
      <h2>Installing</h2>
      <div class="active-grid">
        <div v-for="inst in allActiveInstallations" :key="inst.planeId" class="card active-card">
          <div class="active-header">
            <strong>{{ planeStore.getPlane(inst.planeId)?.registration }}</strong>
            <span class="badge badge-yellow">
              {{ upgradeStore.getUpgrade(inst.upgradeId)?.name }}
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: installProgress(inst) + '%' }"></div>
          </div>
          <div class="active-meta">
            <span>{{ formatCurrency(inst.cost) }}</span>
            <span>{{ formatMinutes(Math.max(0, inst.endTime - gameStore.totalMinutes)) }} remaining</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Plane Selector -->
    <div class="section">
      <h2>Select Plane</h2>
      <p v-if="!eligiblePlanes.length" class="empty">
        No planes available at hub airports. Planes must be available and at a hub to install upgrades.
      </p>
      <div v-else class="plane-selector">
        <select v-model="selectedPlaneId" class="input">
          <option :value="null" disabled>Choose a plane...</option>
          <option v-for="plane in eligiblePlanes" :key="plane.id" :value="plane.id">
            {{ plane.registration }} — {{ planeStore.getModel(plane.modelId)?.manufacturer }}
            {{ planeStore.getModel(plane.modelId)?.name }}
            ({{ plane.currentAirportCode }})
          </option>
        </select>
      </div>
    </div>

    <!-- Upgrade Categories -->
    <div v-if="selectedPlane" class="section">
      <div v-for="cat in categories" :key="cat.key" class="category-section">
        <h3>{{ cat.label }}</h3>

        <!-- Installed -->
        <div v-for="u in installedInCategory(cat.key)" :key="u!.id" class="upgrade-row installed">
          <div class="upgrade-info">
            <span class="upgrade-name">{{ u!.name }}</span>
            <span class="badge badge-green">Installed</span>
          </div>
          <div class="upgrade-desc">{{ effectDescription(u!.effects) }}</div>
        </div>

        <!-- Available -->
        <div v-for="u in upgradesByCategory(cat.key)" :key="u.id" class="upgrade-row available card">
          <div class="upgrade-info">
            <span class="upgrade-name">{{ u.name }}</span>
            <span class="badge badge-blue">L{{ u.level }}</span>
          </div>
          <div class="upgrade-desc">{{ u.description }}</div>
          <div class="upgrade-meta">
            <span>{{ formatCurrency(u.cost) }}</span>
            <span>Install: {{ formatMinutes(u.installTimeMinutes) }}</span>
          </div>
          <button class="btn btn-primary btn-sm" @click="startInstall(u.id)">
            Install
          </button>
        </div>

        <p
          v-if="!installedInCategory(cat.key).length && !upgradesByCategory(cat.key).length"
          class="no-upgrades"
        >
          No upgrades available
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upgrades-page {
  max-width: 800px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-border);
}

.section {
  margin-bottom: 2rem;
}

.empty {
  opacity: 0.7;
}

.plane-selector {
  max-width: 400px;
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

.category-section {
  margin-bottom: 1.5rem;
}

.upgrade-row {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
}

.upgrade-row.installed {
  background: var(--color-background-soft);
  padding: 0.5rem 0.75rem;
}

.upgrade-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.upgrade-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.upgrade-desc {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.upgrade-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}

.no-upgrades {
  font-size: 0.85rem;
  opacity: 0.5;
  padding: 0.25rem 0;
}
</style>
