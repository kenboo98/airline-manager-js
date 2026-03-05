<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useRouteStore } from '@/stores/routeStore'

const props = defineProps<{ airportCode: string }>()
const emit = defineEmits<{
  close: []
  'create-route': []
  'view-detail': []
}>()

const router = useRouter()
const airportStore = useAirportStore()
const planeStore = usePlaneStore()
const routeStore = useRouteStore()

const airport = computed(() => airportStore.getByCode(props.airportCode))

const planesHere = computed(() => planeStore.planesAtAirport(props.airportCode))

// Routes that involve this airport
const routesHere = computed(() => routeStore.getRoutesForAirport(props.airportCode))

// Top 3 destinations from this airport
const topDestinations = computed(() => {
  return airportStore.getTopDestinations(props.airportCode, 3)
})

// Total waiting passengers
const waitingCount = computed(() => {
  return airportStore.getPassengers(props.airportCode).length
})

function onViewFullDetail() {
  router.push(`/airports/${props.airportCode}`)
}

function onCreateRoute() {
  emit('create-route')
}

function getRouteDisplay(route: ReturnType<typeof routeStore.getRoute>) {
  if (!route) return ''
  const isOrigin = route.originCode === props.airportCode
  const otherCode = isOrigin ? route.destinationCode : route.originCode
  const otherAirport = airportStore.getByCode(otherCode)
  return `${otherCode} (${otherAirport?.city})`
}

function getRouteStatus(route: ReturnType<typeof routeStore.getRoute>) {
  if (!route) return ''
  const planeCount = route.planeIds.length
  if (planeCount === 0) return 'No planes assigned'
  return `${planeCount} plane${planeCount > 1 ? 's' : ''}`
}
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
        <span>Passengers Waiting</span>
        <span>{{ waitingCount.toLocaleString() }}</span>
      </div>

      <!-- Create Route Button -->
      <button class="btn btn-primary create-route-btn" @click="onCreateRoute">
        Create Route from Here
      </button>

      <!-- Top Destinations Section -->
      <div v-if="topDestinations.length > 0" class="destinations-section">
        <h4>Top Destinations</h4>
        <div v-for="dest in topDestinations" :key="dest.code" class="destination-row">
          <div class="destination-info">
            <span class="dest-code">{{ dest.code }}</span>
            <span class="dest-city">{{ dest.city }}</span>
          </div>
          <div class="passenger-types">
            <span v-if="dest.leisureCount > 0" class="type-badge leisure" title="Leisure">
              {{ dest.leisureCount }}
            </span>
            <span v-if="dest.businessCount > 0" class="type-badge business" title="Business">
              {{ dest.businessCount }}
            </span>
            <span v-if="dest.ultraWealthyCount > 0" class="type-badge ultra" title="Ultra Wealthy">
              {{ dest.ultraWealthyCount }}
            </span>
          </div>
        </div>
        <button class="btn btn-link" @click="onViewFullDetail">More details &rarr;</button>
      </div>

      <!-- Routes Section -->
      <div class="routes-section">
        <h4>Routes from Here</h4>
        <div v-if="routesHere.length === 0" class="no-routes">
          No routes created from this airport
        </div>
        <div v-for="route in routesHere" :key="route.id" class="route-row">
          <div class="route-info">
            <span class="route-destination">{{ getRouteDisplay(route) }}</span>
            <span
              :class="['route-status', route.enabled ? 'enabled' : 'disabled']"
            >{{ route.enabled ? 'Active' : 'Paused' }}</span>
          </div>
          <span class="route-planes">{{ getRouteStatus(route) }}</span>
        </div>
        <RouterLink to="/routes" class="btn btn-link view-routes-link">
          View all routes &rarr;
        </RouterLink>
      </div>

      <!-- Planes Section -->
      <div class="planes-section">
        <h4>Your Planes Here</h4>
        <div v-if="planesHere.length === 0" class="no-planes">
          No available planes at this airport
        </div>
        <div v-for="plane in planesHere" :key="plane.id" class="plane-row">
          <div class="plane-info">
            <span class="plane-model">{{ planeStore.getModel(plane.modelId)?.name }}</span>
            <span class="plane-reg">{{ plane.registration }}</span>
            <span class="plane-seats"
              >{{ plane.seats.economy + plane.seats.business + plane.seats.firstClass }} seats</span
            >
          </div>
          <span v-if="plane.assignedRouteId" class="plane-assigned">Assigned</span>
          <span v-else class="plane-unassigned">Unassigned</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.airport-info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  width: 320px;
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
  max-height: 70vh;
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

.create-route-btn {
  width: 100%;
  margin: 0.5rem 0 0.75rem;
  justify-content: center;
}

.destinations-section {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.destinations-section h4 {
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
  opacity: 0.8;
}

.destination-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--color-border);
}

.destination-row:last-of-type {
  border-bottom: none;
}

.destination-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.dest-code {
  font-weight: 600;
  font-size: 0.9rem;
}

.dest-city {
  font-size: 0.75rem;
  opacity: 0.7;
}

.passenger-types {
  display: flex;
  gap: 0.3rem;
}

.type-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 500;
}

.type-badge.leisure {
  background: #27ae60;
  color: white;
}

.type-badge.business {
  background: #3498db;
  color: white;
}

.type-badge.ultra {
  background: #9b59b6;
  color: white;
}

.routes-section {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.routes-section h4 {
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
  opacity: 0.8;
}

.no-routes {
  font-size: 0.8rem;
  opacity: 0.6;
}

.route-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--color-border);
}

.route-row:last-of-type {
  border-bottom: none;
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.route-destination {
  font-size: 0.85rem;
  font-weight: 500;
}

.route-status {
  font-size: 0.7rem;
  padding: 0.1rem 0.35rem;
  border-radius: 10px;
  font-weight: 500;
  width: fit-content;
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

.route-planes {
  font-size: 0.75rem;
  opacity: 0.6;
  white-space: nowrap;
}

.view-routes-link {
  margin-top: 0.5rem;
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
  border-bottom: 1px solid var(--color-border);
}

.plane-row:last-of-type {
  border-bottom: none;
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

.plane-assigned {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  background: rgba(52, 152, 219, 0.15);
  color: var(--color-info);
  font-weight: 500;
  white-space: nowrap;
}

.plane-unassigned {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  background: rgba(149, 165, 166, 0.15);
  color: var(--color-text);
  opacity: 0.6;
  font-weight: 500;
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

.btn-link:hover {
  opacity: 0.8;
}
</style>
