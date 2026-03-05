<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAirportStore } from '@/stores/airportStore'
import { useRouteStore } from '@/stores/routeStore'
import { usePassengerStore } from '@/stores/passengerStore'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  originCode: string
  destinationCode: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const airportStore = useAirportStore()
const routeStore = useRouteStore()
const passengerStore = usePassengerStore()

const error = ref('')
const isCreating = ref(false)

const originAirport = computed(() => airportStore.getByCode(props.originCode))
const destAirport = computed(() => airportStore.getByCode(props.destinationCode))

const distance = computed(() =>
  airportStore.getDistanceNm(props.originCode, props.destinationCode),
)

// Check if route already exists
const existingRoute = computed(() => {
  return routeStore.routeList.find(
    (r) =>
      (r.originCode === props.originCode && r.destinationCode === props.destinationCode) ||
      (r.originCode === props.destinationCode && r.destinationCode === props.originCode),
  )
})

const economyPrice = ref(0)
const businessPrice = ref(0)
const firstClassPrice = ref(0)

// Set suggested prices based on distance
watch(
  distance,
  (dist) => {
    if (dist > 0) {
      const suggested = routeStore.computeSuggestedPricing(props.originCode, props.destinationCode)
      economyPrice.value = suggested.economy
      businessPrice.value = suggested.business
      firstClassPrice.value = suggested.firstClass
    }
  },
  { immediate: true },
)

const demandPreview = computed(() =>
  passengerStore.computeDemand(props.originCode, props.destinationCode, {
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

function confirm() {
  error.value = ''
  isCreating.value = true

  if (existingRoute.value) {
    error.value = 'A route between these airports already exists.'
    isCreating.value = false
    return
  }

  const route = routeStore.createRoute({
    originCode: props.originCode,
    destinationCode: props.destinationCode,
    ticketPricing: {
      economy: economyPrice.value,
      business: businessPrice.value,
      firstClass: firstClassPrice.value,
    },
  })

  if (route) {
    emit('confirm')
  } else {
    error.value = 'Failed to create route.'
    isCreating.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal">
      <div class="modal-header">
        <h3>Create New Route</h3>
        <button class="close-btn" @click="emit('cancel')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Route -->
        <div class="section">
          <h4>Route</h4>
          <div class="route-display">
            <div class="airport">
              <span class="code">{{ originCode }}</span>
              <span class="name">{{ originAirport?.city }}</span>
            </div>
            <span class="arrow">&harr;</span>
            <div class="airport">
              <span class="code">{{ destinationCode }}</span>
              <span class="name">{{ destAirport?.city }}</span>
            </div>
          </div>
          <div class="detail-row">
            <span>Distance</span>
            <span>{{ Math.round(distance).toLocaleString() }} nm</span>
          </div>
        </div>

        <!-- Warning if route exists -->
        <div v-if="existingRoute" class="section warning">
          <p>A route between {{ originCode }} and {{ destinationCode }} already exists.</p>
        </div>

        <!-- Pricing -->
        <div class="section">
          <h4>Default Ticket Pricing</h4>
          <p class="hint">Planes assigned to this route will use these prices</p>
          <div class="pricing-row">
            <label>Economy</label>
            <input v-model.number="economyPrice" type="number" class="input price-input" min="0" />
          </div>
          <div class="pricing-row">
            <label>Business</label>
            <input v-model.number="businessPrice" type="number" class="input price-input" min="0" />
          </div>
          <div class="pricing-row">
            <label>First Class</label>
            <input
              v-model.number="firstClassPrice"
              type="number"
              class="input price-input"
              min="0"
            />
          </div>
        </div>

        <!-- Demand Preview -->
        <div class="section">
          <h4>Demand Preview</h4>
          <p class="hint">Estimated passengers per flight</p>
          <div class="demand-row">
            <span class="demand-label">Economy</span>
            <span class="demand-value">{{ demandPreview.economy }}</span>
          </div>
          <div class="demand-row">
            <span class="demand-label">Business</span>
            <span class="demand-value">{{ demandPreview.business }}</span>
          </div>
          <div class="demand-row">
            <span class="demand-label">First Class</span>
            <span class="demand-value">{{ demandPreview.firstClass }}</span>
          </div>
          <div class="detail-row estimated-revenue">
            <span>Est. Revenue per Flight</span>
            <span>{{ formatCurrency(estimatedRevenue) }}</span>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="emit('cancel')">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="isCreating || !!existingRoute"
          @click="confirm"
        >
          {{ isCreating ? 'Creating...' : 'Create Route' }}
        </button>
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

.section.warning {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid var(--color-danger);
  border-radius: 6px;
  padding: 0.75rem;
  color: var(--color-danger);
}

.section.warning p {
  margin: 0;
  font-size: 0.9rem;
}

.section h4 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  margin: 0 0 0.4rem;
}

.hint {
  font-size: 0.8rem;
  opacity: 0.6;
  margin: -0.2rem 0 0.5rem;
}

.route-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
}

.airport {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.code {
  font-weight: 600;
  font-size: 1.3rem;
}

.name {
  font-size: 0.8rem;
  opacity: 0.7;
}

.arrow {
  font-size: 1.5rem;
  opacity: 0.5;
  color: var(--color-accent);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  font-size: 0.9rem;
}

.detail-row.estimated-revenue {
  border-top: 1px solid var(--color-border);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  font-weight: 600;
}

.pricing-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
}

.pricing-row label {
  font-size: 0.9rem;
}

.price-input {
  width: 100px;
  text-align: right;
}

.demand-row {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  font-size: 0.9rem;
}

.demand-label {
  opacity: 0.8;
}

.demand-value {
  font-weight: 500;
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
