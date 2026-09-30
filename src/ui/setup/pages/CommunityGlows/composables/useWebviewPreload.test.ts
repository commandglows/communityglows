import { afterEach, describe, expect, it, vi } from 'vitest'
import { preloadWebviews } from './useWebviewPreload'

const invoke = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock('@tauri-apps/api/core', () => ({ invoke }))
vi.mock('@/stores/webviewState', () => ({ WEBVIEW_URLS: { twitter: 'https://x.com', github: 'https://github.com' } }))
vi.mock('@/stores/profiles', () => ({
  useProfilesStore: () => ({ activeProfileId: 'test-profile', isNetworkHidden: () => false }),
}))
vi.mock('@/config/socialNetworks', () => ({ getNetworkIsolationOrigins: () => [] }))

describe('native network preload authorization boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    invoke.mockClear()
  })

  function nativeEnvironment() {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} })
    vi.stubGlobal('navigator', { userAgent: 'Windows' })
    vi.stubGlobal('document', { documentElement: { classList: { contains: () => false } } })
  }

  it('never creates hidden networks while rights are unavailable or denied', async () => {
    nativeEnvironment()
    await preloadWebviews(() => false)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('preloads only hidden networks with confirmed permission', async () => {
    nativeEnvironment()
    await preloadWebviews(() => true)
    expect(invoke).toHaveBeenCalledTimes(2)
    expect(invoke).toHaveBeenCalledWith('open_webview', expect.objectContaining({ hidden: true }))
  })

  it('rechecks permission after the asynchronous native adapter load', async () => {
    nativeEnvironment()
    let checks = 0
    await preloadWebviews(() => ++checks === 1)
    expect(invoke).not.toHaveBeenCalled()
  })
})
