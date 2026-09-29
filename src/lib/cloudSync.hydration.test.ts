import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getFunctionName } from 'convex/server'

const fixture = vi.hoisted(() => {
  const store = () => ({
    clearLocal: vi.fn(), replaceFromCloud: vi.fn(), initialize: vi.fn(),
    syncToCloud: vi.fn().mockResolvedValue(undefined), seedCloud: vi.fn().mockResolvedValue(undefined),
  })
  return {
    query: vi.fn(), action: vi.fn(), setLocale: vi.fn(),
    profiles: { ...store(), profiles: [], activeProfileId: '' },
    accounts: { ...store(), accounts: [] },
    links: { ...store(), links: {}, getLinks: () => [] },
    friends: { ...store(), friends: {}, enabled: false },
    theme: { applyCloudPreferences: vi.fn(), resetLocalPreferences: vi.fn() },
    tasks: store(), contacts: store(), kanban: store(), workspaces: store(),
  }
})
vi.mock('@/lib/convex', () => ({ getConvexClient: () => ({ query: fixture.query, action: fixture.action }) }))
vi.mock('@/lib/convexAuth', async () => ({ isAuthenticated: (await import('vue')).ref(true) }))
vi.mock('@/utils/i18n', () => ({ setLocale: fixture.setLocale }))
vi.mock('@/lib/cloudSettings', () => ({ syncSettingsPatch: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/cloudSyncQueue', () => ({ clearCloudSyncQueue: vi.fn(), flushCloudSyncQueue: vi.fn().mockResolvedValue(undefined), hasPendingCloudSync: () => false }))
vi.mock('@/lib/buildDiagnostics', () => ({ recordDiagnosticEvent: vi.fn() }))
vi.mock('@/lib/postAuthSyncFeedback', () => ({ advancePostAuthSyncStage: vi.fn().mockResolvedValue(undefined), beginPostAuthSyncFeedback: vi.fn(), queuePostAuthReadyNotice: vi.fn(), resetPostAuthSyncFeedback: vi.fn(), showPostAuthReadyFeedback: vi.fn() }))
vi.mock('@/stores/profiles', () => ({ useProfilesStore: () => fixture.profiles }))
vi.mock('@/stores/accounts', () => ({ useAccountsStore: () => fixture.accounts }))
vi.mock('@/stores/customLinks', () => ({ useCustomLinksStore: () => fixture.links }))
vi.mock('@/stores/friendsFilter', () => ({ useFriendsFilterStore: () => fixture.friends }))
vi.mock('@/stores/theme', () => ({ useThemeStore: () => fixture.theme }))
vi.mock('@/stores/contextualTasks', () => ({ useContextualTasksStore: () => fixture.tasks }))
vi.mock('@/stores/kanbanContacts', () => ({ useKanbanContactsStore: () => fixture.contacts }))
vi.mock('@/stores/kanban', () => ({ useKanbanStore: () => fixture.kanban }))
vi.mock('@/stores/desktopWorkspaces', () => ({ useDesktopWorkspacesStore: () => fixture.workspaces }))
vi.mock('@/stores/shortcuts', () => ({ useShortcutsStore: () => ({ setFromCloud: vi.fn() }) }))

import { isAuthenticated } from './convexAuth'
import { cloudHydrationUnavailable, currentCloudAccount, hydrateCloudState, isCloudHydrating, resetCloudSyncState } from './cloudSync'
import { useOnboardingStore } from '@/stores/onboarding'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(complete => { resolve = complete })
  return { promise, resolve }
}

const user = (id: string, anonymous = false) => ({ _id: id, isAnonymous: anonymous, ...(anonymous ? {} : { email: `${id}@example.invalid` }) })
const cloudProfile = (id: string) => ({ profileId: `profile-${id}`, name: `Profile ${id}`, emoji: '🌊', hiddenNetworks: ['twitter'], createdAt: 1 })

describe('onboarding account hydration boundary', () => {
  let accountId = 'a'
  beforeEach(() => {
    resetCloudSyncState()
    setActivePinia(createPinia())
    useOnboardingStore().bindScope({ installation: 'installation-a', build: 'build-a' })
    vi.clearAllMocks()
    isAuthenticated.value = true
    accountId = 'a'
    const storage = new Map<string, string>()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    })
    fixture.action.mockResolvedValue(undefined)
    fixture.query.mockImplementation(async reference => {
      switch (getFunctionName(reference)) {
        case 'users:getMe': return user(accountId)
        case 'settings:get': return { language: 'fr', onboardingCompleted: true }
        case 'profiles:list': return [cloudProfile(accountId)]
        case 'workspaceState:get': return null
        default: return []
      }
    })
  })
  afterEach(() => { resetCloudSyncState(); vi.unstubAllGlobals() })

  it('publishes a restored anonymous session only after its existing data has hydrated', async () => {
    const profiles = deferred<ReturnType<typeof cloudProfile>[]>()
    fixture.query.mockImplementation(async reference => {
      if (getFunctionName(reference) === 'users:getMe') return user('anonymous', true)
      if (getFunctionName(reference) === 'profiles:list') return profiles.promise
      if (getFunctionName(reference) === 'settings:get') return { onboardingCompleted: true }
      return []
    })
    const pending = hydrateCloudState()
    await vi.waitFor(() => expect(fixture.query.mock.calls.length).toBe(8))
    expect(currentCloudAccount.value).toBeNull()
    expect(isCloudHydrating.value).toBe(true)
    profiles.resolve([cloudProfile('anonymous')])
    await pending
    expect(currentCloudAccount.value).toEqual({ id: 'anonymous', anonymous: true, email: undefined })
    expect(useOnboardingStore().journeyCompleted).toBe(false)
    expect(isCloudHydrating.value).toBe(false)
  })

  it('rejects account A received after sign-out and does not clear the new B hydration promise', async () => {
    const a = deferred<ReturnType<typeof user>>()
    const b = deferred<ReturnType<typeof user>>()
    let userQueries = 0
    const fallback = fixture.query.getMockImplementation()!
    fixture.query.mockImplementation(reference => getFunctionName(reference) === 'users:getMe'
      ? (++userQueries === 1 ? a.promise : b.promise) : fallback(reference))
    const pendingA = hydrateCloudState()
    const rejectedA = expect(pendingA).rejects.toThrow('session a changé')
    isAuthenticated.value = false
    resetCloudSyncState()
    isAuthenticated.value = true
    accountId = 'b'
    const pendingB = hydrateCloudState()
    a.resolve(user('a'))
    await rejectedA
    expect(currentCloudAccount.value).toBeNull()
    expect(isCloudHydrating.value).toBe(true)
    const alsoB = hydrateCloudState()
    expect(userQueries).toBe(2)
    b.resolve(user('b'))
    await Promise.all([pendingB, alsoB])
    expect(currentCloudAccount.value?.id).toBe('b')
    expect(fixture.profiles.replaceFromCloud).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('communityglows_cloud_sync_user_id')).toBe('b')
    expect(isCloudHydrating.value).toBe(false)
  })

  it('never applies or remembers a late A snapshot after B has hydrated', async () => {
    const profiles = deferred<ReturnType<typeof cloudProfile>[]>()
    const fallback = fixture.query.getMockImplementation()!
    fixture.query.mockImplementation(reference => getFunctionName(reference) === 'profiles:list' && accountId === 'a'
      ? profiles.promise : fallback(reference))
    const pendingA = hydrateCloudState()
    const rejectedA = expect(pendingA).rejects.toThrow('session a changé')
    await vi.waitFor(() => expect(fixture.query.mock.calls.length).toBe(8))
    resetCloudSyncState()
    accountId = 'b'
    await hydrateCloudState()
    profiles.resolve([cloudProfile('a')])
    await rejectedA
    expect(fixture.profiles.replaceFromCloud).toHaveBeenCalledTimes(1)
    expect(fixture.profiles.replaceFromCloud).toHaveBeenCalledWith([cloudProfile('b')], undefined)
    expect(currentCloudAccount.value?.id).toBe('b')
    expect(localStorage.getItem('communityglows_cloud_sync_user_id')).toBe('b')
  })

  it('offers terminal failure recovery and releases account choices before a successful retry', async () => {
    fixture.query.mockRejectedValueOnce(new Error('offline'))
    await expect(hydrateCloudState()).rejects.toThrow('offline')
    expect(currentCloudAccount.value).toBeNull()
    expect(cloudHydrationUnavailable.value).toBe(true)
    expect(isCloudHydrating.value).toBe(false)
    await hydrateCloudState()
    expect(currentCloudAccount.value?.id).toBe('a')
    expect(cloudHydrationUnavailable.value).toBe(false)
  })

  it('keeps an explicit local language and requires local account/access acknowledgement despite cloud completed', async () => {
    const onboarding = useOnboardingStore()
    onboarding.selectLanguage('en')
    localStorage.setItem('user-locale', 'en')
    await hydrateCloudState()
    expect(onboarding.completed).toBe(true)
    expect(onboarding.selectedLanguage).toBe('en')
    expect(onboarding.journeyCompleted).toBe(false)
    expect(fixture.setLocale).not.toHaveBeenCalledWith('fr', false)
  })

  it('preserves the later settings language when an acknowledged account is changed', async () => {
    const onboarding = useOnboardingStore()
    onboarding.selectLanguage('fr')
    onboarding.finishSetup()
    onboarding.confirmAccount('previous')
    onboarding.complete()
    localStorage.setItem('user-locale', 'en')
    onboarding.resetAccountConfirmation()
    await hydrateCloudState()
    expect(fixture.setLocale).toHaveBeenCalledWith('en', false)
    expect(fixture.setLocale).not.toHaveBeenCalledWith('fr', false)
  })
})
