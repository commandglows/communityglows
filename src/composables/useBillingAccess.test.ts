import { describe, expect, it } from 'vitest'
import {
  BILLING_ACCESS_GRACE_MS,
  getSafeAccessCheckError,
  getSafeBillingError,
  isAccessWithinGrace,
  isTrialRestartAllowed,
  isTrustedStripeCheckoutUrl,
} from './useBillingAccess'

describe('billing access grace', () => {
  const lifetime = {
    productId: 'communityglows',
    planId: 'lifetime_deal',
    status: 'active',
    accessState: 'lifetime_active',
    source: 'manual',
    entitlementId: null,
    expiresAt: null,
    trialStartedAt: null,
    trialEndsAt: null,
    legacyFallback: false,
    reasonCode: 'active_entitlement',
    trialAttempt: null,
    trialRestartsRemaining: 0,
    trialRestartEligible: false,
  } as const

  it('keeps a recently verified entitlement during a bounded outage', () => {
    expect(isAccessWithinGrace(lifetime, 1_000, 1_000 + BILLING_ACCESS_GRACE_MS)).toBe(true)
  })

  it('fails closed after the bounded grace window', () => {
    expect(isAccessWithinGrace(lifetime, 1_000, 1_001 + BILLING_ACCESS_GRACE_MS)).toBe(false)
  })

  it('never grants grace without a previously verified entitlement', () => {
    expect(isAccessWithinGrace(null, 1_000, 1_001)).toBe(false)
  })

  it('never extends a trial beyond its trusted end timestamp', () => {
    const trial = {
      ...lifetime,
      planId: 'trial',
      accessState: 'trial_active',
      trialStartedAt: 100,
      trialEndsAt: 2_000,
      expiresAt: 2_000,
    } as const
    expect(isAccessWithinGrace(trial, 1_900, 2_000)).toBe(false)
  })
})

describe('trial restart eligibility', () => {
  const expired = {
    productId: 'communityglows',
    planId: 'trial',
    status: 'inactive',
    accessState: 'trial_expired',
    source: 'product_trial',
    entitlementId: null,
    expiresAt: 2_000,
    trialStartedAt: 1_000,
    trialEndsAt: 2_000,
    trialAttempt: 2,
    trialRestartsRemaining: 1,
    trialRestartEligible: true,
    legacyFallback: false,
    reasonCode: 'trial_expired',
  } as const

  it('uses only the server eligibility and remaining counter', () => {
    expect(isTrialRestartAllowed(expired)).toBe(true)
    expect(isTrialRestartAllowed({ ...expired, trialRestartEligible: false })).toBe(false)
    expect(isTrialRestartAllowed({ ...expired, trialRestartsRemaining: 0 })).toBe(false)
    expect(isTrialRestartAllowed({ ...expired, accessState: 'trial_exhausted' })).toBe(false)
  })
})

describe('Stripe checkout URL boundary', () => {
  it('accepts only secure Stripe-owned hosts', () => {
    expect(isTrustedStripeCheckoutUrl(new URL('https://checkout.stripe.com/c/pay/test'))).toBe(true)
    expect(isTrustedStripeCheckoutUrl(new URL('https://stripe.com/pay/test'))).toBe(true)
    expect(isTrustedStripeCheckoutUrl(new URL('https://stripe.example/pay/test'))).toBe(false)
    expect(isTrustedStripeCheckoutUrl(new URL('http://checkout.stripe.com/c/pay/test'))).toBe(false)
  })
})

describe('getSafeBillingError', () => {
  it.each([
    [new Error('code_not_found'), 'billing.errors.not_found'],
    [new Error('Redemption code not found'), 'billing.errors.not_found'],
    [new Error('Redemption code is disabled'), 'billing.errors.disabled'],
    [new Error('Redemption code has already been used'), 'billing.errors.used'],
    [new Error('already_redeemed'), 'billing.errors.used'],
    [new Error('code already used'), 'billing.errors.used'],
    [new Error('Code is required'), 'billing.errors.required'],
    [new Error('Not authenticated'), 'billing.errors.unauthorized'],
    [new Error('CommunityGlows bridge unavailable'), 'billing.errors.bridge_unavailable'],
    [new Error('Suite bridge not configured'), 'billing.errors.bridge_unavailable'],
    [new Error('invalid communityglows bridge secret'), 'billing.errors.bridge_unavailable'],
    [new Error('Malformed response from bridge'), 'billing.errors.bridge_unavailable'],
    [new Error('Unexpected backend detail'), 'billing.errors.generic'],
    [new Error('trial_restart_not_eligible'), 'billing.errors.restart_not_eligible'],
    [new Error('checkout_handoff_unavailable'), 'billing.errors.checkout_unavailable'],
  ])('maps %s to %s', (error, key) => {
    expect(getSafeBillingError(error)).toBe(key)
  })
})

describe('getSafeAccessCheckError', () => {
  it('does not expose redemption-code errors during automatic access checks', () => {
    expect(getSafeAccessCheckError(new Error('code_not_found'))).toBe(
      'billing.errors.access_check_failed',
    )
    expect(getSafeAccessCheckError(new Error('invalid code'))).toBe(
      'billing.errors.access_check_failed',
    )
  })

  it('preserves operational access-check errors', () => {
    expect(getSafeAccessCheckError(new Error('Suite bridge not configured'))).toBe(
      'billing.errors.bridge_unavailable',
    )
    expect(getSafeAccessCheckError(new Error('Not authenticated'))).toBe(
      'billing.errors.unauthorized',
    )
  })
})
