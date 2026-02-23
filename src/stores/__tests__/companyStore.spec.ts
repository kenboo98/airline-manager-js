import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompanyStore } from '../companyStore'

describe('companyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with $10M', () => {
    const store = useCompanyStore()
    expect(store.company.cash).toBe(10_000_000)
  })

  it('sets company name', () => {
    const store = useCompanyStore()
    store.setName('Test Airlines')
    expect(store.company.name).toBe('Test Airlines')
  })

  it('deducts cash', () => {
    const store = useCompanyStore()
    store.deductCash(1_000_000)
    expect(store.company.cash).toBe(9_000_000)
    expect(store.company.totalExpenses).toBe(1_000_000)
  })

  it('adds revenue', () => {
    const store = useCompanyStore()
    store.addRevenue(500_000)
    expect(store.company.cash).toBe(10_500_000)
    expect(store.company.totalRevenue).toBe(500_000)
  })
})
