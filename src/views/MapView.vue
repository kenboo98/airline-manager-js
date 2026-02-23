<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LPopup, LPolyline, LIcon } from '@vue-leaflet/vue-leaflet'
import { useAirportStore } from '@/stores/airportStore'
import { useFlightStore } from '@/stores/flightStore'
import { useGameStore } from '@/stores/gameStore'
import { interpolatePosition } from '@/utils/geo'
import planeIconSvg from '@/assets/plane_icon.svg'

const router = useRouter()
const airportStore = useAirportStore()
const flightStore = useFlightStore()
const gameStore = useGameStore()

const airports = computed(() => airportStore.airportList)

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// The SVG asset points upper-left (~315°); offset so 0° bearing = north
const SVG_BASE_ANGLE = 315

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
    const angle = bearing(dep.lat, dep.lng, arr.lat, arr.lng)
    return {
      id: f.id,
      latLngs: [
        [dep.lat, dep.lng],
        [arr.lat, arr.lng],
      ] as [number, number][],
      planePos: [pos.lat, pos.lng] as [number, number],
      flightNumber: f.flightNumber,
      rotation: angle - SVG_BASE_ANGLE,
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
        <LIcon
          :icon-url="planeIconSvg"
          :icon-size="[28, 28]"
          :icon-anchor="[14, 14]"
          class-name="plane-icon"
          :style="`--plane-rotation: ${route!.rotation}deg`"
        />
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

<style>
.plane-icon {
  background: none !important;
  border: none !important;
}

.plane-icon img {
  transform: rotate(var(--plane-rotation, 0deg));
}
</style>
