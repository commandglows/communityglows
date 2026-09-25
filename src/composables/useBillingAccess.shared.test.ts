import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, type EffectScope } from 'vue'
import { isAuthenticated } from '@/lib/convexAuth'
import { useBillingAccess } from './useBillingAccess'
import { openUrl } from '@tauri-apps/plugin-opener'

const billingAction = vi.hoisted(() => {
  // Exercise VueUse's client lifecycle without mounting a DOM renderer.
  vi.stubGlobal('window', {})
  vi.stubGlobal('document', { createElement: () => ({}) })
  return vi.fn()
})
vi.mock('@/lib/convex', () => ({ getConvexClient: () => ({ action: billingAction }) }))
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }))
vi.mock('@/lib/convexAuth', async () => {
  const { ref } = await import('vue')
  return { isAuthenticated: ref(true), isAuthLoading: ref(false), isConvexConfigured: ref(true) }
})
vi.mock('@/lib/communityGlowsInstallation', () => ({
  getCommunityGlowsInstallationHash: async () => 'test-installation-hash',
}))

describe('shared billing access lifecycle', () => {
  const scopes: EffectScope[] = []
  const lifetime = { status: 'active', accessState: 'lifetime_active', planId: 'lifetime_deal' }
  function consumer() {
    const scope = effectScope()
    scopes.push(scope)
    return { scope, billing: scope.run(() => useBillingAccess())! }
  }

  afterEach(() => {
    scopes.splice(0).forEach(scope => scope.stop())
    isAuthenticated.value = true
    billingAction.mockReset()
    vi.stubGlobal('window', {})
  })

  it('unlocks the app when the gate retries successfully after an outage', async () => {
    billingAction.mockRejectedValue(new Error('bridge unavailable'))
    const app = consumer()
    await vi.waitFor(() => expect(app.billing.status.value).toBe('bridge_unavailable'))
    const gate = consumer()
    await vi.waitFor(() => expect(gate.billing.status.value).toBe('bridge_unavailable'))

    billingAction.mockResolvedValue(lifetime)
    await gate.billing.refreshAccess()

    expect(app.billing.canAccessProtected.value).toBe(true)
    expect(app.billing.errorKey.value).toBeNull()
    gate.scope.stop()
    expect(app.billing.canAccessProtected.value).toBe(true)
  })

  it('clears access for all consumers on sign-out and disposes the last subscription', async () => {
    billingAction.mockResolvedValue(lifetime)
    const app = consumer()
    const gate = consumer()
    await vi.waitFor(() => expect(app.billing.canAccessProtected.value).toBe(true))
    expect(billingAction).toHaveBeenCalledTimes(1)
    isAuthenticated.value = false
    await nextTick()
    for (const { billing } of [app, gate]) {
      expect(billing.access.value).toBeNull()
      expect(billing.lastVerifiedAt.value).toBeNull()
      expect(billing.canAccessProtected.value).toBe(false)
    }
    app.scope.stop()
    gate.scope.stop()
    billingAction.mockClear()
    isAuthenticated.value = true
    await nextTick()
    expect(billingAction).not.toHaveBeenCalled()

    billingAction.mockRejectedValue(new Error('bridge unavailable'))
    const reopened = consumer()
    await vi.waitFor(() => expect(reopened.billing.status.value).toBe('bridge_unavailable'))
    expect(reopened.billing.access.value).toBeNull()
    expect(reopened.billing.canAccessProtected.value).toBe(false)
  })

  it('opens trusted checkout in the native browser without requesting a popup', async () => {
    const popup = vi.fn()
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {}, open: popup })
    billingAction.mockResolvedValueOnce(lifetime)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.isLoading.value).toBe(false))
    const checkoutUrl = 'https://checkout.stripe.com/c/pay/test'
    billingAction.mockResolvedValueOnce({ checkoutUrl })
    expect(await billing.startPurchase()).toBe(checkoutUrl)
    expect(popup).not.toHaveBeenCalled()
    expect(openUrl).toHaveBeenCalledWith(checkoutUrl)
    expect(billing.successKey.value).toBe('billing.checkout_opened')
  })

  it('ignores a successful response from before sign-out and another sign-in', async () => {
    let completeOldRequest!: (value: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { completeOldRequest = resolve }))
    const { billing } = consumer()
    await vi.waitFor(() => expect(billingAction).toHaveBeenCalledTimes(1))
    isAuthenticated.value = false
    expect(billing.access.value).toBeNull()
    billingAction.mockRejectedValueOnce(new Error('bridge unavailable'))
    isAuthenticated.value = true
    await vi.waitFor(() => expect(billing.status.value).toBe('bridge_unavailable'))
    completeOldRequest(lifetime)
    await nextTick()
    expect(billing.access.value).toBeNull()
    expect(billing.lastVerifiedAt.value).toBeNull()
    expect(billing.canAccessProtected.value).toBe(false)
  })

  it('keeps the newest retry result when an older check finishes later', async () => {
    let completeOldRequest!: (value: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { completeOldRequest = resolve }))
    const { billing } = consumer()
    await vi.waitFor(() => expect(billingAction).toHaveBeenCalledTimes(1))
    billingAction.mockResolvedValueOnce({ status: 'inactive', accessState: 'trial_expired' })
    await billing.refreshAccess()
    completeOldRequest(lifetime)
    await nextTick()
    expect(billing.status.value).toBe('trial_expired')
    expect(billing.canAccessProtected.value).toBe(false)
  })

  it('refuses an untrusted checkout host before invoking the native opener', async () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} })
    billingAction.mockResolvedValueOnce(lifetime)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.isLoading.value).toBe(false))
    billingAction.mockResolvedValueOnce({ checkoutUrl: 'https://stripe.example/pay' })
    expect(await billing.startPurchase()).toBeNull()
    expect(openUrl).not.toHaveBeenCalled()
    expect(billing.errorKey.value).toBe('billing.errors.checkout_unavailable')
  })

  it('reports a blocked browser popup before creating checkout', async () => {
    vi.stubGlobal('window', { open: vi.fn(() => null) })
    billingAction.mockResolvedValueOnce(lifetime)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.isLoading.value).toBe(false))
    billingAction.mockClear()
    expect(await billing.startPurchase()).toBeNull()
    expect(billingAction).not.toHaveBeenCalled()
    expect(openUrl).not.toHaveBeenCalled()
    expect(billing.errorKey.value).toBe('billing.errors.checkout_popup_blocked')
  })
})
