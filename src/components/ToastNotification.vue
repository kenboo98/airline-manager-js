<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration: number
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const isVisible = ref(false)
const progress = ref(100)
const timerId = ref<number | null>(null)
const animationId = ref<number | null>(null)
const startTime = ref<number>(0)

const typeIcon = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '!'
    case 'info':
    default:
      return 'i'
  }
})

const typeClass = computed(() => `toast--${props.type}`)

function dismiss() {
  isVisible.value = false
  // Wait for exit animation before removing
  setTimeout(() => {
    emit('dismiss', props.id)
  }, 300)
}

function startTimer() {
  startTime.value = Date.now()
  const endTime = startTime.value + props.duration

  function updateProgress() {
    const now = Date.now()
    const remaining = endTime - now
    progress.value = Math.max(0, (remaining / props.duration) * 100)

    if (remaining > 0) {
      animationId.value = requestAnimationFrame(updateProgress)
    } else {
      dismiss()
    }
  }

  animationId.value = requestAnimationFrame(updateProgress)

  // Fallback timer in case animation frame fails
  timerId.value = window.setTimeout(() => {
    dismiss()
  }, props.duration)
}

function pauseTimer() {
  if (timerId.value) {
    clearTimeout(timerId.value)
    timerId.value = null
  }
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

function resumeTimer() {
  const remaining = (progress.value / 100) * props.duration
  if (remaining > 0) {
    timerId.value = window.setTimeout(() => {
      dismiss()
    }, remaining)
    startTime.value = Date.now() - (props.duration - remaining)
    const endTime = startTime.value + props.duration

    function updateProgress() {
      const now = Date.now()
      const timeLeft = endTime - now
      progress.value = Math.max(0, (timeLeft / props.duration) * 100)

      if (timeLeft > 0 && progress.value > 0) {
        animationId.value = requestAnimationFrame(updateProgress)
      }
    }

    animationId.value = requestAnimationFrame(updateProgress)
  }
}

onMounted(() => {
  // Trigger enter animation
  requestAnimationFrame(() => {
    isVisible.value = true
  })
  startTimer()
})

onUnmounted(() => {
  pauseTimer()
})
</script>

<template>
  <div
    :class="['toast', typeClass, { 'toast--visible': isVisible }]"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <div class="toast__icon">{{ typeIcon }}</div>
    <div class="toast__content">{{ message }}</div>
    <button class="toast__close" @click="dismiss" aria-label="Dismiss notification">
      ×
    </button>
    <div class="toast__progress">
      <div class="toast__progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
  transform: translateY(-20px);
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.toast--visible {
  transform: translateY(0);
  opacity: 1;
}

.toast--info {
  border-left: 4px solid var(--color-info);
}

.toast--success {
  border-left: 4px solid var(--color-success);
}

.toast--warning {
  border-left: 4px solid var(--color-warning);
}

.toast--error {
  border-left: 4px solid var(--color-danger);
}

.toast__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.toast--info .toast__icon {
  background: rgba(52, 152, 219, 0.15);
  color: var(--color-info);
}

.toast--success .toast__icon {
  background: rgba(39, 174, 96, 0.15);
  color: var(--color-success);
}

.toast--warning .toast__icon {
  background: rgba(243, 156, 18, 0.15);
  color: var(--color-warning);
}

.toast--error .toast__icon {
  background: rgba(231, 76, 60, 0.15);
  color: var(--color-danger);
}

.toast__content {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-text);
}

.toast__close {
  background: none;
  border: none;
  color: var(--color-text);
  opacity: 0.5;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.toast__close:hover {
  opacity: 1;
}

.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-border);
}

.toast__progress-bar {
  height: 100%;
  transition: none;
}

.toast--info .toast__progress-bar {
  background: var(--color-info);
}

.toast--success .toast__progress-bar {
  background: var(--color-success);
}

.toast--warning .toast__progress-bar {
  background: var(--color-warning);
}

.toast--error .toast__progress-bar {
  background: var(--color-danger);
}
</style>
