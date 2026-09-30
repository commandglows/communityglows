import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import persistedState from 'pinia-plugin-persistedstate'

const { syncSettingsPatch, resolveScope } = vi.hoisted(() => ({ syncSettingsPatch: vi.fn(), resolveScope: vi.fn() }))
vi.mock('@/lib/cloudSettings', () => ({ syncSettingsPatch }))
vi.mock('@/lib/onboardingLifecycle', () => ({ resolveOnboardingLifecycleScope: resolveScope }))

import { useOnboardingStore } from './onboarding'

describe('explicit local onboarding acknowledgements', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    })
    vi.stubGlobal('window', { localStorage })
    setActivePinia(createPinia())
    useOnboardingStore().bindScope({ installation: 'installation-a', build: 'build-a' })
    vi.clearAllMocks()
  })
  afterEach(() => vi.unstubAllGlobals())

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
    expect(syncSettingsPatch).not.toHaveBeenCalled()
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

  it('keeps the journey hidden across launches of the same installation and build', () => {
    const store = useOnboardingStore()
    store.selectLanguage('fr')
    store.finishSetup()
    store.confirmAccount('account-a')
    store.complete()
    store.bindScope({ installation: 'installation-a', build: 'build-a' })
    expect(store.journeyCompleted).toBe(true)
  })

  it.each([
    { installation: 'installation-b', build: 'build-a' },
    { installation: 'installation-a', build: 'build-b' },
  ])('replays language and the existing journey after installation/build changes: %o', (scope) => {
    const store = useOnboardingStore()
    store.selectLanguage('en')
    store.finishSetup()
    store.confirmAccount('account-a')
    store.complete()
    syncSettingsPatch.mockClear()
    store.bindScope(scope)
    expect(store.languageSelected).toBe(false)
    expect(store.setupCompleted).toBe(false)
    expect(store.accountConfirmed).toBe(false)
    expect(store.journeyCompleted).toBe(false)
    expect(syncSettingsPatch).not.toHaveBeenCalled()
    // Neither historical cloud completion nor an imported old backup can cover this scope.
    store.$patch({ completed: true })
    expect(store.journeyCompleted).toBe(false)
  })

  it('revalidates the installation after a persisted restart without trusting saved runtime flags', () => {
    const newInstance = () => {
      const pinia = createPinia().use(persistedState)
      createApp({}).use(pinia)
      return useOnboardingStore(pinia)
    }
    const first = newInstance()
    first.bindScope({ installation: 'installation-a', build: 'build-a' })
    first.selectLanguage('fr')
    first.finishSetup()
    first.confirmAccount(null)
    first.complete()
    first.$persist()
    const saved = JSON.parse(localStorage.getItem('onboarding')!)
    expect(saved).not.toHaveProperty('scopeReady')
    expect(saved).not.toHaveProperty('scopeUnavailable')

    const restarted = newInstance()
    expect(restarted.journeyCompleted).toBe(false)
    expect(restarted.selectedLanguage).toBe('fr')
    restarted.bindScope({ installation: 'installation-a', build: 'build-a' })
    expect(restarted.journeyCompleted).toBe(true)
    restarted.bindScope({ installation: 'installation-b', build: 'build-a' })
    expect(restarted.selectedLanguage).toBeNull()
    expect(restarted.setupCompleted).toBe(false)
    expect(restarted.journeyCompleted).toBe(false)
  })

  it('fails closed on a missing native witness and recovers through the existing retry', async () => {
    const store = useOnboardingStore()
    store.selectLanguage('fr')
    store.finishSetup()
    store.confirmAccount('account-a')
    store.complete()
    resolveScope.mockRejectedValueOnce(new Error('unavailable'))
    await store.resolveScope()
    expect(store.scopeUnavailable).toBe(true)
    expect(store.journeyCompleted).toBe(false)
    expect(store.selectedLanguage).toBeNull()
    resolveScope.mockResolvedValueOnce({ installation: 'installation-b', build: 'build-a' })
    await store.resolveScope()
    expect(store.scopeUnavailable).toBe(false)
    expect(store.scopeReady).toBe(true)
    expect(store.selectedLanguage).toBeNull()
  })
})
