import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { PlaneModel, OwnedPlane } from '@/types'
import { planeModels } from '@/data/planes'
import { generateId } from '@/utils/id'
import { useCompanyStore } from './companyStore'

export const usePlaneStore = defineStore('plane', () => {
  const catalog = ref<PlaneModel[]>([])
  const fleet = ref<Map<string, OwnedPlane>>(new Map())

  const fleetList = computed(() => Array.from(fleet.value.values()))

  const availablePlanes = computed(() => fleetList.value.filter((p) => p.status === 'available'))

  function planesAtAirport(code: string): OwnedPlane[] {
    return fleetList.value.filter((p) => p.currentAirportCode === code && p.status === 'available')
  }

  function getModel(id: string): PlaneModel | undefined {
    return catalog.value.find((m) => m.id === id)
  }

  function getPlane(id: string): OwnedPlane | undefined {
    return fleet.value.get(id)
  }

  function loadCatalog() {
    catalog.value = planeModels
  }

  function purchasePlane(
    modelId: string,
    registration: string,
    airportCode: string,
  ): OwnedPlane | null {
    const model = getModel(modelId)
    if (!model) return null

    const companyStore = useCompanyStore()
    if (companyStore.company.cash < model.purchasePrice) return null

    const plane: OwnedPlane = {
      id: generateId(),
      modelId,
      registration,
      seats: { ...model.defaultSeats },
      status: 'available',
      totalFlightHours: 0,
      currentFlightId: null,
      currentAirportCode: airportCode,
    }

    companyStore.deductCash(model.purchasePrice)
    fleet.value.set(plane.id, plane)
    return plane
  }

  function setStatus(planeId: string, status: OwnedPlane['status']) {
    const plane = fleet.value.get(planeId)
    if (plane) {
      plane.status = status
    }
  }

  function updateLocation(planeId: string, code: string) {
    const plane = fleet.value.get(planeId)
    if (plane) {
      plane.currentAirportCode = code
    }
  }

  return {
    catalog,
    fleet,
    fleetList,
    availablePlanes,
    planesAtAirport,
    getModel,
    getPlane,
    loadCatalog,
    purchasePlane,
    setStatus,
    updateLocation,
  }
})
