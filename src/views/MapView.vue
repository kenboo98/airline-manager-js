<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
  LPolyline,
  LIcon,
  LCircle,
} from '@vue-leaflet/vue-leaflet'
import { useAirportStore } from '@/stores/airportStore'
import { usePlaneStore } from '@/stores/planeStore'
import { useFlightStore } from '@/stores/flightStore'
import { useGameStore } from '@/stores/gameStore'
import { interpolatePosition } from '@/utils/geo'
import planeIconSvg from '@/assets/plane_icon.svg'
import AirportInfoPanel from '@/components/map/AirportInfoPanel.vue'
import FlightConfirmModal from '@/components/map/FlightConfirmModal.vue'

const router = useRouter()
const airportStore = useAirportStore()
const planeStore = usePlaneStore()
const flightStore = useFlightStore()
const gameStore = useGameStore()

const selectedAirportCode = ref<string | null>(null)

// Flight creation mode state
const flightMode = ref<{ departureCode: string; planeId: string } | null>(null)
const destinationCode = ref<string | null>(null)

function onAirportClick(code: string) {
  if (flightMode.value) {
    // In flight creation mode — check if airport is reachable
    const plane = planeStore.getPlane(flightMode.value.planeId)
    if (!plane) return
    const model = planeStore.getModel(plane.modelId)
    if (!model) return

    const distance = airportStore.getDistanceNm(flightMode.value.departureCode, code)
    const airport = airportStore.getByCode(code)
    if (!airport) return

    if (code === flightMode.value.departureCode) return
    if (distance > model.range) return
    if (model.minRunwayLength > airport.runwayLength) return

    destinationCode.value = code
  } else {
    selectedAirportCode.value = code
  }
}

function onSelectPlane(planeId: string) {
  const departureCode = selectedAirportCode.value
  if (!departureCode) return
  selectedAirportCode.value = null
  flightMode.value = { departureCode, planeId }
}

function cancelFlightMode() {
  flightMode.value = null
  destinationCode.value = null
}

function onModalConfirm() {
  flightMode.value = null
  destinationCode.value = null
}

function onModalCancel() {
  destinationCode.value = null
}

function onViewDetail() {
  router.push(`/airports/${selectedAirportCode.value}`)
}

function onClosePanel() {
  selectedAirportCode.value = null
}

const airports = computed(() => airportStore.airportList)

// Range circle data for flight creation mode
const rangeCircle = computed(() => {
  if (!flightMode.value) return null
  const airport = airportStore.getByCode(flightMode.value.departureCode)
  const plane = planeStore.getPlane(flightMode.value.planeId)
  if (!airport || !plane) return null
  const model = planeStore.getModel(plane.modelId)
  if (!model) return null
  return {
    center: [airport.lat, airport.lng] as [number, number],
    radius: model.range * 1852, // nm to meters
  }
})

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
  flightStore.currentlyFlying
    .map((f) => {
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
    })
    .filter(Boolean),
)

const scheduledRoutes = computed(() =>
  flightStore.scheduledFlights
    .map((f) => {
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
    })
    .filter(Boolean),
)
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
        @click="onAirportClick(airport.code)"
      >
        <LPopup>
          <strong>{{ airport.code }}</strong
          ><br />
          {{ airport.name }}
        </LPopup>
      </LMarker>

      <!-- Range circle in flight creation mode -->
      <LCircle
        v-if="rangeCircle"
        :lat-lng="rangeCircle.center"
        :radius="rangeCircle.radius"
        color="#3498db"
        :fill-opacity="0.1"
        :weight="2"
      />

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

    <!-- Airport info panel (normal mode) -->
    <AirportInfoPanel
      v-if="selectedAirportCode && !flightMode"
      :airport-code="selectedAirportCode"
      @close="onClosePanel"
      @select-plane="onSelectPlane"
      @view-detail="onViewDetail"
    />

    <!-- Flight creation mode overlay -->
    <div v-if="flightMode" class="flight-mode-banner">
      <span>Select a destination airport within range</span>
      <button class="btn btn-sm" @click="cancelFlightMode">Cancel</button>
    </div>

    <!-- Flight confirm modal -->
    <FlightConfirmModal
      v-if="flightMode && destinationCode"
      :departure-code="flightMode.departureCode"
      :arrival-code="destinationCode"
      :plane-id="flightMode.planeId"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
    />
  </div>
</template>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - var(--gamebar-height) - 3rem);
}

.flight-mode-banner {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.9rem;
  font-weight: 500;
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
