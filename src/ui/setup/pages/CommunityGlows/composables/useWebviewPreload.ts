import { WEBVIEW_URLS } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { getNetworkIsolationOrigins } from '@/config/socialNetworks'

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Max networks to preload hidden at startup. */
const PRELOAD_COUNT = 3

/**
 * Preload the user's top N visible networks as hidden webviews.
 * Each webview is created with valid minimal bounds and immediately hidden
 * through the native visibility API. When the user clicks a network for the
 * first time, show_webview instantly brings it on-screen —
 * no page load needed.
 *
 * Call once after the app is mounted and the profile store is ready.
 */
export async function preloadWebviews() {
  if (!isTauri()) return
  // Skip on Android: the Kotlin plugin manages the visible host pool itself.
  // Calling open_webview here would show the social overlay on startup.
  if (/android/i.test(navigator.userAgent)) return

  const { invoke } = await import('@tauri-apps/api/core')
  const profilesStore = useProfilesStore()
  const profileId = profilesStore.activeProfileId
  if (!profileId) return

  // Get visible webview-capable networks for the active profile
  const allNetworkIds = Object.keys(WEBVIEW_URLS)
  const visibleIds = allNetworkIds.filter(
    (id) => !profilesStore.isNetworkHidden(profileId, id),
  )

  // Preload the first N — they load in parallel off-screen
  const toPreload = visibleIds.slice(0, PRELOAD_COUNT)

  await Promise.allSettled(
    toPreload.map((networkId) =>
      invoke('open_webview', {
        url: WEBVIEW_URLS[networkId],
        profileId,
        networkId,
        darkMode: document.documentElement.classList.contains('dark'),
        storageOrigins: getNetworkIsolationOrigins(networkId),
        hidden: true,
        x: -10000,
        y: -10000,
        width: 1,
        height: 1,
      }),
    ),
  )
}
