import { defineStore } from 'pinia'

export type DesktopControlBarPosition = 'top' | 'bottom'

const STORAGE_KEY = 'communityglows_desktop_control_bar_position'
const HEIGHT_STORAGE_KEY = 'communityglows_desktop_control_bar_height'

// The user asked for a generous but bounded expansion: the bar must never
// consume more than a fifth of the desktop canvas.
export const DESKTOP_CONTROL_BAR_MAX_HEIGHT_RATIO = 0.2

export function normalizeDesktopControlBarPosition(value: unknown): DesktopControlBarPosition {
  return value === 'bottom' ? 'bottom' : 'top'
}

export function normalizeDesktopControlBarHeight(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) {
    return null
  }
  return Math.min(Math.max(value, minimum), maximum)
}

function readStoredHeight(): number | null {
  if (typeof localStorage === 'undefined') return null
  const stored = Number(localStorage.getItem(HEIGHT_STORAGE_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : null
}

export const useDesktopControlBarStore = defineStore('desktop-control-bar', {
  state: () => ({
    position: normalizeDesktopControlBarPosition(
      typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY),
    ),
    height: readStoredHeight(),
  }),

  actions: {
    setPosition(position: DesktopControlBarPosition) {
      this.position = position
      localStorage.setItem(STORAGE_KEY, position)
    },

    setHeight(value: number, minimum: number, viewportHeight: number) {
      const maximum = viewportHeight * DESKTOP_CONTROL_BAR_MAX_HEIGHT_RATIO
      const height = normalizeDesktopControlBarHeight(value, minimum, maximum)
      if (height === null) return
      this.height = height
      localStorage.setItem(HEIGHT_STORAGE_KEY, String(height))
    },

    resolvedHeight(minimum: number, viewportHeight: number) {
      const maximum = viewportHeight * DESKTOP_CONTROL_BAR_MAX_HEIGHT_RATIO
      return (
        normalizeDesktopControlBarHeight(this.height, minimum, maximum) ?? minimum
      )
    },
  },
})
