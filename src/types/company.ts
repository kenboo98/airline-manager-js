export interface FinancialRecord {
  date: number
  revenue: number
  expenses: number
  profit: number
}

export interface Company {
  name: string
  cash: number
  totalRevenue: number
  totalExpenses: number
  financialHistory: FinancialRecord[]
  foundedDate: number
}
