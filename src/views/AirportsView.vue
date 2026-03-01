<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAirportStore } from '@/stores/airportStore'

const airportStore = useAirportStore()
const searchQuery = ref('')
const sortBy = ref<'demand' | 'code' | 'city'>('demand')

const filteredAirports = computed(() => {
  let list = searchQuery.value
    ? airportStore.searchAirports(searchQuery.value)
    : airportStore.airportList

  if (sortBy.value === 'demand') {
    list = [...list].sort((a, b) => {
      const da = a.demand.business + a.demand.leisure + a.demand.firstClass
      const db = b.demand.business + b.demand.leisure + b.demand.firstClass
      return db - da
    })
  } else if (sortBy.value === 'code') {
    list = [...list].sort((a, b) => a.code.localeCompare(b.code))
  } else {
    list = [...list].sort((a, b) => a.city.localeCompare(b.city))
  }

  return list
})

function totalDemand(airport: {
  demand: { business: number; leisure: number; firstClass: number }
}) {
  return airport.demand.business + airport.demand.leisure + airport.demand.firstClass
}
</script>

<template>
  <div class="airports-page">
    <h1>Airports</h1>

    <div class="controls">
      <input v-model="searchQuery" class="input search-input" placeholder="Search airports..." />
      <select v-model="sortBy" class="input sort-select">
        <option value="demand">Sort by Demand</option>
        <option value="code">Sort by Code</option>
        <option value="city">Sort by City</option>
      </select>
    </div>

    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>City</th>
          <th>Total Demand</th>
          <th>Hours</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="airport in filteredAirports" :key="airport.code">
          <td>
            <RouterLink :to="`/airports/${airport.code}`" class="code-link">
              {{ airport.code }}
            </RouterLink>
          </td>
          <td>{{ airport.name }}</td>
          <td>{{ airport.city }}</td>
          <td>{{ totalDemand(airport) }}</td>
          <td>{{ airport.operatingHours.open }}:00 - {{ airport.operatingHours.close }}:00</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.airports-page {
  max-width: 1000px;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-input {
  max-width: 300px;
}

.sort-select {
  max-width: 180px;
}

.code-link {
  font-weight: 600;
}
</style>
