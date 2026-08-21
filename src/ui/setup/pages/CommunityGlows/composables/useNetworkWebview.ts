import { nextTick, ref, watch, onUnmounted, type Ref } from 'vue'
import { useElementBounding } from '@vueuse/core'
import { getNetworkIsolationOrigins } from '@/config/socialNetworks'
import { recordDiagnosticEvent } from '@/lib/buildDiagnostics'

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const isDarkMode = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

async function invoke(cmd: string, args?: Record<string, unknown>) {
  if (!isTauri()) return
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
  return tauriInvoke(cmd, args)
}

function notifyWebviewReady(profileId: string, networkId: string) {
  window.dispatchEvent(
    new CustomEvent('communityglows-network-webview-ready', {
      detail: { profileId, networkId },
    }),
  )
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

type DesktopWebviewPoolStats = {
  total: number
  visible: number
  hidden: number
  poolingEnabled?: boolean
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

export function createFrameCoalescedTask<T>(
  task: (value: T) => Promise<void>,
  requestFrame: (
    callback: FrameRequestCallback,
  ) => number = window.requestAnimationFrame.bind(window),
  cancelFrame: (handle: number) => void = window.cancelAnimationFrame.bind(
    window,
  ),
) {
  let pendingValue: T
  let hasPendingValue = false
  let frameHandle: number | undefined
  let running = false
  let disposed = false

  const requestDrain = () => {
    if (disposed || running || frameHandle !== undefined || !hasPendingValue)
      return
    frameHandle = requestFrame(() => {
      frameHandle = undefined
      void drain()
    })
  }

  const drain = async () => {
    if (disposed || running || !hasPendingValue) return
    const value = pendingValue
    hasPendingValue = false
    running = true
    try {
      await task(value)
    } finally {
      running = false
      requestDrain()
    }
  }

  return {
    schedule(value: T) {
      if (disposed) return
      pendingValue = value
      hasPendingValue = true
      requestDrain()
    },
    dispose() {
      disposed = true
      hasPendingValue = false
      if (frameHandle !== undefined) cancelFrame(frameHandle)
      frameHandle = undefined
    },
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
  let lastScheduledBounds = ''

  const record = (
    stage: string,
    status: NetworkWebviewDiagnostic['status'],
    detail?: string,
  ) => {
    onDiagnostic({ at: new Date().toISOString(), stage, status, detail })
    recordDiagnosticEvent({ area: 'windows-webview', stage, status, detail })
  }

  const recordPoolStats = async () => {
    try {
      const stats = (await invoke('get_desktop_webview_pool_stats')) as
        DesktopWebviewPoolStats | undefined
      if (!stats) return
      record(
        'webview-pool',
        'success',
        `total=${stats.total} visible=${stats.visible} hidden=${stats.hidden}${stats.poolingEnabled === undefined ? '' : ` enabled=${stats.poolingEnabled}`}`,
      )
    } catch (error) {
      record(
        'webview-pool',
        'error',
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const resizeTask = createFrameCoalescedTask<WebviewHostBounds>(
    async ({ x: nx, y: ny, width: nw, height: nh }) => {
      if (!isOpen.value || !activeKey.value) return
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
        record(
          'resize-webview',
          'success',
          `${Math.round(nw)}x${Math.round(nh)}`,
        )
      } catch (error) {
        record(
          'resize-webview',
          'error',
          error instanceof Error ? error.message : String(error),
        )
      }
    },
  )

  // Keep bounds in sync without flooding the native bridge while a sash moves.
  watch([x, y, width, height], ([nx, ny, nw, nh]) => {
    if (!isOpen.value || !activeKey.value || nw <= 0 || nh <= 0) return
    const bounds = {
      x: Math.round(nx * 100) / 100,
      y: Math.round(ny * 100) / 100,
      width: Math.round(nw * 100) / 100,
      height: Math.round(nh * 100) / 100,
    }
    const signature = `${bounds.x}:${bounds.y}:${bounds.width}:${bounds.height}`
    if (signature === lastScheduledBounds) return
    lastScheduledBounds = signature
    resizeTask.schedule(bounds)
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
      await recordPoolStats()
      notifyWebviewReady(profileId, networkId)
    } catch (error) {
      record(
        'open-webview',
        'error',
        error instanceof Error ? error.message : String(error),
      )
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

      // Hide the currently visible webview while preserving its page state.
      if (isOpen.value && activeKey.value) {
        const [oldProfileId, oldNetworkId] = activeKey.value.split(':')
        await invoke('hide_webview', {
          profileId: oldProfileId,
          networkId: oldNetworkId,
        })
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
      await recordPoolStats()
      notifyWebviewReady(profileId, networkId)
      record('switch-webview', 'success', `network=${networkId}`)
    } catch (error) {
      record(
        'switch-webview',
        'error',
        error instanceof Error ? error.message : String(error),
      )
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
        await recordPoolStats()
        record('hide-webview', 'success', `network=${networkId}`)
      } catch (error) {
        record(
          'hide-webview',
          'error',
          error instanceof Error ? error.message : String(error),
        )
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
      await recordPoolStats()
      notifyWebviewReady(profileId, networkId)
      record('show-webview', 'success', `network=${networkId}`)
    } catch (error) {
      record(
        'show-webview',
        'error',
        error instanceof Error ? error.message : String(error),
      )
      throw error
    }
  }

  /** Hide the active webview and discard the visible-host identity. */
  async function close() {
    await suspend()
    activeKey.value = null
  }

  onUnmounted(() => {
    resizeTask.dispose()
    void close()
  })

  return { open, switchTo, suspend, resume, close, isOpen, activeKey }
}
