import { action, query } from './_generated/server'
import { makeFunctionReference } from 'convex/server'
import { v } from 'convex/values'
import { requireAuthUserId } from './authHelpers'

const getCurrentUser = makeFunctionReference<
  'query',
  Record<string, never>,
  { email?: string; emailVerificationTime?: number } | null
>('users:getMe')

/**
 * Suite entitlement bridge adapter.
 * - Canonical entitlement state is owned by the CommandGlows suite.
 * - Local tables are retained only as the active CommunityGlows entitlement cache.
 */

const PRODUCT_COMMUNITYGLOWS = 'communityglows'
const PLAN_LIFETIME_DEAL = 'lifetime_deal'
const PLAN_FOUNDER_LTD = 'founder_ltd'
const COMMUNITYGLOWS_OFFER_ID = 'communityglows/lifetime_deal'
const DEFAULT_COMMUNITYGLOWS_SITE_URL = 'https://communityglows.com'

type EntitlementSnapshot = {
  hasAccess: boolean
  globalUserId: string | null
  planId: string | null
  source: string | null
  reasonCode: string
  accessState?:
    | 'inactive'
    | 'trial_active'
    | 'trial_expired'
    | 'trial_exhausted'
    | 'lifetime_active'
  trialStartedAt?: number | null
  trialEndsAt?: number | null
  trialExpiresAt?: number | null
  trialAttempt?: number | null
  trialRestartsRemaining?: number
  trialRestartEligible?: boolean
  entitlementGrantedAt?: number | null
  entitlementUpdatedAt?: number | null
  knownInstallationCount?: number
  includedAccess?: string[]
}

type BridgeResponseOk<T extends Record<string, unknown> = Record<string, unknown>> = {
  status: 'ok'
  snapshot?: EntitlementSnapshot
  checkoutIdentityToken?: string
  redemption?: {
    hasAccess: boolean
    planId: string | null
    source: string | null
    reasonCode?: string
    alreadyRedeemed?: boolean
  }
  result?: T
}

type BridgeResponseFailure = {
  status: 'error' | 'unavailable'
  error: string
}

declare const process: {
  env: Record<string, string | undefined>
}

function requireAdminSecret(secret: string) {
  const configured = process.env.COMMUNITYGLOWS_BILLING_ADMIN_SECRET
  if (!configured || secret !== configured) {
    throw new Error('Unauthorized billing admin action')
  }
}

function getSuiteBridgeUrl(raw: string | undefined): string {
  if (!raw) {
    throw new Error('suite_bridge_not_configured')
  }

  const normalized = raw.trim().replace(/\/$/, '')
  if (!normalized) {
    throw new Error('suite_bridge_not_configured')
  }

  if (normalized.endsWith('/api/bridge/communityglows')) {
    return normalized
  }

  return `${normalized}/api/bridge/communityglows`
}

function getSuiteBridgeSecret() {
  const secret = process.env.COMMUNITYGLOWS_SUITE_BRIDGE_SECRET
  if (!secret) {
    throw new Error('suite_bridge_not_configured')
  }
  return secret
}

function getSuiteRequestHeaders(additional: Record<string, string> = {}): Record<string, string> {
  const bypassSecret = process.env.COMMUNITYGLOWS_SUITE_BYPASS_SECRET?.trim()
  return {
    'Content-Type': 'application/json',
    ...(bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {}),
    ...additional,
  }
}

function getSuiteCommerceCheckoutUrl(): string {
  const bridgeUrl = new URL(getSuiteBridgeUrl(process.env.COMMUNITYGLOWS_SUITE_BRIDGE_URL))
  return new URL('/api/commerce/checkout', bridgeUrl.origin).toString()
}

function getCommunityGlowsSiteUrl(): string {
  const configured = process.env.COMMUNITYGLOWS_PUBLIC_SITE_URL?.trim()
  try {
    return new URL(configured || DEFAULT_COMMUNITYGLOWS_SITE_URL).origin
  } catch {
    return DEFAULT_COMMUNITYGLOWS_SITE_URL
  }
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '-')
}

function mapBridgeError(message: string) {
  if (/trial_restart_not_eligible|trial_exhausted|restart_limit/i.test(message)) {
    return 'trial_restart_not_eligible'
  }
  if (/checkout.*not configured|stripe.*not configured|missing.*price/i.test(message)) {
    return 'checkout_not_configured'
  }
  if (/invalid_payload|missing|provider_account_id_required|code_required/i.test(message)) {
    return 'invalid_payload'
  }
  if (/code_not_found/i.test(message)) return 'not_found'
  if (/code_disabled|already_disabled/i.test(message)) return 'disabled'
  if (/code_already_used|already_redeemed/i.test(message)) return 'used'
  if (/account_retention_not_found/i.test(message)) return 'account_retention_not_found'
  if (/account_email_mismatch/i.test(message)) return 'account_email_mismatch'
  if (/provider_account_deleted/i.test(message)) return 'provider_account_deleted'
  if (/unauthorized|not authenticated|authentication/i.test(message)) {
    return 'unauthorized'
  }
  if (/not_configured|unavailable|failed|bridge_secret_not_configured|invalid_communityglows_bridge_secret|bridge_secret_mismatch/i.test(message)) {
    return 'bridge_not_configured'
  }
  return 'generic'
}

function normalizePlan(planId?: string | null) {
  return planId || PLAN_LIFETIME_DEAL
}

function isAllowedPlanForCommunityGlows(planId: string) {
  return planId === PLAN_LIFETIME_DEAL || planId === PLAN_FOUNDER_LTD
}

export type SuiteBridgeArgs = {
  operation:
    | 'snapshot'
    | 'restart_trial'
    | 'redeem_code'
    | 'manual_grant'
    | 'revoke'
    | 'refund'
    | 'disable_code'
    | 'upsert_code'
    | 'prepare_account_deletion'
    | 'relink_account'
  providerAccountId?: string
  code?: string
  plan?: string
  source?: string
  reason?: string
  email?: string
  sourceRef?: string
  status?: string
  installationHash?: string
}

export async function callSuiteBridge<T extends Record<string, unknown> = Record<string, unknown>>(
  args: SuiteBridgeArgs,
): Promise<BridgeResponseOk<T>> {
  const suiteBridgeUrl = getSuiteBridgeUrl(process.env.COMMUNITYGLOWS_SUITE_BRIDGE_URL)
  const suiteBridgeSecret = getSuiteBridgeSecret()

  let response: Response
  try {
    response = await fetch(suiteBridgeUrl, {
      method: 'POST',
      headers: getSuiteRequestHeaders({
        'x-communityglows-suite-secret': suiteBridgeSecret,
      }),
      body: JSON.stringify({
        ...args,
        email: args.email,
        sourceRef: args.sourceRef,
      }),
    })
  } catch (error) {
    throw Object.assign(new Error(`bridge_request_failed: ${error instanceof Error ? error.message : 'network_error'}`), { cause: error })
  }

  let payload: BridgeResponseOk<T> | BridgeResponseFailure
  try {
    payload = (await response.json()) as BridgeResponseOk<T> | BridgeResponseFailure
  } catch {
    throw new Error('bridge_malformed_response')
  }

  if (!response.ok || payload.status !== 'ok') {
    const mappedError = payload && typeof payload === 'object' && 'error' in payload
      ? mapBridgeError(payload.error)
      : `bridge_http_${response.status}`
    throw new Error(mappedError)
  }

  return payload
}

async function createSuiteCheckout(checkoutIdentityToken: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(getSuiteCommerceCheckoutUrl(), {
      method: 'POST',
      headers: getSuiteRequestHeaders(),
      body: JSON.stringify({
        offerId: COMMUNITYGLOWS_OFFER_ID,
        provider: 'stripe',
        source: 'direct',
        sourceRef: 'communityglows-app',
        identityToken: checkoutIdentityToken,
        successUrl: `${getCommunityGlowsSiteUrl()}/purchase/success?offerId=${encodeURIComponent(COMMUNITYGLOWS_OFFER_ID)}`,
        cancelUrl: `${getCommunityGlowsSiteUrl()}/purchase/cancel?offerId=${encodeURIComponent(COMMUNITYGLOWS_OFFER_ID)}`,
      }),
    })
  } catch (error) {
    throw Object.assign(new Error(`checkout_request_failed: ${error instanceof Error ? error.message : 'network_error'}`), { cause: error })
  }

  let payload: { checkoutUrl?: unknown; message?: unknown }
  try {
    payload = await response.json() as { checkoutUrl?: unknown; message?: unknown }
  } catch {
    throw new Error('checkout_malformed_response')
  }

  if (!response.ok || typeof payload.checkoutUrl !== 'string' || !payload.checkoutUrl.trim()) {
    const message = typeof payload.message === 'string' ? payload.message : `checkout_http_${response.status}`
    throw new Error(mapBridgeError(message))
  }

  return payload.checkoutUrl.trim()
}

function normalizeProductAccess(snapshot: EntitlementSnapshot) {
  const trialEndsAt = snapshot.trialEndsAt ?? snapshot.trialExpiresAt ?? null
  const normalizedAccessState = snapshot.accessState ?? (
    snapshot.planId === 'trial'
      ? (typeof trialEndsAt === 'number' && trialEndsAt > Date.now() ? 'trial_active' : 'trial_expired')
      : undefined
  )
  const trialAttempt = typeof snapshot.trialAttempt === 'number' ? snapshot.trialAttempt : null
  const trialRestartsRemaining = typeof snapshot.trialRestartsRemaining === 'number'
    ? Math.max(0, Math.min(2, snapshot.trialRestartsRemaining))
    : 0
  const trialRestartEligible = snapshot.trialRestartEligible === true
  const isLifetime = snapshot.hasAccess && snapshot.planId != null &&
    isAllowedPlanForCommunityGlows(snapshot.planId)
  const hasTrustedTrialWindow =
    typeof snapshot.trialStartedAt === 'number' &&
    typeof trialEndsAt === 'number' &&
    snapshot.trialStartedAt < trialEndsAt
  const trialFields = {
    trialStartedAt: snapshot.trialStartedAt ?? null,
    trialEndsAt,
    trialAttempt,
    trialRestartsRemaining,
    trialRestartEligible,
    entitlementGrantedAt:
      typeof snapshot.entitlementGrantedAt === 'number'
        ? snapshot.entitlementGrantedAt
        : null,
    entitlementUpdatedAt:
      typeof snapshot.entitlementUpdatedAt === 'number'
        ? snapshot.entitlementUpdatedAt
        : null,
    knownInstallationCount:
      typeof snapshot.knownInstallationCount === 'number'
        ? Math.max(0, Math.floor(snapshot.knownInstallationCount))
        : 0,
    includedAccess: Array.isArray(snapshot.includedAccess)
      ? snapshot.includedAccess.filter(
          (entry) => entry === 'communityglows_protected_features'
        )
      : [],
  }

  if (normalizedAccessState === 'trial_active') {
    if (!snapshot.hasAccess || !hasTrustedTrialWindow || trialEndsAt! <= Date.now()) {
      return {
        productId: PRODUCT_COMMUNITYGLOWS,
        planId: 'trial',
        status: 'inactive' as const,
        accessState: 'trial_expired' as const,
        source: snapshot.source ?? 'suite',
        entitlementId: null,
        expiresAt: trialEndsAt,
        legacyFallback: false,
        reasonCode: hasTrustedTrialWindow ? 'trial_expired' : 'trial_window_unverified',
        ...trialFields,
        trialRestartEligible: false,
      }
    }

    return {
      productId: PRODUCT_COMMUNITYGLOWS,
      planId: snapshot.planId ?? 'trial',
      status: 'active' as const,
      accessState: 'trial_active' as const,
      source: snapshot.source ?? 'suite',
      entitlementId: null,
      expiresAt: trialEndsAt!,
      legacyFallback: false,
      reasonCode: snapshot.reasonCode || 'trial_active',
      ...trialFields,
      trialRestartEligible: false,
    }
  }

  if (normalizedAccessState === 'trial_expired' || normalizedAccessState === 'trial_exhausted') {
    return {
      productId: PRODUCT_COMMUNITYGLOWS,
      planId: snapshot.planId ?? 'trial',
      status: 'inactive' as const,
      accessState: normalizedAccessState,
      source: snapshot.source ?? 'suite',
      entitlementId: null,
      expiresAt: trialEndsAt,
      legacyFallback: false,
      reasonCode: snapshot.reasonCode || normalizedAccessState,
      ...trialFields,
      trialRestartEligible: normalizedAccessState === 'trial_expired' && trialRestartEligible,
    }
  }

  if (!snapshot.hasAccess) {
    return {
      productId: PRODUCT_COMMUNITYGLOWS,
      planId: snapshot.planId,
      status: 'inactive' as const,
      source: snapshot.source ?? 'suite',
      entitlementId: null,
      expiresAt: null,
      legacyFallback: false,
      accessState: 'inactive' as const,
      reasonCode: snapshot.reasonCode,
      ...trialFields,
      trialRestartEligible: false,
    }
  }

  if (!isLifetime) {
    throw new Error('unverified_access_state')
  }

  return {
    productId: PRODUCT_COMMUNITYGLOWS,
    planId: snapshot.planId,
    status: 'active' as const,
    source: snapshot.source ?? 'manual',
    entitlementId: null,
    expiresAt: null,
    legacyFallback: false,
    accessState: 'lifetime_active' as const,
    reasonCode: snapshot.reasonCode,
    ...trialFields,
    trialRestartEligible: false,
  }
}

async function getSuiteAccessForUser(
  userId: string,
  operation: 'snapshot' | 'restart_trial',
  installationHash: string,
  email?: string,
) {
  const response = await callSuiteBridge({
    operation,
    providerAccountId: userId,
    sourceRef: userId,
    installationHash,
    email,
  })
  if (!response.snapshot) throw new Error('invalid_snapshot')
  return { access: normalizeProductAccess(response.snapshot), checkoutIdentityToken: response.checkoutIdentityToken }
}

export const getProductAccess = action({
  args: {
    productId: v.optional(v.string()),
    installationHash: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx)
    const user = await ctx.runQuery(getCurrentUser, {})
    return (await getSuiteAccessForUser(userId, 'snapshot', args.installationHash, user?.email)).access
  },
})

export const restartTrial = action({
  args: { installationHash: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx)
    const user = await ctx.runQuery(getCurrentUser, {})
    const access = (await getSuiteAccessForUser(userId, 'restart_trial', args.installationHash, user?.email)).access
    if (access.accessState !== 'trial_active') {
      throw new Error('trial_restart_not_eligible')
    }
    return access
  },
})

export const startCheckout = action({
  args: { installationHash: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx)
    const user = await ctx.runQuery(getCurrentUser, {})
    const response = await getSuiteAccessForUser(userId, 'snapshot', args.installationHash, user?.email)
    if (!response.checkoutIdentityToken) throw new Error('checkout_handoff_unavailable')
    return {
      provider: 'stripe' as const,
      checkoutUrl: await createSuiteCheckout(response.checkoutIdentityToken),
    }
  },
})

export const redeemCode = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx)
    const user = await ctx.runQuery(getCurrentUser, {})
    const code = normalizeCode(args.code)
    if (!code) {
      throw new Error('code_required')
    }

    const response = await callSuiteBridge({
      operation: 'redeem_code',
      providerAccountId: userId,
      code,
      email: user?.email,
      sourceRef: userId,
    })

    const redemption = response.redemption
    if (!redemption) {
      throw new Error('bridge_response_missing_redemption')
    }

    return {
      productId: PRODUCT_COMMUNITYGLOWS,
      planId: redemption.planId,
      status: redemption.hasAccess ? ('active' as const) : ('inactive' as const),
      source: redemption.source ?? 'manual',
      entitlementId: null,
      expiresAt: null,
      alreadyRedeemed: Boolean(redemption.alreadyRedeemed),
      reasonCode: redemption.reasonCode,
    }
  },
})

export const relinkRetainedAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx)
    const user = await ctx.runQuery(getCurrentUser, {})
    if (!user?.email || !user.emailVerificationTime) {
      return { relinked: false, reason: 'verified_email_required' as const }
    }
    try {
      const response = await callSuiteBridge<{ status?: string }>({
        operation: 'relink_account',
        providerAccountId: userId,
        email: user.email,
      })
      return {
        relinked: response.result?.status === 'relinked' || response.result?.status === 'already_relinked',
        reason: response.result?.status ?? 'not_relinked',
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'account_retention_not_found') {
        return { relinked: false, reason: 'no_retained_account' as const }
      }
      throw error
    }
  },
})

export const adminUpsertRedemptionCode = action({
  args: {
    adminSecret: v.string(),
    code: v.string(),
    productId: v.optional(v.string()),
    planId: v.optional(v.string()),
    source: v.optional(
      v.union(
        v.literal('appsumo'),
        v.literal('direct'),
        v.literal('legacy'),
        v.literal('manual'),
        v.literal('partner'),
      ),
    ),
    status: v.optional(v.union(v.literal('available'), v.literal('disabled'))),
    sourceRef: v.optional(v.string()),
    externalOrderId: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    requireAdminSecret(args.adminSecret)
    const code = normalizeCode(args.code)
    if (!code) {
      throw new Error('code_required')
    }
    if (args.productId && args.productId !== PRODUCT_COMMUNITYGLOWS) {
      throw new Error('product_not_allowed')
    }
    if (args.planId && !isAllowedPlanForCommunityGlows(normalizePlan(args.planId))) {
      throw new Error('plan_not_allowed')
    }

    const response = await callSuiteBridge<{ created?: boolean }>( {
      operation: 'upsert_code',
      code,
      plan: normalizePlan(args.planId),
      source: args.source,
      status: args.status,
      sourceRef: args.sourceRef ?? args.externalOrderId,
    })

    return {
      created: response.result?.created ?? true,
      suiteResponseStatus: response.status,
      planId: normalizePlan(args.planId),
      source: args.source ?? 'manual',
    }
  },
})

export const adminManualGrantCommunityGlowsAccess = action({
  args: {
    adminSecret: v.string(),
    providerAccountId: v.string(),
    planId: v.optional(v.string()),
    source: v.optional(
      v.union(
        v.literal('appsumo'),
        v.literal('direct'),
        v.literal('legacy'),
        v.literal('manual'),
        v.literal('partner'),
      ),
    ),
    sourceRef: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    requireAdminSecret(args.adminSecret)
    const planId = normalizePlan(args.planId)
    if (!isAllowedPlanForCommunityGlows(planId)) {
      throw new Error('plan_not_allowed')
    }

    const response = await callSuiteBridge<{ alreadyGranted?: boolean }>(
      {
        operation: 'manual_grant',
        providerAccountId: args.providerAccountId,
        plan: planId,
        source: args.source ?? 'manual',
        sourceRef: args.sourceRef,
      },
    )

    return {
      alreadyActive: response.result?.alreadyGranted ?? false,
      source: response.result?.alreadyGranted ? 'reopened' : 'created',
      suiteResponseStatus: response.status,
    }
  },
})

export const adminRevokeCommunityGlowsAccess = action({
  args: {
    adminSecret: v.string(),
    providerAccountId: v.string(),
    sourceRef: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    requireAdminSecret(args.adminSecret)
    const response = await callSuiteBridge<{ status?: 'already_revoked' | 'ok'; hasAccess?: boolean }>(
      {
        operation: 'revoke',
        providerAccountId: args.providerAccountId,
        reason: args.reason,
        sourceRef: args.sourceRef,
      },
    )

    return {
      alreadyRevoked: response.result?.status === 'already_revoked',
      suiteResponseStatus: response.status,
      reason: args.reason,
    }
  },
})

export const adminRefundCommunityGlowsAccess = action({
  args: {
    adminSecret: v.string(),
    providerAccountId: v.string(),
    sourceRef: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    requireAdminSecret(args.adminSecret)
    const response = await callSuiteBridge<{ status?: 'already_revoked' | 'ok'; hasAccess?: boolean }>(
      {
        operation: 'refund',
        providerAccountId: args.providerAccountId,
        reason: args.reason,
        sourceRef: args.sourceRef,
      },
    )

    return {
      alreadyRevoked: response.result?.status === 'already_revoked',
      suiteResponseStatus: response.status,
      reason: args.reason,
    }
  },
})

export const getLocalBillingMigrationSummary = query({
  args: {
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    requireAdminSecret(args.adminSecret)

    const [entitlements, redemptionCodes, billingEvents, subscriptions] = await Promise.all(
      [
        ctx.db.query('entitlements').collect(),
        ctx.db.query('redemptionCodes').collect(),
        ctx.db.query('billingEvents').collect(),
        ctx.db.query('subscriptions').collect(),
      ],
    )

    return {
      status: 'local_compat_only',
      totals: {
        entitlements: entitlements.length,
        redemptionCodes: redemptionCodes.length,
        billingEvents: billingEvents.length,
        subscriptions: subscriptions.length,
      },
      source: {
        entitlements: entitlements.map((entry) => ({
          planId: entry.planId,
          status: entry.status,
          productId: entry.productId,
        })),
        redemptionCodes: redemptionCodes.map((entry) => ({
          status: entry.status,
          source: entry.source,
          planId: entry.planId,
        })),
        billingEvents: billingEvents.slice(0, 25).map((entry) => ({
          productId: entry.productId,
          eventType: entry.eventType,
          planId: entry.planId ?? null,
        })),
      },
      migrationNotes: {
        notes: [
          'Local tables are read-only migration inputs; no deletions performed.',
          `Entitlements table rows: ${entitlements.length}`,
          `Redemption code rows: ${redemptionCodes.length}`,
        ],
      },
    }
  },
})
