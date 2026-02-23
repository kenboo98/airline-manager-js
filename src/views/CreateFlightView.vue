<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useFlightStore } from '@/stores/flightStore'
import { useGameStore } from '@/stores/gameStore'
import { usePassengerStore } from '@/stores/passengerStore'
import { formatCurrency, formatDuration } from '@/utils/format'
import { computeFairPrice } from '@/utils/pricing'

const router = useRouter()
const airportStore = useAirportStore()
const planeStore = usePlaneStore()
const flightStore = useFlightStore()
const gameStore = useGameStore()
const passengerStore = usePassengerStore()

const departureCode = ref('')
const arrivalCode = ref('')
const planeId = ref('')
const flightNumber = ref('')
const departureDay = ref(1)
const departureHour = ref(8)
const departureMinute = ref(0)
const economyPrice = ref(0)
const businessPrice = ref(0)
const firstClassPrice = ref(0)
const error = ref('')

const depSearch = ref('')
const arrSearch = ref('')

const filteredDepAirports = computed(() => {
  if (!depSearch.value) return airportStore.airportList
  return airportStore.searchAirports(depSearch.value)
})

const filteredArrAirports = computed(() => {
  if (!arrSearch.value) return airportStore.airportList
  return airportStore.searchAirports(arrSearch.value)
})

const distance = computed(() => {
  if (!departureCode.value || !arrivalCode.value) return 0
  return airportStore.getDistanceNm(departureCode.value, arrivalCode.value)
})

const selectedPlane = computed(() => {
  if (!planeId.value) return null
  return planeStore.getPlane(planeId.value) ?? null
})

const selectedModel = computed(() => {
  if (!selectedPlane.value) return null
  return planeStore.getModel(selectedPlane.value.modelId) ?? null
})

const eligiblePlanes = computed(() => {
  if (!departureCode.value || !arrivalCode.value) return []
  const depAirport = airportStore.getByCode(departureCode.value)
  const arrAirport = airportStore.getByCode(arrivalCode.value)
  const dist = distance.value

  return planeStore.availablePlanes.filter((p) => {
    const model = planeStore.getModel(p.modelId)
    if (!model) return false
    if (model.range < dist) return false
    if (depAirport && model.minRunwayLength > depAirport.runwayLength) return false
    if (arrAirport && model.minRunwayLength > arrAirport.runwayLength) return false
    return true
  })
})

const duration = computed(() => {
  if (!selectedModel.value || !distance.value) return 0
  return airportStore.getFlightDurationMinutes(
    departureCode.value,
    arrivalCode.value,
    selectedModel.value.speed,
  )
})

const departureTimeMinutes = computed(() => {
  return (departureDay.value - 1) * 1440 + departureHour.value * 60 + departureMinute.value
})

const operatingCost = computed(() => {
  if (!selectedModel.value) return 0
  const depAirport = airportStore.getByCode(departureCode.value)
  const arrAirport = airportStore.getByCode(arrivalCode.value)
  const landingFees = (depAirport?.landingFee ?? 0) + (arrAirport?.landingFee ?? 0)
  return distance.value * selectedModel.value.operatingCostPerNm + landingFees
})

const demandPreview = computed(() => {
  if (!departureCode.value || !arrivalCode.value) {
    return { economy: 0, business: 0, firstClass: 0 }
  }
  return passengerStore.computeDemand(departureCode.value, arrivalCode.value, {
    economy: economyPrice.value,
    business: businessPrice.value,
    firstClass: firstClassPrice.value,
  })
})

const estimatedRevenue = computed(() => {
  return (
    demandPreview.value.economy * economyPrice.value +
    demandPreview.value.business * businessPrice.value +
    demandPreview.value.firstClass * firstClassPrice.value
  )
})

// Auto-set fair prices when route changes
watch([departureCode, arrivalCode], () => {
  if (departureCode.value && arrivalCode.value) {
    const dist = distance.value
    economyPrice.value = computeFairPrice(dist, 'economy')
    businessPrice.value = computeFairPrice(dist, 'business')
    firstClassPrice.value = computeFairPrice(dist, 'firstClass')
  }
})

// Auto-set departure day to current game day
watch(
  () => gameStore.time.day,
  (day) => {
    if (departureDay.value < day) {
      departureDay.value = day
    }
  },
  { immediate: true },
)

function submit() {
  error.value = ''

  if (!departureCode.value || !arrivalCode.value) {
    error.value = 'Select both airports.'
    return
  }
  if (departureCode.value === arrivalCode.value) {
    error.value = 'Departure and arrival must be different.'
    return
  }
  if (!planeId.value) {
    error.value = 'Select a plane.'
    return
  }
  if (!flightNumber.value.trim()) {
    error.value = 'Enter a flight number.'
    return
  }
  if (departureTimeMinutes.value <= gameStore.totalMinutes) {
    error.value = 'Departure must be in the future.'
    return
  }

  const flight = flightStore.createFlight({
    flightNumber: flightNumber.value.trim(),
    departureAirportCode: departureCode.value,
    arrivalAirportCode: arrivalCode.value,
    planeId: planeId.value,
    departureTime: departureTimeMinutes.value,
    ticketPricing: {
      economy: economyPrice.value,
      business: businessPrice.value,
      firstClass: firstClassPrice.value,
    },
  })

  if (flight) {
    router.push('/flights/active')
  } else {
    error.value = 'Failed to create flight.'
  }
}
</script>

<template>
  <div class="create-flight-page">
    <h1>Create Flight</h1>

    <div class="form-layout">
      <div class="form-section">
        <h2>Route</h2>

        <div class="form-group">
          <label>Departure Airport</label>
          <input v-model="depSearch" class="input" placeholder="Search..." />
          <select v-model="departureCode" class="input" size="5">
            <option v-for="ap in filteredDepAirports" :key="ap.code" :value="ap.code">
              {{ ap.code }} — {{ ap.city }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Arrival Airport</label>
          <input v-model="arrSearch" class="input" placeholder="Search..." />
          <select v-model="arrivalCode" class="input" size="5">
            <option v-for="ap in filteredArrAirports" :key="ap.code" :value="ap.code">
              {{ ap.code }} — {{ ap.city }}
            </option>
          </select>
        </div>

        <p v-if="distance" class="route-info">
          Distance: {{ Math.round(distance).toLocaleString() }} nm
        </p>
      </div>

      <div class="form-section">
        <h2>Plane</h2>

        <div class="form-group">
          <label>Select Plane</label>
          <select v-model="planeId" class="input">
            <option value="" disabled>Select a plane</option>
            <option v-for="p in eligiblePlanes" :key="p.id" :value="p.id">
              {{ p.registration }} ({{ planeStore.getModel(p.modelId)?.manufacturer }}
              {{ planeStore.getModel(p.modelId)?.name }}) @ {{ p.currentAirportCode }}
            </option>
          </select>
          <p v-if="departureCode && arrivalCode && !eligiblePlanes.length" class="hint">
            No planes available for this route. Check range and runway requirements.
          </p>
        </div>

        <div class="form-group">
          <label>Flight Number</label>
          <input v-model="flightNumber" class="input" placeholder="e.g. AM101" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Departure Day</label>
            <input v-model.number="departureDay" type="number" class="input" :min="gameStore.time.day" />
          </div>
          <div class="form-group">
            <label>Hour</label>
            <input v-model.number="departureHour" type="number" class="input" min="0" max="23" />
          </div>
          <div class="form-group">
            <label>Minute</label>
            <input v-model.number="departureMinute" type="number" class="input" min="0" max="59" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>Ticket Pricing</h2>

        <div class="form-group">
          <label>Economy Price</label>
          <input v-model.number="economyPrice" type="number" class="input" min="0" />
        </div>
        <div class="form-group">
          <label>Business Price</label>
          <input v-model.number="businessPrice" type="number" class="input" min="0" />
        </div>
        <div class="form-group">
          <label>First Class Price</label>
          <input v-model.number="firstClassPrice" type="number" class="input" min="0" />
        </div>
      </div>

      <div class="form-section summary-section">
        <h2>Flight Summary</h2>
        <div class="summary card" v-if="selectedModel && distance">
          <div class="summary-row">
            <span>Distance</span>
            <span>{{ Math.round(distance).toLocaleString() }} nm</span>
          </div>
          <div class="summary-row">
            <span>Duration</span>
            <span>{{ formatDuration(duration) }}</span>
          </div>
          <div class="summary-row">
            <span>Operating Cost</span>
            <span>{{ formatCurrency(operatingCost) }}</span>
          </div>
          <div class="summary-row">
            <span>Est. Passengers</span>
            <span>
              {{ demandPreview.economy }}E / {{ demandPreview.business }}B / {{ demandPreview.firstClass }}F
            </span>
          </div>
          <div class="summary-row">
            <span>Est. Revenue</span>
            <span>{{ formatCurrency(estimatedRevenue) }}</span>
          </div>
          <div class="summary-row profit">
            <span>Est. Profit</span>
            <span :class="{ negative: estimatedRevenue - operatingCost < 0 }">
              {{ formatCurrency(estimatedRevenue - operatingCost) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <button class="btn btn-primary" @click="submit">Create Flight</button>
  </div>
</template>

<style scoped>
.create-flight-page {
  max-width: 1000px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-section h2 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-row {
  display: flex;
  gap: 0.5rem;
}

.form-row .form-group {
  flex: 1;
}

select[size] {
  height: auto;
}

.route-info {
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.hint {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-top: 0.25rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  font-size: 0.9rem;
}

.summary-row.profit {
  border-top: 1px solid var(--color-border);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  font-weight: 600;
}

.negative {
  color: var(--color-danger);
}

.error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}
</style>
