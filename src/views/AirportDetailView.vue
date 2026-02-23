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

function totalDemand(airport: { demand: { business: number; leisure: number; firstClass: number } }) {
  return airport.demand.business + airport.demand.leisure + airport.demand.firstClass
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
        <h3>Demand ({{ totalDemand(airport) }} total/day)</h3>
        <p>Business: {{ airport.demand.business }}</p>
        <p>Leisure: {{ airport.demand.leisure }}</p>
        <p>First Class: {{ airport.demand.firstClass }}</p>
      </div>
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
  max-width: 900px;
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

.info-grid h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.coords {
  font-size: 0.85rem;
  opacity: 0.6;
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
</style>
