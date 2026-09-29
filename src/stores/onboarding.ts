import { defineStore } from 'pinia'
import { resolveOnboardingLifecycleScope, type OnboardingLifecycleScope } from '@/lib/onboardingLifecycle'

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
    journeyScope: null as OnboardingLifecycleScope | null,
    scopeReady: false,
    scopeUnavailable: false,
  }),

  getters: {
    languageSelected: (state) => state.selectedLanguage === 'fr' || state.selectedLanguage === 'en',
    journeyCompleted: (state) => state.scopeReady && state.completionVersion === CURRENT_ONBOARDING_VERSION &&
      state.selectedLanguage !== null && state.setupCompleted &&
      state.accountConfirmed && state.accessConfirmed,
  },

  actions: {
    bindScope(scope: OnboardingLifecycleScope) {
      if (this.journeyScope?.installation !== scope.installation || this.journeyScope?.build !== scope.build) {
        this.selectedLanguage = null
        this.setupCompleted = false
        this.resetAccountConfirmation()
      }
      this.journeyScope = scope
      this.scopeReady = true
      this.scopeUnavailable = false
    },
    async resolveScope() {
      this.scopeReady = false
      try {
        this.bindScope(await resolveOnboardingLifecycleScope())
      } catch {
        this.selectedLanguage = null
        this.setupCompleted = false
        this.resetAccountConfirmation()
        this.scopeUnavailable = true
      }
    },
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
      if (!this.scopeReady || !this.languageSelected || !this.setupCompleted || !this.accountConfirmed) return
      this.completed = true
      this.accessConfirmed = true
      this.completionVersion = CURRENT_ONBOARDING_VERSION
    },
    reset() {
      this.completed = false
      this.selectedLanguage = null
      this.setupCompleted = false
      this.resetAccountConfirmation()
    },
  },

  persist: { pick: ['completed', 'selectedLanguage', 'setupCompleted', 'accountConfirmed', 'confirmedAccountId', 'localOnly', 'accessConfirmed', 'completionVersion', 'journeyScope'] },
})
