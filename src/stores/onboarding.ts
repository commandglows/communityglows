import { defineStore } from 'pinia'
import { syncSettingsPatch } from '@/lib/cloudSettings'

const CURRENT_ONBOARDING_VERSION = 1

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    completed: false,
    selectedLanguage: null as 'fr' | 'en' | null,
    setupCompleted: false,
    accountConfirmed: false,
    confirmedAccountId: null as string | null,
    localOnly: false,
    accessConfirmed: false,
    completionVersion: 0,
  }),

  getters: {
    languageSelected: (state) => state.selectedLanguage === 'fr' || state.selectedLanguage === 'en',
    journeyCompleted: (state) => state.completionVersion === CURRENT_ONBOARDING_VERSION &&
      state.selectedLanguage !== null && state.setupCompleted &&
      state.accountConfirmed && state.accessConfirmed,
  },

  actions: {
    selectLanguage(language: 'fr' | 'en') {
      this.selectedLanguage = language
    },
    finishSetup() {
      this.setupCompleted = true
    },
    confirmAccount(accountId: string | null) {
      this.accountConfirmed = true
      this.confirmedAccountId = accountId
      this.localOnly = accountId === null
      this.accessConfirmed = false
      this.completionVersion = 0
    },
    reconcileAccount(accountId: string) {
      if (this.accountConfirmed && !this.localOnly && this.confirmedAccountId !== accountId) {
        this.resetAccountConfirmation()
      }
    },
    resetAccountConfirmation() {
      this.accountConfirmed = false
      this.confirmedAccountId = null
      this.localOnly = false
      this.accessConfirmed = false
      this.completionVersion = 0
    },
    complete() {
      if (!this.languageSelected || !this.setupCompleted || !this.accountConfirmed) return
      this.completed = true
      this.accessConfirmed = true
      this.completionVersion = CURRENT_ONBOARDING_VERSION
      syncSettingsPatch({ onboardingCompleted: true, language: this.selectedLanguage! })
    },
    reset() {
      this.completed = false
      this.selectedLanguage = null
      this.setupCompleted = false
      this.resetAccountConfirmation()
      syncSettingsPatch({ onboardingCompleted: false })
    },
  },

  persist: true,
})
