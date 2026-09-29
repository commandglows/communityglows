import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { syncSettingsPatch } = vi.hoisted(() => ({ syncSettingsPatch: vi.fn() }))
vi.mock('@/lib/cloudSettings', () => ({ syncSettingsPatch }))

import { useOnboardingStore } from './onboarding'

describe('explicit local onboarding acknowledgements', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not let a legacy local or cloud completion skip language, account or access', () => {
    const store = useOnboardingStore()
    store.$patch({ completed: true })
    expect(store.languageSelected).toBe(false)
    expect(store.journeyCompleted).toBe(false)
    store.complete()
    expect(store.journeyCompleted).toBe(false)
    expect(syncSettingsPatch).not.toHaveBeenCalled()
  })

  it('requires a deliberate language, setup and account before acknowledging the displayed access', () => {
    const store = useOnboardingStore()
    store.selectLanguage('en')
    store.finishSetup()
    store.complete()
    expect(store.journeyCompleted).toBe(false)
    store.confirmAccount('account-a')
    expect(store.journeyCompleted).toBe(false)
    store.complete()
    expect(store.journeyCompleted).toBe(true)
    expect(syncSettingsPatch).toHaveBeenLastCalledWith({ onboardingCompleted: true, language: 'en' })
  })

  it('keeps a completed local journey independent from later legacy cloud flags', () => {
    const store = useOnboardingStore()
    store.selectLanguage('fr')
    store.finishSetup()
    store.confirmAccount('account-a')
    store.complete()
    store.$patch({ completed: false })
    expect(store.journeyCompleted).toBe(true)
  })

  it('invalidates account and access on an account change without repeating personalization', () => {
    const store = useOnboardingStore()
    store.selectLanguage('fr')
    store.finishSetup()
    store.confirmAccount('account-a')
    store.complete()
    store.reconcileAccount('account-a')
    expect(store.journeyCompleted).toBe(true)
    store.reconcileAccount('account-b')
    expect(store.accountConfirmed).toBe(false)
    expect(store.accessConfirmed).toBe(false)
    expect(store.journeyCompleted).toBe(false)
    expect(store.selectedLanguage).toBe('fr')
    expect(store.setupCompleted).toBe(true)
  })

  it('keeps a local-only choice explicit and makes tutorial replay ask for language again', () => {
    const store = useOnboardingStore()
    store.selectLanguage('en')
    store.finishSetup()
    store.confirmAccount(null)
    store.complete()
    expect(store.localOnly).toBe(true)
    expect(store.journeyCompleted).toBe(true)
    store.reset()
    expect(store.languageSelected).toBe(false)
    expect(store.setupCompleted).toBe(false)
    expect(store.journeyCompleted).toBe(false)
  })
})
