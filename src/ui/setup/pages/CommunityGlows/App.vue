<template>
  <div class="app-container">
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
    <!-- Onboarding (first launch) -->
    <OnboardingFlow v-if="!onboardingStore.completed" />

    <!-- Product access gate: recovery remains available while protected work is paused. -->
    <ProductAccessGate v-else-if="shouldBlockProductAccess" />

    <!-- Mobile layout (≤768px): single-column, no panels -->
    <MobileLayout v-else-if="isMobile" />

    <!-- Desktop layout: header + resizable sidebars -->
    <template v-else>
      <div class="desktop-layout">
        <div class="desktop-layout__content">
          <AppSidebar
            v-model="sidebarVisible"
            :control-bar-position="controlBarStore.position"
            @manage-profiles="profileManagerVisible = true"
            @open-settings="settingsVisible = true"
          >
            <AppRightSidebar
              v-model="rightSidebarVisible"
              :control-bar-position="controlBarStore.position"
              @open-settings="settingsVisible = true"
              @open-rightpanel-section="openRightPanelSection"
              @manage-profiles="profileManagerVisible = true"
              @edit-profile-avatar="profileAvatarVisible = true"
            >
              <div class="desktop-main">
                <DesktopControlBar
                  v-if="
                    showDesktopControlBar &&
                    controlBarStore.position === 'top'
                  "
                  :left-hidden="!sidebarVisible"
                  :right-hidden="!rightSidebarVisible"
                  :resizable="bothSidebarsHidden"
                  :has-leading-content="bothSidebarsHidden"
                  position="top"
                  @open-left="sidebarVisible = true"
                  @open-right="rightSidebarVisible = true"
                >
                  <template #after-left>
                    <ProfileSwitcher
                      v-if="bothSidebarsHidden"
                      :icons-only="false"
                      embedded
                      control-bar
                      menu-direction="down"
                      @manage-profiles="profileManagerVisible = true"
                      @open-settings="settingsVisible = true"
                    />
                  </template>
                  <DesktopQuickNavigation
                    v-if="bothSidebarsHidden"
                    position="top"
                    :show-profile-selector="false"
                    @manage-profiles="profileManagerVisible = true"
                    @open-settings="settingsVisible = true"
                  />
                </DesktopControlBar>
                <div class="desktop-main__content">
                  <!-- Native Tauri webview host: shown when a webview-capable network is active -->
                  <NetworkWebviewHost
                    v-if="webviewStore.activeUrl"
                    :suspended="
                      settingsVisible ||
                      profileManagerVisible ||
                      profileAvatarVisible ||
                      webviewOverlayActive > 0
                    "
                  />
                  <!-- Router-view for Gmail (API), login, and other non-webview pages -->
                  <router-view v-else />
                </div>
                <DesktopControlBar
                  v-if="
                    showDesktopControlBar &&
                    controlBarStore.position === 'bottom'
                  "
                  :left-hidden="!sidebarVisible"
                  :right-hidden="!rightSidebarVisible"
                  :resizable="bothSidebarsHidden"
                  :has-leading-content="bothSidebarsHidden"
                  position="bottom"
                  @open-left="sidebarVisible = true"
                  @open-right="rightSidebarVisible = true"
                >
                  <template #after-left>
                    <ProfileSwitcher
                      v-if="bothSidebarsHidden"
                      :icons-only="false"
                      embedded
                      control-bar
                      menu-direction="up"
                      @manage-profiles="profileManagerVisible = true"
                      @open-settings="settingsVisible = true"
                    />
                  </template>
                  <DesktopQuickNavigation
                    v-if="bothSidebarsHidden"
                    position="bottom"
                    :show-profile-selector="false"
                    @manage-profiles="profileManagerVisible = true"
                    @open-settings="settingsVisible = true"
                  />
                </DesktopControlBar>
              </div>
            </AppRightSidebar>
          </AppSidebar>
        </div>
      </div>
    </template>

    <!-- Desktop signup nudge (Dialog mode) -->
    <SignupNudge
      v-model="nudgeVisible"
      @dismiss="nudge.dismiss()"
      @account-created="nudge.onAccountCreated()"
    />

    <PostAuthSyncOverlay />
    <ProfileManagerDialog
      v-if="onboardingStore.completed && !isMobile"
      v-model="profileManagerVisible"
    />
    <MobileSettingsSheet
      v-if="onboardingStore.completed && !isMobile"
      v-model="settingsVisible"
      @edit-profile-avatar="openProfileAvatarFromSettings"
    />
    <ProfileAvatarDialog
      v-if="onboardingStore.completed && !isMobile"
      v-model="profileAvatarVisible"
      :avatar="profilesStore.activeProfile?.avatar"
      :emoji="profilesStore.activeProfile?.emoji ?? '🟦'"
      @save="saveActiveProfileAvatar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { Notification, Notivue } from "notivue"
import { useI18n } from "vue-i18n"
import { useMediaQuery } from "@/composables/useMediaQuery"
import { RESPONSIVE_BREAKPOINTS } from "@/design-tokens"
import { useThemeStore } from "@/stores/theme"
import { useWebviewStore, WEBVIEW_URLS } from "@/stores/webviewState"
import { useProfilesStore } from "@/stores/profiles"
import { getNetworkIsolationOriginsByNetwork } from "@/config/socialNetworks"
import { isAuthenticated } from "@/lib/convexAuth"
import { hydrateCloudState, resetCloudSyncState } from "@/lib/cloudSync"
import { syncSettingsPatch } from "@/lib/cloudSettings"
import { restorePostAuthReadyFeedback } from "@/lib/postAuthSyncFeedback"
import {
  consumePendingCommunityGlowsDeepLinkAction,
  COMMUNITYGLOWS_DEEP_LINK_EVENT,
  COMMUNITYGLOWS_PROFILE_PICKED_EVENT,
  COMMUNITYGLOWS_SHARED_LINK_EVENT,
  resolveCommunityGlowsSharedUrl,
  type CommunityGlowsDeepLinkAction,
} from "@/lib/communityGlowsDeepLinks"
import { useOnboardingStore } from "@/stores/onboarding"
import {
  isEditableShortcutTarget,
  normalizeShortcutEvent,
  useShortcutsStore,
} from "@/stores/shortcuts"
import { useRouter } from "vue-router"
import {
  DEFAULT_TAP_SOUND_VARIANT,
  TAP_SOUND_STORAGE_KEY,
  normalizeTapSoundVariant,
} from "./utils/tapSound"
import { preloadWebviews } from "./composables/useWebviewPreload"
import { TEXT_ZOOM_DEFAULT, normalizeTextZoomLevel } from "./utils/textZoom"
import { useSignupNudge } from "@/composables/useSignupNudge"
import { isDesktopTauri, supportsHaptics } from "@/platform/capabilities"
import AppSidebar from "./components/AppSidebar.vue"
import AppRightSidebar from "./components/AppRightSidebar.vue"
import DesktopControlBar from "./components/DesktopControlBar.vue"
import DesktopQuickNavigation from "./components/DesktopQuickNavigation.vue"
import ProfileSwitcher from "./components/ProfileSwitcher.vue"
import NetworkWebviewHost from "./components/NetworkWebviewHost.vue"
import MobileLayout from "./components/MobileLayout.vue"
import MobileSettingsSheet from "./components/MobileSettingsSheet.vue"
import PostAuthSyncOverlay from "./components/PostAuthSyncOverlay.vue"
import SignupNudge from "./components/SignupNudge.vue"
import OnboardingFlow from "./components/OnboardingFlow.vue"
import ProductAccessGate from "./components/ProductAccessGate.vue"
import ProfileManagerDialog from "./components/ProfileManagerDialog.vue"
import ProfileAvatarDialog from "./components/ProfileAvatarDialog.vue"
import { useDesktopControlBarStore } from "@/stores/desktopControlBar"
import { useBillingAccess } from "@/composables/useBillingAccess"

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)
const settingsVisible = ref(false)
const profileManagerVisible = ref(false)
const profileAvatarVisible = ref(false)
const webviewOverlayActive = ref(0)

// Signup nudge (desktop only — mobile has its own in MobileLayout)
const nudge = useSignupNudge()
const nudgeVisible = ref(false)

const { locale } = useI18n()

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const onboardingStore = useOnboardingStore()
const billingAccess = useBillingAccess()
const shortcutsStore = useShortcutsStore()
const controlBarStore = useDesktopControlBarStore()
const router = useRouter()
const showDesktopControlBar = computed(
  () => !sidebarVisible.value || !rightSidebarVisible.value,
)
const bothSidebarsHidden = computed(
  () => !sidebarVisible.value && !rightSidebarVisible.value,
)

function openProfileAvatarFromSettings() {
  settingsVisible.value = false
  profileAvatarVisible.value = true
}

function saveActiveProfileAvatar(value: { avatar?: string; emoji: string }) {
  const profile = profilesStore.activeProfile
  if (!profile) return
  profilesStore.update(profile.id, {
    name: profile.name,
    avatar: value.avatar,
    emoji: value.emoji,
    hiddenNetworks: profile.hiddenNetworks,
  })
  profileAvatarVisible.value = false
}
const textZoomLevel = ref(
  normalizeTextZoomLevel(
    Number(
      localStorage.getItem("communityglows_text_zoom") ??
        String(TEXT_ZOOM_DEFAULT),
    ),
  ),
)
const webviewReadyVersion = ref(0)
restorePostAuthReadyFeedback()

const queuedDeepLinkAction = ref<CommunityGlowsDeepLinkAction | null>(
  consumePendingCommunityGlowsDeepLinkAction(),
)
const pendingProfileChoiceAction = ref<CommunityGlowsDeepLinkAction | null>(
  null,
)
const lastHandledSharedUrl = ref<string | null>(null)

const isMobile = useMediaQuery(
  `(max-width: ${RESPONSIVE_BREAKPOINTS.sidebarTablet}px)`,
)
const shouldBlockProductAccess = computed(() => {
  if (!onboardingStore.completed || !isAuthenticated.value) return false
  return !billingAccess.canAccessProtected.value
})

let unlistenTray: (() => void) | undefined

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
let tauriInvoke:
  | ((command: string, args?: Record<string, unknown>) => Promise<unknown>)
  | null = null

const ensureTauriInvoke = async () => {
  if (!isTauri) return null
  if (tauriInvoke) return tauriInvoke
  const { invoke } = await import("@tauri-apps/api/core")
  tauriInvoke = invoke
  return invoke
}

const triggerNativeTapFeedback = () => {
  if (!supportsHaptics()) return
  const invoke = tauriInvoke
  if (invoke) {
    invoke("plugin:android-webview|trigger_haptic").catch(() => {})
    return
  }
  ensureTauriInvoke()
    .then((loadedInvoke) => {
      loadedInvoke?.("plugin:android-webview|trigger_haptic").catch(() => {})
    })
    .catch(() => {})
}

// Event handlers declared at module scope so onUnmounted can remove them
const onWebviewBack = () => {
  const profileId = profilesStore.activeProfileId
  const networkId = webviewStore.activeNetworkId
  if (isDesktopTauri() && profileId && networkId) {
    ensureTauriInvoke()
      .then((invoke) => {
        invoke?.("close_webview", { profileId, networkId }).catch(() => {})
      })
      .catch(() => {})
  }
  webviewStore.clearNetwork()
}
const onGrayscaleChanged = ((e: CustomEvent) => {
  themeStore.setGrayscale(e.detail.enabled)
}) as unknown as (e: Event) => void
const onOpenProfileSheet = () => {
  webviewStore.clearNetwork()
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("communityglows-show-profile-sheet"))
  }, 100)
}
const onSwitchProfile = ((e: CustomEvent) => {
  const { profileId } = e.detail
  if (profileId && profileId !== profilesStore.activeProfileId) {
    profilesStore.setActive(profileId)
    const networkId = webviewStore.activeNetworkId
    if (networkId) {
      const currentUrl = webviewStore.activeUrl
      const urlOverride =
        currentUrl && currentUrl !== WEBVIEW_URLS[networkId]
          ? currentUrl
          : undefined
      webviewStore.clearNetwork()
      setTimeout(() => webviewStore.selectNetwork(networkId, urlOverride), 100)
    }
  }
}) as unknown as (e: Event) => void
const onToggleDarkMode = () => {
  themeStore.toggleTheme()
}
const onProfilePicked = ((e: CustomEvent<{ profileId?: string }>) => {
  const pendingAction = pendingProfileChoiceAction.value
  if (!pendingAction || pendingAction.type !== "open-network") return

  const selectedProfileId =
    typeof e.detail?.profileId === "string" && e.detail.profileId
      ? e.detail.profileId
      : profilesStore.activeProfileId

  pendingProfileChoiceAction.value = null
  openNetworkFromDeepLink(
    pendingAction.networkId,
    selectedProfileId,
    pendingAction.urlOverride,
  )
}) as unknown as (e: Event) => void
const onNativeTextZoomChanged = ((e: CustomEvent) => {
  const level = normalizeTextZoomLevel(Number(e.detail?.level))
  if (!Number.isFinite(level)) return
  textZoomLevel.value = level
  localStorage.setItem("communityglows_text_zoom", String(level))
}) as unknown as (e: Event) => void
const onNativeTapSoundChanged = ((e: CustomEvent) => {
  const enabled = e.detail?.enabled
  if (typeof enabled !== "boolean") return
  localStorage.setItem("communityglows_tap_sound", String(enabled))
  syncSettingsPatch({ tapSoundEnabled: enabled }).catch(() => {})
}) as unknown as (e: Event) => void
const onSharedLink = ((e: CustomEvent<{ url?: string }>) => {
  const rawUrl = typeof e.detail?.url === "string" ? e.detail.url : ""
  handleSharedUrl(rawUrl)
}) as unknown as (e: Event) => void
const onWebviewReady = () => {
  webviewReadyVersion.value += 1
}

const onKeyboardShortcut = (event: KeyboardEvent) => {
  if (event.type === "keyup") return
  if (isEditableShortcutTarget(event.target)) return
  const pressed = normalizeShortcutEvent(event)
  const shortcut = shortcutsStore.enabledShortcuts.find(
    (item) => item.keys === pressed,
  )
  if (!shortcut) return
  event.preventDefault()
  if (shortcut.action === "toggle-left-sidebar")
    sidebarVisible.value = !sidebarVisible.value
  if (shortcut.action === "toggle-right-sidebar")
    rightSidebarVisible.value = !rightSidebarVisible.value
  if (shortcut.action === "open-settings") settingsVisible.value = true
  if (shortcut.action === "open-crm") router.push("/crm")
  if (shortcut.action === "open-network" && shortcut.target) {
    webviewStore.selectNetwork(shortcut.target)
  }
  if (shortcut.action === "open-profile-selector") {
    window.dispatchEvent(new CustomEvent("communityglows-show-profile-sheet"))
  }
  if (shortcut.action === "open-profile" && shortcut.target) {
    const nextProfileId = shortcut.target
    profilesStore.setActive(nextProfileId)
    const currentNetworkId = webviewStore.activeNetworkId
    if (
      currentNetworkId &&
      profilesStore.isNetworkHidden(nextProfileId, currentNetworkId)
    ) {
      webviewStore.clearNetwork()
    }
  }
  if (shortcut.action === "open-rightpanel-section" && shortcut.target) {
    void openRightPanelSection(shortcut.target)
  }
}

type RightPanelSection =
  | "feed"
  | "profile"
  | "friends"
  | "notifications"
  | "saved"
  | "events"
type RightPanelSectionMap = Record<
  string,
  Partial<Record<RightPanelSection, string>>
>

const rightPanelSectionMap: RightPanelSectionMap = {
  twitter: {
    feed: "/home",
    friends: "/i/following",
    notifications: "/notifications",
    profile: "/i/account",
    saved: "/i/bookmarks",
    events: "/i/events",
  },
  facebook: {
    feed: "/",
    friends: "/friends",
    notifications: "/notifications",
    profile: "/profile",
    saved: "/bookmarks",
    events: "/events",
  },
  instagram: {
    feed: "/",
    friends: "/accounts/activity",
    notifications: "/notifications",
    profile: "/accounts/edit",
    saved: "/saved",
  },
  linkedin: {
    feed: "/feed",
    friends: "/mynetwork",
    notifications: "/notifications",
    profile: "/in/",
    saved: "/my-items/saved-posts",
    events: "/events",
  },
  tiktok: {
    feed: "/",
    notifications: "/inbox",
    profile: "/@me",
    saved: "/foryou",
  },
  threads: {
    feed: "/",
    notifications: "/notifications",
    profile: "/users/me",
    saved: "/search",
  },
  discord: {
    feed: "/channels/@me",
    friends: "/channels/@me",
    notifications: "/channels/@me",
    profile: "/settings",
  },
  reddit: {
    feed: "/",
    friends: "/user/me/friends",
    notifications: "/message/inbox",
    profile: "/user/me",
    saved: "/user/me/saved",
    events: "/r/all",
  },
  snapchat: {
    feed: "/",
    notifications: "/",
    profile: "/@me",
    saved: "/",
  },
  cinderreels: {
    feed: "/",
    notifications: "/",
    profile: "/account",
  },
  quora: {
    feed: "/",
    friends: "/following",
    notifications: "/notifications",
    profile: "/profile",
    saved: "/search",
  },
  pinterest: {
    feed: "/",
    friends: "/your-friends",
    notifications: "/notifications",
    profile: "/username",
    saved: "/saved/",
  },
  telegram: {
    feed: "/k",
    notifications: "/im",
    profile: "/settings",
  },
  nextdoor: {
    feed: "/",
    notifications: "/notifications",
    profile: "/profile",
  },
  patreon: {
    feed: "/",
    notifications: "/notifications",
    profile: "/manage",
  },
  theresanaiforthat: {
    feed: "/",
    notifications: "/discussions",
    profile: "/user",
    saved: "/saved",
  },
  industrysocial: {
    feed: "/",
    notifications: "/notifications",
    profile: "/my-account",
  },
  bluesky: {
    feed: "/",
    notifications: "/notifications",
    profile: "/profile",
    saved: "/search",
    events: "/search",
  },
  mastodon: {
    feed: "/home",
    notifications: "/notifications",
    profile: "/users",
    saved: "/explore/tags",
    events: "/explore",
  },
  substack: {
    feed: "/",
    notifications: "/notifications",
    profile: "/home",
    saved: "/saved",
  },
  "ko-fi": {
    feed: "/",
    profile: "/home",
    saved: "/shop",
  },
  buymeacoffee: {
    feed: "/",
    profile: "/settings",
    saved: "/",
  },
  producthunt: {
    feed: "/",
    notifications: "/notifications",
    profile: "/me",
    saved: "/posts",
  },
  indiehackers: {
    feed: "/",
    notifications: "/notifications",
    profile: "/members",
  },
  hackernews: {
    feed: "/",
    notifications: "/user",
    profile: "/user",
    saved: "/favorites",
    events: "/newest",
  },
}

function resolveRightPanelSectionPath(
  networkId: string,
  sectionId: string,
): string {
  const section = sectionId.toLowerCase() as RightPanelSection
  const byNetwork = rightPanelSectionMap[networkId] ?? {}
  const defaultSectionPaths: Record<string, string> = {
    feed: "",
    profile: "",
    friends: "/friends",
    notifications: "/notifications",
    saved: "/saved",
    events: "/events",
  }
  return byNetwork[section] ?? defaultSectionPaths[section] ?? ""
}

async function openRightPanelSection(sectionId: string) {
  const networkId = webviewStore.activeNetworkId
  const profileId = profilesStore.activeProfileId
  if (!networkId || !profileId || !WEBVIEW_URLS[networkId]) return

  const baseUrl = WEBVIEW_URLS[networkId]
  const path = resolveRightPanelSectionPath(networkId, sectionId)
  const url = `${baseUrl.replace(/\/$/, "")}${path ? `/${path.replace(/^\//, "")}` : ""}`

  if (isTauri) {
    const { invoke } = await import("@tauri-apps/api/core")
    try {
      await invoke("navigate_webview", { profileId, networkId, url })
      return
    } catch {
      // Fallback below for desktop where command may be unavailable in older builds.
      webviewStore.selectNetwork(networkId, url)
    }
  } else {
    webviewStore.selectNetwork(networkId, url)
  }
}

// Global tap feedback — delegated to the native plugin so it honors
// the same hapticEnabled / tapSoundEnabled flags as the Kotlin bottom bar.
// Throttled to 50ms to avoid double-fire on fast repeat taps.
let lastTapAt = 0
const onGlobalTap = (e: Event) => {
  const target = e.target as HTMLElement | null
  if (!target) return
  const trigger = target.closest(
    'button, [role="button"], a[role="button"], .communityglows-tap, input[type="button"], input[type="submit"], label[for]',
  ) as HTMLElement | null
  if (!trigger) return
  if (
    trigger.hasAttribute("disabled") ||
    trigger.getAttribute("aria-disabled") === "true"
  )
    return
  if (trigger.closest("[data-no-haptic]")) return
  const now = performance.now()
  if (now - lastTapAt < 50) return
  lastTapAt = now
  triggerNativeTapFeedback()
}

function openNetworkFromDeepLink(
  networkId: string,
  profileId?: string,
  urlOverride?: string,
) {
  profilesStore.ensureDefault()

  const targetProfileId =
    profileId &&
    profilesStore.profiles.some((profile) => profile.id === profileId)
      ? profileId
      : profilesStore.activeProfileId

  if (targetProfileId && targetProfileId !== profilesStore.activeProfileId) {
    profilesStore.setActive(targetProfileId)
  }

  webviewStore.selectNetwork(networkId, urlOverride)
}

function openProfileChooserFromDeepLink() {
  webviewStore.clearNetwork()
  window.dispatchEvent(new CustomEvent("communityglows-show-profile-sheet"))
}

function onWebviewOverlayState(event: Event) {
  const detail = (event as CustomEvent<{ active: boolean }>).detail
  if (!detail) return
  if (detail.active) webviewOverlayActive.value += 1
  else webviewOverlayActive.value = Math.max(0, webviewOverlayActive.value - 1)
}

function applyDeepLinkAction(action: CommunityGlowsDeepLinkAction) {
  if (!onboardingStore.completed) {
    queuedDeepLinkAction.value = action
    return
  }

  if (action.type === "open-billing") {
    webviewStore.clearNetwork()
    settingsVisible.value = true
    return
  }

  if (action.type === "create-task") {
    webviewStore.clearNetwork()
    router.push({ path: "/tasks", query: { url: action.urlOverride ?? "" } })
    return
  }

  if (action.type !== "open-network") return

  profilesStore.ensureDefault()

  if (action.chooseProfile && profilesStore.profiles.length > 1) {
    pendingProfileChoiceAction.value = action
    openProfileChooserFromDeepLink()
    return
  }

  openNetworkFromDeepLink(
    action.networkId,
    action.profileId,
    action.urlOverride,
  )
}

const onDeepLinkAction = ((e: CustomEvent<CommunityGlowsDeepLinkAction>) => {
  if (!e.detail) return
  applyDeepLinkAction(e.detail)
}) as unknown as (e: Event) => void

function handleSharedUrl(rawUrl: string) {
  const action = resolveCommunityGlowsSharedUrl(rawUrl)
  if (!action) return
  const dedupeKey = `${action.networkId}:${action.urlOverride ?? ""}`
  if (lastHandledSharedUrl.value === dedupeKey) return
  lastHandledSharedUrl.value = dedupeKey
  applyDeepLinkAction(action)
}

// Sync locale to Android plugin for native UI translations
watch(
  locale,
  async (newLocale) => {
    if (!isTauri) return
    const { invoke } = await import("@tauri-apps/api/core")
    invoke("set_locale", { locale: newLocale }).catch(() => {})
  },
  { immediate: true },
)

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
watch(
  () => themeStore.grayscaleEnabled,
  async (enabled) => {
    if (!isTauri) return
    const { invoke } = await import("@tauri-apps/api/core")
    invoke("set_grayscale", { enabled }).catch(() => {})
  },
)

// Sync dark mode state to native Android bottom bar
watch(
  () => themeStore.isDarkMode,
  async (enabled) => {
    if (!isTauri) return
    const { invoke } = await import("@tauri-apps/api/core")
    invoke("set_dark_mode", { enabled }).catch(() => {})
  },
)

// Desktop child WebViews do not inherit Vue shell preferences automatically.
// Apply the current settings to the active native child without changing shell CSS.
const syncDesktopWebviewPreferences = async () => {
  if (!isDesktopTauri()) return
  const { invoke } = await import("@tauri-apps/api/core")
  invoke("set_webview_preferences", {
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
  profilesStore.profiles.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    avatar: p.avatar,
  })),
)
const profilesFingerprint = computed(() =>
  nativeProfilesPayload.value
    .map((p) => {
      const avatarSig = p.avatar
        ? `${p.avatar.length}:${p.avatar.slice(-32)}`
        : ""
      return `${p.id}:${p.name}:${p.emoji}:${avatarSig}`
    })
    .join("|"),
)
watch(
  [profilesFingerprint, () => profilesStore.activeProfileId],
  async ([_, activeId]) => {
    if (!isTauri) return
    const { invoke } = await import("@tauri-apps/api/core")
    const profilesJson = JSON.stringify(nativeProfilesPayload.value)
    invoke("set_profiles", { profilesJson, activeProfileId: activeId }).catch(
      () => {},
    )
  },
  { immediate: true },
)

// Sync the per-profile visible networks to the Android bottom bar.
// Re-fires when the active profile changes or its hiddenNetworks list is edited.
const hiddenFingerprint = computed(() => {
  const p = profilesStore.activeProfile
  return p ? `${p.id}:${(p.hiddenNetworks ?? []).join(",")}` : ""
})
watch(
  hiddenFingerprint,
  async () => {
    const activeNetworkId = webviewStore.activeNetworkId
    const profileId = profilesStore.activeProfileId
    if (
      profileId &&
      activeNetworkId &&
      profilesStore.isNetworkHidden(profileId, activeNetworkId)
    ) {
      webviewStore.clearNetwork()
    }

    if (!isTauri) return
    if (!profileId) return
    const visibleIds = Object.keys(WEBVIEW_URLS).filter(
      (id) => !profilesStore.isNetworkHidden(profileId, id),
    )
    const { invoke } = await import("@tauri-apps/api/core")
    invoke("set_bar_networks", {
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

  window.addEventListener(
    "communityglows-network-webview-ready",
    onWebviewReady,
  )
  window.addEventListener("keydown", onKeyboardShortcut, { capture: true })
  window.addEventListener("keyup", onKeyboardShortcut, { capture: true })

  if (isTauri) {
    const invoke = await ensureTauriInvoke()
    if (invoke) {
      // Edge-to-edge: transparent status bar, content extends to top of screen
      invoke("setup_display").catch(() => {})
      // Sync initial dark mode state to native bar
      invoke("set_dark_mode", { enabled: themeStore.isDarkMode }).catch(
        () => {},
      )
      // Keep the shared zoom state normalized before the first WebView opens.
      const savedZoom = normalizeTextZoomLevel(
        Number(
          localStorage.getItem("communityglows_text_zoom") ??
            String(TEXT_ZOOM_DEFAULT),
        ),
      )
      localStorage.setItem("communityglows_text_zoom", String(savedZoom))
      textZoomLevel.value = savedZoom
      // Sync initial haptic + tap sound preferences to native plugin
      // (Kotlin defaults to haptic=on, tapSound=off — resync if user changed them)
      const savedHaptic =
        localStorage.getItem("communityglows_haptic") !== "false"
      const savedTapSound =
        localStorage.getItem("communityglows_tap_sound") === "true"
      const savedTapSoundVariant = normalizeTapSoundVariant(
        localStorage.getItem(TAP_SOUND_STORAGE_KEY) ??
          DEFAULT_TAP_SOUND_VARIANT,
      )
      localStorage.setItem(TAP_SOUND_STORAGE_KEY, savedTapSoundVariant)
      invoke("plugin:android-webview|set_haptic", {
        enabled: savedHaptic,
      }).catch(() => {})
      invoke("plugin:android-webview|set_tap_sound_variant", {
        variant: savedTapSoundVariant,
      }).catch(() => {})
      if (savedTapSound) {
        invoke("plugin:android-webview|set_tap_sound", { enabled: true }).catch(
          () => {},
        )
      }

      // Tray events use Rust Emitter.emit() → listen() from @tauri-apps/api/event
      const { listen } = await import("@tauri-apps/api/event")
      unlistenTray = await listen<string>(
        "tray:open-network",
        ({ payload: networkId }) => {
          profilesStore.ensureDefault()
          webviewStore.selectNetwork(networkId)
        },
      )

      try {
        const sharedLink = (await invoke(
          "plugin:android-webview|get_current_shared_link",
        )) as { url?: string | null }
        if (typeof sharedLink?.url === "string") {
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
  window.addEventListener("communityglows-webview-back", onWebviewBack)
  window.addEventListener(
    "communityglows-grayscale-changed",
    onGrayscaleChanged,
  )
  window.addEventListener(
    "communityglows-open-profile-sheet",
    onOpenProfileSheet,
  )
  window.addEventListener("communityglows-switch-profile", onSwitchProfile)
  window.addEventListener("communityglows-toggle-dark-mode", onToggleDarkMode)
  window.addEventListener(
    "communityglows-text-zoom-changed",
    onNativeTextZoomChanged,
  )
  window.addEventListener(
    "communityglows-tap-sound-changed",
    onNativeTapSoundChanged,
  )
  window.addEventListener(COMMUNITYGLOWS_DEEP_LINK_EVENT, onDeepLinkAction)
  window.addEventListener(COMMUNITYGLOWS_PROFILE_PICKED_EVENT, onProfilePicked)
  window.addEventListener(COMMUNITYGLOWS_SHARED_LINK_EVENT, onSharedLink)
  window.addEventListener(
    "communityglows-webview-overlay-state",
    onWebviewOverlayState,
  )

  // Global haptic/sound feedback for Vue-side buttons.
  // Delegated pointerdown → native plugin respects user's haptic + tap_sound prefs.
  // Opt-out with `data-no-haptic` on an element or ancestor.
  if (isTauri) {
    document.addEventListener("pointerdown", onGlobalTap, {
      capture: true,
      passive: true,
    })
  }
})

onUnmounted(() => {
  window.removeEventListener(
    "communityglows-network-webview-ready",
    onWebviewReady,
  )
  window.removeEventListener("keydown", onKeyboardShortcut, { capture: true })
  window.removeEventListener("keyup", onKeyboardShortcut, { capture: true })
  window.removeEventListener("communityglows-webview-back", onWebviewBack)
  window.removeEventListener(
    "communityglows-grayscale-changed",
    onGrayscaleChanged,
  )
  window.removeEventListener(
    "communityglows-open-profile-sheet",
    onOpenProfileSheet,
  )
  window.removeEventListener("communityglows-switch-profile", onSwitchProfile)
  window.removeEventListener(
    "communityglows-toggle-dark-mode",
    onToggleDarkMode,
  )
  window.removeEventListener(
    "communityglows-text-zoom-changed",
    onNativeTextZoomChanged,
  )
  window.removeEventListener(
    "communityglows-tap-sound-changed",
    onNativeTapSoundChanged,
  )
  window.removeEventListener(COMMUNITYGLOWS_DEEP_LINK_EVENT, onDeepLinkAction)
  window.removeEventListener(
    COMMUNITYGLOWS_PROFILE_PICKED_EVENT,
    onProfilePicked,
  )
  window.removeEventListener(COMMUNITYGLOWS_SHARED_LINK_EVENT, onSharedLink)
  window.removeEventListener(
    "communityglows-webview-overlay-state",
    onWebviewOverlayState,
  )
  document.removeEventListener("pointerdown", onGlobalTap, true)
  unlistenTray?.()
})
</script>

<style>
* {
  -webkit-user-select: none;
  user-select: none;
}

input,
textarea,
[contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
}

.app-container {
  height: var(--sg-app-viewport-height);
  overflow: hidden;
}

.desktop-layout {
  display: flex;
  width: var(--sg-size-full);
  height: var(--sg-size-full);
  min-width: 0;
  flex-direction: column;
}
.desktop-layout__content {
  width: var(--sg-size-full);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 1;
}

.desktop-main {
  display: flex;
  flex-direction: column;
  width: var(--sg-size-full);
  height: var(--sg-size-full);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.desktop-main__content {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

html.dark {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: var(--sg-font-family);
  color: var(--sg-color-text);
  background: var(--sg-color-background);
}

html.dark body {
  background: var(--sg-color-background);
  color: var(--sg-color-text);
}

.sg-error {
  color: var(--sg-color-danger-text);
}
</style>
