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
      <span
        class="billing-status-pill"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <p class="billing-copy">{{ helperText }}</p>

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

const { t } = useI18n()
const redemptionCode = ref('')
const {
  access,
  canRedeem,
  errorKey,
  isLifetimeDeal,
  isRedeeming,
  redeemCode,
  status,
  successKey,
} = useBillingAccess()

const statusClass = computed(() => ({
  active: status.value === 'active',
  muted:
    status.value === 'unconfigured' ||
    status.value === 'signed_out' ||
    status.value === 'loading' ||
    status.value === 'bridge_unavailable',
  error: status.value === 'error',
}))

const statusLabel = computed(() => {
  if (status.value === 'active') {
        return isLifetimeDeal.value
      ? t('billing.status_lifetime_deal')
      : t('billing.status_active')
  }
  if (status.value === 'loading') return t('billing.status_loading')
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
  if (status.value === 'active') {
    return isLifetimeDeal.value
      ? t('billing.lifetime_deal_active_hint')
      : t('billing.active_hint')
  }
  return t('billing.free_hint')
})

const planLabel = computed(() => {
  if (isLifetimeDeal.value) return t('billing.plan_lifetime_deal')
  if (access.value?.status === 'active') return t('billing.plan_active')
  return t('billing.plan_free')
})

const showPlanDetails = computed(() => status.value === 'active' || status.value === 'free')
const showRedeemForm = computed(() =>
  status.value !== 'active' && status.value !== 'bridge_unavailable'
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
</script>

<style scoped>
.billing-panel {
  --billing-spacing-sm: var(--sg-space-0d5rem);
  --billing-spacing-md: var(--sg-space-0d75rem);
  --billing-spacing-lg: var(--sg-space-1rem);
  --billing-title-font-size: var(--sg-font-size-0d95rem);
  --billing-muted-bg: color-mix(in srgb, var(--sg-color-text-muted) 16%, transparent);
  --billing-error-bg: color-mix(in srgb, var(--sg-color-danger) 8%, transparent);
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

.billing-status-pill {
  flex: 0 0 auto;
  padding: var(--sg-space-0d3rem-0d55rem);
  border-radius: var(--sg-radius-pill);
  background: color-mix(in srgb, var(--sg-color-action) 12%, var(--sg-color-surface-raised) 88%);
  color: var(--sg-color-action);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 700;
  white-space: nowrap;
}

.billing-status-pill.muted {
  background: var(--billing-muted-bg);
  color: var(--sg-color-text-muted);
}

.billing-status-pill.error {
  background: var(--billing-error-bg);
  color: var(--sg-color-danger-text);
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

.billing-panel.is-narrow .billing-submit-btn {
  width: var(--sg-size-100pct);
}
</style>
