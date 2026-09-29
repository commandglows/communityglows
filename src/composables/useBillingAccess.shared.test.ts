import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, type EffectScope } from 'vue'
import { isAuthenticated, isAuthLoading } from '@/lib/convexAuth'
import { canAcknowledgeBillingAccess, useBillingAccess } from './useBillingAccess'
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
    isAuthLoading.value = false
    billingAction.mockReset()
    vi.stubGlobal('window', {})
  })

  it('waits for restored authentication confirmation before checking entitlements', async () => {
    isAuthLoading.value = true
    billingAction.mockRejectedValue(new Error('not authenticated'))
    const { billing } = consumer()
    await nextTick()
    expect(billing.status.value).toBe('loading')
    expect(billingAction.mock.calls.length).toBe(0)
    expect(billing.canAccessProtected.value).toBe(false)

    billingAction.mockResolvedValueOnce(lifetime)
    isAuthLoading.value = false
    await vi.waitFor(() => expect(billing.canAccessProtected.value).toBe(true))
    expect(billingAction).toHaveBeenCalledTimes(1)
  })

  it('announces only the trial period returned by the existing server authority', async () => {
    const trial = { status: 'active', accessState: 'trial_active', trialStartedAt: 1_790_682_000_000, trialEndsAt: 1_793_274_000_000 }
    billingAction.mockResolvedValueOnce(trial)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.status.value).toBe('trial_active'))
    expect(billing.access.value?.trialStartedAt).toBe(trial.trialStartedAt)
    expect(billing.access.value?.trialEndsAt).toBe(trial.trialEndsAt)
    expect(canAcknowledgeBillingAccess(billing.status.value, billing.canAccessProtected.value)).toBe(true)
  })

  it('does not invent a trial or complete its announcement when access remains unknown', async () => {
    billingAction.mockRejectedValueOnce(new Error('unexpected server failure'))
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.status.value).toBe('error'))
    expect(billing.access.value).toBeNull()
    expect(canAcknowledgeBillingAccess(billing.status.value, billing.canAccessProtected.value)).toBe(false)
    for (const status of ['loading', 'signed_out', 'unconfigured', 'bridge_unavailable'] as const) {
      expect(canAcknowledgeBillingAccess(status, false)).toBe(false)
    }
    expect(canAcknowledgeBillingAccess('bridge_unavailable', true)).toBe(true)
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

  it('ignores a late restart from account A without clearing account B restart in progress', async () => {
    const expired = { status: 'inactive', accessState: 'trial_expired', trialRestartEligible: true, trialRestartsRemaining: 1 }
    billingAction.mockResolvedValueOnce(expired)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.canRestartTrial.value).toBe(true))
    let completeA!: (result: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { completeA = resolve }))
    const restartA = billing.restartTrial()
    await vi.waitFor(() => expect(billingAction).toHaveBeenCalledTimes(2))
    isAuthenticated.value = false
    billingAction.mockResolvedValueOnce(expired)
    isAuthenticated.value = true
    await vi.waitFor(() => expect(billing.canRestartTrial.value).toBe(true))
    let completeB!: (result: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { completeB = resolve }))
    const restartB = billing.restartTrial()
    await vi.waitFor(() => expect(billingAction).toHaveBeenCalledTimes(4))
    completeA({ status: 'active', accessState: 'trial_active' })
    expect(await restartA).toBeNull()
    expect(billing.status.value).toBe('trial_expired')
    expect(billing.isRestarting.value).toBe(true)
    completeB({ status: 'active', accessState: 'trial_active' })
    await restartB
    expect(billing.status.value).toBe('trial_active')
    expect(billing.isRestarting.value).toBe(false)
  })

  it('finishes a current-account restart after a concurrent access retry without a stuck spinner', async () => {
    const expired = { status: 'inactive', accessState: 'trial_expired', trialRestartEligible: true, trialRestartsRemaining: 1 }
    billingAction.mockResolvedValueOnce(expired)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.canRestartTrial.value).toBe(true))
    let complete!: (result: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { complete = resolve }))
    const restarting = billing.restartTrial()
    await vi.waitFor(() => expect(billingAction).toHaveBeenCalledTimes(2))
    billingAction.mockResolvedValueOnce(expired)
    await billing.refreshAccess()
    complete({ status: 'active', accessState: 'trial_active' })
    await restarting
    expect(billing.status.value).toBe('trial_active')
    expect(billing.isLoading.value).toBe(false)
    expect(billing.isRestarting.value).toBe(false)
  })

  it('does not publish redemption success from a previous account', async () => {
    billingAction.mockResolvedValueOnce(lifetime)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.canAccessProtected.value).toBe(true))
    let complete!: (result: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { complete = resolve }))
    const redeeming = billing.redeemCode('fake-test-code')
    isAuthenticated.value = false
    billingAction.mockResolvedValueOnce(lifetime)
    isAuthenticated.value = true
    await vi.waitFor(() => expect(billing.canAccessProtected.value).toBe(true))
    complete({ status: 'active', alreadyRedeemed: false })
    expect(await redeeming).toBeNull()
    expect(billing.redeemResult.value).toBeNull()
    expect(billing.successKey.value).toBeNull()
    expect(billing.access.value).toEqual(lifetime)
  })

  it('does not open account A checkout after switching to account B', async () => {
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} })
    billingAction.mockResolvedValueOnce(lifetime)
    const { billing } = consumer()
    await vi.waitFor(() => expect(billing.canAccessProtected.value).toBe(true))
    let complete!: (result: unknown) => void
    billingAction.mockReturnValueOnce(new Promise(resolve => { complete = resolve }))
    const purchasing = billing.startPurchase()
    await vi.waitFor(() => expect(billingAction).toHaveBeenCalledTimes(2))
    isAuthenticated.value = false
    billingAction.mockResolvedValueOnce(lifetime)
    isAuthenticated.value = true
    await vi.waitFor(() => expect(billing.canAccessProtected.value).toBe(true))
    complete({ checkoutUrl: 'https://checkout.stripe.com/c/pay/fake' })
    expect(await purchasing).toBeNull()
    expect(openUrl).not.toHaveBeenCalled()
    expect(billing.successKey.value).toBeNull()
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
