export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatGameTime(totalMinutes: number): string {
  const day = Math.floor(totalMinutes / 1440) + 1
  const hour = Math.floor((totalMinutes % 1440) / 60)
  const minute = Math.floor(totalMinutes % 60)
  return `Day ${day} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}
