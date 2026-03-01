<script setup lang="ts">
import { ref } from 'vue'
import { useCompanyStore } from '@/stores/companyStore'
import { formatCurrency } from '@/utils/format'

const companyStore = useCompanyStore()
const nameInput = ref(companyStore.company.name)

function saveName() {
  companyStore.setName(nameInput.value.trim())
}

function maxBarValue() {
  const history = companyStore.company.financialHistory
  if (!history.length) return 1
  return Math.max(...history.map((r) => Math.max(r.revenue, r.expenses)), 1)
}
</script>

<template>
  <div class="company-page">
    <h1>Company</h1>

    <div class="section">
      <h2>Airline Name</h2>
      <div class="name-form">
        <input v-model="nameInput" class="input" placeholder="Enter airline name" />
        <button class="btn btn-primary" @click="saveName">Save</button>
      </div>
    </div>

    <div class="section">
      <h2>Financial Summary</h2>
      <div class="finance-cards">
        <div class="card">
          <div class="card-label">Cash</div>
          <div class="card-value">{{ formatCurrency(companyStore.company.cash) }}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Revenue</div>
          <div class="card-value revenue">
            {{ formatCurrency(companyStore.company.totalRevenue) }}
          </div>
        </div>
        <div class="card">
          <div class="card-label">Total Expenses</div>
          <div class="card-value expenses">
            {{ formatCurrency(companyStore.company.totalExpenses) }}
          </div>
        </div>
        <div class="card">
          <div class="card-label">Net Profit</div>
          <div
            :class="[
              'card-value',
              companyStore.company.totalRevenue - companyStore.company.totalExpenses >= 0
                ? 'revenue'
                : 'expenses',
            ]"
          >
            {{
              formatCurrency(companyStore.company.totalRevenue - companyStore.company.totalExpenses)
            }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="companyStore.company.financialHistory.length" class="section">
      <h2>Daily History (Last {{ companyStore.company.financialHistory.length }} days)</h2>
      <div class="chart">
        <div
          v-for="(record, i) in companyStore.company.financialHistory"
          :key="i"
          class="chart-bar-group"
        >
          <div class="chart-bars">
            <div
              class="bar revenue-bar"
              :style="{ height: (record.revenue / maxBarValue()) * 100 + '%' }"
              :title="'Revenue: ' + formatCurrency(record.revenue)"
            ></div>
            <div
              class="bar expense-bar"
              :style="{ height: (record.expenses / maxBarValue()) * 100 + '%' }"
              :title="'Expenses: ' + formatCurrency(record.expenses)"
            ></div>
          </div>
          <div class="chart-label">D{{ record.date + 1 }}</div>
        </div>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-color revenue-color"></span> Revenue</span>
        <span class="legend-item"><span class="legend-color expense-color"></span> Expenses</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.company-page {
  max-width: 900px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.section {
  margin-bottom: 2rem;
}

h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.name-form {
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
}

.name-form .input {
  flex: 1;
}

.finance-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.card-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 1.3rem;
  font-weight: 600;
}

.revenue {
  color: var(--color-success);
}

.expenses {
  color: var(--color-danger);
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 150px;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  flex: 1;
  width: 100%;
}

.bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  min-height: 1px;
}

.revenue-bar {
  background: var(--color-success);
  opacity: 0.7;
}

.expense-bar {
  background: var(--color-danger);
  opacity: 0.7;
}

.chart-label {
  font-size: 0.65rem;
  opacity: 0.5;
  margin-top: 2px;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.revenue-color {
  background: var(--color-success);
}

.expense-color {
  background: var(--color-danger);
}
</style>
