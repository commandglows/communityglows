import { defineStore } from 'pinia'

export type DesktopControlBarPosition = 'top' | 'bottom'

const STORAGE_KEY = 'sfz_desktop_control_bar_position'

export function normalizeDesktopControlBarPosition(value: unknown): DesktopControlBarPosition {
  return value === 'bottom' ? 'bottom' : 'top'
}

export const useDesktopControlBarStore = defineStore('desktop-control-bar', {
  state: () => ({
    position: normalizeDesktopControlBarPosition(
      typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY),
    ),
  }),

  actions: {
    setPosition(position: DesktopControlBarPosition) {
      this.position = position
      localStorage.setItem(STORAGE_KEY, position)
    },
  },
})
