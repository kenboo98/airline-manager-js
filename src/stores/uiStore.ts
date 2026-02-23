import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
}

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const selectedAirportCode = ref<string | null>(null)
  const notifications = ref<Notification[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addNotification(message: string, type: Notification['type'] = 'info') {
    const notification: Notification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: Date.now(),
    }
    notifications.value.push(notification)
    if (notifications.value.length > 20) {
      notifications.value.shift()
    }
  }

  function dismissNotification(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return {
    sidebarCollapsed,
    selectedAirportCode,
    notifications,
    toggleSidebar,
    addNotification,
    dismissNotification,
  }
})
