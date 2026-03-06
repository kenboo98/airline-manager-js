import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UpgradeDefinition, UpgradeEffects, UpgradeInstallation } from '@/types/upgrade'
import { upgradeDefinitions } from '@/data/upgrades'
import { usePlaneStore } from './planeStore'
import { useCompanyStore } from './companyStore'
import { useHubStore } from './hubStore'
import { useUiStore } from './uiStore'

export const useUpgradeStore = defineStore('upgrade', () => {
  const catalog = ref<UpgradeDefinition[]>([])
  const activeInstallations = ref<Map<string, UpgradeInstallation>>(new Map())

  function loadCatalog() {
    catalog.value = upgradeDefinitions
  }

  function getUpgrade(id: string): UpgradeDefinition | undefined {
    return catalog.value.find((u) => u.id === id)
  }

  function getAvailableUpgrades(planeId: string): UpgradeDefinition[] {
    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) return []

    const installedIds = new Set(plane.installedUpgrades.map((u) => u.upgradeId))

    return catalog.value.filter((upgrade) => {
      // Already installed
      if (installedIds.has(upgrade.id)) return false

      // Check if a same-category upgrade at this level or higher is installed
      const sameCategoryInstalled = plane.installedUpgrades.some((installed) => {
        const def = getUpgrade(installed.upgradeId)
        return def && def.category === upgrade.category && def.level >= upgrade.level
      })
      if (sameCategoryInstalled) return false

      // Check prerequisite
      if (upgrade.prerequisiteId && !installedIds.has(upgrade.prerequisiteId)) return false

      return true
    })
  }

  function getEffectiveStats(planeId: string): UpgradeEffects {
    const planeStore = usePlaneStore()
    const plane = planeStore.getPlane(planeId)
    if (!plane) {
      return {
        operatingCostMultiplier: 1,
        fuelPerHourMultiplier: 1,
        rangeBonus: 0,
        demandMultiplier: 1,
        ticketPriceMultiplier: 1,
      }
    }

    // Only use the highest level per category
    const bestByCategory = new Map<string, UpgradeDefinition>()
    for (const installed of plane.installedUpgrades) {
      const def = getUpgrade(installed.upgradeId)
      if (!def) continue
      const existing = bestByCategory.get(def.category)
      if (!existing || def.level > existing.level) {
        bestByCategory.set(def.category, def)
      }
    }

    const result: UpgradeEffects = {
      operatingCostMultiplier: 1,
      fuelPerHourMultiplier: 1,
      rangeBonus: 0,
      demandMultiplier: 1,
      ticketPriceMultiplier: 1,
    }

    for (const def of bestByCategory.values()) {
      if (def.effects.operatingCostMultiplier != null) {
        result.operatingCostMultiplier! *= def.effects.operatingCostMultiplier
      }
      if (def.effects.fuelPerHourMultiplier != null) {
        result.fuelPerHourMultiplier! *= def.effects.fuelPerHourMultiplier
      }
      if (def.effects.rangeBonus != null) {
        result.rangeBonus! += def.effects.rangeBonus
      }
      if (def.effects.demandMultiplier != null) {
        result.demandMultiplier! *= def.effects.demandMultiplier
      }
      if (def.effects.ticketPriceMultiplier != null) {
        result.ticketPriceMultiplier! *= def.effects.ticketPriceMultiplier
      }
    }

    return result
  }

  function startUpgrade(planeId: string, upgradeId: string, totalMinutes: number): boolean {
    const planeStore = usePlaneStore()
    const hubStore = useHubStore()
    const companyStore = useCompanyStore()

    const plane = planeStore.getPlane(planeId)
    if (!plane) return false
    if (plane.status !== 'available') return false
    if (!hubStore.isHub(plane.currentAirportCode)) return false

    const upgrade = getUpgrade(upgradeId)
    if (!upgrade) return false

    // Validate available
    const available = getAvailableUpgrades(planeId)
    if (!available.some((u) => u.id === upgradeId)) return false

    if (companyStore.company.cash < upgrade.cost) return false

    const installation: UpgradeInstallation = {
      planeId,
      upgradeId,
      startTime: totalMinutes,
      endTime: totalMinutes + upgrade.installTimeMinutes,
      cost: upgrade.cost,
    }

    companyStore.addExpense(upgrade.cost)
    planeStore.setStatus(planeId, 'upgrading')
    activeInstallations.value.set(planeId, installation)
    return true
  }

  function processTick(totalMinutes: number) {
    const planeStore = usePlaneStore()
    const uiStore = useUiStore()

    for (const [planeId, installation] of activeInstallations.value) {
      if (totalMinutes >= installation.endTime) {
        const plane = planeStore.getPlane(planeId)
        const upgrade = getUpgrade(installation.upgradeId)
        if (plane && upgrade) {
          // Remove previous level of same category if present
          plane.installedUpgrades = plane.installedUpgrades.filter((u) => {
            const def = getUpgrade(u.upgradeId)
            return !def || def.category !== upgrade.category
          })

          plane.installedUpgrades.push({
            upgradeId: installation.upgradeId,
            installedAt: totalMinutes,
          })
          planeStore.setStatus(planeId, 'available')

          uiStore.addNotification(
            `${upgrade.name} installed on ${plane.registration}`,
            'success',
            6000,
          )
        }
        activeInstallations.value.delete(planeId)
      }
    }
  }

  return {
    catalog,
    activeInstallations,
    loadCatalog,
    getUpgrade,
    getAvailableUpgrades,
    getEffectiveStats,
    startUpgrade,
    processTick,
  }
})
