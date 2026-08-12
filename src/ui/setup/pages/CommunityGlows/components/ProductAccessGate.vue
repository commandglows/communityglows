<template>
  <main class="product-access-gate" aria-labelledby="product-access-gate-title">
    <section class="product-access-card">
      <SgIcon icon="pi pi-lock" class="product-access-icon" />
      <p class="product-access-eyebrow">{{ $t('billing.title') }}</p>
      <h1 id="product-access-gate-title">{{ $t(titleKey) }}</h1>
      <p class="product-access-copy">{{ $t(messageKey) }}</p>
      <p v-if="isTrialDecision" class="product-access-copy">{{ restartAllowanceLabel }}</p>

      <div class="product-access-actions">
        <button
          v-if="canRestartTrial"
          class="product-access-primary"
          type="button"
          :disabled="isRestarting"
          @click="restart"
        >
          <SgIcon :icon="isRestarting ? 'pi pi-spin pi-spinner' : 'pi pi-replay'" />
          {{ isRestarting ? $t('billing.restarting_trial') : $t('billing.restart_trial') }}
        </button>
        <button
          :class="canRestartTrial ? 'product-access-secondary' : 'product-access-primary'"
          type="button"
          :disabled="!canStartCheckout"
          @click="purchase"
        >
          <SgIcon :icon="isStartingCheckout ? 'pi pi-spin pi-spinner' : 'pi pi-credit-card'" />
          {{ isStartingCheckout ? $t('billing.opening_checkout') : $t('billing.buy_lifetime') }}
        </button>
        <button class="product-access-secondary" type="button" :disabled="isLoading" @click="retry">
          <SgIcon :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
          {{ $t('billing.retry_access') }}
        </button>
        <a class="product-access-secondary" href="mailto:support@communityglows.com">
          {{ $t('billing.contact_support') }}
        </a>
      </div>

      <p class="product-access-recovery">{{ $t('billing.recovery_paths_available') }}</p>
      <p v-if="successKey" class="product-access-feedback success">{{ $t(successKey) }}</p>
      <p v-else-if="errorKey" class="product-access-feedback error">{{ $t(errorKey) }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingAccess } from '@/composables/useBillingAccess'

const { t } = useI18n()
const {
  canRestartTrial,
  canStartCheckout,
  errorKey,
  isLoading,
  isRestarting,
  isStartingCheckout,
  refreshAccess,
  restartTrial,
  startPurchase,
  status,
  successKey,
  trialRestartsRemaining,
} = useBillingAccess()
const isTrialDecision = computed(() =>
  status.value === 'trial_expired' || status.value === 'trial_exhausted')
const titleKey = computed(() => status.value === 'trial_expired'
  ? 'billing.gate_trial_expired_title'
  : status.value === 'trial_exhausted'
    ? 'billing.gate_trial_exhausted_title'
  : status.value === 'free'
    ? 'billing.gate_access_required_title'
  : 'billing.gate_unverified_title')
const messageKey = computed(() => status.value === 'trial_expired'
  ? 'billing.gate_trial_expired_message'
  : status.value === 'trial_exhausted'
    ? 'billing.gate_trial_exhausted_message'
  : status.value === 'free'
    ? 'billing.gate_access_required_message'
  : 'billing.gate_unverified_message')
const restartAllowanceLabel = computed(() => trialRestartsRemaining.value > 0
  ? t('billing.restarts_remaining', { count: trialRestartsRemaining.value })
  : t('billing.restarts_exhausted'))

function retry() {
  void refreshAccess()
}

function restart() {
  void restartTrial()
}

function purchase() {
  void startPurchase()
}
</script>

<style scoped>
.product-access-gate {
  min-height: var(--sg-size-100vh);
  display: grid;
  place-items: center;
  padding: var(--sg-space-2rem);
  background: var(--sg-color-background);
  color: var(--sg-color-text);
}

.product-access-card {
  width: min(var(--sg-size-100pct), var(--sg-size-34rem));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-2rem);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-1rem);
  background: var(--sg-color-surface-raised);
  text-align: center;
}

.product-access-icon { font-size: var(--sg-font-size-2rem); }
.product-access-eyebrow { margin: 0; color: var(--sg-color-text-muted); font-size: var(--sg-font-size-0d8rem); text-transform: uppercase; letter-spacing: var(--sg-letter-spacing-0d08em); }
.product-access-card h1 { margin: 0; font-size: var(--sg-size-1d6rem); }
.product-access-copy, .product-access-recovery { margin: 0; color: var(--sg-color-text-muted); line-height: var(--sg-access-gate-copy-line-height); }
.product-access-actions { width: var(--sg-size-100pct); display: grid; gap: var(--sg-space-0d65rem); margin-top: var(--sg-space-0d5rem); }
.product-access-primary, .product-access-secondary { min-height: var(--sg-size-2d75rem); display: inline-flex; align-items: center; justify-content: center; gap: var(--sg-space-0d5rem); padding: var(--sg-space-0d7rem) var(--sg-space-1rem); border: var(--sg-border-1px) solid var(--sg-color-border); border-radius: var(--sg-radius-0d75rem); color: inherit; text-decoration: none; font: inherit; cursor: pointer; }
.product-access-primary { border-color: transparent; background: var(--sg-color-action); color: var(--sg-color-text-on-action); font-weight: 700; }
.product-access-secondary { background: transparent; }
.product-access-secondary:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
.product-access-secondary:disabled { cursor: wait; opacity: .6; }
.product-access-recovery { font-size: .8rem; }
.product-access-feedback { margin: 0; font-size: .85rem; }
.product-access-feedback.success { color: var(--sg-color-success, #22c55e); }
.product-access-feedback.error { color: var(--sg-color-danger, #ef4444); }
</style>
