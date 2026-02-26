<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useFlightStore } from '@/stores/flightStore'
import { useGameStore } from '@/stores/gameStore'
import { usePassengerStore } from '@/stores/passengerStore'
import { formatCurrency, formatDuration } from '@/utils/format'
import { computeFairPrice } from '@/utils/pricing'

const props = defineProps<{
  departureCode: string
  arrivalCode: string
  planeId: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const airportStore = useAirportStore()
const planeStore = usePlaneStore()
const flightStore = useFlightStore()
const gameStore = useGameStore()
const passengerStore = usePassengerStore()

const error = ref('')

const depAirport = computed(() => airportStore.getByCode(props.departureCode))
const arrAirport = computed(() => airportStore.getByCode(props.arrivalCode))
const plane = computed(() => planeStore.getPlane(props.planeId))
const model = computed(() => (plane.value ? planeStore.getModel(plane.value.modelId) : undefined))

const distance = computed(() =>
  airportStore.getDistanceNm(props.departureCode, props.arrivalCode),
)

const duration = computed(() => {
  if (!model.value) return 0
  return airportStore.getFlightDurationMinutes(
    props.departureCode,
    props.arrivalCode,
    model.value.speed,
  )
})

const flightNumber = computed(() => `AM${flightStore.flightList.length + 101}`)
const departureTime = computed(() => gameStore.totalMinutes + 5)

const economyPrice = ref(0)
const businessPrice = ref(0)
const firstClassPrice = ref(0)

// Set fair prices on mount
watch(
  distance,
  (dist) => {
    if (dist > 0) {
      economyPrice.value = computeFairPrice(dist, 'economy')
      businessPrice.value = computeFairPrice(dist, 'business')
      firstClassPrice.value = computeFairPrice(dist, 'firstClass')
    }
  },
  { immediate: true },
)

const operatingCost = computed(() => {
  if (!model.value) return 0
  const landingFees = (depAirport.value?.landingFee ?? 0) + (arrAirport.value?.landingFee ?? 0)
  return distance.value * model.value.operatingCostPerNm + landingFees
})

const demandPreview = computed(() =>
  passengerStore.computeDemand(props.departureCode, props.arrivalCode, {
    economy: economyPrice.value,
    business: businessPrice.value,
    firstClass: firstClassPrice.value,
  }),
)

const estimatedRevenue = computed(
  () =>
    demandPreview.value.economy * economyPrice.value +
    demandPreview.value.business * businessPrice.value +
    demandPreview.value.firstClass * firstClassPrice.value,
)

const estimatedProfit = computed(() => estimatedRevenue.value - operatingCost.value)

function confirm() {
  error.value = ''
  const flight = flightStore.createFlight({
    flightNumber: flightNumber.value,
    departureAirportCode: props.departureCode,
    arrivalAirportCode: props.arrivalCode,
    planeId: props.planeId,
    departureTime: departureTime.value,
    ticketPricing: {
      economy: economyPrice.value,
      business: businessPrice.value,
      firstClass: firstClassPrice.value,
    },
  })

  if (flight) {
    emit('confirm')
  } else {
    error.value = 'Failed to create flight.'
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal">
      <div class="modal-header">
        <h3>Confirm Flight</h3>
        <button class="close-btn" @click="emit('cancel')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Route -->
        <div class="section">
          <h4>Route</h4>
          <div class="route-display">
            <span class="code">{{ departureCode }}</span>
            <span class="arrow">&rarr;</span>
            <span class="code">{{ arrivalCode }}</span>
          </div>
          <div class="detail-row">
            <span>Distance</span>
            <span>{{ Math.round(distance).toLocaleString() }} nm</span>
          </div>
          <div class="detail-row">
            <span>Duration</span>
            <span>{{ formatDuration(duration) }}</span>
          </div>
        </div>

        <!-- Plane -->
        <div class="section">
          <h4>Plane</h4>
          <div class="detail-row">
            <span>{{ model?.manufacturer }} {{ model?.name }}</span>
            <span>{{ plane?.registration }}</span>
          </div>
          <div class="detail-row">
            <span>Flight</span>
            <span>{{ flightNumber }}</span>
          </div>
        </div>

        <!-- Pricing -->
        <div class="section">
          <h4>Ticket Pricing</h4>
          <div v-if="plane && plane.seats.economy > 0" class="pricing-row">
            <label>Economy</label>
            <input v-model.number="economyPrice" type="number" class="input price-input" min="0" />
          </div>
          <div v-if="plane && plane.seats.business > 0" class="pricing-row">
            <label>Business</label>
            <input
              v-model.number="businessPrice"
              type="number"
              class="input price-input"
              min="0"
            />
          </div>
          <div v-if="plane && plane.seats.firstClass > 0" class="pricing-row">
            <label>First Class</label>
            <input
              v-model.number="firstClassPrice"
              type="number"
              class="input price-input"
              min="0"
            />
          </div>
        </div>

        <!-- Summary -->
        <div class="section">
          <h4>Estimate</h4>
          <div class="detail-row">
            <span>Passengers</span>
            <span>
              <template v-if="plane && plane.seats.economy > 0">{{ demandPreview.economy }}E</template>
              <template v-if="plane && plane.seats.business > 0">{{ plane.seats.economy > 0 ? ' / ' : '' }}{{ demandPreview.business }}B</template>
              <template v-if="plane && plane.seats.firstClass > 0">{{ (plane.seats.economy > 0 || plane.seats.business > 0) ? ' / ' : '' }}{{ demandPreview.firstClass }}F</template>
            </span>
          </div>
          <div class="detail-row">
            <span>Revenue</span>
            <span>{{ formatCurrency(estimatedRevenue) }}</span>
          </div>
          <div class="detail-row">
            <span>Operating Cost</span>
            <span>{{ formatCurrency(operatingCost) }}</span>
          </div>
          <div class="detail-row profit">
            <span>Profit</span>
            <span :class="{ negative: estimatedProfit < 0 }">
              {{ formatCurrency(estimatedProfit) }}
            </span>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="emit('cancel')">Cancel</button>
        <button class="btn btn-primary" @click="confirm">Confirm Flight</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--color-background);
  border-radius: 8px;
  width: 420px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
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

.modal-body {
  padding: 0.75rem 1rem;
}

.section {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.section h4 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  margin: 0 0 0.4rem;
}

.route-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.code {
  font-weight: 600;
  font-size: 1.2rem;
}

.arrow {
  opacity: 0.5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  font-size: 0.9rem;
}

.detail-row.profit {
  border-top: 1px solid var(--color-border);
  margin-top: 0.3rem;
  padding-top: 0.4rem;
  font-weight: 600;
}

.negative {
  color: var(--color-danger);
}

.pricing-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0;
}

.pricing-row label {
  font-size: 0.9rem;
}

.price-input {
  width: 100px;
  text-align: right;
}

.error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}
</style>
