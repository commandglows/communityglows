<template>
  <section
    class="billing-panel"
    :class="{ 'is-narrow': isBillingNarrow }"
  >
    <div class="billing-panel-header">
      <div class="billing-title-row">
        <SgIcon icon="pi pi-key" />
        <h3>{{ $t('billing.title') }}</h3>
      </div>
      <SgStatusPill
        :text="statusLabel"
        :tone="statusTone"
      />
    </div>

    <p class="billing-copy">{{ helperText }}</p>

    <div
      v-if="status === 'trial_active'"
      class="billing-trial-summary"
    >
      <div>
        <strong>{{ trialTimeLabel }}</strong>
        <span>{{ trialEndLabel }}</span>
      </div>
      <div
        class="billing-progress"
        role="progressbar"
        :aria-label="$t('billing.trial_progress_label')"
        :aria-valuenow="trialProgress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span :style="{ width: `${trialProgress}%` }" />
      </div>
      <p class="billing-recovery-note">{{ restartAllowanceLabel }}</p>
    </div>

    <div
      v-if="status === 'trial_expired' || status === 'trial_exhausted'"
      class="billing-recovery"
    >
      <p>{{ $t('billing.expired_data_safe') }}</p>
      <p>{{ restartAllowanceLabel }}</p>
      <div class="billing-actions">
        <button
          v-if="canRestartTrial"
          class="billing-action primary"
          type="button"
          :disabled="isRestarting"
          @click="restart"
        >
          <SgIcon :icon="isRestarting ? 'pi pi-spin pi-spinner' : 'pi pi-replay'" />
          {{ isRestarting ? $t('billing.restarting_trial') : $t('billing.restart_trial') }}
        </button>
        <button
          class="billing-action"
          :class="{ primary: !canRestartTrial }"
          type="button"
          :disabled="!canStartCheckout"
          @click="purchase"
        >
          <SgIcon :icon="isStartingCheckout ? 'pi pi-spin pi-spinner' : 'pi pi-credit-card'" />
          {{ isStartingCheckout ? $t('billing.opening_checkout') : $t('billing.buy_lifetime') }}
        </button>
        <button
          class="billing-action"
          type="button"
          :disabled="isLoading"
          @click="retryAccess"
        >
          <SgIcon :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
          {{ $t('billing.retry_access') }}
        </button>
        <a
          class="billing-action"
          href="mailto:support@communityglows.com"
        >
          <SgIcon icon="pi pi-envelope" />
          {{ $t('billing.contact_support') }}
        </a>
      </div>
      <p class="billing-recovery-note">{{ $t('billing.recovery_paths_available') }}</p>
    </div>

    <div
      v-if="status === 'bridge_unavailable'"
      class="billing-bridge-state"
      :class="{ grace: canAccessProtected }"
    >
      <SgIcon :icon="canAccessProtected ? 'pi pi-calendar' : 'pi pi-cloud'" />
      <div>
        <strong>{{ canAccessProtected ? $t('billing.grace_title') : $t('billing.bridge_blocked_title') }}</strong>
        <p>{{ canAccessProtected ? $t('billing.grace_hint') : $t('billing.bridge_blocked_hint') }}</p>
      </div>
      <button
        class="billing-action"
        type="button"
        :disabled="isLoading"
        @click="retryAccess"
      >
        <SgIcon :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
        {{ $t('billing.retry_access') }}
      </button>
    </div>

    <div
      v-if="showPlanDetails"
      class="billing-plan-row"
    >
      <span>{{ $t('billing.current_plan') }}</span>
      <strong>{{ planLabel }}</strong>
    </div>

    <form
      v-if="showRedeemForm"
      class="billing-redeem-form"
      @submit.prevent="submitRedeem"
    >
      <label
        class="billing-input-label"
        for="billing-redemption-code"
      >
        {{ $t('billing.code_label') }}
      </label>
      <div class="billing-input-row">
        <input
          id="billing-redemption-code"
          v-model="redemptionCode"
          class="billing-input"
          type="text"
          autocomplete="one-time-code"
          autocapitalize="characters"
          spellcheck="false"
          :placeholder="$t('billing.code_placeholder')"
          :disabled="inputDisabled"
        />
        <button
          class="billing-submit-btn"
          type="submit"
          :disabled="submitDisabled"
        >
          <SgIcon
            v-if="isRedeeming"
            icon="pi pi-spin pi-spinner"
          />
          <span>{{ isRedeeming ? $t('billing.redeeming') : $t('billing.redeem_button') }}</span>
        </button>
      </div>
    </form>

    <p
      v-if="successKey"
      class="billing-message success"
    >
      <SgIcon icon="pi pi-check-circle" />
      {{ $t(successKey) }}
    </p>
    <p
      v-else-if="errorKey"
      class="billing-message error"
    >
      <SgIcon icon="pi pi-exclamation-circle" />
      {{ $t(errorKey) }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingAccess } from '@/composables/useBillingAccess'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import SgStatusPill from './ui/SgStatusPill.vue'

const { t } = useI18n()
const redemptionCode = ref('')
const {
  access,
  canRedeem,
  canRestartTrial,
  canStartCheckout,
  errorKey,
  isLifetimeDeal,
  isLoading,
  isRedeeming,
  isRestarting,
  isStartingCheckout,
  redeemCode,
  refreshAccess,
  restartTrial,
  startPurchase,
  status,
  successKey,
  canAccessProtected,
  trialRestartsRemaining,
} = useBillingAccess()

const DAY_MS = 24 * 60 * 60 * 1000

const statusTone = computed<'default' | 'muted' | 'error'>(() => {
  if (status.value === 'unconfigured' || status.value === 'signed_out' || status.value === 'loading' || status.value === 'bridge_unavailable') {
    return 'muted'
  }
  if (status.value === 'error' || status.value === 'trial_expired' || status.value === 'trial_exhausted') {
    return 'error'
  }
  return 'default'
})

const statusLabel = computed(() => {
  if (status.value === 'active') {
        return isLifetimeDeal.value
      ? t('billing.status_lifetime_deal')
      : t('billing.status_active')
  }
  if (status.value === 'loading') return t('billing.status_loading')
  if (status.value === 'trial_active') return t('billing.status_trial_active')
  if (status.value === 'trial_expired') return t('billing.status_trial_expired')
  if (status.value === 'trial_exhausted') return t('billing.status_trial_exhausted')
  if (status.value === 'lifetime_active') return t('billing.status_lifetime_active')
  if (status.value === 'bridge_unavailable') return t('billing.status_bridge_unavailable')
  if (status.value === 'signed_out') return t('billing.status_signed_out')
  if (status.value === 'unconfigured') return t('billing.status_unconfigured')
  if (status.value === 'error') return t('billing.status_error')
  return t('billing.status_free')
})

const isBillingNarrow = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.billingCompact}px)`)

const helperText = computed(() => {
  if (status.value === 'unconfigured') return t('billing.unconfigured_hint')
  if (status.value === 'signed_out') return t('billing.signed_out_hint')
  if (status.value === 'loading') return t('billing.loading_hint')
  if (status.value === 'bridge_unavailable') return t('billing.bridge_unavailable_hint')
  if (status.value === 'trial_active') return t('billing.trial_active_hint')
  if (status.value === 'trial_expired') return t('billing.trial_expired_hint')
  if (status.value === 'trial_exhausted') return t('billing.trial_exhausted_hint')
  if (status.value === 'lifetime_active') return t('billing.lifetime_active_hint')
  if (status.value === 'active') {
    return isLifetimeDeal.value
      ? t('billing.lifetime_deal_active_hint')
      : t('billing.active_hint')
  }
  return t('billing.free_hint')
})

const planLabel = computed(() => {
  if (status.value === 'trial_active') return t('billing.plan_trial')
  if (status.value === 'trial_expired') return t('billing.plan_trial_expired')
  if (status.value === 'trial_exhausted') return t('billing.plan_trial_exhausted')
  if (status.value === 'lifetime_active' || isLifetimeDeal.value) return t('billing.plan_lifetime_deal')
  if (access.value?.status === 'active') return t('billing.plan_active')
  return t('billing.plan_free')
})

const showPlanDetails = computed(() =>
  status.value === 'active' ||
  status.value === 'free' ||
  status.value === 'trial_active' ||
  status.value === 'trial_expired' ||
  status.value === 'trial_exhausted' ||
  status.value === 'lifetime_active',
)
const showRedeemForm = computed(() =>
  status.value !== 'active' &&
  status.value !== 'lifetime_active' &&
  status.value !== 'bridge_unavailable'
)
const inputDisabled = computed(() => !canRedeem.value || isRedeeming.value)
const submitDisabled = computed(
  () => !redemptionCode.value.trim() || inputDisabled.value,
)

async function submitRedeem() {
  const result = await redeemCode(redemptionCode.value)
  if (result?.status === 'active') {
    redemptionCode.value = ''
  }
}

const trialDaysRemaining = computed(() => {
  const trialEndsAt = access.value?.trialEndsAt
  if (typeof trialEndsAt !== 'number') return 0
  return Math.max(0, Math.ceil((trialEndsAt - Date.now()) / DAY_MS))
})

const trialTimeLabel = computed(() => t('billing.trial_days_remaining', {
  count: trialDaysRemaining.value,
}))

const restartAllowanceLabel = computed(() => trialRestartsRemaining.value > 0
  ? t('billing.restarts_remaining', { count: trialRestartsRemaining.value })
  : t('billing.restarts_exhausted'))

const trialEndLabel = computed(() => {
  const trialEndsAt = access.value?.trialEndsAt
  if (typeof trialEndsAt !== 'number') return ''
  return t('billing.trial_ends_on', {
    date: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(trialEndsAt),
  })
})

const trialProgress = computed(() => {
  const startedAt = access.value?.trialStartedAt
  const endsAt = access.value?.trialEndsAt
  if (typeof startedAt !== 'number' || typeof endsAt !== 'number' || endsAt <= startedAt) return 0
  return Math.round(Math.max(0, Math.min(1, (endsAt - Date.now()) / (endsAt - startedAt))) * 100)
})

function retryAccess() {
  void refreshAccess()
}

function restart() {
  void restartTrial()
}

function purchase() {
  if (canStartCheckout.value) void startPurchase()
}
</script>

<style scoped>
.billing-panel {
  --billing-spacing-sm: var(--sg-space-0d5rem);
  --billing-spacing-md: var(--sg-space-0d75rem);
  --billing-spacing-lg: var(--sg-space-1rem);
  --billing-title-font-size: var(--sg-font-size-0d95rem);
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d8rem);
  padding: calc(var(--sg-space-0d75rem) + var(--sg-space-0d25rem));
  margin-bottom: var(--sg-space-1rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  background: color-mix(in srgb, var(--sg-color-surface-raised) 92%, var(--sg-color-surface-muted) 8%);
}

.billing-panel-header,
.billing-title-row,
.billing-plan-row,
.billing-input-row,
.billing-message {
  display: flex;
  align-items: center;
}

.billing-panel-header {
  justify-content: space-between;
  gap: var(--sg-space-0d75rem);
}

.billing-title-row {
  gap: var(--sg-space-0d55rem);
  min-width: 0;
}

.billing-title-row :deep(.sg-icon) {
  color: var(--sg-color-action);
  font-size: var(--billing-title-font-size);
}

.billing-title-row h3 {
  margin: 0;
  color: var(--sg-color-text);
  font-size: var(--billing-title-font-size);
  line-height: var(--sg-line-height-1d2);
}

.billing-copy {
  margin: 0;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d82rem);
  line-height: var(--sg-line-height-1d45);
}

.billing-plan-row {
  justify-content: space-between;
  gap: var(--billing-spacing-md);
  padding: calc(var(--sg-space-0d5rem) + var(--sg-space-0d25rem)) var(--sg-space-0d75rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d82rem);
}

.billing-plan-row strong {
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d82rem);
  text-align: right;
}

.billing-trial-summary,
.billing-recovery,
.billing-bridge-state {
  padding: var(--billing-spacing-lg);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  background: var(--sg-color-surface-muted);
}

.billing-trial-summary > div:first-child {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--billing-spacing-md);
}

.billing-trial-summary strong,
.billing-bridge-state strong {
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d85rem);
}

.billing-trial-summary span,
.billing-recovery-note,
.billing-bridge-state p {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
}

.billing-progress {
  height: var(--sg-space-0d3rem);
  margin-top: var(--billing-spacing-md);
  overflow: hidden;
  border-radius: var(--sg-radius-pill);
  background: color-mix(in srgb, var(--sg-color-text-muted) 16%, transparent);
}

.billing-progress span {
  display: block;
  height: var(--sg-size-full);
  border-radius: inherit;
  background: var(--sg-color-action);
}

.billing-recovery {
  border-color: color-mix(in srgb, var(--sg-color-danger) 24%, var(--sg-color-border));
}

.billing-recovery > p {
  margin: 0;
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d82rem);
  line-height: var(--sg-line-height-1d45);
}

.billing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--billing-spacing-sm);
  margin-top: var(--billing-spacing-md);
}

.billing-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d45rem);
  min-height: var(--sg-size-2d45rem);
  padding: var(--sg-space-0d5rem) var(--sg-space-0d75rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
  font-size: var(--sg-font-size-0d82rem);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.billing-action.primary {
  border-color: var(--sg-color-action);
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
}

.billing-action:disabled {
  cursor: default;
  opacity: 0.55;
}

.billing-recovery .billing-recovery-note {
  margin-top: var(--billing-spacing-md);
  color: var(--sg-color-text-muted);
}

.billing-bridge-state {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--billing-spacing-md);
}

.billing-bridge-state > :deep(.sg-icon) {
  color: var(--sg-color-danger);
}

.billing-bridge-state.grace > :deep(.sg-icon) {
  color: var(--sg-color-action);
}

.billing-bridge-state p {
  margin: var(--sg-space-0d25rem) 0 0;
  line-height: var(--sg-line-height-1d4);
}

.billing-redeem-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d45rem);
}

.billing-input-label {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 600;
}

.billing-input-row {
  gap: var(--sg-space-0d55rem);
}

.billing-input {
  flex: 1 1 auto;
  min-width: 0;
  width: var(--sg-size-100pct);
  padding: calc(var(--sg-space-0d5rem) + var(--sg-space-0d25rem)) var(--sg-space-0d75rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  outline: none;
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d9rem);
  box-sizing: border-box;
}

.billing-input:focus {
  border-color: var(--sg-color-action);
}

.billing-submit-btn {
  flex: 0 0 auto;
  min-height: var(--sg-size-2d45rem);
  padding: calc(var(--sg-space-0d5rem) + var(--sg-space-0d25rem)) var(--sg-space-0d75rem);
  border: none;
  border-radius: var(--sg-radius-lg);
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  font-size: var(--sg-font-size-0d85rem);
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d45rem);
}

.billing-submit-btn:disabled {
  cursor: default;
  opacity: 0.55;
}

.billing-message {
  gap: var(--sg-space-0d45rem);
  margin: 0;
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-line-height-1d4);
}

.billing-message.success {
  color: var(--sg-color-success);
}

.billing-message.error {
  color: var(--sg-color-danger);
}

.billing-panel.is-narrow {
  padding: var(--sg-space-0d9rem);
}

.billing-panel.is-narrow .billing-panel-header {
  align-items: flex-start;
}

.billing-panel.is-narrow .billing-input-row {
  align-items: stretch;
  flex-direction: column;
}

.billing-panel.is-narrow .billing-trial-summary > div:first-child,
.billing-panel.is-narrow .billing-bridge-state {
  align-items: flex-start;
  grid-template-columns: 1fr;
  flex-direction: column;
}

.billing-panel.is-narrow .billing-actions,
.billing-panel.is-narrow .billing-action {
  width: var(--sg-size-100pct);
}

.billing-panel.is-narrow .billing-submit-btn {
  width: var(--sg-size-100pct);
}
</style>
