<script setup lang="ts">
import { computed } from 'vue'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'

const props = defineProps<{ airportCode: string }>()
const emit = defineEmits<{
  close: []
  'select-plane': [planeId: string]
  'view-detail': []
}>()

const airportStore = useAirportStore()
const planeStore = usePlaneStore()

const airport = computed(() => airportStore.getByCode(props.airportCode))

const totalDemand = computed(() => {
  if (!airport.value) return 0
  const d = airport.value.demand
  return d.business + d.leisure + d.firstClass
})

const planesHere = computed(() => planeStore.planesAtAirport(props.airportCode))
</script>

<template>
  <div class="airport-info-panel">
    <div class="panel-header">
      <h3>{{ airport?.code }}</h3>
      <button class="close-btn" @click="emit('close')">&times;</button>
    </div>

    <div v-if="airport" class="panel-body">
      <p class="airport-name">{{ airport.name }}</p>
      <p class="airport-city">{{ airport.city }}</p>

      <div class="detail-row">
        <span>Total Demand</span>
        <span>{{ totalDemand.toLocaleString() }}</span>
      </div>
      <div class="detail-row sub">
        <span>Business</span>
        <span>{{ airport.demand.business }}</span>
      </div>
      <div class="detail-row sub">
        <span>Leisure</span>
        <span>{{ airport.demand.leisure }}</span>
      </div>
      <div class="detail-row sub">
        <span>First Class</span>
        <span>{{ airport.demand.firstClass }}</span>
      </div>

      <div class="planes-section">
        <h4>Your Planes Here</h4>
        <div v-if="planesHere.length === 0" class="no-planes">No available planes at this airport</div>
        <div v-for="plane in planesHere" :key="plane.id" class="plane-row">
          <div class="plane-info">
            <span class="plane-model">{{ planeStore.getModel(plane.modelId)?.name }}</span>
            <span class="plane-reg">{{ plane.registration }}</span>
            <span class="plane-seats">{{ plane.seats.economy + plane.seats.business + plane.seats.firstClass }} seats</span>
          </div>
          <button class="btn btn-sm" @click="emit('select-plane', plane.id)">
            Select for Flight
          </button>
        </div>
      </div>

      <button class="btn btn-link" @click="emit('view-detail')">View Airport Detail</button>
    </div>
  </div>
</template>

<style scoped>
.airport-info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  width: 300px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--color-text);
  line-height: 1;
  padding: 0 0.25rem;
}

.panel-body {
  padding: 0.75rem 1rem;
  max-height: 60vh;
  overflow-y: auto;
}

.airport-name {
  font-weight: 500;
  margin: 0 0 0.15rem;
}

.airport-city {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0 0 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-row.sub {
  font-weight: 400;
  font-size: 0.8rem;
  padding-left: 0.5rem;
  opacity: 0.8;
}

.planes-section {
  margin-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
}

.planes-section h4 {
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
}

.no-planes {
  font-size: 0.8rem;
  opacity: 0.6;
}

.plane-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  gap: 0.5rem;
}

.plane-row + .plane-row {
  border-top: 1px solid var(--color-border);
}

.plane-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.plane-model {
  font-size: 0.85rem;
  font-weight: 500;
}

.plane-reg {
  font-size: 0.75rem;
  opacity: 0.7;
}

.plane-seats {
  font-size: 0.75rem;
  opacity: 0.6;
}

.btn-sm {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  white-space: nowrap;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0.5rem 0 0;
  font-size: 0.85rem;
  text-decoration: underline;
  display: block;
  width: 100%;
  text-align: left;
}
</style>
