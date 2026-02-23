import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlaneStore } from '../planeStore'
import { useCompanyStore } from '../companyStore'

describe('planeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads catalog', () => {
    const store = usePlaneStore()
    store.loadCatalog()
    expect(store.catalog.length).toBeGreaterThanOrEqual(8)
  })

  it('purchases a plane', () => {
    const planeStore = usePlaneStore()
    const companyStore = useCompanyStore()
    planeStore.loadCatalog()

    const plane = planeStore.purchasePlane('e175', 'N12345', 'JFK')
    expect(plane).not.toBeNull()
    expect(plane!.registration).toBe('N12345')
    expect(plane!.currentAirportCode).toBe('JFK')
    expect(companyStore.company.cash).toBe(10_000_000 - 2_500_000)
    expect(planeStore.fleetList.length).toBe(1)
  })

  it('rejects purchase when insufficient funds', () => {
    const planeStore = usePlaneStore()
    const companyStore = useCompanyStore()
    planeStore.loadCatalog()

    companyStore.company.cash = 100
    const plane = planeStore.purchasePlane('b777-200er', 'N99999', 'JFK')
    expect(plane).toBeNull()
    expect(planeStore.fleetList.length).toBe(0)
  })

  it('updates plane status', () => {
    const planeStore = usePlaneStore()
    planeStore.loadCatalog()
    const plane = planeStore.purchasePlane('e175', 'N12345', 'JFK')
    expect(plane).not.toBeNull()

    planeStore.setStatus(plane!.id, 'in-flight')
    expect(planeStore.getPlane(plane!.id)!.status).toBe('in-flight')
  })
})
