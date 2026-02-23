import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Company, FinancialRecord } from '@/types'

const STARTING_CASH = 10_000_000

export const useCompanyStore = defineStore('company', () => {
  const company = ref<Company>({
    name: '',
    cash: STARTING_CASH,
    totalRevenue: 0,
    totalExpenses: 0,
    financialHistory: [],
    foundedDate: 0,
  })

  let dailyRevenue = 0
  let dailyExpenses = 0
  let lastSnapshotDay = -1

  const profitToday = computed(() => dailyRevenue - dailyExpenses)
  const netWorth = computed(() => company.value.cash)

  function setName(name: string) {
    company.value.name = name
  }

  function deductCash(amount: number) {
    company.value.cash -= amount
    company.value.totalExpenses += amount
    dailyExpenses += amount
  }

  function addRevenue(amount: number) {
    company.value.cash += amount
    company.value.totalRevenue += amount
    dailyRevenue += amount
  }

  function addExpense(amount: number) {
    company.value.cash -= amount
    company.value.totalExpenses += amount
    dailyExpenses += amount
  }

  function processTick(totalMinutes: number) {
    const currentDay = Math.floor(totalMinutes / 1440)
    if (lastSnapshotDay < 0) {
      lastSnapshotDay = currentDay
      return
    }
    if (currentDay > lastSnapshotDay) {
      const record: FinancialRecord = {
        date: lastSnapshotDay,
        revenue: dailyRevenue,
        expenses: dailyExpenses,
        profit: dailyRevenue - dailyExpenses,
      }
      company.value.financialHistory.push(record)
      if (company.value.financialHistory.length > 30) {
        company.value.financialHistory.shift()
      }
      dailyRevenue = 0
      dailyExpenses = 0
      lastSnapshotDay = currentDay
    }
  }

  return {
    company,
    profitToday,
    netWorth,
    setName,
    deductCash,
    addRevenue,
    addExpense,
    processTick,
  }
})
