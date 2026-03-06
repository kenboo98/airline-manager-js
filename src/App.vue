<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import GameBar from '@/components/layout/GameBar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import GameSetupView from '@/views/GameSetupView.vue'
import { useGameStore } from '@/stores/gameStore'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useUpgradeStore } from '@/stores/upgradeStore'

const gameStore = useGameStore()
const airportStore = useAirportStore()
const planeStore = usePlaneStore()
const upgradeStore = useUpgradeStore()

onMounted(() => {
  airportStore.loadAirports()
  planeStore.loadCatalog()
  upgradeStore.loadCatalog()
})
</script>

<template>
  <template v-if="!gameStore.setupComplete">
    <GameSetupView />
  </template>
  <template v-else>
    <GameBar />
    <AppSidebar />
    <NotificationContainer />
    <main class="main-content">
      <RouterView />
    </main>
  </template>
</template>

<style scoped>
.main-content {
  padding: 1.5rem;
  overflow-y: auto;
  min-height: 0;
}
</style>
