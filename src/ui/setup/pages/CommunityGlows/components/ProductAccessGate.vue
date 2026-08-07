<template>
  <main class="product-access-gate" aria-labelledby="product-access-gate-title">
    <section class="product-access-card">
      <SgIcon icon="pi pi-lock" class="product-access-icon" />
      <p class="product-access-eyebrow">{{ $t('billing.title') }}</p>
      <h1 id="product-access-gate-title">{{ $t(titleKey) }}</h1>
      <p class="product-access-copy">{{ $t(messageKey) }}</p>

      <div class="product-access-actions">
        <a class="product-access-primary" href="https://communityglows.com/lifetime-deal" target="_blank" rel="noopener noreferrer">
          {{ $t('billing.buy_lifetime') }}
        </a>
        <button class="product-access-secondary" type="button" :disabled="isLoading" @click="retry">
          <SgIcon :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
          {{ $t('billing.retry_access') }}
        </button>
        <a class="product-access-secondary" href="mailto:support@communityglows.com">
          {{ $t('billing.contact_support') }}
        </a>
      </div>

      <p class="product-access-recovery">{{ $t('billing.recovery_paths_available') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBillingAccess } from '@/composables/useBillingAccess'

const { isLoading, refreshAccess, status } = useBillingAccess()
const titleKey = computed(() => status.value === 'trial_expired'
  ? 'billing.gate_trial_expired_title'
  : 'billing.gate_unverified_title')
const messageKey = computed(() => status.value === 'trial_expired'
  ? 'billing.gate_trial_expired_message'
  : 'billing.gate_unverified_message')

function retry() {
  void refreshAccess()
}
</script>

<style scoped>
.product-access-gate {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: var(--sg-color-surface, #101114);
  color: var(--sg-color-text, #f5f5f5);
}

.product-access-card {
  width: min(100%, 34rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border: 1px solid var(--sg-color-border, #383b42);
  border-radius: 1rem;
  background: var(--sg-color-surface-raised, #191b20);
  text-align: center;
}

.product-access-icon { font-size: 2rem; }
.product-access-eyebrow { margin: 0; color: var(--sg-color-text-muted, #a8abb4); font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
.product-access-card h1 { margin: 0; font-size: 1.6rem; }
.product-access-copy, .product-access-recovery { margin: 0; color: var(--sg-color-text-muted, #a8abb4); line-height: 1.55; }
.product-access-actions { width: 100%; display: grid; gap: .65rem; margin-top: .5rem; }
.product-access-primary, .product-access-secondary { min-height: 2.75rem; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .7rem 1rem; border: 1px solid var(--sg-color-border, #383b42); border-radius: .7rem; color: inherit; text-decoration: none; font: inherit; cursor: pointer; }
.product-access-primary { border-color: transparent; background: var(--sg-color-text, #f5f5f5); color: var(--sg-color-surface, #101114); font-weight: 700; }
.product-access-secondary { background: transparent; }
.product-access-secondary:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
.product-access-secondary:disabled { cursor: wait; opacity: .6; }
.product-access-recovery { font-size: .8rem; }
</style>
