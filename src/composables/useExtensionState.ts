import { onMounted, onScopeDispose, ref } from "vue"
import {
  EXTENSION_STATE_CHANGED,
  initializeExtensionState,
  readExtensionState,
} from "@/platform/extensionState"

export function useExtensionState() {
  const state = ref<ReturnType<typeof readExtensionState>>({
    profiles: [],
    activeProfileId: "",
    links: {},
    tasks: [],
  })
  const loading = ref(true)
  const error = ref(false)
  function refresh() {
    try {
      state.value = readExtensionState()
      error.value = false
    } catch {
      // Keep the last readable state. A corrupt or inaccessible key must not be overwritten.
      error.value = true
    }
  }
  onMounted(async () => {
    window.addEventListener("storage", refresh)
    window.addEventListener(EXTENSION_STATE_CHANGED, refresh)
    try {
      await initializeExtensionState()
      refresh()
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  })
  onScopeDispose(() => {
    window.removeEventListener("storage", refresh)
    window.removeEventListener(EXTENSION_STATE_CHANGED, refresh)
  })
  return { state, loading, error, refresh }
}
