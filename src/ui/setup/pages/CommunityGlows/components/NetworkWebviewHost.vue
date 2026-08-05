<template>
  <!-- Transparent host div — the native Tauri webview floats on top -->
  <div
    ref="hostEl"
    class="webview-host"
  >
    <div
      v-if="launchError"
      class="launch-error"
      role="alert"
    >
      <SgIcon icon="pi pi-exclamation-triangle" />
      <p>Impossible d'ouvrir {{ webviewStore.activeNetworkId }}.</p>
      <div class="launch-error-actions">
        <Button
          label="Réessayer"
          icon="pi pi-refresh"
          size="small"
          @click="launchActiveNetwork"
        />
        <Button
          :label="diagnosticsCopied ? 'Copié' : 'Copier le diagnostic'"
          :icon="diagnosticsCopied ? 'pi pi-check' : 'pi pi-copy'"
          size="small"
          severity="secondary"
          outlined
          @click="copyDiagnostics"
        />
      </div>
    </div>
    <!-- Dev-mode placeholder (running in browser, not Tauri) -->
    <div
      v-if="!isTauri"
      class="dev-placeholder"
    >
      <div class="placeholder-content">
        <SgIcon icon="pi pi-desktop placeholder-icon" />
        <p><strong>{{ webviewStore.activeNetworkId }}</strong></p>
        <p>{{ profilesStore.activeProfile?.emoji }} {{ profilesStore.activeProfile?.name ?? 'No profile' }}</p>
        <p class="hint">Native webview renders here in the Tauri desktop app.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from './ui/SgButton.vue'
import { buildIdentityHeader } from '@/lib/buildDiagnostics'
import { useWebviewStore, WEBVIEW_URLS } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { getNetworkIsolationOriginsByNetwork } from '@/config/socialNetworks'
import {
  useNetworkWebview,
  createSerialTaskQueue,
  type NetworkWebviewDiagnostic,
} from '../composables/useNetworkWebview'

const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const props = withDefaults(defineProps<{
  suspended?: boolean
}>(), {
  suspended: false,
})
const hostEl = ref<HTMLElement | null>(null)
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const launchError = ref<string | null>(null)
const diagnosticsCopied = ref(false)
const diagnostics = ref<NetworkWebviewDiagnostic[]>([])
const enqueueTransition = createSerialTaskQueue()

const { open, switchTo, suspend, resume, close } = useNetworkWebview(hostEl, entry => {
  diagnostics.value = [...diagnostics.value.slice(-19), entry]
})

// Kotlin bottom bar events are handled in App.vue via CustomEvents (evaluateJavascript).
// Network switching is handled entirely in Kotlin (direct loadUrl) — no Vue IPC needed.
// Back/close sends 'communityglows-webview-back' CustomEvent → App.vue calls clearNetwork().

const activeUrl = computed(() => webviewStore.activeUrl)
const activeNetworkId = computed(() => webviewStore.activeNetworkId)
const activeProfileId = computed(() => profilesStore.activeProfileId)

function diagnosticsReport(): string {
  const lines = [
    'CommunityGlows Windows WebView diagnostic',
    ...buildIdentityHeader(),
    `captured_at: ${new Date().toISOString()}`,
    `tauri: ${isTauri ? 'yes' : 'no'}`,
    `platform: ${navigator.platform || 'unknown'}`,
    `user_agent: ${navigator.userAgent || 'unknown'}`,
    `network: ${activeNetworkId.value ?? 'none'}`,
    `profile_selected: ${activeProfileId.value ? 'yes' : 'no'}`,
    `error: ${launchError.value ?? 'none'}`,
    'events:',
    ...diagnostics.value.map(entry =>
      `- ${entry.at} ${entry.stage} ${entry.status}${entry.detail ? ` | ${entry.detail}` : ''}`,
    ),
  ]
  return lines.join('\n')
}

async function copyDiagnostics() {
  const report = diagnosticsReport()
  try {
    await navigator.clipboard.writeText(report)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = report
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  diagnosticsCopied.value = true
  window.setTimeout(() => {
    diagnosticsCopied.value = false
  }, 2000)
}

async function launchActiveNetwork() {
  const url = activeUrl.value
  const networkId = activeNetworkId.value
  const profileId = activeProfileId.value
  if (!url || !networkId || !profileId) return

  launchError.value = null
  try {
    await enqueueTransition(() => open(url, profileId, networkId))
  } catch (error) {
    launchError.value = error instanceof Error ? error.message : String(error)
    console.error('[CommunityGlows] Failed to open network WebView:', launchError.value)
  }
}

/** Send the list of visible webview network IDs to the Android bottom bar. */
async function syncBarNetworks() {
  if (!isTauri) return
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  const allWebviewIds = Object.keys(WEBVIEW_URLS)
  const visibleIds = allWebviewIds.filter(id => !profilesStore.isNetworkHidden(profileId, id))
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_bar_networks', {
      networkIds: visibleIds,
      storageOriginsByNetwork: getNetworkIsolationOriginsByNetwork(visibleIds),
    })
  } catch { /* no-op on desktop */ }
}

// React to network or profile changes — open or switch the webview
watch(
  [activeUrl, activeNetworkId, activeProfileId, () => props.suspended],
  async ([url, networkId, profileId, isSuspended], previousValues) => {
    const [prevUrl, prevNetworkId, prevProfileId, wasSuspended] = previousValues ?? []
    if (isSuspended) {
      await enqueueTransition(suspend).catch(error => {
        console.error('[CommunityGlows] Failed to hide network WebView for an overlay:', error)
      })
      return
    }
    if (!url || !networkId || !profileId) {
      launchError.value = null
      await enqueueTransition(close).catch(error => {
        console.error('[CommunityGlows] Failed to close network WebView:', error)
      })
      return
    }
    launchError.value = null
    try {
      if (wasSuspended) {
        await enqueueTransition(() => resume(url, profileId, networkId))
        return
      }
      const keyChanged =
        networkId !== prevNetworkId || profileId !== prevProfileId || url !== prevUrl
      if (keyChanged && (prevNetworkId || prevProfileId)) {
        await enqueueTransition(() => switchTo(url, profileId, networkId))
      } else if (!prevNetworkId && !prevProfileId) {
        await enqueueTransition(() => open(url, profileId, networkId))
      }
    } catch (error) {
      launchError.value = error instanceof Error ? error.message : String(error)
      console.error('[CommunityGlows] Failed to switch network WebView:', launchError.value)
    }
  },
  { immediate: true },
)

// The watch({ immediate: true }) above handles the initial open on mount.
// No separate onMounted needed — it would cause a redundant double open_webview IPC.
</script>

<style scoped>
.webview-host {
  flex: 1;
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
  min-height: 0;
  background: transparent;
  position: relative;
}

.launch-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--sg-color-text-muted);
  background: var(--sg-color-surface-muted);
}

.launch-error p {
  margin: 0;
}

.launch-error-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
}

.dev-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--sg-size-100pct);
  color: var(--sg-color-text-muted);
}

.placeholder-content {
  text-align: center;
  padding: var(--sg-webview-placeholder-padding);
}

.placeholder-icon { font-size: var(--sg-webview-placeholder-icon-size); opacity: var(--sg-friends-empty-icon-opacity); }

.placeholder-content p {
  margin: var(--sg-space-2) 0;
}

.hint {
  font-size: var(--sg-webview-placeholder-copy-size);
  opacity: var(--sg-opacity-muted);
}
</style>
