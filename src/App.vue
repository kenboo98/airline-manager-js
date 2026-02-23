<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import GameBar from '@/components/layout/GameBar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useGameStore } from '@/stores/gameStore'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'

const gameStore = useGameStore()
const airportStore = useAirportStore()
const planeStore = usePlaneStore()

onMounted(() => {
  airportStore.loadAirports()
  planeStore.loadCatalog()
  gameStore.startGame()
})
</script>

<template>
  <GameBar />
  <AppSidebar />
  <main class="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
.main-content {
  padding: 1.5rem;
  overflow-y: auto;
  min-height: 0;
}
</style>
