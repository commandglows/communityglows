import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = vi.hoisted(() => ({ isTauri: vi.fn(), isExtension: vi.fn(), invoke: vi.fn() }))
vi.mock('@/platform/capabilities', () => fixtures)
vi.mock('@tauri-apps/api/core', () => ({ invoke: fixtures.invoke }))

import { ONBOARDING_INSTALLATION_KEY, recordExtensionOnboardingInstallation, resolveOnboardingLifecycleScope } from './onboardingLifecycle'

describe('onboarding installation/build scope', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', false)
    vi.stubGlobal('__VERSION__', '0.1.0')
    vi.stubGlobal('__BUILD_ID__', 'build-a')
    vi.stubGlobal('navigator', { userAgent: 'Windows' })
    const values = new Map<string, string>([['communityglows_installation_id', 'billing-device-unchanged']])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    })
    fixtures.isTauri.mockReturnValue(false)
    fixtures.isExtension.mockReturnValue(false)
    fixtures.invoke.mockReset()
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('reads the package witness on Windows and observes reinstall without touching the billing device', async () => {
    fixtures.isTauri.mockReturnValue(true)
    fixtures.invoke.mockResolvedValueOnce('a'.repeat(64)).mockResolvedValueOnce('b'.repeat(64))
    expect(await resolveOnboardingLifecycleScope()).toEqual({ installation: 'a'.repeat(64), build: '0.1.0:build-a' })
    expect(await resolveOnboardingLifecycleScope()).toEqual({ installation: 'b'.repeat(64), build: '0.1.0:build-a' })
    expect(fixtures.invoke).toHaveBeenCalledWith('get_onboarding_installation_generation')
    expect(localStorage.getItem('communityglows_installation_id')).toBe('billing-device-unchanged')
    expect(localStorage.getItem(ONBOARDING_INSTALLATION_KEY)).toBeNull()
  })

  it.each(['', 'malformed', 'A'.repeat(64)])('does not replace invalid production Windows witnesses with a fake local generation: %s', async (witness) => {
    fixtures.isTauri.mockReturnValue(true)
    fixtures.invoke.mockResolvedValue(witness)
    await expect(resolveOnboardingLifecycleScope()).rejects.toThrow('onboarding_installation_unavailable')
    expect(localStorage.getItem(ONBOARDING_INSTALLATION_KEY)).toBeNull()
  })

  it('does not hide native read failure behind a local fallback in production', async () => {
    fixtures.isTauri.mockReturnValue(true)
    fixtures.invoke.mockRejectedValue(new Error('read failed'))
    await expect(resolveOnboardingLifecycleScope()).rejects.toThrow('read failed')
    expect(localStorage.getItem(ONBOARDING_INSTALLATION_KEY)).toBeNull()
  })

  it('allows tauri:dev without pretending it was installed by a Windows package', async () => {
    vi.stubEnv('DEV', true)
    fixtures.isTauri.mockReturnValue(true)
    const first = await resolveOnboardingLifecycleScope()
    expect((await resolveOnboardingLifecycleScope()).installation).toBe(first.installation)
    expect(first.installation).not.toHaveLength(64)
    expect(fixtures.invoke).not.toHaveBeenCalled()
  })

  it('keeps web origin continuity while a new build invalidates the acknowledged scope', async () => {
    const first = await resolveOnboardingLifecycleScope()
    vi.stubGlobal('__BUILD_ID__', 'build-b')
    const updated = await resolveOnboardingLifecycleScope()
    expect(updated.installation).toBe(first.installation)
    expect(updated.build).toBe('0.1.0:build-b')
    expect(localStorage.getItem('communityglows_installation_id')).toBe('billing-device-unchanged')
  })

  it('uses the existing extension install/update event to rotate only its onboarding witness', async () => {
    fixtures.isExtension.mockReturnValue(true)
    const values: Record<string, string> = { [ONBOARDING_INSTALLATION_KEY]: 'previous-installation' }
    vi.stubGlobal('chrome', { storage: { local: {
      get: vi.fn(async (key: string) => ({ [key]: values[key] })),
      set: vi.fn(async (patch: Record<string, string>) => { Object.assign(values, patch) }),
    } } })
    expect((await resolveOnboardingLifecycleScope()).installation).toBe('previous-installation')
    await recordExtensionOnboardingInstallation()
    const next = await resolveOnboardingLifecycleScope()
    expect(next.installation).not.toBe('previous-installation')
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ [ONBOARDING_INSTALLATION_KEY]: next.installation })
    expect(Object.keys(values)).toEqual([ONBOARDING_INSTALLATION_KEY])
  })
})
