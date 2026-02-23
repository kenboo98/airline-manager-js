import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GameSpeed, GameTime } from '@/types'
import { useFlightStore } from './flightStore'
import { usePassengerStore } from './passengerStore'
import { useCompanyStore } from './companyStore'

const SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
  0: 0,
  1: 0.1,
  2: 1,
  3: 6,
}

export const useGameStore = defineStore('game', () => {
  const speed = ref<GameSpeed>(0)
  const totalMinutes = ref(0)
  const started = ref(false)
  let tickIntervalId: ReturnType<typeof setInterval> | null = null

  const time = computed<GameTime>(() => {
    const t = totalMinutes.value
    return {
      totalMinutes: t,
      day: Math.floor(t / 1440) + 1,
      hour: Math.floor((t % 1440) / 60),
      minute: Math.floor(t % 60),
    }
  })

  const isPaused = computed(() => speed.value === 0)

  function tick() {
    const delta = SPEED_MULTIPLIERS[speed.value]
    if (delta === 0) return

    totalMinutes.value += delta

    const flightStore = useFlightStore()
    const passengerStore = usePassengerStore()
    const companyStore = useCompanyStore()

    flightStore.processTick(totalMinutes.value)
    passengerStore.processTick(totalMinutes.value)
    companyStore.processTick(totalMinutes.value)
  }

  function startGame() {
    if (started.value) return
    started.value = true
    tickIntervalId = setInterval(tick, 100)
  }

  function pause() {
    speed.value = 0
  }

  function setSpeed(s: GameSpeed) {
    speed.value = s
  }

  function stopGame() {
    if (tickIntervalId !== null) {
      clearInterval(tickIntervalId)
      tickIntervalId = null
    }
    started.value = false
  }

  return {
    speed,
    totalMinutes,
    started,
    time,
    isPaused,
    startGame,
    pause,
    setSpeed,
    stopGame,
  }
})
