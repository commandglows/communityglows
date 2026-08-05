import { nextTick, ref, watch, onUnmounted, type Ref } from 'vue'
import { useElementBounding } from '@vueuse/core'
import { getNetworkIsolationOrigins } from '@/config/socialNetworks'
import { recordDiagnosticEvent } from '@/lib/buildDiagnostics'

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const isDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

async function invoke(cmd: string, args?: Record<string, unknown>) {
  if (!isTauri()) return
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
  return tauriInvoke(cmd, args)
}

function notifyWebviewReady(profileId: string, networkId: string) {
  window.dispatchEvent(new CustomEvent('communityglows-network-webview-ready', {
    detail: { profileId, networkId },
  }))
}

type WebviewHostBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type NetworkWebviewDiagnostic = {
  at: string
  stage: string
  status: 'start' | 'success' | 'error'
  detail?: string
}

export function createSerialTaskQueue() {
  let pending = Promise.resolve()

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = pending.then(task, task)
    pending = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }
}

export async function measureWebviewHost(
  hostEl: Ref<HTMLElement | null>,
): Promise<WebviewHostBounds> {
  await nextTick()

  const bounds = hostEl.value?.getBoundingClientRect()
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    throw new Error('Network WebView host is not visible')
  }

  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  }
}

/**
 * Manages a native Tauri child webview for a (profile, network) pair,
 * positioned over the given host element.
 * Each profile×network gets its own native isolation boundary
 * (desktop data directory, Android WebKit profile when supported).
 */
export function useNetworkWebview(
  hostEl: Ref<HTMLElement | null>,
  onDiagnostic: (entry: NetworkWebviewDiagnostic) => void = () => undefined,
) {
  const { x, y, width, height } = useElementBounding(hostEl)

  // Track what's currently open as "profileId:networkId"
  const activeKey = ref<string | null>(null)
  const isOpen = ref(false)

  const record = (
    stage: string,
    status: NetworkWebviewDiagnostic['status'],
    detail?: string,
  ) => {
    onDiagnostic({ at: new Date().toISOString(), stage, status, detail })
    recordDiagnosticEvent({ area: 'windows-webview', stage, status, detail })
  }

  // Keep bounds in sync on sidebar toggle / window resize
  watch([x, y, width, height], async ([nx, ny, nw, nh]) => {
    if (isOpen.value && activeKey.value && nw > 0 && nh > 0) {
      const [profileId, networkId] = activeKey.value.split(':')
      record('resize-webview', 'start', `${Math.round(nw)}x${Math.round(nh)}`)
      try {
        await invoke('resize_webview', {
          profileId,
          networkId,
          x: nx,
          y: ny,
          width: nw,
          height: nh,
        })
        record('resize-webview', 'success', `${Math.round(nw)}x${Math.round(nh)}`)
      } catch (error) {
        record('resize-webview', 'error', error instanceof Error ? error.message : String(error))
      }
    }
  })

  async function open(url: string, profileId: string, networkId: string) {
    record('measure-host', 'start')
    try {
      const bounds = await measureWebviewHost(hostEl)
      record(
        'measure-host',
        'success',
        `${Math.round(bounds.width)}x${Math.round(bounds.height)} at ${Math.round(bounds.x)},${Math.round(bounds.y)}`,
      )
      const storageOrigins = getNetworkIsolationOrigins(networkId)
      record('open-webview', 'start', `network=${networkId}`)
      await invoke('open_webview', {
        url,
        profileId,
        networkId,
        darkMode: isDarkMode(),
        storageOrigins,
        ...bounds,
      })
      record('open-webview', 'success', `network=${networkId}`)
      activeKey.value = `${profileId}:${networkId}`
      isOpen.value = true
      notifyWebviewReady(profileId, networkId)
    } catch (error) {
      record('open-webview', 'error', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Switch to a different profile or network — hide the old webview (keep it
   * alive in the pool) and show/create the new one. Preserves page state,
   * scroll position, and cookies across switches.
   */
  async function switchTo(url: string, profileId: string, networkId: string) {
    record('switch-webview', 'start', `network=${networkId}`)
    try {
      const bounds = await measureWebviewHost(hostEl)

      // Hide the currently visible webview (stays alive off-screen)
      if (isOpen.value && activeKey.value) {
        const [oldProfileId, oldNetworkId] = activeKey.value.split(':')
        await invoke('hide_webview', { profileId: oldProfileId, networkId: oldNetworkId })
      }

      // Try to show an existing pooled webview (instant — no page reload)
      const shown = await invoke('show_webview', {
        profileId,
        networkId,
        ...bounds,
      })

      if (!shown) {
        // First time opening this network — create a fresh webview
        const storageOrigins = getNetworkIsolationOrigins(networkId)
        await invoke('open_webview', {
          url,
          profileId,
          networkId,
          darkMode: isDarkMode(),
          storageOrigins,
          ...bounds,
        })
      }

      activeKey.value = `${profileId}:${networkId}`
      isOpen.value = true
      notifyWebviewReady(profileId, networkId)
      record('switch-webview', 'success', `network=${networkId}`)
    } catch (error) {
      record('switch-webview', 'error', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /** Hide the active WebView while keeping its pool key for an instant restore. */
  async function suspend() {
    if (isOpen.value && activeKey.value) {
      const [profileId, networkId] = activeKey.value.split(':')
      record('hide-webview', 'start', `network=${networkId}`)
      try {
        await invoke('hide_webview', { profileId, networkId })
        isOpen.value = false
        record('hide-webview', 'success', `network=${networkId}`)
      } catch (error) {
        record('hide-webview', 'error', error instanceof Error ? error.message : String(error))
        throw error
      }
    }
  }

  /** Restore the current pool entry after a Vue overlay is dismissed. */
  async function resume(url: string, profileId: string, networkId: string) {
    const key = `${profileId}:${networkId}`
    if (activeKey.value !== key) {
      await switchTo(url, profileId, networkId)
      return
    }

    record('show-webview', 'start', `network=${networkId}`)
    try {
      const bounds = await measureWebviewHost(hostEl)
      const shown = await invoke('show_webview', {
        profileId,
        networkId,
        ...bounds,
      })
      if (!shown) {
        await open(url, profileId, networkId)
        return
      }
      isOpen.value = true
      notifyWebviewReady(profileId, networkId)
      record('show-webview', 'success', `network=${networkId}`)
    } catch (error) {
      record('show-webview', 'error', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /** Hide the active webview and discard the visible-host identity. */
  async function close() {
    await suspend()
    activeKey.value = null
  }

  onUnmounted(close)

  return { open, switchTo, suspend, resume, close, isOpen, activeKey }
}
