<script setup lang="ts">
import { ref, computed } from 'vue'
import 'leaflet/dist/leaflet.css'
import { divIcon } from 'leaflet'
import type L from 'leaflet'
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
import { useRouteStore } from '@/stores/routeStore'
import { useGameStore } from '@/stores/gameStore'
import { interpolatePosition } from '@/utils/geo'
import planeIconSvg from '@/assets/plane_icon.svg'
import AirportInfoPanel from '@/components/map/AirportInfoPanel.vue'
import RouteConfirmModal from '@/components/map/RouteConfirmModal.vue'

const airportStore = useAirportStore()
const planeStore = usePlaneStore()
const flightStore = useFlightStore()
const routeStore = useRouteStore()
const gameStore = useGameStore()

const selectedAirportCode = ref<string | null>(null)

// Route creation mode state
const routeCreationMode = ref<boolean>(false)
const originCode = ref<string | null>(null)
const destinationCode = ref<string | null>(null)

function onAirportClick(code: string) {
  if (routeCreationMode.value && originCode.value) {
    // In route creation mode — select destination
    if (code === originCode.value) return // Can't route to same airport

    destinationCode.value = code
  } else {
    selectedAirportCode.value = code
  }
}

function onCreateRoute() {
  // Start route creation mode from the selected airport
  if (selectedAirportCode.value) {
    originCode.value = selectedAirportCode.value
    selectedAirportCode.value = null
    routeCreationMode.value = true
  }
}

function cancelRouteCreation() {
  routeCreationMode.value = false
  originCode.value = null
  destinationCode.value = null
}

function onRouteConfirm() {
  routeCreationMode.value = false
  originCode.value = null
  destinationCode.value = null
}

function onRouteCancel() {
  destinationCode.value = null
}

function onClosePanel() {
  selectedAirportCode.value = null
}

const airports = computed(() => airportStore.airportList)

// Range circle data for route creation mode (show max range from any plane at origin)
const rangeCircle = computed(() => {
  if (!routeCreationMode.value || !originCode.value) return null

  const airport = airportStore.getByCode(originCode.value)
  if (!airport) return null

  // Get planes at this airport and find the max range
  const planes = planeStore.planesAtAirport(originCode.value)
  if (planes.length === 0) return null

  let maxRange = 0
  for (const plane of planes) {
    const model = planeStore.getModel(plane.modelId)
    if (model && model.range > maxRange) {
      maxRange = model.range
    }
  }

  if (maxRange === 0) return null

  return {
    center: [airport.lat, airport.lng] as [number, number],
    radius: maxRange * 1852, // nm to meters
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

// The SVG asset points upper-right (~45°); offset so 0° bearing = north
const SVG_BASE_ANGLE = 60

function createPlaneIcon(rotation: number) {
  return divIcon({
    html: `<img src="${planeIconSvg}" width="28" height="28" style="transform: rotate(${rotation}deg);">`,
    iconSize: [28, 28] as [number, number],
    iconAnchor: [14, 14] as [number, number],
    className: 'plane-icon',
  })
}

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
      const plane = planeStore.getPlane(f.planeId)
      const totalSeats = plane
        ? plane.seats.economy + plane.seats.business + plane.seats.firstClass
        : 0
      const passengers = f.passengers.economy + f.passengers.business + f.passengers.firstClass
      return {
        id: f.id,
        latLngs: [
          [dep.lat, dep.lng],
          [arr.lat, arr.lng],
        ] as [number, number][],
        planePos: [pos.lat, pos.lng] as [number, number],
        flightNumber: f.flightNumber,
        icon: createPlaneIcon(angle + SVG_BASE_ANGLE) as unknown as L.Icon,
        passengers,
        totalSeats,
      }
    })
    .filter(Boolean),
)

const airportsWithPlanes = computed(() => {
  const codes = new Set<string>()
  for (const plane of planeStore.fleetList) {
    if (plane.status !== 'in-flight') {
      codes.add(plane.currentAirportCode)
    }
  }
  return codes
})

// Route polylines from route store
const establishedRoutes = computed(() => routeStore.routePolylines)

// Temp route line during creation
const tempRouteLine = computed(() => {
  if (!routeCreationMode.value || !originCode.value || !destinationCode.value) return null

  const origin = airportStore.getByCode(originCode.value)
  const dest = airportStore.getByCode(destinationCode.value)
  if (!origin || !dest) return null

  return {
    latLngs: [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ] as [number, number][],
  }
})
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

      <!-- Small plane icon at airports with stationed planes -->
      <LMarker
        v-for="airport in airports.filter((a) => airportsWithPlanes.has(a.code))"
        :key="'stationed-' + airport.code"
        :lat-lng="[airport.lat, airport.lng]"
      >
        <LIcon
          :icon-url="planeIconSvg"
          :icon-size="[14, 14]"
          :icon-anchor="[-2, 24]"
          class-name="stationed-plane-icon"
        />
      </LMarker>

      <!-- Range circle in route creation mode -->
      <LCircle
        v-if="rangeCircle"
        :lat-lng="rangeCircle.center"
        :radius="rangeCircle.radius"
        color="#3498db"
        :fill-opacity="0.1"
        :weight="2"
      />

      <!-- Established routes (solid green for enabled, dashed gray for disabled) -->
      <LPolyline
        v-for="route in establishedRoutes"
        :key="'route-' + route!.id"
        :lat-lngs="route!.latLngs"
        :color="route!.enabled ? '#27ae60' : '#95a5a6'"
        :weight="route!.enabled ? 2.5 : 2"
        :opacity="route!.enabled ? 0.7 : 0.4"
        :dash-array="route!.enabled ? undefined : '6 4'"
      />

      <!-- Temp route line during creation -->
      <LPolyline
        v-if="tempRouteLine"
        :lat-lngs="tempRouteLine.latLngs"
        color="#3498db"
        :weight="3"
        :opacity="0.8"
        dash-array="8 6"
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
        :icon="route!.icon"
      >
        <LPopup>
          <div>
            <strong>{{ route!.flightNumber }}</strong
            ><br />
            Passengers: {{ route!.passengers }} / {{ route!.totalSeats }}
          </div>
        </LPopup>
      </LMarker>
    </LMap>

    <!-- Airport info panel (normal mode) -->
    <AirportInfoPanel
      v-if="selectedAirportCode && !routeCreationMode"
      :airport-code="selectedAirportCode"
      @close="onClosePanel"
      @create-route="onCreateRoute"
    />

    <!-- Route creation mode overlay -->
    <div v-if="routeCreationMode" class="route-mode-banner">
      <template v-if="!destinationCode">
        <span>Select a destination airport</span>
      </template>
      <template v-else>
        <span>Confirm route creation</span>
      </template>
      <button class="btn btn-sm" @click="cancelRouteCreation">Cancel</button>
    </div>

    <!-- Route confirm modal -->
    <RouteConfirmModal
      v-if="routeCreationMode && originCode && destinationCode"
      :origin-code="originCode"
      :destination-code="destinationCode"
      @confirm="onRouteConfirm"
      @cancel="onRouteCancel"
    />
  </div>
</template>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - var(--gamebar-height) - 3rem);
}

.route-mode-banner {
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
.plane-icon,
.stationed-plane-icon {
  background: none !important;
  border: none !important;
}

.stationed-plane-icon {
  pointer-events: none !important;
}
</style>
