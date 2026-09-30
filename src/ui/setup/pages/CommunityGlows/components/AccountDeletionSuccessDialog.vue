<template>
  <SgDialog
    :model-value="accountDeletionConfirmed"
    :title="$t('account.delete_success')"
    :description="$t('account.delete_success_details')"
    :close-label="$t('account.delete_return_home')"
    @update:model-value="returnHome"
  >
    <div class="account-deleted-actions">
      <SgButton
        :label="$t('account.delete_return_home')"
        @click="returnHome"
      />
    </div>
  </SgDialog>
</template>

<script setup lang="ts">
import SgDialog from './ui/SgDialog.vue'
import SgButton from './ui/SgButton.vue'
import { accountDeletionConfirmed, dismissAccountDeletionConfirmation } from '@/lib/accountDeletionFeedback'

const emit = defineEmits<{ continue: [] }>()

function returnHome() {
  dismissAccountDeletionConfirmation()
  emit('continue')
}
</script>

<style scoped>
.account-deleted-actions { display: flex; justify-content: flex-end; padding: var(--sg-space-5); }
</style>
