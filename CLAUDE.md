# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Airline Manager JS — a JavaScript-based airline management application. This is a new project; update this file as architecture and conventions are established.

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
- **Routing:** Vue Router (`src/router/`)
- **State management:** Pinia (`src/stores/`)
- **Testing:** Vitest + @vue/test-utils; tests live in `src/components/__tests__/`
- **Linting/Formatting:** ESLint 9 (flat config in `eslint.config.ts`) + Prettier
- **Mapping:** Leaflet + @vue-leaflet/vue-leaflet for interactive maps; ESRI World Shaded Relief tiles (no API key)
- **Path alias:** `@/` maps to `src/`

## Key Views

- **HomeView** (`src/views/HomeView.vue`) — landing page
- **MapView** (`src/views/MapView.vue`) — interactive map displaying airports and flight routes using Leaflet
- **AboutView** (`src/views/AboutView.vue`) — about page
