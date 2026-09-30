import { readonly, ref } from 'vue'

const visible = ref(false)
export const accountDeletionConfirmed = readonly(visible)

export function dismissAccountDeletionConfirmation() {
  visible.value = false
}

export async function awaitAccountDeletionConfirmation(request: () => Promise<unknown>) {
  visible.value = false
  const result = await request()
  if (!result || typeof result !== 'object' || !('status' in result) ||
    (result.status !== 'deleted' && result.status !== 'already_deleted')) {
    throw new Error('account_deletion_not_confirmed')
  }
  visible.value = true
}
