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

  const dailyRevenue = ref(0)
  const dailyExpenses = ref(0)
  let lastSnapshotDay = -1

  const revenueToday = computed(() => dailyRevenue.value)
  const expensesToday = computed(() => dailyExpenses.value)
  const profitToday = computed(() => dailyRevenue.value - dailyExpenses.value)
  const netWorth = computed(() => company.value.cash)

  function setName(name: string) {
    company.value.name = name
  }

  function deductCash(amount: number) {
    company.value.cash -= amount
    company.value.totalExpenses += amount
    dailyExpenses.value += amount
  }

  function addRevenue(amount: number) {
    company.value.cash += amount
    company.value.totalRevenue += amount
    dailyRevenue.value += amount
  }

  function addExpense(amount: number) {
    company.value.cash -= amount
    company.value.totalExpenses += amount
    dailyExpenses.value += amount
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
        revenue: dailyRevenue.value,
        expenses: dailyExpenses.value,
        profit: dailyRevenue.value - dailyExpenses.value,
      }
      company.value.financialHistory.push(record)
      if (company.value.financialHistory.length > 30) {
        company.value.financialHistory.shift()
      }
      dailyRevenue.value = 0
      dailyExpenses.value = 0
      lastSnapshotDay = currentDay
    }
  }

  return {
    company,
    revenueToday,
    expensesToday,
    profitToday,
    netWorth,
    setName,
    deductCash,
    addRevenue,
    addExpense,
    processTick,
  }
})
