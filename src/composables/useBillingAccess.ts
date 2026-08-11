import { computed, ref, watch } from 'vue'
import { getConvexClient } from '@/lib/convex'
import {
  isAuthenticated,
  isAuthLoading,
  isConvexConfigured,
} from '@/lib/convexAuth'
import { api } from '../../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import { getCommunityGlowsInstallationHash } from '@/lib/communityGlowsInstallation'

type ProductAccess = FunctionReturnType<typeof api.billing.getProductAccess>
type RedeemResult = FunctionReturnType<typeof api.billing.redeemCode>
type RestartResult = FunctionReturnType<typeof api.billing.restartTrial>

export type BillingAccessStatus =
  | 'unconfigured'
  | 'signed_out'
  | 'loading'
  | 'bridge_unavailable'
  | 'free'
  | 'active'
  | 'trial_active'
  | 'trial_expired'
  | 'trial_exhausted'
  | 'lifetime_active'
  | 'error'

export const BILLING_ACCESS_GRACE_MS = 15 * 60 * 1000

export function isAccessWithinGrace(
  access: ProductAccess | null,
  verifiedAt: number | null,
  now = Date.now(),
) {
  if (!access || verifiedAt === null || now - verifiedAt > BILLING_ACCESS_GRACE_MS) {
    return false
  }
  if (access.accessState === 'trial_active') {
    return typeof access.trialEndsAt === 'number' && access.trialEndsAt > now
  }
  return access.accessState === 'lifetime_active'
}

export function isTrialRestartAllowed(access: ProductAccess | null): boolean {
  return access?.accessState === 'trial_expired' &&
    access.trialRestartEligible === true &&
    (access.trialRestartsRemaining ?? 0) > 0
}

export function isTrustedStripeCheckoutUrl(url: URL): boolean {
  return url.protocol === 'https:' &&
    (url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'))
}

export function getSafeBillingError(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (/trial_restart_not_eligible|trial_exhausted|restart_limit/i.test(message)) {
    return 'billing.errors.restart_not_eligible'
  }
  if (/checkout_handoff_unavailable|checkout_not_configured|stripe.*not configured|missing.*price/i.test(message)) {
    return 'billing.errors.checkout_unavailable'
  }
  if (/checkout_popup_blocked/i.test(message)) {
    return 'billing.errors.checkout_popup_blocked'
  }
  if (/checkout.*malformed|invalid checkout/i.test(message)) {
    return 'billing.errors.checkout_unavailable'
  }

  if (/code_not_found|not found|invalid code/i.test(message)) {
    return 'billing.errors.not_found'
  }
  if (/disabled/i.test(message)) {
    return 'billing.errors.disabled'
  }
  if (
    /already been used|already used|already_redeemed|already redeemed/i.test(message)
  ) {
    return 'billing.errors.used'
  }
  if (/bridge|unavailable|request failed|timeout|malformed/i.test(message)) {
    return 'billing.errors.bridge_unavailable'
  }
  if (/unauthorized|not authenticated|authentication/i.test(message)) {
    return 'billing.errors.unauthorized'
  }
  if (/required/i.test(message)) {
    return 'billing.errors.required'
  }

  return 'billing.errors.generic'
}

export function getSafeAccessCheckError(error: unknown) {
  const safeError = getSafeBillingError(error)

  if (safeError === 'billing.errors.bridge_unavailable') {
    return safeError
  }

  if (safeError === 'billing.errors.unauthorized') {
    return safeError
  }

  return 'billing.errors.access_check_failed'
}

export function useBillingAccess() {
  const access = ref<ProductAccess | null>(null)
  const redeemResult = ref<RedeemResult | null>(null)
  const isLoading = ref(false)
  const isRedeeming = ref(false)
  const isRestarting = ref(false)
  const isStartingCheckout = ref(false)
  const errorKey = ref<string | null>(null)
  const successKey = ref<string | null>(null)
  const lastVerifiedAt = ref<number | null>(null)

  const canLoadAccess = computed(
    () => isConvexConfigured.value && isAuthenticated.value,
  )
  const canRedeem = computed(
    () => canLoadAccess.value && !isAuthLoading.value && !isRedeeming.value,
  )
  const trialRestartsRemaining = computed(() => access.value?.trialRestartsRemaining ?? 0)
  const canRestartTrial = computed(() =>
    canLoadAccess.value &&
    !isAuthLoading.value &&
    !isRestarting.value &&
    isTrialRestartAllowed(access.value),
  )
  const canStartCheckout = computed(() =>
    canLoadAccess.value && !isAuthLoading.value && !isStartingCheckout.value,
  )
  const isLifetimeDeal = computed(
    () =>
      access.value?.status === 'active' &&
      (access.value.planId === 'lifetime_deal' ||
        access.value.planId === 'founder_ltd'),
  )
  const status = computed<BillingAccessStatus>(() => {
    if (!isConvexConfigured.value) return 'unconfigured'
    if (isAuthLoading.value || isLoading.value) return 'loading'
    if (!isAuthenticated.value) return 'signed_out'
    if (errorKey.value === 'billing.errors.bridge_unavailable') {
      return 'bridge_unavailable'
    }
    if (errorKey.value && !access.value) return 'error'
    if (access.value?.accessState === 'trial_active') return 'trial_active'
    if (access.value?.accessState === 'trial_expired') return 'trial_expired'
    if (access.value?.accessState === 'trial_exhausted') return 'trial_exhausted'
    if (access.value?.accessState === 'lifetime_active') return 'lifetime_active'
    return 'free'
  })
  const canAccessProtected = computed(() => {
    if (status.value === 'trial_active' || status.value === 'lifetime_active') {
      return true
    }
    if (status.value === 'bridge_unavailable') {
      return isAccessWithinGrace(access.value, lastVerifiedAt.value)
    }
    return false
  })

  async function refreshAccess() {
    if (!canLoadAccess.value) {
      access.value = null
      lastVerifiedAt.value = null
      redeemResult.value = null
      isLoading.value = false
      errorKey.value = null
      successKey.value = null
      return
    }

    isLoading.value = true
    errorKey.value = null
    try {
      const installationHash = await getCommunityGlowsInstallationHash()
      access.value = await getConvexClient().action(api.billing.getProductAccess, { installationHash })
      lastVerifiedAt.value = Date.now()
    } catch (error) {
      errorKey.value = getSafeAccessCheckError(error)
      if (errorKey.value !== 'billing.errors.bridge_unavailable') {
        access.value = null
        lastVerifiedAt.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function restartTrial(): Promise<RestartResult | null> {
    successKey.value = null
    errorKey.value = null
    if (!canRestartTrial.value) {
      errorKey.value = 'billing.errors.restart_not_eligible'
      return null
    }

    isRestarting.value = true
    try {
      const installationHash = await getCommunityGlowsInstallationHash()
      const result = await getConvexClient().action(api.billing.restartTrial, { installationHash })
      access.value = result
      lastVerifiedAt.value = Date.now()
      successKey.value = 'billing.restart_success'
      return result
    } catch (error) {
      errorKey.value = getSafeBillingError(error)
      return null
    } finally {
      isRestarting.value = false
    }
  }

  async function startPurchase(
    checkoutWindow: Window | null = window.open('', '_blank'),
  ): Promise<string | null> {
    successKey.value = null
    errorKey.value = null
    if (checkoutWindow) checkoutWindow.opener = null
    if (!canStartCheckout.value) {
      checkoutWindow?.close()
      errorKey.value = isConvexConfigured.value
        ? 'billing.errors.unauthorized'
        : 'billing.errors.unconfigured'
      return null
    }
    if (!checkoutWindow) {
      errorKey.value = 'billing.errors.checkout_popup_blocked'
      return null
    }

    isStartingCheckout.value = true
    try {
      const installationHash = await getCommunityGlowsInstallationHash()
      const result = await getConvexClient().action(api.billing.startCheckout, { installationHash })
      const checkoutUrl = new URL(result.checkoutUrl)
      if (!isTrustedStripeCheckoutUrl(checkoutUrl)) throw new Error('checkout_malformed_response')
      checkoutWindow.location.replace(checkoutUrl.toString())
      successKey.value = 'billing.checkout_opened'
      return checkoutUrl.toString()
    } catch (error) {
      checkoutWindow.close()
      errorKey.value = getSafeBillingError(error)
      return null
    } finally {
      isStartingCheckout.value = false
    }
  }

  async function redeemCode(rawCode: string) {
    const code = rawCode.trim()
    successKey.value = null
    errorKey.value = null
    redeemResult.value = null

    if (!code) {
      errorKey.value = 'billing.errors.required'
      return null
    }
    if (!canRedeem.value) {
      errorKey.value = isConvexConfigured.value
        ? 'billing.errors.unauthorized'
        : 'billing.errors.unconfigured'
      return null
    }

    isRedeeming.value = true
    try {
      const result = await getConvexClient().action(api.billing.redeemCode, {
        code,
      })
      redeemResult.value = result
      successKey.value = result.alreadyRedeemed
        ? 'billing.redeem_already_active'
        : 'billing.redeem_success'
      await refreshAccess()
      return result
    } catch (error) {
      errorKey.value = getSafeBillingError(error)
      return null
    } finally {
      isRedeeming.value = false
    }
  }

  watch(
    [isConvexConfigured, isAuthenticated, isAuthLoading],
    () => {
      void refreshAccess()
    },
    { immediate: true },
  )

  return {
    access,
    canAccessProtected,
    canRedeem,
    canRestartTrial,
    canStartCheckout,
    errorKey,
    isAuthenticated,
    isAuthLoading,
    isConvexConfigured,
    isLifetimeDeal,
    lastVerifiedAt,
    isLoading,
    isRedeeming,
    isRestarting,
    isStartingCheckout,
    redeemCode,
    redeemResult,
    refreshAccess,
    restartTrial,
    startPurchase,
    status,
    successKey,
    trialRestartsRemaining,
  }
}
