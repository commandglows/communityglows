<template>
  <SgDialog
    :model-value="modelValue"
    :title="$t('account.delete_title')"
    :description="$t('account.delete_description')"
    :close-label="$t('common.cancel')"
    :dismissible="!loading"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form
      class="account-delete-dialog"
      :aria-busy="loading || undefined"
      @submit.prevent="emit('confirm')"
    >
      <div class="account-delete-warning">
        <SgIcon
          icon="pi pi-exclamation-triangle"
          aria-hidden="true"
        />
        <p>{{ $t('account.delete_warning') }}</p>
      </div>
      <ul class="account-delete-list">
        <li>{{ $t('account.delete_cloud_data') }}</li>
        <li>{{ $t('account.delete_social_accounts_untouched') }}</li>
        <li>{{ $t('account.delete_license_retention') }}</li>
      </ul>
      <p class="account-delete-trial-policy">{{ $t('account.delete_trial_policy') }}</p>
      <div class="account-delete-field">
        <label for="account-delete-confirmation">
          {{ $t('account.delete_confirmation_label', { email }) }}
        </label>
        <SgInput
          id="account-delete-confirmation"
          :model-value="confirmation"
          type="email"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :placeholder="email"
          :disabled="loading"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? 'account-delete-error' : undefined"
          required
          @update:model-value="emit('update:confirmation', $event)"
        />
        <p
          v-if="error"
          id="account-delete-error"
          class="account-delete-error"
          role="alert"
        >
          {{ error }}
        </p>
      </div>
      <div class="account-delete-actions">
        <SgButton
          :label="$t('common.cancel')"
          severity="secondary"
          outlined
          :disabled="loading"
          @click="emit('update:modelValue', false)"
        />
        <SgButton
          type="submit"
          severity="danger"
          :label="loading ? $t('account.delete_loading') : $t('account.delete_confirm')"
          :loading="loading"
          :disabled="!canConfirm || loading"
        />
      </div>
    </form>
  </SgDialog>
</template>

<script setup lang="ts">
import SgDialog from './ui/SgDialog.vue'
import SgButton from './ui/SgButton.vue'
import SgInput from './ui/SgInput.vue'
import SgIcon from './ui/SgIcon.vue'

defineProps<{
  modelValue: boolean
  email: string
  confirmation: string
  canConfirm: boolean
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:confirmation': [value: string]
  confirm: []
}>()
</script>

<style scoped>
.account-delete-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-5);
  padding: var(--sg-space-4) var(--sg-space-5) var(--sg-space-5);
}

.account-delete-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--sg-space-3);
  padding: var(--sg-space-3) var(--sg-space-4);
  border: var(--sg-border-1px) solid var(--sg-color-danger-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-danger-soft);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d9rem);
  font-weight: 600;
  line-height: var(--sg-line-height-1d5);
}

.account-delete-warning p { margin: 0; }
.account-delete-warning :deep(.sg-icon) { flex-shrink: 0; color: var(--sg-color-danger); }

.account-delete-list {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-2);
  margin: 0;
  padding-inline-start: var(--sg-space-5);
  list-style: disc;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
  line-height: var(--sg-line-height-1d5);
}

.account-delete-field { display: flex; flex-direction: column; gap: var(--sg-space-2); }
.account-delete-trial-policy { margin: 0; padding: var(--sg-space-3) var(--sg-space-4); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-muted); color: var(--sg-color-text-muted); font-size: var(--sg-font-size-0d9rem); line-height: var(--sg-line-height-1d5); }
.account-delete-field label { color: var(--sg-color-text); font-size: var(--sg-font-size-0d9rem); line-height: var(--sg-line-height-1d5); overflow-wrap: anywhere; }
.account-delete-error { margin: 0; color: var(--sg-color-text); font-size: var(--sg-font-size-0d9rem); line-height: var(--sg-line-height-1d5); }

.account-delete-actions { display: flex; flex-wrap: wrap; gap: var(--sg-space-3); }
.account-delete-actions :deep(.sg-button) { flex: 1 1 calc(var(--sg-dialog-width) / 3); }
</style>
