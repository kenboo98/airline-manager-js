<script setup lang="ts">
import { computed } from 'vue'
import { useAirportStore } from '@/stores/airportStore'
import { useFlightStore } from '@/stores/flightStore'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{ code: string }>()

const airportStore = useAirportStore()
const flightStore = useFlightStore()

const airport = computed(() => airportStore.getByCode(props.code))

const departures = computed(() =>
  flightStore.activeFlights.filter((f) => f.departureAirportCode === props.code),
)

const arrivals = computed(() =>
  flightStore.activeFlights.filter((f) => f.arrivalAirportCode === props.code),
)

// All waiting passengers at this airport
const waitingPassengers = computed(() => airportStore.getPassengers(props.code))

const waitingCount = computed(() => waitingPassengers.value.length)

const waitingByType = computed(() => {
  const leisure = waitingPassengers.value.filter((p) => p.type === 'leisure').length
  const business = waitingPassengers.value.filter((p) => p.type === 'business').length
  const ultraWealthy = waitingPassengers.value.filter((p) => p.type === 'ultraWealthy').length
  return { leisure, business, ultraWealthy }
})

// All destinations (not just top 3)
const allDestinations = computed(() => {
  return airportStore.getTopDestinations(props.code, 100)
})

function totalDemand(airport: {
  demand: { business: number; leisure: number; firstClass: number }
}) {
  return airport.demand.business + airport.demand.leisure + airport.demand.firstClass
}

function formatDistance(toCode: string): string {
  const dist = airportStore.getDistanceNm(props.code, toCode)
  return `${Math.round(dist).toLocaleString()} nm`
}

function averageMaxPrice(toCode: string, type: string): number {
  const passengers = waitingPassengers.value.filter(
    (p) => p.destinationCode === toCode && p.type === type,
  )
  if (passengers.length === 0) return 0
  const total = passengers.reduce((sum, p) => sum + p.maxPrice, 0)
  return Math.round(total / passengers.length)
}
</script>

<template>
  <div v-if="airport" class="airport-detail">
    <h1>{{ airport.code }} — {{ airport.name }}</h1>

    <div class="info-grid">
      <div class="card">
        <h3>Location</h3>
        <p>{{ airport.city }}, {{ airport.country }}</p>
        <p class="coords">{{ airport.lat.toFixed(4) }}, {{ airport.lng.toFixed(4) }}</p>
      </div>
      <div class="card">
        <h3>Operations</h3>
        <p>Hours: {{ airport.operatingHours.open }}:00 - {{ airport.operatingHours.close }}:00</p>
        <p>Runway: {{ airport.runwayLength.toLocaleString() }} ft</p>
        <p>Landing Fee: {{ formatCurrency(airport.landingFee) }}</p>
      </div>
      <div class="card">
        <h3>Passengers Waiting</h3>
        <p class="big-number">{{ waitingCount }}</p>
        <p class="breakdown">
          <span class="leisure">{{ waitingByType.leisure }} leisure</span> •
          <span class="business">{{ waitingByType.business }} business</span> •
          <span class="ultra">{{ waitingByType.ultraWealthy }} ultra-wealthy</span>
        </p>
      </div>
      <div class="card">
        <h3>Daily Demand ({{ totalDemand(airport) }} total)</h3>
        <p>Business: {{ airport.demand.business }}</p>
        <p>Leisure: {{ airport.demand.leisure }}</p>
        <p>First Class: {{ airport.demand.firstClass }}</p>
      </div>
    </div>

    <!-- Destinations Section -->
    <div class="destinations-section">
      <h2>Popular Destinations</h2>
      <div v-if="allDestinations.length === 0" class="no-data">
        No passengers waiting at this airport.
      </div>
      <table v-else class="destinations-table">
        <thead>
          <tr>
            <th>Destination</th>
            <th>Distance</th>
            <th>Total</th>
            <th>Leisure</th>
            <th>Business</th>
            <th>Ultra-Wealthy</th>
            <th>Avg Max Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dest in allDestinations" :key="dest.code">
            <td>
              <strong>{{ dest.code }}</strong>
              <span class="city-name">{{ dest.city }}</span>
            </td>
            <td>{{ formatDistance(dest.code) }}</td>
            <td class="total-col">{{ dest.passengerCount }}</td>
            <td class="leisure-col">{{ dest.leisureCount }}</td>
            <td class="business-col">{{ dest.businessCount }}</td>
            <td class="ultra-col">{{ dest.ultraWealthyCount }}</td>
            <td class="price-col">
              <div v-if="dest.leisureCount > 0" class="price-row">
                <span class="type-label leisure">L:</span>
                {{ formatCurrency(averageMaxPrice(dest.code, 'leisure')) }}
              </div>
              <div v-if="dest.businessCount > 0" class="price-row">
                <span class="type-label business">B:</span>
                {{ formatCurrency(averageMaxPrice(dest.code, 'business')) }}
              </div>
              <div v-if="dest.ultraWealthyCount > 0" class="price-row">
                <span class="type-label ultra">U:</span>
                {{ formatCurrency(averageMaxPrice(dest.code, 'ultraWealthy')) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="departures.length || arrivals.length" class="flights-section">
      <h2>Flights</h2>

      <div v-if="departures.length">
        <h3>Departures</h3>
        <table>
          <thead>
            <tr>
              <th>Flight</th>
              <th>To</th>
              <th>Status</th>
              <th>Passengers</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in departures" :key="f.id">
              <td>{{ f.flightNumber }}</td>
              <td>{{ f.arrivalAirportCode }}</td>
              <td>
                <span :class="['badge', f.status === 'in-flight' ? 'badge-blue' : 'badge-yellow']">
                  {{ f.status }}
                </span>
              </td>
              <td>
                {{ f.passengers.economy + f.passengers.business + f.passengers.firstClass }} /
                {{ f.passengers.economy + f.passengers.business + f.passengers.firstClass }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="arrivals.length">
        <h3>Arrivals</h3>
        <table>
          <thead>
            <tr>
              <th>Flight</th>
              <th>From</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in arrivals" :key="f.id">
              <td>{{ f.flightNumber }}</td>
              <td>{{ f.departureAirportCode }}</td>
              <td>
                <span :class="['badge', f.status === 'in-flight' ? 'badge-blue' : 'badge-yellow']">
                  {{ f.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-else>
    <p>Airport not found.</p>
  </div>
</template>

<style scoped>
.airport-detail {
  max-width: 1000px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
}

.info-grid h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.big-number {
  font-size: 2rem;
  font-weight: 600;
  margin: 0.25rem 0;
}

.breakdown {
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.8;
}

.breakdown .leisure {
  color: #27ae60;
}

.breakdown .business {
  color: #3498db;
}

.breakdown .ultra {
  color: #9b59b6;
}

.coords {
  font-size: 0.85rem;
  opacity: 0.6;
}

.destinations-section {
  margin-bottom: 2rem;
}

.destinations-section h2 {
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

.no-data {
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  opacity: 0.7;
  text-align: center;
}

.destinations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.destinations-table th,
.destinations-table td {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.destinations-table th {
  background: var(--color-background-soft);
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.city-name {
  display: block;
  font-size: 0.8rem;
  opacity: 0.7;
}

.total-col {
  font-weight: 600;
}

.leisure-col {
  color: #27ae60;
}

.business-col {
  color: #3498db;
}

.ultra-col {
  color: #9b59b6;
}

.price-col {
  font-size: 0.8rem;
}

.price-row {
  margin-bottom: 0.15rem;
}

.type-label {
  display: inline-block;
  width: 1.2rem;
  font-weight: 600;
  font-size: 0.7rem;
}

.type-label.leisure {
  color: #27ae60;
}

.type-label.business {
  color: #3498db;
}

.type-label.ultra {
  color: #9b59b6;
}

.flights-section {
  margin-top: 1.5rem;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

h3 {
  font-size: 1rem;
  margin: 1rem 0 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.badge-yellow {
  background: #f39c12;
  color: white;
}

.badge-blue {
  background: #3498db;
  color: white;
}
</style>
