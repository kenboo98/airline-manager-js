# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Airline Manager JS — a tick-based airline management simulation game. Player starts with $10M, buys planes, creates flights between ~30 US airports, sets ticket prices, and manages finances. Game time runs on a configurable speed loop.

## Build & Development Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build for production (output in `dist/`)
- `npm run preview` — preview production build locally
- `npm run test:unit` — run unit tests with Vitest (watch mode by default; use `-- --run` for single run)
- `npm run lint` — lint with ESLint
- `npm run format` — format `src/` with Prettier

## Architecture

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Language:** TypeScript
- **Build tool:** Vite
- **Routing:** Vue Router (`src/router/`) — lazy-loaded routes
- **State management:** Pinia (`src/stores/`) — composition API style
- **Testing:** Vitest + @vue/test-utils; tests in `src/**/__tests__/`
- **Linting/Formatting:** ESLint 9 (flat config in `eslint.config.ts`) + Prettier
- **Mapping:** Leaflet + @vue-leaflet/vue-leaflet; ESRI World Shaded Relief tiles (no API key)
- **Path alias:** `@/` maps to `src/`

## Key Structure

```
src/
  types/          — TypeScript interfaces (airport, plane, flight, company, game)
  data/           — Static data (airports.ts, planes.ts)
  utils/          — Helpers (geo, format, pricing, id)
  stores/         — Pinia stores (gameStore orchestrates tick loop)
  components/
    layout/       — GameBar, AppSidebar
  views/          — Page components (one per route)
```

## Store Architecture

`gameStore` orchestrates the tick loop (100ms interval), calling domain stores in order:
1. `flightStore.processTick()` — departures/arrivals
2. `passengerStore.processTick()` — booking passengers on scheduled flights
3. `companyStore.processTick()` — daily financial snapshots

No circular dependencies. Store dependency: gameStore → flightStore/passengerStore/companyStore, flightStore → airportStore/planeStore/companyStore.

## Key Views

- **HomeView** — dashboard with summary cards and quick actions
- **MapView** — interactive map with airports from store, active flight routes
- **AirportsView** — searchable/sortable airport list
- **AirportDetailView** — airport info, demand, flights at airport
- **PurchasePlanesView** — plane catalog with buy modal
- **FleetView** — owned planes table with status
- **CreateFlightView** — flight creation form with route/pricing/demand preview
- **ActiveFlightsView** — in-flight/scheduled flights with progress bars
- **CompanyView** — airline name, financial summary, daily history chart
