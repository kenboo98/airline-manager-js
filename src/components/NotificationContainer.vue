<script setup lang="ts">
import { useUiStore } from '@/stores/uiStore'
import ToastNotification from './ToastNotification.vue'

const uiStore = useUiStore()

function handleDismiss(id: string) {
  uiStore.dismissNotification(id)
}
</script>

<template>
  <div class="notification-container">
    <ToastNotification
      v-for="notification in uiStore.notifications"
      :key="notification.id"
      :id="notification.id"
      :message="notification.message"
      :type="notification.type"
      :duration="notification.duration"
      @dismiss="handleDismiss"
    />
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: var(--gamebar-height);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  z-index: 1000;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
}
</style>
