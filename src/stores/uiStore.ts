import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
  duration: number // milliseconds until auto-dismiss
}

interface AddNotificationOptions {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const selectedAirportCode = ref<string | null>(null)
  const notifications = ref<Notification[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addNotification(
    messageOrOptions: string | AddNotificationOptions,
    type: Notification['type'] = 'info',
    duration: number = 5000,
  ) {
    const options: AddNotificationOptions =
      typeof messageOrOptions === 'string'
        ? { message: messageOrOptions, type, duration }
        : messageOrOptions

    const notification: Notification = {
      id: crypto.randomUUID(),
      message: options.message,
      type: options.type ?? 'info',
      timestamp: Date.now(),
      duration: options.duration ?? 5000,
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
