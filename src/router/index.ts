import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
    },
    {
      path: '/airports',
      name: 'airports',
      component: () => import('../views/AirportsView.vue'),
    },
    {
      path: '/airports/:code',
      name: 'airport-detail',
      component: () => import('../views/AirportDetailView.vue'),
      props: true,
    },
    {
      path: '/planes/buy',
      name: 'purchase-planes',
      component: () => import('../views/PurchasePlanesView.vue'),
    },
    {
      path: '/planes',
      name: 'fleet',
      component: () => import('../views/FleetView.vue'),
    },
    {
      path: '/flights/active',
      name: 'active-flights',
      component: () => import('../views/ActiveFlightsView.vue'),
    },
    {
      path: '/routes',
      name: 'routes',
      component: () => import('../views/RoutesView.vue'),
    },
    {
      path: '/company',
      name: 'company',
      component: () => import('../views/CompanyView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('../views/GameSetupView.vue'),
    },
    {
      path: '/hubs',
      name: 'hubs',
      component: () => import('../views/HubsView.vue'),
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('../views/MaintenanceView.vue'),
    },
    {
      path: '/upgrades',
      name: 'upgrades',
      component: () => import('../views/UpgradesView.vue'),
    },
  ],
})

export default router
