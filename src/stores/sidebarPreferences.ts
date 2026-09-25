import { defineStore } from 'pinia'

export const BENTO_DISPLAY_KEY = 'communityglows.sidebar-bento-display.v1'
export type BentoDisplay = 'grouped' | 'tabs'
export const normalizeBentoDisplay = (value: unknown): BentoDisplay => value === 'tabs' ? 'tabs' : 'grouped'
function readDisplay(): BentoDisplay {
  try { return normalizeBentoDisplay(localStorage.getItem(BENTO_DISPLAY_KEY)) } catch { return 'grouped' }
}
export const useSidebarPreferencesStore = defineStore('sidebar-preferences', {
  state: () => ({ bentoDisplay: readDisplay(), saveError: false }),
  actions: {
    setBentoDisplay(value: BentoDisplay) {
      try {
        localStorage.setItem(BENTO_DISPLAY_KEY, normalizeBentoDisplay(value))
        this.bentoDisplay = normalizeBentoDisplay(value)
        this.saveError = false
      } catch { this.saveError = true }
    },
  },
})
