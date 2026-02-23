<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from '@vue-leaflet/vue-leaflet'
import { useAirportStore } from '@/stores/airportStore'
import { useFlightStore } from '@/stores/flightStore'
import { useGameStore } from '@/stores/gameStore'
import { interpolatePosition } from '@/utils/geo'

const router = useRouter()
const airportStore = useAirportStore()
const flightStore = useFlightStore()
const gameStore = useGameStore()

const airports = computed(() => airportStore.airportList)

const flyingRoutes = computed(() =>
  flightStore.currentlyFlying.map((f) => {
    const dep = airportStore.getByCode(f.departureAirportCode)
    const arr = airportStore.getByCode(f.arrivalAirportCode)
    if (!dep || !arr) return null
    const progress =
      (gameStore.totalMinutes - f.departureTime) / (f.arrivalTime - f.departureTime)
    const pos = interpolatePosition(
      { lat: dep.lat, lng: dep.lng },
      { lat: arr.lat, lng: arr.lng },
      progress,
    )
    return {
      id: f.id,
      latLngs: [
        [dep.lat, dep.lng],
        [arr.lat, arr.lng],
      ] as [number, number][],
      planePos: [pos.lat, pos.lng] as [number, number],
      flightNumber: f.flightNumber,
    }
  }).filter(Boolean),
)

const scheduledRoutes = computed(() =>
  flightStore.scheduledFlights.map((f) => {
    const dep = airportStore.getByCode(f.departureAirportCode)
    const arr = airportStore.getByCode(f.arrivalAirportCode)
    if (!dep || !arr) return null
    return {
      id: f.id,
      latLngs: [
        [dep.lat, dep.lng],
        [arr.lat, arr.lng],
      ] as [number, number][],
    }
  }).filter(Boolean),
)

function navigateToAirport(code: string) {
  router.push(`/airports/${code}`)
}
</script>

<template>
  <div class="map-container">
    <LMap :zoom="4" :center="[39.5, -98.35]" :use-global-leaflet="false">
      <LTileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
        layer-type="base"
        name="WorldShadedRelief"
      />
      <LMarker
        v-for="airport in airports"
        :key="airport.code"
        :lat-lng="[airport.lat, airport.lng]"
        @click="navigateToAirport(airport.code)"
      >
        <LPopup>
          <strong>{{ airport.code }}</strong><br />
          {{ airport.name }}
        </LPopup>
      </LMarker>

      <!-- Scheduled flight routes (dashed red) -->
      <LPolyline
        v-for="route in scheduledRoutes"
        :key="'s-' + route!.id"
        :lat-lngs="route!.latLngs"
        color="#e74c3c"
        :weight="2"
        :opacity="0.5"
        dash-array="6 4"
      />

      <!-- Active flight routes (solid blue) -->
      <LPolyline
        v-for="route in flyingRoutes"
        :key="'f-' + route!.id"
        :lat-lngs="route!.latLngs"
        color="#3498db"
        :weight="2.5"
        :opacity="0.8"
      />

      <!-- Plane position markers -->
      <LMarker
        v-for="route in flyingRoutes"
        :key="'p-' + route!.id"
        :lat-lng="route!.planePos"
      >
        <LPopup>{{ route!.flightNumber }}</LPopup>
      </LMarker>
    </LMap>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: calc(100vh - var(--gamebar-height) - 3rem);
}
</style>
