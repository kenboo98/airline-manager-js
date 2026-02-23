<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/map', label: 'Map' },
  { to: '/airports', label: 'Airports' },
  { to: '/planes/buy', label: 'Buy Planes' },
  { to: '/planes', label: 'Fleet' },
  { to: '/flights/active', label: 'Active Flights' },
  { to: '/company', label: 'Company' },
]
</script>

<template>
  <aside v-if="!uiStore.sidebarCollapsed" class="sidebar">
    <nav>
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        exact-active-class="active"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  padding: 0.5rem 0;
  overflow-y: auto;
}

nav {
  display: flex;
  flex-direction: column;
}

.nav-link {
  padding: 0.5rem 1rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.875rem;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}

.nav-link:hover {
  background: var(--color-background-mute);
}

.nav-link.router-link-active {
  border-left-color: var(--color-accent);
  background: var(--color-background-mute);
  font-weight: 600;
}
</style>
