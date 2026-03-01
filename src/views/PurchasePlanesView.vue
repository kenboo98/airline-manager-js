<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlaneStore } from '@/stores/planeStore'
import { useCompanyStore } from '@/stores/companyStore'
import { useAirportStore } from '@/stores/airportStore'
import { formatCurrency } from '@/utils/format'
import type { PlaneModel } from '@/types'

const planeStore = usePlaneStore()
const companyStore = useCompanyStore()
const airportStore = useAirportStore()

const showPurchaseModal = ref(false)
const selectedModel = ref<PlaneModel | null>(null)
const registration = ref('')
const homeAirport = ref('')
const purchaseError = ref('')

function openPurchase(model: PlaneModel) {
  selectedModel.value = model
  registration.value = ''
  homeAirport.value = ''
  purchaseError.value = ''
  showPurchaseModal.value = true
}

function closePurchase() {
  showPurchaseModal.value = false
  selectedModel.value = null
}

const canAfford = computed(() => {
  if (!selectedModel.value) return false
  return companyStore.company.cash >= selectedModel.value.purchasePrice
})

function confirmPurchase() {
  if (!selectedModel.value || !registration.value.trim() || !homeAirport.value) {
    purchaseError.value = 'Please fill in all fields.'
    return
  }
  if (!canAfford.value) {
    purchaseError.value = 'Insufficient funds.'
    return
  }
  const result = planeStore.purchasePlane(
    selectedModel.value.id,
    registration.value.trim(),
    homeAirport.value,
  )
  if (result) {
    closePurchase()
  } else {
    purchaseError.value = 'Purchase failed.'
  }
}
</script>

<template>
  <div class="purchase-page">
    <h1>Buy Planes</h1>
    <p class="cash-display">Available: {{ formatCurrency(companyStore.company.cash) }}</p>

    <div class="catalog-grid">
      <div v-for="model in planeStore.catalog" :key="model.id" class="card plane-card">
        <h3>{{ model.manufacturer }} {{ model.name }}</h3>
        <div class="specs">
          <div class="spec">
            <span class="spec-label">Range</span>
            <span>{{ model.range.toLocaleString() }} nm</span>
          </div>
          <div class="spec">
            <span class="spec-label">Speed</span>
            <span>{{ model.speed }} kt</span>
          </div>
          <div class="spec">
            <span class="spec-label">Seats</span>
            <span>
              {{ model.defaultSeats.economy }}E / {{ model.defaultSeats.business }}B
              <template v-if="model.defaultSeats.firstClass">
                / {{ model.defaultSeats.firstClass }}F
              </template>
            </span>
          </div>
          <div class="spec">
            <span class="spec-label">Min Runway</span>
            <span>{{ model.minRunwayLength.toLocaleString() }} ft</span>
          </div>
          <div class="spec">
            <span class="spec-label">Op. Cost</span>
            <span>{{ formatCurrency(model.operatingCostPerNm) }}/nm</span>
          </div>
        </div>
        <div class="plane-footer">
          <span class="price">{{ formatCurrency(model.purchasePrice) }}</span>
          <button
            class="btn btn-primary"
            :disabled="companyStore.company.cash < model.purchasePrice"
            @click="openPurchase(model)"
          >
            Buy
          </button>
        </div>
      </div>
    </div>

    <!-- Purchase Modal -->
    <div
      v-if="showPurchaseModal && selectedModel"
      class="modal-overlay"
      @click.self="closePurchase"
    >
      <div class="modal card">
        <h2>Purchase {{ selectedModel.manufacturer }} {{ selectedModel.name }}</h2>
        <p>Price: {{ formatCurrency(selectedModel.purchasePrice) }}</p>

        <div class="form-group">
          <label>Registration</label>
          <input v-model="registration" class="input" placeholder="e.g. N12345" />
        </div>

        <div class="form-group">
          <label>Home Airport</label>
          <select v-model="homeAirport" class="input">
            <option value="" disabled>Select airport</option>
            <option
              v-for="ap in airportStore.airportList"
              :key="ap.code"
              :value="ap.code"
              :disabled="ap.runwayLength < selectedModel.minRunwayLength"
            >
              {{ ap.code }} — {{ ap.city }}
              <template v-if="ap.runwayLength < selectedModel.minRunwayLength">
                (runway too short)
              </template>
            </option>
          </select>
        </div>

        <p v-if="purchaseError" class="error">{{ purchaseError }}</p>

        <div class="modal-actions">
          <button class="btn" @click="closePurchase">Cancel</button>
          <button class="btn btn-primary" :disabled="!canAfford" @click="confirmPurchase">
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.purchase-page {
  max-width: 1100px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.cash-display {
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.plane-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.specs {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1rem;
}

.spec {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.spec-label {
  opacity: 0.6;
}

.plane-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.price {
  font-size: 1.1rem;
  font-weight: 600;
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
  width: 400px;
  max-width: 90vw;
}

.modal h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.form-group {
  margin: 1rem 0;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.error {
  color: var(--color-danger);
  font-size: 0.85rem;
}
</style>
