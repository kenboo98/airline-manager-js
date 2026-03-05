<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouteStore } from '@/stores/routeStore'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'
import { formatCurrency } from '@/utils/format'
import type { Route } from '@/types'

const routeStore = useRouteStore()
const airportStore = useAirportStore()
const planeStore = usePlaneStore()

const editingRoute = ref<Route | null>(null)
const economyPrice = ref(0)
const businessPrice = ref(0)
const firstClassPrice = ref(0)

const sortedRoutes = computed(() => {
  return [...routeStore.routeList].sort((a, b) => {
    // Sort by profit (descending)
    const profitA = a.totalRevenue - a.totalCost
    const profitB = b.totalRevenue - b.totalCost
    return profitB - profitA
  })
})

const totalMetrics = computed(() => {
  const routes = routeStore.routeList
  let totalRevenue = 0
  let totalCost = 0
  let totalFlights = 0

  for (const route of routes) {
    totalRevenue += route.totalRevenue
    totalCost += route.totalCost
    totalFlights += route.flightCount
  }

  return {
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    totalFlights,
    routeCount: routes.length,
    avgProfitPerFlight: totalFlights > 0 ? (totalRevenue - totalCost) / totalFlights : 0,
  }
})

function getRouteMetrics(route: Route) {
  return routeStore.getMetrics(route.id)
}

function getRouteDisplay(route: Route) {
  const origin = airportStore.getByCode(route.originCode)
  const dest = airportStore.getByCode(route.destinationCode)
  return {
    codes: `${route.originCode} ↔ ${route.destinationCode}`,
    cities: `${origin?.city || route.originCode} ↔ ${dest?.city || route.destinationCode}`,
    distance: airportStore.getDistanceNm(route.originCode, route.destinationCode),
  }
}

function getAssignedPlanes(route: Route) {
  return route.planeIds
    .map((id) => planeStore.getPlane(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
}

function toggleRoute(route: Route) {
  routeStore.toggleRouteEnabled(route.id)
}

function openEditModal(route: Route) {
  editingRoute.value = route
  economyPrice.value = route.ticketPricing.economy
  businessPrice.value = route.ticketPricing.business
  firstClassPrice.value = route.ticketPricing.firstClass
}

function closeEditModal() {
  editingRoute.value = null
}

function savePricing() {
  if (!editingRoute.value) return
  routeStore.updateTicketPricing(editingRoute.value.id, {
    economy: economyPrice.value,
    business: businessPrice.value,
    firstClass: firstClassPrice.value,
  })
  closeEditModal()
}

function deleteRoute(route: Route) {
  if (confirm(`Are you sure you want to delete the route ${route.originCode} ↔ ${route.destinationCode}?`)) {
    routeStore.deleteRoute(route.id)
  }
}

function formatProfit(profit: number): string {
  const formatted = formatCurrency(profit)
  return profit >= 0 ? `+${formatted}` : formatted
}

function profitClass(profit: number): string {
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}
</script>

<template>
  <div class="routes-page">
    <h1>Routes</h1>

    <!-- Summary Cards -->
    <div v-if="routeStore.routeList.length > 0" class="summary-cards">
      <div class="card summary-card">
        <span class="summary-label">Total Routes</span>
        <span class="summary-value">{{ totalMetrics.routeCount }}</span>
      </div>
      <div class="card summary-card">
        <span class="summary-label">Total Revenue</span>
        <span class="summary-value">{{ formatCurrency(totalMetrics.totalRevenue) }}</span>
      </div>
      <div class="card summary-card">
        <span class="summary-label">Total Costs</span>
        <span class="summary-value">{{ formatCurrency(totalMetrics.totalCost) }}</span>
      </div>
      <div class="card summary-card">
        <span class="summary-label">Total Profit</span>
        <span :class="['summary-value', profitClass(totalMetrics.totalProfit)]">
          {{ formatProfit(totalMetrics.totalProfit) }}
        </span>
      </div>
      <div class="card summary-card">
        <span class="summary-label">Total Flights</span>
        <span class="summary-value">{{ totalMetrics.totalFlights.toLocaleString() }}</span>
      </div>
      <div class="card summary-card">
        <span class="summary-label">Avg Profit/Flight</span>
        <span :class="['summary-value', profitClass(totalMetrics.avgProfitPerFlight)]">
          {{ formatProfit(totalMetrics.avgProfitPerFlight) }}
        </span>
      </div>
    </div>

    <p v-if="!routeStore.routeList.length" class="empty">
      No routes yet.
      <RouterLink to="/map">Create your first route on the map!</RouterLink>
    </p>

    <div v-else class="routes-table-container">
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Distance</th>
            <th>Status</th>
            <th>Planes</th>
            <th>Flights</th>
            <th>Revenue</th>
            <th>Costs</th>
            <th>Profit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="route in sortedRoutes" :key="route.id" :class="{ disabled: !route.enabled }">
            <td>
              <div class="route-display">
                <span class="route-codes">{{ getRouteDisplay(route).codes }}</span>
                <span class="route-cities">{{ getRouteDisplay(route).cities }}</span>
              </div>
            </td>
            <td>{{ Math.round(getRouteDisplay(route).distance).toLocaleString() }} nm</td>
            <td>
              <span :class="['badge', route.enabled ? 'badge-green' : 'badge-gray']">
                {{ route.enabled ? 'Active' : 'Paused' }}
              </span>
            </td>
            <td>
              <div class="planes-cell">
                <span class="plane-count">{{ route.planeIds.length }}</span>
                <div v-if="route.planeIds.length > 0" class="plane-list">
                  <span
                    v-for="plane in getAssignedPlanes(route)"
                    :key="plane.id"
                    class="plane-tag"
                  >
                    {{ plane.registration }}
                  </span>
                </div>
              </div>
            </td>
            <td>{{ route.flightCount.toLocaleString() }}</td>
            <td>{{ formatCurrency(route.totalRevenue) }}</td>
            <td>{{ formatCurrency(route.totalCost) }}</td>
            <td>
              <span :class="['profit', profitClass(getRouteMetrics(route)?.profit || 0)]">
                {{ formatProfit(getRouteMetrics(route)?.profit || 0) }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="btn btn-sm" @click="toggleRoute(route)">
                  {{ route.enabled ? 'Pause' : 'Resume' }}
                </button>
                <button class="btn btn-sm" @click="openEditModal(route)">Pricing</button>
                <button class="btn btn-sm btn-danger" @click="deleteRoute(route)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Pricing Modal -->
    <div v-if="editingRoute" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal card">
        <div class="modal-header">
          <h2>Edit Pricing</h2>
          <button class="close-btn" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="route-info">
            <p class="route-name">{{ getRouteDisplay(editingRoute).codes }}</p>
            <p class="route-cities">{{ getRouteDisplay(editingRoute).cities }}</p>
          </div>

          <div class="pricing-section">
            <h4>Ticket Pricing</h4>
            <div class="pricing-row">
              <label>Economy</label>
              <input
                v-model.number="economyPrice"
                type="number"
                class="input price-input"
                min="0"
              />
            </div>
            <div class="pricing-row">
              <label>Business</label>
              <input
                v-model.number="businessPrice"
                type="number"
                class="input price-input"
                min="0"
              />
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
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeEditModal">Cancel</button>
          <button class="btn btn-primary" @click="savePricing">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.routes-page {
  max-width: 1200px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty {
  opacity: 0.7;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.8rem;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.summary-value.profit-positive {
  color: var(--color-success);
}

.summary-value.profit-negative {
  color: var(--color-danger);
}

/* Table */
.routes-table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 900px;
}

th,
td {
  padding: 0.75rem;
}

tbody tr.disabled {
  opacity: 0.6;
}

.route-display {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.route-codes {
  font-weight: 600;
  font-size: 0.95rem;
}

.route-cities {
  font-size: 0.8rem;
  opacity: 0.7;
}

.badge-gray {
  background: rgba(149, 165, 166, 0.15);
  color: var(--color-text);
  opacity: 0.7;
}

.planes-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.plane-count {
  font-weight: 600;
  min-width: 1.5rem;
}

.plane-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.plane-tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  background: var(--color-background-mute);
  border-radius: 4px;
  font-family: monospace;
}

.profit {
  font-weight: 600;
}

.profit-positive {
  color: var(--color-success);
}

.profit-negative {
  color: var(--color-danger);
}

.actions {
  display: flex;
  gap: 0.4rem;
}

.actions .btn {
  font-size: 0.75rem;
  padding: 0.3rem 0.5rem;
}

/* Modal */
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
  width: 360px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 1.15rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.6;
  line-height: 1;
}

.close-btn:hover {
  opacity: 1;
}

.modal-body {
  margin-bottom: 1rem;
}

.route-info {
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.route-name {
  font-weight: 600;
  font-size: 1rem;
  margin: 0;
}

.route-cities {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0.25rem 0 0;
}

.pricing-section h4 {
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
  opacity: 0.8;
}

.pricing-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
}

.pricing-row label {
  font-size: 0.9rem;
}

.price-input {
  width: 120px;
  text-align: right;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>
