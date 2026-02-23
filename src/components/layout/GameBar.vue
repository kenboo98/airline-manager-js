<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { useCompanyStore } from '@/stores/companyStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useUiStore } from '@/stores/uiStore'
import { formatGameTime, formatCurrency } from '@/utils/format'
import type { GameSpeed } from '@/types'

const gameStore = useGameStore()
const companyStore = useCompanyStore()
const planeStore = usePlaneStore()
const uiStore = useUiStore()

function setSpeed(s: GameSpeed) {
  gameStore.setSpeed(s)
}
</script>

<template>
  <div class="gamebar">
    <button class="menu-btn" @click="uiStore.toggleSidebar">&#9776;</button>

    <div class="gamebar-section company-name">
      {{ companyStore.company.name || 'My Airline' }}
    </div>

    <div class="gamebar-section time">
      {{ formatGameTime(gameStore.totalMinutes) }}
    </div>

    <div class="gamebar-section speed-controls">
      <button
        :class="['speed-btn', { active: gameStore.speed === 0 }]"
        @click="setSpeed(0)"
        title="Pause"
      >
        &#10074;&#10074;
      </button>
      <button
        :class="['speed-btn', { active: gameStore.speed === 1 }]"
        @click="setSpeed(1)"
        title="Normal"
      >
        &#9654;
      </button>
      <button
        :class="['speed-btn', { active: gameStore.speed === 2 }]"
        @click="setSpeed(2)"
        title="Fast"
      >
        &#9654;&#9654;
      </button>
      <button
        :class="['speed-btn', { active: gameStore.speed === 3 }]"
        @click="setSpeed(3)"
        title="Ultra"
      >
        &#9654;&#9654;&#9654;
      </button>
    </div>

    <div class="gamebar-section stats">
      <span class="stat">{{ formatCurrency(companyStore.company.cash) }}</span>
      <span class="stat">{{ planeStore.fleetList.length }} planes</span>
    </div>
  </div>
</template>

<style scoped>
.gamebar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
  height: var(--gamebar-height);
  font-size: 0.875rem;
}

.menu-btn {
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
}

.company-name {
  font-weight: 600;
}

.time {
  font-family: monospace;
  background: var(--color-background);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.speed-controls {
  display: flex;
  gap: 2px;
}

.speed-btn {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.15rem 0.4rem;
  cursor: pointer;
  font-size: 0.65rem;
  border-radius: 3px;
}

.speed-btn.active {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.stats {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.stat {
  font-weight: 500;
}
</style>
