import { defineStore } from 'pinia'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { resolveAutoTheme, type AutoThemeSource, type ThemeMode } from '@/utils/themeAuto'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    themeMode: 'dark' as ThemeMode,
    isDarkMode: false,
    autoThemeSource: null as AutoThemeSource | null,
    grayscaleEnabled: false,
    autoThemeCheckAt: null as number | null,
  }),

  actions: {
    toggleTheme() {
      const nextMode: ThemeMode = this.isDarkMode ? 'light' : 'dark'
      void this.setThemeMode(nextMode, { allowPrompt: false })
    },

    async setThemeMode(mode: ThemeMode, options?: { allowPrompt?: boolean }) {
      this.themeMode = mode
      localStorage.setItem('theme', mode)

      if (mode === 'auto') {
        await this.refreshAutoTheme({ allowPrompt: options?.allowPrompt })
      } else {
        this.stopAutoThemeSync()
        this.autoThemeSource = null
        this.autoThemeCheckAt = null
        this.isDarkMode = mode === 'dark'
        this.persistResolvedTheme()
        this.applyTheme()
      }

      await this.syncThemeToCloud(mode)
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    },

    persistResolvedTheme() {
      localStorage.setItem('theme-resolved', this.isDarkMode ? 'dark' : 'light')
    },

    stopAutoThemeSync() {
      if (typeof window === 'undefined')
        return

      const timeoutId = window.__communityglowsAutoThemeTimeout
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId)
      }
      window.__communityglowsAutoThemeTimeout = null

      const media = window.__communityglowsAutoThemeMedia
      const listener = window.__communityglowsAutoThemeMediaListener
      if (media && listener) {
        media.removeEventListener('change', listener)
      }
      window.__communityglowsAutoThemeMedia = null
      window.__communityglowsAutoThemeMediaListener = null

      const visibilityListener = window.__communityglowsAutoThemeVisibilityListener
      if (visibilityListener) {
        document.removeEventListener('visibilitychange', visibilityListener)
      }
      window.__communityglowsAutoThemeVisibilityListener = null
    },

    scheduleAutoThemeRefresh(at: number | null) {
      if (typeof window === 'undefined')
        return

      const timeoutId = window.__communityglowsAutoThemeTimeout
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId)
      }
      window.__communityglowsAutoThemeTimeout = null

      if (!at)
        return

      const delay = Math.max(60_000, at - Date.now() + 15_000)
      window.__communityglowsAutoThemeTimeout = window.setTimeout(() => {
        void this.refreshAutoTheme({ allowPrompt: false })
      }, delay)
    },

    ensureSystemThemeListener() {
      if (typeof window === 'undefined')
        return

      const media = window.matchMedia('(prefers-color-scheme: dark)')
      if (!window.__communityglowsAutoThemeMediaListener) {
        window.__communityglowsAutoThemeMediaListener = () => {
          if (this.themeMode !== 'auto' || this.autoThemeSource !== 'system')
            return
          void this.refreshAutoTheme({ allowPrompt: false })
        }
      }

      if (window.__communityglowsAutoThemeMedia !== media) {
        if (window.__communityglowsAutoThemeMedia && window.__communityglowsAutoThemeMediaListener) {
          window.__communityglowsAutoThemeMedia.removeEventListener('change', window.__communityglowsAutoThemeMediaListener)
        }
        media.addEventListener('change', window.__communityglowsAutoThemeMediaListener)
        window.__communityglowsAutoThemeMedia = media
      }
    },

    ensureVisibilityListener() {
      if (typeof document === 'undefined' || window.__communityglowsAutoThemeVisibilityListener)
        return

      window.__communityglowsAutoThemeVisibilityListener = () => {
        if (document.visibilityState !== 'visible' || this.themeMode !== 'auto')
          return
        void this.refreshAutoTheme({ allowPrompt: false })
      }
      document.addEventListener('visibilitychange', window.__communityglowsAutoThemeVisibilityListener)
    },

    async refreshAutoTheme(options?: { allowPrompt?: boolean }) {
      if (this.themeMode !== 'auto')
        return

      this.ensureSystemThemeListener()
      this.ensureVisibilityListener()

      const resolution = await resolveAutoTheme({
        allowPrompt: options?.allowPrompt,
      })
      this.isDarkMode = resolution.isDark
      this.autoThemeSource = resolution.source
      this.autoThemeCheckAt = resolution.nextCheckAt
      this.persistResolvedTheme()
      this.applyTheme()
      this.scheduleAutoThemeRefresh(resolution.nextCheckAt)
    },

    setGrayscale(enabled: boolean) {
      this.grayscaleEnabled = enabled
      this.applyGrayscale()
      localStorage.setItem('grayscale', enabled ? '1' : '0')
      syncSettingsPatch({ grayscaleEnabled: enabled })
    },

    applyGrayscale() {
      document.documentElement.style.filter = this.grayscaleEnabled ? 'grayscale(1)' : ''
    },

    initTheme() {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
        this.themeMode = savedTheme
      } else {
        this.themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }

      const resolvedTheme = localStorage.getItem('theme-resolved')
      if (this.themeMode === 'auto' && (resolvedTheme === 'light' || resolvedTheme === 'dark')) {
        this.isDarkMode = resolvedTheme === 'dark'
      } else {
        this.isDarkMode = this.themeMode === 'dark'
      }
      this.applyTheme()
      this.persistResolvedTheme()

      if (this.themeMode === 'auto') {
        void this.refreshAutoTheme({ allowPrompt: false })
      } else {
        this.stopAutoThemeSync()
      }

      this.grayscaleEnabled = localStorage.getItem('grayscale') === '1'
      this.applyGrayscale()
    },

    async syncThemeToCloud(theme: ThemeMode) {
      await syncSettingsPatch({ theme })
    },

    applyCloudPreferences(settings: {
      theme?: ThemeMode
      grayscaleEnabled?: boolean
      textZoom?: number
      uiScale?: number
      hapticEnabled?: boolean
      tapSoundEnabled?: boolean
      tapSoundVariant?: 'classic' | 'soft' | 'pop'
    }) {
      if (settings.theme) {
        this.themeMode = settings.theme
        this.isDarkMode = settings.theme === 'dark'
        localStorage.setItem('theme', settings.theme)
        if (settings.theme === 'auto') {
          const resolvedTheme = localStorage.getItem('theme-resolved')
          if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
            this.isDarkMode = resolvedTheme === 'dark'
          }
          void this.refreshAutoTheme({ allowPrompt: false })
        } else {
          this.stopAutoThemeSync()
          this.autoThemeSource = null
          this.autoThemeCheckAt = null
        }
      }
      if (typeof settings.grayscaleEnabled === 'boolean') {
        this.grayscaleEnabled = settings.grayscaleEnabled
        localStorage.setItem('grayscale', settings.grayscaleEnabled ? '1' : '0')
      }
      if (typeof settings.textZoom === 'number') {
        localStorage.setItem('communityglows_text_zoom', String(settings.textZoom))
      }
      if (typeof settings.uiScale === 'number') {
        localStorage.setItem('communityglows_ui_scale', String(settings.uiScale))
      }
      if (typeof settings.hapticEnabled === 'boolean') {
        localStorage.setItem('communityglows_haptic', String(settings.hapticEnabled))
      }
      if (typeof settings.tapSoundEnabled === 'boolean') {
        localStorage.setItem('communityglows_tap_sound', String(settings.tapSoundEnabled))
      }
      if (typeof settings.tapSoundVariant === 'string') {
        localStorage.setItem('communityglows_tap_sound_variant', settings.tapSoundVariant)
      }
      this.persistResolvedTheme()
      this.applyTheme()
      this.applyGrayscale()
    },

    resetLocalPreferences() {
      this.stopAutoThemeSync()
      this.themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.autoThemeSource = null
      this.autoThemeCheckAt = null
      this.grayscaleEnabled = false
      this.persistResolvedTheme()
      this.applyTheme()
      this.applyGrayscale()
    },
  }
})
