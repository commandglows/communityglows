<template>
  <div class="app-container">
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
    <!-- Onboarding (first launch) -->
    <OnboardingFlow v-if="!onboardingStore.completed" />

    <!-- Mobile layout (≤768px): single-column, no panels -->
    <MobileLayout v-else-if="isMobile" />

    <!-- Desktop layout: header + resizable sidebars -->
    <template v-else>
      <AppSidebar v-model="sidebarVisible">
        <AppRightSidebar
          v-model="rightSidebarVisible"
          @open-settings="settingsVisible = true"
        >
          <!-- Native Tauri webview host: shown when a webview-capable network is active -->
          <NetworkWebviewHost
            v-if="webviewStore.activeUrl"
            :suspended="settingsVisible"
          />
          <!-- Router-view for Gmail (API), login, and other non-webview pages -->
          <router-view v-else />
        </AppRightSidebar>
      </AppSidebar>
    </template>

    <!-- Desktop signup nudge (Dialog mode) -->
    <SignupNudge
      v-model="nudgeVisible"
      @dismiss="nudge.dismiss()"
      @account-created="nudge.onAccountCreated()"
    />

    <PostAuthSyncOverlay />
    <MobileSettingsSheet
      v-if="onboardingStore.completed && !isMobile"
      v-model="settingsVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Notification, Notivue } from 'notivue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useWebviewStore, WEBVIEW_URLS } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { getNetworkIsolationOriginsByNetwork } from '@/config/socialNetworks'
import { isAuthenticated } from '@/lib/convexAuth'
import { hydrateCloudState, resetCloudSyncState } from '@/lib/cloudSync'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { restorePostAuthReadyFeedback } from '@/lib/postAuthSyncFeedback'
import {
  consumePendingSocialGlowzDeepLinkAction,
  SOCIALGLOWZ_DEEP_LINK_EVENT,
  SOCIALGLOWZ_PROFILE_PICKED_EVENT,
  SOCIALGLOWZ_SHARED_LINK_EVENT,
  resolveSocialGlowzSharedUrl,
  type SocialGlowzDeepLinkAction,
} from '@/lib/socialGlowzDeepLinks'
import { useOnboardingStore } from '@/stores/onboarding'
import { isEditableShortcutTarget, normalizeShortcutEvent, useShortcutsStore } from '@/stores/shortcuts'
import { useRouter } from 'vue-router'
import {
  DEFAULT_TAP_SOUND_VARIANT,
  TAP_SOUND_STORAGE_KEY,
  normalizeTapSoundVariant,
} from './utils/tapSound'
import { preloadWebviews } from './composables/useWebviewPreload'
import { TEXT_ZOOM_DEFAULT, normalizeTextZoomLevel } from './utils/textZoom'
import { useSignupNudge } from '@/composables/useSignupNudge'
import { isDesktopTauri, supportsHaptics } from '@/platform/capabilities'
import AppSidebar from './components/AppSidebar.vue'
import AppRightSidebar from './components/AppRightSidebar.vue'
import NetworkWebviewHost from './components/NetworkWebviewHost.vue'
import MobileLayout from './components/MobileLayout.vue'
import MobileSettingsSheet from './components/MobileSettingsSheet.vue'
import PostAuthSyncOverlay from './components/PostAuthSyncOverlay.vue'
import SignupNudge from './components/SignupNudge.vue'
import OnboardingFlow from './components/OnboardingFlow.vue'

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)
const settingsVisible = ref(false)

// Signup nudge (desktop only — mobile has its own in MobileLayout)
const nudge = useSignupNudge()
const nudgeVisible = ref(false)

const { locale } = useI18n()

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const onboardingStore = useOnboardingStore()
const shortcutsStore = useShortcutsStore()
const router = useRouter()
const textZoomLevel = ref(normalizeTextZoomLevel(
  Number(localStorage.getItem('sfz_text_zoom') ?? String(TEXT_ZOOM_DEFAULT)),
))
const webviewReadyVersion = ref(0)
restorePostAuthReadyFeedback()

const queuedDeepLinkAction = ref<SocialGlowzDeepLinkAction | null>(consumePendingSocialGlowzDeepLinkAction())
const pendingProfileChoiceAction = ref<SocialGlowzDeepLinkAction | null>(null)
const lastHandledSharedUrl = ref<string | null>(null)

// Mobile detection — reactive on window resize
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

let unlistenTray: (() => void) | undefined

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
let tauriInvoke: ((command: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null

const ensureTauriInvoke = async () => {
  if (!isTauri) return null
  if (tauriInvoke) return tauriInvoke
  const { invoke } = await import('@tauri-apps/api/core')
  tauriInvoke = invoke
  return invoke
}

const triggerNativeTapFeedback = () => {
  if (!supportsHaptics()) return
  const invoke = tauriInvoke
  if (invoke) {
    invoke('plugin:android-webview|trigger_haptic').catch(() => {})
    return
  }
  ensureTauriInvoke().then((loadedInvoke) => {
    loadedInvoke?.('plugin:android-webview|trigger_haptic').catch(() => {})
  }).catch(() => {})
}

// Event handlers declared at module scope so onUnmounted can remove them
const onWebviewBack = () => {
  const profileId = profilesStore.activeProfileId
  const networkId = webviewStore.activeNetworkId
  if (isDesktopTauri() && profileId && networkId) {
    ensureTauriInvoke().then((invoke) => {
      invoke?.('close_webview', { profileId, networkId }).catch(() => {})
    }).catch(() => {})
  }
  webviewStore.clearNetwork()
}
const onGrayscaleChanged = ((e: CustomEvent) => {
  themeStore.setGrayscale(e.detail.enabled)
}) as unknown as (e: Event) => void
const onOpenProfileSheet = () => {
  webviewStore.clearNetwork()
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('sfz-show-profile-sheet'))
  }, 100)
}
const onSwitchProfile = ((e: CustomEvent) => {
  const { profileId } = e.detail
  if (profileId && profileId !== profilesStore.activeProfileId) {
    profilesStore.setActive(profileId)
    const networkId = webviewStore.activeNetworkId
    if (networkId) {
      const currentUrl = webviewStore.activeUrl
      const urlOverride = currentUrl && currentUrl !== WEBVIEW_URLS[networkId]
        ? currentUrl
        : undefined
      webviewStore.clearNetwork()
      setTimeout(() => webviewStore.selectNetwork(networkId, urlOverride), 100)
    }
  }
}) as unknown as (e: Event) => void
const onToggleDarkMode = () => { themeStore.toggleTheme() }
const onProfilePicked = ((e: CustomEvent<{ profileId?: string }>) => {
  const pendingAction = pendingProfileChoiceAction.value
  if (!pendingAction || pendingAction.type !== 'open-network') return

  const selectedProfileId = typeof e.detail?.profileId === 'string' && e.detail.profileId
    ? e.detail.profileId
    : profilesStore.activeProfileId

  pendingProfileChoiceAction.value = null
  openNetworkFromDeepLink(pendingAction.networkId, selectedProfileId, pendingAction.urlOverride)
}) as unknown as (e: Event) => void
const onNativeTextZoomChanged = ((e: CustomEvent) => {
  const level = normalizeTextZoomLevel(Number(e.detail?.level))
  if (!Number.isFinite(level)) return
  textZoomLevel.value = level
  localStorage.setItem('sfz_text_zoom', String(level))
}) as unknown as (e: Event) => void
const onNativeTapSoundChanged = ((e: CustomEvent) => {
  const enabled = e.detail?.enabled
  if (typeof enabled !== 'boolean') return
  localStorage.setItem('sfz_tap_sound', String(enabled))
  syncSettingsPatch({ tapSoundEnabled: enabled }).catch(() => {})
}) as unknown as (e: Event) => void
const onSharedLink = ((e: CustomEvent<{ url?: string }>) => {
  const rawUrl = typeof e.detail?.url === 'string' ? e.detail.url : ''
  handleSharedUrl(rawUrl)
}) as unknown as (e: Event) => void
const onWebviewReady = () => { webviewReadyVersion.value += 1 }

const onKeyboardShortcut = (event: KeyboardEvent) => {
  if (isEditableShortcutTarget(event.target)) return
  const pressed = normalizeShortcutEvent(event)
  const shortcut = shortcutsStore.enabledShortcuts.find(item => item.keys === pressed)
  if (!shortcut) return
  event.preventDefault()
  if (shortcut.action === 'toggle-left-sidebar') sidebarVisible.value = !sidebarVisible.value
  if (shortcut.action === 'toggle-right-sidebar') rightSidebarVisible.value = !rightSidebarVisible.value
  if (shortcut.action === 'open-settings') settingsVisible.value = true
  if (shortcut.action === 'open-crm') router.push('/crm')
}

// Global tap feedback — delegated to the native plugin so it honors
// the same hapticEnabled / tapSoundEnabled flags as the Kotlin bottom bar.
// Throttled to 50ms to avoid double-fire on fast repeat taps.
let lastTapAt = 0
const onGlobalTap = (e: Event) => {
  const target = e.target as HTMLElement | null
  if (!target) return
  const trigger = target.closest(
    'button, [role="button"], a[role="button"], .sfz-tap, input[type="button"], input[type="submit"], label[for]',
  ) as HTMLElement | null
  if (!trigger) return
  if (trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') return
  if (trigger.closest('[data-no-haptic]')) return
  const now = performance.now()
  if (now - lastTapAt < 50) return
  lastTapAt = now
  triggerNativeTapFeedback()
}

function openNetworkFromDeepLink(networkId: string, profileId?: string, urlOverride?: string) {
  profilesStore.ensureDefault()

  const targetProfileId = profileId && profilesStore.profiles.some((profile) => profile.id === profileId)
    ? profileId
    : profilesStore.activeProfileId

  if (targetProfileId && targetProfileId !== profilesStore.activeProfileId) {
    profilesStore.setActive(targetProfileId)
  }

  webviewStore.selectNetwork(networkId, urlOverride)
}

function openProfileChooserFromDeepLink() {
  webviewStore.clearNetwork()
  window.dispatchEvent(new CustomEvent('sfz-show-profile-sheet'))
}

function applyDeepLinkAction(action: SocialGlowzDeepLinkAction) {
  if (!onboardingStore.completed) {
    queuedDeepLinkAction.value = action
    return
  }

  if (action.type === 'create-task') {
    webviewStore.clearNetwork()
    router.push({ path: '/tasks', query: { url: action.urlOverride ?? '' } })
    return
  }

  if (action.type !== 'open-network') return

  profilesStore.ensureDefault()

  if (action.chooseProfile && profilesStore.profiles.length > 1) {
    pendingProfileChoiceAction.value = action
    openProfileChooserFromDeepLink()
    return
  }

  openNetworkFromDeepLink(action.networkId, action.profileId, action.urlOverride)
}

const onDeepLinkAction = ((e: CustomEvent<SocialGlowzDeepLinkAction>) => {
  if (!e.detail) return
  applyDeepLinkAction(e.detail)
}) as unknown as (e: Event) => void

function handleSharedUrl(rawUrl: string) {
  const action = resolveSocialGlowzSharedUrl(rawUrl)
  if (!action) return
  const dedupeKey = `${action.networkId}:${action.urlOverride ?? ''}`
  if (lastHandledSharedUrl.value === dedupeKey) return
  lastHandledSharedUrl.value = dedupeKey
  applyDeepLinkAction(action)
}

// Sync locale to Android plugin for native UI translations
watch(locale, async (newLocale) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_locale', { locale: newLocale }).catch(() => {})
}, { immediate: true })

watch(
  () => isAuthenticated.value,
  async (authenticated, wasAuthenticated) => {
    if (authenticated) {
      await hydrateCloudState()
      return
    }

    if (wasAuthenticated) {
      resetCloudSyncState()
    }
  },
  { immediate: true },
)

watch(
  () => onboardingStore.completed,
  (completed) => {
    if (!completed || !queuedDeepLinkAction.value) return
    const action = queuedDeepLinkAction.value
    queuedDeepLinkAction.value = null
    applyDeepLinkAction(action)
  },
)

// When the settings toggle changes, sync the native webview on Android
watch(() => themeStore.grayscaleEnabled, async (enabled) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_grayscale', { enabled }).catch(() => {})
})

// Sync dark mode state to native Android bottom bar
watch(() => themeStore.isDarkMode, async (enabled) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_dark_mode', { enabled }).catch(() => {})
})

// Desktop child WebViews do not inherit Vue shell preferences automatically.
// Apply the current settings to the active native child without changing shell CSS.
const syncDesktopWebviewPreferences = async () => {
  if (!isDesktopTauri()) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_webview_preferences', {
    profileId: profilesStore.activeProfileId,
    networkId: webviewStore.activeNetworkId,
    grayscale: themeStore.grayscaleEnabled,
    darkMode: themeStore.isDarkMode,
    textZoom: textZoomLevel.value,
  }).catch(() => {})
}

watch(
  [
    () => themeStore.grayscaleEnabled,
    () => themeStore.isDarkMode,
    () => textZoomLevel.value,
    () => webviewStore.activeNetworkId,
    () => profilesStore.activeProfileId,
    () => webviewReadyVersion.value,
  ],
  syncDesktopWebviewPreferences,
  { immediate: true },
)

// Sync profile list to Android popup menu whenever profiles or active profile changes.
// Keep the watcher shallow, but include a small avatar signature so the native menu refreshes after avatar edits.
const nativeProfilesPayload = computed(() =>
  profilesStore.profiles.map(p => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    avatar: p.avatar,
  }))
)
const profilesFingerprint = computed(() =>
  nativeProfilesPayload.value
    .map((p) => {
      const avatarSig = p.avatar ? `${p.avatar.length}:${p.avatar.slice(-32)}` : ''
      return `${p.id}:${p.name}:${p.emoji}:${avatarSig}`
    })
    .join('|')
)
watch(
  [profilesFingerprint, () => profilesStore.activeProfileId],
  async ([_, activeId]) => {
    if (!isTauri) return
    const { invoke } = await import('@tauri-apps/api/core')
    const profilesJson = JSON.stringify(nativeProfilesPayload.value)
    invoke('set_profiles', { profilesJson, activeProfileId: activeId }).catch(() => {})
  },
  { immediate: true },
)

// Sync the per-profile visible networks to the Android bottom bar.
// Re-fires when the active profile changes or its hiddenNetworks list is edited.
const hiddenFingerprint = computed(() => {
  const p = profilesStore.activeProfile
  return p ? `${p.id}:${(p.hiddenNetworks ?? []).join(',')}` : ''
})
watch(
  hiddenFingerprint,
  async () => {
    if (!isTauri) return
    const profileId = profilesStore.activeProfileId
    if (!profileId) return
    const visibleIds = Object.keys(WEBVIEW_URLS)
      .filter(id => !profilesStore.isNetworkHidden(profileId, id))
    const { invoke } = await import('@tauri-apps/api/core')
    invoke('set_bar_networks', {
      networkIds: visibleIds,
      storageOriginsByNetwork: getNetworkIsolationOriginsByNetwork(visibleIds),
    }).catch(() => {})
  },
  { immediate: true },
)

onMounted(async () => {
  themeStore.initTheme()
  profilesStore.ensureDefault()
  if (isAuthenticated.value) {
    await hydrateCloudState()
  }

  if (queuedDeepLinkAction.value) {
    const action = queuedDeepLinkAction.value
    queuedDeepLinkAction.value = null
    applyDeepLinkAction(action)
  }

  // Preload top networks off-screen so first click is instant (non-blocking)
  preloadWebviews()

  // Signup nudge (desktop only — mobile uses MobileLayout's own nudge)
  if (!isMobile.value) {
    nudge.recordFirstLaunch()
    await nudge.check()
    if (nudge.showNudge.value) {
      nudgeVisible.value = true
    }
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('sfz-network-webview-ready', onWebviewReady)
  window.addEventListener('keydown', onKeyboardShortcut)

  if (isTauri) {
    const invoke = await ensureTauriInvoke()
    if (invoke) {
      // Edge-to-edge: transparent status bar, content extends to top of screen
      invoke('setup_display').catch(() => {})
      // Sync initial dark mode state to native bar
      invoke('set_dark_mode', { enabled: themeStore.isDarkMode }).catch(() => {})
      // Keep the shared zoom state normalized before the first WebView opens.
      const savedZoom = normalizeTextZoomLevel(
        Number(localStorage.getItem('sfz_text_zoom') ?? String(TEXT_ZOOM_DEFAULT))
      )
      localStorage.setItem('sfz_text_zoom', String(savedZoom))
      textZoomLevel.value = savedZoom
      // Sync initial haptic + tap sound preferences to native plugin
      // (Kotlin defaults to haptic=on, tapSound=off — resync if user changed them)
      const savedHaptic = localStorage.getItem('sfz_haptic') !== 'false'
      const savedTapSound = localStorage.getItem('sfz_tap_sound') === 'true'
      const savedTapSoundVariant = normalizeTapSoundVariant(
        localStorage.getItem(TAP_SOUND_STORAGE_KEY) ?? DEFAULT_TAP_SOUND_VARIANT
      )
      localStorage.setItem(TAP_SOUND_STORAGE_KEY, savedTapSoundVariant)
      invoke('plugin:android-webview|set_haptic', { enabled: savedHaptic }).catch(() => {})
      invoke('plugin:android-webview|set_tap_sound_variant', { variant: savedTapSoundVariant }).catch(() => {})
      if (savedTapSound) {
        invoke('plugin:android-webview|set_tap_sound', { enabled: true }).catch(() => {})
      }

      // Tray events use Rust Emitter.emit() → listen() from @tauri-apps/api/event
      const { listen } = await import('@tauri-apps/api/event')
      unlistenTray = await listen<string>('tray:open-network', ({ payload: networkId }) => {
        profilesStore.ensureDefault()
        webviewStore.selectNetwork(networkId)
      })

      try {
        const sharedLink = await invoke('plugin:android-webview|get_current_shared_link') as { url?: string | null }
        if (typeof sharedLink?.url === 'string') {
          handleSharedUrl(sharedLink.url)
        }
      } catch {
        // Command unavailable outside Android mobile runtime.
      }
    }
  }

  // Kotlin bottom bar communicates via CustomEvents dispatched on the main Tauri WebView.
  // This uses evaluateJavascript() — the same proven mechanism as grayscale/mute injection.
  // (Plugin trigger() + addPluginListener was unreliable in production.)
  window.addEventListener('sfz-webview-back', onWebviewBack)
  window.addEventListener('sfz-grayscale-changed', onGrayscaleChanged)
  window.addEventListener('sfz-open-profile-sheet', onOpenProfileSheet)
  window.addEventListener('sfz-switch-profile', onSwitchProfile)
  window.addEventListener('sfz-toggle-dark-mode', onToggleDarkMode)
  window.addEventListener('sfz-text-zoom-changed', onNativeTextZoomChanged)
  window.addEventListener('sfz-tap-sound-changed', onNativeTapSoundChanged)
  window.addEventListener(SOCIALGLOWZ_DEEP_LINK_EVENT, onDeepLinkAction)
  window.addEventListener(SOCIALGLOWZ_PROFILE_PICKED_EVENT, onProfilePicked)
  window.addEventListener(SOCIALGLOWZ_SHARED_LINK_EVENT, onSharedLink)

  // Global haptic/sound feedback for Vue-side buttons.
  // Delegated pointerdown → native plugin respects user's haptic + tap_sound prefs.
  // Opt-out with `data-no-haptic` on an element or ancestor.
  if (isTauri) {
    document.addEventListener('pointerdown', onGlobalTap, { capture: true, passive: true })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('sfz-network-webview-ready', onWebviewReady)
  window.removeEventListener('keydown', onKeyboardShortcut)
  window.removeEventListener('sfz-webview-back', onWebviewBack)
  window.removeEventListener('sfz-grayscale-changed', onGrayscaleChanged)
  window.removeEventListener('sfz-open-profile-sheet', onOpenProfileSheet)
  window.removeEventListener('sfz-switch-profile', onSwitchProfile)
  window.removeEventListener('sfz-toggle-dark-mode', onToggleDarkMode)
  window.removeEventListener('sfz-text-zoom-changed', onNativeTextZoomChanged)
  window.removeEventListener('sfz-tap-sound-changed', onNativeTapSoundChanged)
  window.removeEventListener(SOCIALGLOWZ_DEEP_LINK_EVENT, onDeepLinkAction)
  window.removeEventListener(SOCIALGLOWZ_PROFILE_PICKED_EVENT, onProfilePicked)
  window.removeEventListener(SOCIALGLOWZ_SHARED_LINK_EVENT, onSharedLink)
  document.removeEventListener('pointerdown', onGlobalTap, true)
  unlistenTray?.()
})
</script>

<style>
* {
  -webkit-user-select: none;
  user-select: none;
}

input, textarea, [contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
}

.app-container {
  height: var(--sg-app-viewport-height);
  overflow: hidden;
}

:root {
  /* Compatibility aliases for views that have not adopted the sg-* names yet. */
  --primary-color: var(--sg-color-action);
  --text-color: var(--sg-color-text);
  --text-color-secondary: var(--sg-color-text-muted);
  --surface-ground: var(--sg-color-surface-muted);
  --surface-card: var(--sg-color-surface-raised);
  --surface-border: var(--sg-color-border);
  --surface-hover: var(--sg-color-surface-hover);
  --card-shadow: var(--sg-shadow-control);

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

html.dark {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: var(--font-family);
  color: var(--text-color);
  background: var(--surface-ground);
}

html.dark body {
  background: var(--surface-ground);
  color: var(--text-color);
}

.sg-error {
  color: var(--sg-color-danger-text);
}
</style>
