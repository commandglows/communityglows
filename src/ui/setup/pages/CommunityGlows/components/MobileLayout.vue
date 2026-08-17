<template>
  <!-- Webview active: transparent host — the native Kotlin overlay covers everything -->
  <div
    v-if="webviewStore.activeUrl"
    class="mobile-webview-screen"
  >
    <NetworkWebviewHost class="mobile-webview-host" />
  </div>

  <!-- Home screen -->
  <div
    v-else
    class="mobile-home"
    @click.self="exitEditMode"
  >
    <!-- Top app bar -->
    <div class="mobile-topbar">
      <div class="mobile-brand">
        <span class="mobile-app-icon">
          <img
            :src="logoUrl"
            alt="CommunityGlows"
          />
        </span>
        <div class="mobile-topbar-title">
          <span class="mobile-app-name">CommunityGlows</span>
          <span class="mobile-app-subtitle">{{ $t('account.section_title') }}</span>
        </div>
      </div>
      <button
        class="settings-topbar-btn"
        :aria-label="$t('common.settings')"
        @click="settingsVisible = true"
      >
        <SgIcon icon="pi pi-cog" />
        <span>{{ $t('common.settings') }}</span>
      </button>
    </div>

    <!-- Quick actions bar (sticky top) -->
    <div class="quick-actions">
      <!-- Notifications -->
      <button
        class="quick-action-btn quick-action-btn--hidden"
        @click="notificationsVisible = !notificationsVisible"
      >
        <span class="quick-action-icon">
          <SgIcon icon="pi pi-bell" />
          <span
            v-if="notificationCount > 0"
            class="notif-badge"
          >{{ notificationCount }}</span>
        </span>
        <span class="quick-action-label">{{ $t('common.notifications') }}</span>
        <SgIcon icon="pi pi-chevron-right quick-action-arrow" />
      </button>

    </div>

    <!-- Notifications panel -->
    <div
      v-if="notificationsVisible"
      class="notif-panel notif-panel--hidden"
    >
      <div class="notif-header">
        <span class="notif-title">{{ $t('common.notifications') }}</span>
        <button
          class="notif-clear"
          @click="notificationCount = 0"
        >
          {{ $t('notif.mark_all_read') }}
        </button>
      </div>
      <div class="notif-empty">
        <SgIcon icon="pi pi-bell-slash" />
        <span>{{ $t('notif.empty_state') }}</span>
      </div>
    </div>

    <!-- Scrollable network grid -->
    <div class="mobile-home-scroll">
      <!-- Network grid -->
      <div
        class="networks-section"
        @click.self="exitEditMode"
      >
        <div class="networks-section-header">
          <p class="section-title">{{ $t('sidebar.networks_section') }}</p>
          <button
            v-if="networkEditMode"
            class="network-edit-complete"
            type="button"
            @click="exitEditMode"
          >
            <SgIcon icon="pi pi-check" />
            {{ $t('networks.finish_editing') }}
          </button>
        </div>
        <div class="network-grid">
          <button
            v-for="item in visibleMenuItems"
            :key="item.id"
            class="network-tile"
            :class="{ active: isNetworkActive(item), 'edit-mode': networkEditMode }"
            :style="{ background: tileBg(item) }"
            @click="onNetworkTileClick(item)"
            @touchstart="startLongPress(item)"
            @touchend="cancelLongPress"
            @touchcancel="cancelLongPress"
            @touchmove="cancelLongPress"
            @contextmenu.prevent
          >
            <span
              class="network-icon-wrap"
              :style="{ background: getNetworkColor(item) ?? `var(--sg-color-surface-hover)` }"
            >
              <ThreadsIcon
                v-if="item.route === '/threads'"
                class="social-brand-icon"
                size="var(--sg-font-size-1d25rem)"
                :color="'var(--sg-color-text-on-action)'"
              />
              <SnapchatIcon
                v-else-if="item.route === '/snapchat'"
                class="social-brand-icon"
                size="var(--sg-font-size-1d25rem)"
                :color="'var(--sg-color-text-on-action)'"
              />
              <NextdoorIcon
                v-else-if="item.route === '/nextdoor'"
                class="social-brand-icon"
                size="var(--sg-font-size-1d25rem)"
                :color="'var(--sg-color-text-on-action)'"
              />
              <QuoraIcon
                v-else-if="item.route === '/quora'"
                class="social-brand-icon"
                size="var(--sg-font-size-1d25rem)"
                :color="'var(--sg-color-text-on-action)'"
              />
              <SgIcon
                v-else
                :icon="item.icon"
              />
            </span>
            <span class="network-name">{{ item.label }}</span>
            <span
              v-if="networkEditMode && !item.route.startsWith('/custom-')"
              class="network-toggle"
              :class="{ hidden: isNetworkHiddenForProfile(item) }"
            >
              <span class="network-toggle-thumb" />
            </span>
            <span
              v-if="networkEditMode && item.route.startsWith('/custom-')"
              class="custom-delete-badge"
            >
              <SgIcon icon="pi pi-times" />
            </span>
          </button>

          <!-- Add custom link tile (only in edit mode) -->
          <button
            v-if="networkEditMode"
            class="network-tile add-custom-tile edit-mode"
            @click="showAddLinkForm = true"
          >
            <span
              class="network-icon-wrap"
              :style="{ background: 'var(--sg-color-surface-hover)' }"
            >
              <SgIcon icon="pi pi-plus" />
            </span>
            <span class="network-name">{{ $t('common.add') }}</span>
          </button>
        </div>
        <p
          v-if="networkEditMode"
          class="edit-hint"
        >
          {{ $t('networks.edit_mode_hint') }}
        </p>

        <!-- Add custom link form -->
        <div
          v-if="showAddLinkForm"
          class="add-link-sheet"
          @click.self="showAddLinkForm = false"
        >
          <div class="add-link-card">
            <p class="add-link-title">{{ $t('links.add_dialog_title') }}</p>
            <input
              v-model="newLinkLabel"
              class="add-link-input"
              placeholder="Nom (ex: Mon site)"
            />
            <input
              v-model="newLinkUrl"
              class="add-link-input"
              placeholder="URL (ex: example.com)"
              @keydown.enter="submitCustomLink"
            />
            <div class="add-link-actions">
              <button
                class="add-link-cancel"
                @click="showAddLinkForm = false"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                class="add-link-confirm"
                :disabled="!newLinkLabel.trim() || !newLinkUrl.trim()"
                @click="submitCustomLink"
              >
                {{ $t('common.add') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div><!-- /.mobile-home-scroll -->

    <!-- Profile switcher bar (sticky bottom) -->
    <div
      class="profile-card profile-card--bottom"
      @click="networkEditMode ? exitEditMode() : (profileSheetVisible = true)"
    >
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">
          <img
            v-if="profilesStore.activeProfile?.avatar"
            :src="profilesStore.activeProfile.avatar"
            class="profile-avatar-img"
          />
          <span v-else>{{ profilesStore.activeProfile?.emoji ?? '👤' }}</span>
        </div>
        <div class="profile-avatar-ring" />
      </div>
      <div class="profile-info">
        <span class="profile-name">{{ profilesStore.activeProfile?.name ?? $t('profile.default_name') }}</span>
        <span class="profile-sub">
          <SgIcon
            icon="pi pi-th-large"
            class="profile-net-icon"
          />
          {{ $t('profile.networks_count', { count: visibleMenuItems.length }) }} · {{ $t('profile.tap_to_manage') }}
        </span>
        <div class="profile-pills">
          <span
            v-for="item in visibleMenuItems.slice(0, 5)"
            :key="item.id"
            class="profile-pill"
            :style="{ background: pillColor(item) || 'var(--sg-color-surface-hover)' }"
          />
        </div>
      </div>
      <SgIcon icon="pi pi-chevron-up profile-chevron" />
    </div>
  </div>

  <!-- ─── Profile bottom sheet ─── -->
  <MobileProfileSheet v-model="profileSheetVisible" />

  <!-- ─── Signup nudge (once/day, max 5, then 30-day pause) ─── -->
  <SignupNudge
    v-model="nudgeVisible"
    @dismiss="nudge.dismiss()"
    @account-created="nudge.onAccountCreated()"
  />

  <!-- ─── Settings bottom sheet ─── -->
  <MobileSettingsSheet v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useCustomLinksStore } from '@/stores/customLinks'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import type { MenuItem } from '../types'
import NetworkWebviewHost from './NetworkWebviewHost.vue'
import MobileProfileSheet from './MobileProfileSheet.vue'
import MobileSettingsSheet from './MobileSettingsSheet.vue'
import SignupNudge from './SignupNudge.vue'
import { useSignupNudge } from '@/composables/useSignupNudge'
import { consumeReopenSettingsAfterAuth } from '@/lib/cloudSync'
import ThreadsIcon from './icons/ThreadsIcon.vue'
import SnapchatIcon from './icons/SnapchatIcon.vue'
import NextdoorIcon from './icons/NextdoorIcon.vue'
import QuoraIcon from './icons/QuoraIcon.vue'
import logoUrl from '@/assets/logo.png'

const router = useRouter()
const route = useRoute()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const customLinksStore = useCustomLinksStore()

// ─── Sheet state ──────────────────────────────────────────────
const profileSheetVisible = ref(false)
const settingsVisible = ref(false)

// ─── Signup nudge ────────────────────────────────────────────
const nudge = useSignupNudge()
const nudgeVisible = ref(false)

// Listen for native popup menu "Changer de profil" event
const openProfileSheetFromNative = () => { profileSheetVisible.value = true }
onMounted(async () => {
  window.addEventListener('communityglows-show-profile-sheet', openProfileSheetFromNative)

  if (consumeReopenSettingsAfterAuth()) {
    settingsVisible.value = true
  }

  nudge.recordFirstLaunch()
  await nudge.check()
  if (nudge.showNudge.value) {
    nudgeVisible.value = true
  }
})
onUnmounted(() => {
  window.removeEventListener('communityglows-show-profile-sheet', openProfileSheetFromNative)
})

// ─── Notifications ────────────────────────────────────────────
const notificationsVisible = ref(false)
const notificationCount = ref(3)

// ─── Network edit mode (long press to show/hide networks) ────
const networkEditMode = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let suppressNextNetworkClick = false

function startLongPress(_item: MenuItem) {
  cancelLongPress()
  suppressNextNetworkClick = false
  longPressTimer = setTimeout(() => {
    networkEditMode.value = true
    suppressNextNetworkClick = true
    longPressTimer = null
  }, 500)
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function exitEditMode() {
  cancelLongPress()
  suppressNextNetworkClick = false
  networkEditMode.value = false
}

function onNetworkTileClick(item: MenuItem) {
  if (suppressNextNetworkClick) {
    suppressNextNetworkClick = false
    return
  }
  if (networkEditMode.value) {
    handleEditClick(item)
    return
  }
  navigateToNetwork(item)
}

const networkIdFromItem = (item: MenuItem) => item.route.slice(1)

function toggleNetworkVisibility(item: MenuItem) {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  profilesStore.toggleNetworkHidden(profileId, networkIdFromItem(item))
}

function isNetworkHiddenForProfile(item: MenuItem): boolean {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return false
  return profilesStore.isNetworkHidden(profileId, networkIdFromItem(item))
}

/** Built-in menu items + custom links from the active profile, merged. */
const allMenuItems = computed(() => {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return menuItems.value
  const customs = customLinksStore.getLinks(profileId)
  const customItems: MenuItem[] = customs.map((link, i) => ({
    id: 1000 + i,
    label: link.label,
    icon: link.icon,
    route: `/${link.id}`,
  }))
  return [...menuItems.value, ...customItems]
})

const visibleMenuItems = computed(() => {
  if (networkEditMode.value) return allMenuItems.value
  const profileId = profilesStore.activeProfileId
  if (!profileId) return allMenuItems.value
  return allMenuItems.value.filter(item => !profilesStore.isNetworkHidden(profileId, networkIdFromItem(item)))
})

// ─── Custom links ────────────────────────────────────────────
const showAddLinkForm = ref(false)
const newLinkLabel = ref('')
const newLinkUrl = ref('')

function submitCustomLink() {
  const profileId = profilesStore.activeProfileId
  if (!profileId || !newLinkLabel.value.trim() || !newLinkUrl.value.trim()) return
  customLinksStore.addLink(profileId, newLinkLabel.value, newLinkUrl.value)
  newLinkLabel.value = ''
  newLinkUrl.value = ''
  showAddLinkForm.value = false
}

function handleEditClick(item: MenuItem) {
  const nId = networkIdFromItem(item)
  if (nId.startsWith('custom-')) {
    // Delete custom link
    const profileId = profilesStore.activeProfileId
    if (profileId) customLinksStore.removeLink(profileId, nId)
  } else {
    toggleNetworkVisibility(item)
  }
}

// ─── Friends filter ───────────────────────────────────────────
const builtinMenuItems = computed<MenuItem[]>(() =>
  builtInSocialNetworks.map((network, index) => ({
    id: index + 1,
    label: network.label,
    icon: network.icon,
    route: network.route,
  })),
)

// ─── Network list ─────────────────────────────────────────────
const menuItems = computed<MenuItem[]>(() => [
  ...builtinMenuItems.value,
  { id: builtinMenuItems.value.length + 1, label: 'Tâches', icon: 'pi pi-check-square', route: '/tasks' },
])

const networkColors: Record<string, string> = builtInSocialNetworks.reduce((acc, network) => {
  if (network.tileColor || network.color) {
    acc[network.id] = network.tileColor ?? network.color
  }
  return acc
}, {} as Record<string, string>)

const KANBAN_COLOR = 'var(--sg-color-action)'

const getNetworkColor = (item: MenuItem) => {
  if (item.route.startsWith('/custom-')) return null
  if (item.route === '/kanban') return KANBAN_COLOR
  return networkColors[item.route.slice(1)]
}

const isNetworkActive = (item: MenuItem) =>
  item.route === '/tasks' ? route.path === '/tasks' : webviewStore.activeNetworkId === item.route.slice(1)

const pillColor = (item: MenuItem) => {
  const c = getNetworkColor(item)
  if (!c) return undefined
  return c.startsWith('linear') ? 'var(--sg-color-instagram-coral)' : c
}

const tileBg = (item: MenuItem) => {
  const c = getNetworkColor(item)
  if (!c) return undefined
  const solid = c.startsWith('linear') ? 'var(--sg-color-instagram-coral)' : c
  return `color-mix(in srgb, ${solid} 7%, var(--sg-color-surface-raised))`
}

// ─── Navigation ───────────────────────────────────────────────
const navigateToNetwork = (network: MenuItem) => {
  const networkId = network.route.slice(1)
  if (networkId.startsWith('custom-')) {
    const profileId = profilesStore.activeProfileId
    if (!profileId) return
    const link = customLinksStore.getLinks(profileId).find(l => l.id === networkId)
    if (link) {
      profilesStore.ensureDefault()
      webviewStore.selectCustom(networkId, link.url)
    }
  } else if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }
}


</script>

<style scoped>
/* ─── Webview screen ─────────────────────────────────────────── */

.mobile-webview-screen {
  height: var(--sg-size-100vh);
  width: var(--sg-size-100pct);
}

.mobile-webview-host {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
}

/* ─── Home screen ────────────────────────────────────────────── */

.mobile-home {
  display: flex;
  flex-direction: column;
  height: var(--sg-size-100pct);
  overflow: hidden;
  background: var(--sg-color-surface-muted);
  padding-top: env(safe-area-inset-top, var(--sg-space-24px));
}

.mobile-home-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: var(--sg-space-0d5rem);
}

/* ─── Top app bar ────────────────────────────────────────────── */

.mobile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-3);
  flex-shrink: 0;
  padding: var(--sg-space-3) var(--sg-space-4) var(--sg-space-0d6rem);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d7rem);
  min-width: 0;
}

.mobile-app-icon {
  width: var(--sg-size-2d75rem);
  height: var(--sg-size-2d75rem);
  border-radius: var(--sg-radius-14px);
  background: var(--sg-color-action);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-app-icon img {
  width: var(--sg-size-1d95rem);
  height: var(--sg-size-1d95rem);
  border-radius: var(--sg-radius-8px);
  display: block;
}

.mobile-topbar-title {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mobile-app-name {
  font-size: var(--sg-font-size-1d1rem);
  line-height: var(--sg-line-height-1d2);
  font-weight: 800;
  color: var(--sg-color-text);
}

.mobile-app-subtitle {
  margin-top: var(--sg-space-0d1rem);
  font-size: var(--sg-font-size-0d72rem);
  line-height: var(--sg-line-height-1d2);
  color: var(--sg-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-topbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d45rem);
  flex-shrink: 0;
  min-height: var(--sg-size-2d45rem);
  padding: 0 var(--sg-space-0d75rem);
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-999px);
  color: var(--sg-color-text);
  cursor: pointer;
  box-shadow: var(--sg-shadow-control);
  font-size: var(--sg-font-size-0d82rem);
  font-weight: 600;
  transition: var(--sg-motion-backgroundneg-color-0d12s), transform var(--sg-motion-transform);
}

.settings-topbar-btn:active {
  background: var(--sg-color-surface-hover);
  transform: var(--sg-transform-scale-0d98);
}

.settings-topbar-btn .sg-icon {
  font-size: var(--sg-font-size-1rem);
}

/* ─── Profile card ───────────────────────────────────────────── */

.profile-card {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--sg-space-4);
  margin: var(--sg-space-4);
  padding: var(--sg-space-4) var(--sg-space-4) var(--sg-space-1d1rem);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-18px);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  cursor: pointer;
  box-shadow: var(--sg-shadow-control);
  transition: var(--sg-motion-backgroundneg-color-0d15s);
}

.profile-card--bottom {
  margin: var(--sg-space-2) var(--sg-space-4) calc(var(--sg-space-2) + env(safe-area-inset-bottom, 0px));
}

.profile-card:active {
  background: var(--sg-color-surface-hover);
}

.profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  font-size: var(--sg-font-size-2d2rem);
  line-height: var(--sg-line-height-1);
  width: var(--sg-size-3d4rem);
  height: var(--sg-size-3d4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-radius-50pct);
  overflow: hidden;
}

.profile-avatar-img {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
  object-fit: cover;
  border-radius: var(--sg-radius-50pct);
}

.profile-avatar-ring {
  position: absolute;
  inset: var(--sg-space-3px);
  border-radius: var(--sg-radius-50pct);
  border: 2.5px solid var(--sg-color-action);
  opacity: 0.6;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d15rem);
  overflow: hidden;
}

.profile-name {
  font-weight: 700;
  font-size: var(--sg-font-size-1d1rem);
  color: var(--sg-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-sub {
  font-size: var(--sg-font-size-0d72rem);
  color: var(--sg-color-text-muted);
  display: flex;
  align-items: center;
}

.profile-pills {
  display: flex;
  gap: var(--sg-space-0d3rem);
  margin-top: var(--sg-space-0d35rem);
}

.profile-pill {
  width: var(--sg-size-0d55rem);
  height: var(--sg-size-0d55rem);
  border-radius: var(--sg-radius-50pct);
  opacity: 0.85;
}

.profile-chevron {
  font-size: var(--sg-font-size-0d75rem);
  color: var(--sg-color-text-muted);
  flex-shrink: 0;
}

.profile-net-icon {
  font-size: var(--sg-font-size-0d65rem);
  margin-right: var(--sg-space-0d3rem);
  color: var(--sg-color-text-muted);
}

/* ─── Quick actions ──────────────────────────────────────────── */

.quick-actions {
  flex-shrink: 0;
  margin: 0 var(--sg-space-4) var(--sg-space-2);
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-16px);
  overflow: hidden;
  box-shadow: var(--sg-shadow-control);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: var(--sg-space-3);
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d85rem) var(--sg-space-4);
  background: none;
  border: none;
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
  cursor: pointer;
  transition: var(--sg-motion-backgroundneg-color-0d12s);
}

.quick-action-btn:active {
  background: var(--sg-color-surface-hover);
}

.quick-action-btn--hidden {
  display: none;
}

.quick-action-icon {
  position: relative;
  width: var(--sg-size-2rem);
  height: var(--sg-size-2rem);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-radius-8px);
  flex-shrink: 0;
}

.quick-action-icon .sg-icon {
  font-size: var(--sg-font-size-1rem);
  color: var(--sg-color-text);
}

.notif-badge {
  position: absolute;
  top: var(--sg-position-neg-4px);
  right: var(--sg-position-neg-4px);
  background: var(--sg-color-danger);
  color: var(--sg-color-text-on-action);
  font-size: var(--sg-font-size-0d6rem);
  font-weight: 700;
  min-width: var(--sg-size-1rem);
  height: var(--sg-size-1rem);
  border-radius: var(--sg-radius-0d5rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--sg-space-0d2rem);
}

.quick-action-label {
  flex: 1;
  font-size: var(--sg-font-size-0d9rem);
  font-weight: 500;
  color: var(--sg-color-text);
  text-align: left;
}

.quick-action-arrow {
  font-size: var(--sg-font-size-0d7rem);
  color: var(--sg-color-text-muted);
}

/* ─── Notifications panel ────────────────────────────────────── */

.notif-panel {
  flex-shrink: 0;
  margin: 0 var(--sg-space-4) var(--sg-space-2);
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-16px);
  overflow: hidden;
  box-shadow: var(--sg-shadow-control);
}

.notif-panel--hidden {
  display: none;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sg-space-3) var(--sg-space-4);
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
}

.notif-title {
  font-size: var(--sg-font-size-0d85rem);
  font-weight: 700;
  color: var(--sg-color-text);
  text-transform: uppercase;
  letter-spacing: var(--sg-letter-spacing-0d05em);
}

.notif-clear {
  background: none;
  border: none;
  font-size: var(--sg-font-size-0d8rem);
  color: var(--sg-color-action);
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-2);
  padding: var(--sg-space-1d5rem);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d85rem);
}

.notif-empty .sg-icon {
  font-size: var(--sg-font-size-1d5rem);
  opacity: 0.4;
}

/* ─── Network grid ───────────────────────────────────────────── */

.networks-section {
  flex: 1;
  padding: 0 var(--sg-space-0d75rem) var(--sg-space-2);
}

.networks-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-2);
}

.section-title {
  margin: var(--sg-space-0d25rem) 0 var(--sg-space-2) var(--sg-space-0d25rem);
  font-size: var(--sg-font-size-0d72rem);
  font-weight: 700;
  letter-spacing: var(--sg-letter-spacing-0d06em);
  text-transform: uppercase;
  color: var(--sg-color-text-muted);
}

.network-edit-complete {
  display: inline-flex;
  align-items: center;
  gap: var(--sg-space-1);
  margin-bottom: var(--sg-space-2);
  padding: var(--sg-space-0d4rem) var(--sg-space-0d75rem);
  border: var(--sg-border-1px) solid var(--sg-color-action);
  border-radius: var(--sg-radius-8px);
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  font: inherit;
  font-size: var(--sg-font-size-0d72rem);
  font-weight: 700;
  cursor: pointer;
}

.network-edit-complete:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sg-space-2);
}

.network-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d45rem);
  position: relative;
  aspect-ratio: 1;
  min-width: 0;
  padding: var(--sg-space-0d5rem) var(--sg-space-0d35rem);
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-14px);
  cursor: pointer;
  transition: var(--sg-motion-backgroundneg-color-0d15s), var(--sg-motion-transform-0d2s);
  box-shadow: var(--sg-shadow-control);
}

.network-tile:active {
  transform: scale(0.96);
  background: var(--sg-color-surface-hover);
}

.network-tile.active {
  border-color: var(--sg-color-action);
  background: color-mix(in srgb, var(--sg-color-action) 6%, var(--sg-color-surface-raised));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--sg-color-action) 35%, transparent), var(--sg-shadow-control);
}

.network-icon-wrap {
  width: var(--sg-size-2d45rem);
  height: var(--sg-size-2d45rem);
  border-radius: var(--sg-radius-999px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.network-icon-wrap .sg-icon {
  font-size: var(--sg-font-size-1d2rem);
  color: var(--sg-color-text-on-action);
}

.social-brand-icon {
  width: var(--sg-font-size-0d72rem);
  height: var(--sg-font-size-0d72rem);
}

.network-name {
  width: var(--sg-size-100pct);
  min-width: 0;
  font-size: var(--sg-font-size-0d68rem);
  font-weight: 600;
  color: var(--sg-color-text);
  text-align: center;
  line-height: var(--sg-line-height-1d12);
  overflow: hidden;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* ─── Network edit mode (long press) ────────────────────────── */

.network-tile.edit-mode {
  animation: tile-wiggle var(--sg-motion-all-0d3s-ease);
}

.network-toggle {
  position: absolute;
  top: var(--sg-space-0d35rem);
  right: var(--sg-space-0d35rem);
  width: var(--sg-size-1d75rem);
  height: var(--sg-size-1rem);
  border-radius: var(--sg-radius-0d75rem);
  background: var(--sg-color-action);
  flex-shrink: 0;
  transition: var(--sg-motion-backgroundneg-color-0d2s);
}

.network-toggle.hidden {
  background: var(--sg-color-border);
}

.network-toggle-thumb {
  position: absolute;
  top: var(--sg-space-0d2rem);
  right: var(--sg-space-0d2rem);
  width: var(--sg-size-0d75rem);
  height: var(--sg-size-0d75rem);
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-text-on-action);
  box-shadow: var(--sg-shadow-control);
  transition: var(--sg-motion-transform-0d2s);
}

.network-toggle.hidden .network-toggle-thumb {
  transform: translateX(var(--sg-position-neg-5px));
}

.edit-hint {
  text-align: center;
  font-size: var(--sg-font-size-0d72rem);
  color: var(--sg-color-text-muted);
  margin: var(--sg-space-2) 0 0;
  font-style: italic;
}

.custom-delete-badge {
  position: absolute;
  top: var(--sg-space-neg-0d4rem);
  right: var(--sg-space-neg-0d4rem);
  width: var(--sg-size-1d25rem);
  height: var(--sg-size-1d25rem);
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-danger);
  color: var(--sg-color-text-on-action);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--sg-font-size-0d6rem);
}

.add-custom-tile {
  border: var(--sg-border-2px) dashed var(--sg-color-border);
  background: transparent;
}

.add-link-sheet {
  position: fixed;
  inset: 0;
  background: var(--sg-color-surface-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--sg-layer-200);
  padding: var(--sg-space-4);
}

.add-link-card {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-16px);
  padding: var(--sg-space-1d25rem);
  width: var(--sg-size-100pct);
  max-width: var(--sg-size-20rem);
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d75rem);
}

.add-link-title {
  margin: 0;
  font-weight: 600;
  font-size: var(--sg-font-size-1rem);
  color: var(--sg-color-text);
}

.add-link-input {
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d6rem) var(--sg-space-0d75rem);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d9rem);
  outline: none;
  box-sizing: border-box;
}

.add-link-input:focus {
  border-color: var(--sg-color-action);
}

.add-link-actions {
  display: flex;
  gap: var(--sg-space-2);
  justify-content: flex-end;
}

.add-link-cancel,
.add-link-confirm {
  padding: var(--sg-space-2) var(--sg-space-4);
  border-radius: var(--sg-radius-10px);
  border: none;
  font-size: var(--sg-font-size-0d85rem);
  font-weight: 600;
  cursor: pointer;
}

.add-link-cancel {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}

.add-link-confirm {
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
}

.add-link-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes tile-wiggle {
  0% { transform: scale(1); }
  50% { transform: scale(0.97); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .network-tile,
  .network-toggle-thumb {
    transition: none;
  }
}
</style>
