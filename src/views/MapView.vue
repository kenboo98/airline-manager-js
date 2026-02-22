<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from '@vue-leaflet/vue-leaflet'

interface Airport {
  code: string
  name: string
  lat: number
  lng: number
}

const airports: Airport[] = [
  { code: 'JFK', name: 'John F. Kennedy Intl', lat: 40.6413, lng: -73.7781 },
  { code: 'LAX', name: 'Los Angeles Intl', lat: 33.9425, lng: -118.4081 },
  { code: 'ORD', name: "O'Hare Intl", lat: 41.9742, lng: -87.9073 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta Intl', lat: 33.6407, lng: -84.4277 },
  { code: 'DFW', name: 'Dallas/Fort Worth Intl', lat: 32.8998, lng: -97.0403 },
  { code: 'DEN', name: 'Denver Intl', lat: 39.8561, lng: -104.6737 },
  { code: 'SFO', name: 'San Francisco Intl', lat: 37.6213, lng: -122.379 },
  { code: 'SEA', name: 'Seattle-Tacoma Intl', lat: 47.4502, lng: -122.3088 },
  { code: 'MIA', name: 'Miami Intl', lat: 25.7959, lng: -80.287 },
  { code: 'BOS', name: 'Boston Logan Intl', lat: 42.3656, lng: -71.0096 },
]

const routes: [string, string][] = [
  ['JFK', 'LAX'],
  ['JFK', 'ORD'],
  ['ATL', 'DFW'],
  ['SFO', 'SEA'],
  ['MIA', 'ATL'],
  ['DEN', 'ORD'],
  ['BOS', 'JFK'],
  ['LAX', 'DFW'],
]

function getAirport(code: string) {
  return airports.find((a) => a.code === code)!
}

function getRouteLatLngs(from: string, to: string): [number, number][] {
  const a = getAirport(from)
  const b = getAirport(to)
  return [
    [a.lat, a.lng],
    [b.lat, b.lng],
  ]
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
      <LMarker v-for="airport in airports" :key="airport.code" :lat-lng="[airport.lat, airport.lng]">
        <LPopup>
          <strong>{{ airport.code }}</strong
          ><br />
          {{ airport.name }}
        </LPopup>
      </LMarker>
      <LPolyline
        v-for="([from, to], i) in routes"
        :key="i"
        :lat-lngs="getRouteLatLngs(from, to)"
        color="#e74c3c"
        :weight="2"
        :opacity="0.7"
        dash-array="6 4"
      />
    </LMap>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: calc(100vh - 80px);
}
</style>
