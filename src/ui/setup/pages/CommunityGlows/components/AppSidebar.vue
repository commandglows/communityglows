<template>
  <SplitterGroup
    direction="horizontal"
    @layout="handleResize"
  >
    <SplitterPanel
      v-show="modelValue"
      ref="sidebarPanel"
      :default-size="SIDEBAR_EXPANDED_SIZE"
      :min-size="5"
      :max-size="SIDEBAR_MAX_SIZE"
      :collapsed-size="0"
      collapsible
      class="sidebar"
      :class="{ 'icons-only': iconsOnly }"
    >
      <div
        class="sidebar-content"
        :class="{ 'content-centered': iconsOnly }"
      >
        <div class="sidebar-main">
          <div
            v-if="controlBarPosition === 'top' || !iconsOnly"
            class="sidebar-header"
            :class="
              iconsOnly ? 'sidebar-header--centered' : 'sidebar-header--spaced'
            "
          >
            <Button
              v-if="controlBarPosition === 'top'"
              v-sg-tooltip.right="'Toggle left sidebar'"
              icon="pi pi-bars"
              text
              aria-label="Toggle left sidebar"
              @click="toggleSidebar"
            />
            <h1
              v-if="!iconsOnly"
              class="app-title"
            >
              CommunityGlows
            </h1>
          </div>

          <div class="sidebar-scrollable-content">
            <div class="menu-section network-menu-section">
              <div class="menu-items">
                <div
                  v-for="item in visibleMenuItems"
                  :key="item.id"
                  class="menu-item-group"
                >
                  <div
                    class="network-row"
                    :class="{
                      active: isNetworkActive(item),
                      'network-row--editing': networkEditMode,
                      'network-row--hidden': isNetworkHiddenForProfile(item),
                    }"
                  >
                    <Button
                      :icon="undefined"
                      :label="iconsOnly ? undefined : item.label"
                      :tooltip="iconsOnly ? item.label : undefined"
                      :tooltip-options="{ position: 'right' }"
                      text
                      :class="[
                        'network-btn',
                        iconsOnly
                          ? 'network-btn--centered'
                          : 'network-btn--leading',
                        {
                          'network-btn--active': isNetworkActive(item),
                          'network-btn--editing': networkEditMode && !iconsOnly,
                        },
                      ]"
                      :aria-pressed="
                        networkEditMode
                          ? !isNetworkHiddenForProfile(item)
                          : undefined
                      "
                      @click="
                        networkEditMode
                          ? toggleNetworkVisibility(item)
                          : navigateToNetwork(item)
                      "
                    >
                      <template #icon>
                        <NetworkBrandIcon
                          :network-id="item.route.slice(1)"
                          :fallback-icon="item.icon"
                        />
                      </template>
                    </Button>
                    <span
                      v-if="networkEditMode"
                      class="network-visibility-indicator"
                      aria-hidden="true"
                    >
                      <i
                        :class="
                          isNetworkHiddenForProfile(item)
                            ? 'pi pi-eye-slash'
                            : 'pi pi-eye'
                        "
                      />
                    </span>
                  </div>
                </div>
              </div>
              <Button
                v-sg-tooltip.right="
                  networkEditMode
                    ? $t('networks.finish_editing')
                    : $t('networks.start_editing')
                "
                :icon="networkEditMode ? 'pi pi-check' : 'pi pi-pencil'"
                :label="
                  iconsOnly
                    ? undefined
                    : networkEditMode
                      ? $t('networks.finish_editing')
                      : $t('networks.start_editing')
                "
                :aria-label="
                  networkEditMode
                    ? $t('networks.finish_editing')
                    : $t('networks.start_editing')
                "
                :aria-pressed="networkEditMode"
                text
                size="small"
                class="network-edit-mode-button"
                @click="toggleNetworkEditMode"
              />
            </div>

            <!-- Filtre Amis -->
            <div class="friends-section friends-section--hidden">
              <div
                v-if="!iconsOnly"
                class="section-header"
              >
                <h3>{{ $t("sidebar.friends_section") }}</h3>
                <Button
                  v-sg-tooltip.right="$t('friends_filter.manage_tooltip')"
                  icon="pi pi-users"
                  text
                  size="small"
                  :aria-label="$t('friends_filter.manage_button')"
                  @click="showFriendsPanel = true"
                />
              </div>
              <div
                class="friends-toggle"
                :class="{ 'friends-toggle--centered': iconsOnly }"
              >
                <Button
                  v-sg-tooltip.right="
                    iconsOnly
                      ? filterEnabled
                        ? $t('friends_filter.filter_active')
                        : $t('friends_filter.filter_inactive')
                      : undefined
                  "
                  :label="
                    iconsOnly
                      ? undefined
                      : filterEnabled
                        ? $t('friends_filter.friends_only')
                        : $t('friends_filter.see_all')
                  "
                  :aria-label="
                    iconsOnly
                      ? filterEnabled
                        ? $t('friends_filter.filter_active')
                        : $t('friends_filter.filter_inactive')
                      : undefined
                  "
                  :icon="filterEnabled ? 'pi pi-filter-fill' : 'pi pi-filter'"
                  :aria-pressed="filterEnabled"
                  class="friends-filter-button"
                  @click="setFilterEnabled"
                />
                <Button
                  v-if="iconsOnly"
                  v-sg-tooltip.right="$t('friends_filter.manage_tooltip')"
                  icon="pi pi-users"
                  text
                  size="small"
                  class="friends-manage-btn"
                  :aria-label="$t('friends_filter.manage_button')"
                  @click="showFriendsPanel = true"
                />
              </div>
            </div>

            <FriendsPanel
              v-model="showFriendsPanel"
              :network-id="webviewStore.activeNetworkId ?? 'twitter'"
            />

            <!-- Custom Links -->
            <div
              v-if="customLinkItems.length || networkEditMode"
              class="custom-links-section"
            >
              <div
                v-if="networkEditMode && !iconsOnly"
                class="section-header"
              >
                <h3>{{ $t("sidebar.custom_links_section") }}</h3>
                <Button
                  v-sg-tooltip.right="$t('links.add_tooltip')"
                  icon="pi pi-plus"
                  text
                  size="small"
                  type="button"
                  :aria-label="$t('links.add_button')"
                  @mouseenter="setAddLinkTooltipOverlay(true)"
                  @mouseleave="setAddLinkTooltipOverlay(false)"
                  @click="openAddLinkDialog"
                />
              </div>
              <div
                v-if="customLinkItems.length"
                class="menu-items"
              >
                <div
                  v-for="item in customLinkItems"
                  :key="item.id"
                  class="menu-item-group"
                >
                  <div
                    class="network-row"
                    :class="{ active: isNetworkActive(item) }"
                  >
                    <Button
                      :icon="item.icon"
                      :label="iconsOnly ? undefined : item.label"
                      :tooltip="iconsOnly ? item.label : undefined"
                      :tooltip-options="{ position: 'right' }"
                      text
                      :class="[
                        'network-btn',
                        iconsOnly
                          ? 'network-btn--centered'
                          : 'network-btn--leading',
                        { 'network-btn--active': isNetworkActive(item) },
                      ]"
                      @click="navigateToNetwork(item)"
                    />
                    <Button
                      v-if="networkEditMode && !iconsOnly"
                      icon="pi pi-times"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      class="custom-link-delete"
                      :aria-label="$t('common.delete')"
                      @click="removeCustomLink(item.route.slice(1))"
                    />
                  </div>
                </div>
              </div>
              <Button
                v-if="networkEditMode && iconsOnly"
                v-sg-tooltip.right="$t('links.add_tooltip')"
                icon="pi pi-plus"
                text
                size="small"
                class="custom-link-add-icon"
                type="button"
                :aria-label="$t('links.add_button')"
                @mouseenter="setAddLinkTooltipOverlay(true)"
                @mouseleave="setAddLinkTooltipOverlay(false)"
                @click="openAddLinkDialog"
              />
            </div>

            <SgDialog
              v-model="showAddLinkDialog"
              :title="$t('links.add_dialog_title')"
              variant="sidebar"
            >
              <form
                class="add-link-form"
                @submit.prevent="addCustomLink"
              >
                <p class="add-link-hint">
                  {{ $t("links.add_dialog_hint") }}
                </p>

                <label class="add-link-field">
                  <span>{{ $t("links.name_label") }}</span>
                  <input
                    v-model="newLinkLabel"
                    :placeholder="$t('links.name_placeholder')"
                    class="add-link-input"
                    autocomplete="off"
                  />
                </label>

                <label class="add-link-field">
                  <span>{{ $t("links.url_label") }}</span>
                  <input
                    v-model="newLinkUrl"
                    type="text"
                    inputmode="url"
                    :placeholder="$t('links.url_placeholder')"
                    class="add-link-input"
                    autocomplete="url"
                  />
                </label>

                <fieldset class="add-link-icon-field">
                  <legend>{{ $t("links.icon_label") }}</legend>
                  <div class="add-link-icon-grid">
                    <button
                      v-for="iconOption in customLinkIconOptions"
                      :key="iconOption.icon"
                      type="button"
                      class="add-link-icon-option"
                      :class="{
                        'add-link-icon-option--selected':
                          newLinkIcon === iconOption.icon,
                      }"
                      :aria-label="$t(iconOption.labelKey)"
                      :aria-pressed="newLinkIcon === iconOption.icon"
                      @click="newLinkIcon = iconOption.icon"
                    >
                      <SgIcon :icon="iconOption.icon" />
                    </button>
                  </div>
                </fieldset>

                <Button
                  :label="$t('common.add')"
                  icon="pi pi-plus"
                  type="submit"
                  :disabled="!newLinkLabel.trim() || !newLinkUrl.trim()"
                />
              </form>
            </SgDialog>
          </div>
        </div>

        <!-- Profile switcher (global — one profile = all networks) -->
        <ProfileSwitcher
          :icons-only="iconsOnly"
          :menu-direction="iconsOnly ? 'down' : 'up'"
          class="profile-switcher-bottom"
          @manage-profiles="emit('manage-profiles')"
          @open-settings="emit('open-settings')"
        />
        <div
          v-if="controlBarPosition === 'bottom'"
          class="sidebar-bottom-toggle sidebar-bottom-toggle--left"
        >
          <Button
            v-sg-tooltip.right="'Toggle left sidebar'"
            icon="pi pi-bars"
            text
            aria-label="Toggle left sidebar"
            @click="toggleSidebar"
          />
        </div>
      </div>
    </SplitterPanel>
    <SplitterResizeHandle
      v-show="modelValue"
      class="sidebar-resize-handle"
    />
    <SplitterPanel
      :default-size="100 - SIDEBAR_EXPANDED_SIZE"
      class="main-panel"
    >
      <slot></slot>
    </SplitterPanel>
  </SplitterGroup>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue"
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui"
import { useRouter, useRoute } from "vue-router"
import { useWebviewStore } from "@/stores/webviewState"
import { useProfilesStore } from "@/stores/profiles"
import { useFriendsFilterStore } from "@/stores/friendsFilter"
import { useCustomLinksStore } from "@/stores/customLinks"
import { builtInSocialNetworks } from "@/config/socialNetworks"
import type { MenuItem } from "../types"
import Button from "./ui/SgButton.vue"
import SgIcon from "./ui/SgIcon.vue"
import SgDialog from "./ui/SgDialog.vue"
import ProfileSwitcher from "./ProfileSwitcher.vue"
import FriendsPanel from "./FriendsPanel.vue"
import NetworkBrandIcon from "./NetworkBrandIcon.vue"
import {
  clampSidebarSize,
  isCompactSidebarSize,
  sidebarSizeForMode,
  SIDEBAR_EXPANDED_SIZE,
  SIDEBAR_MAX_SIZE,
} from "./sidebarLayout"
import type { DesktopControlBarPosition } from "@/stores/desktopControlBar"

const router = useRouter()
const route = useRoute()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const filterStore = useFriendsFilterStore()
const customLinksStore = useCustomLinksStore()

const showFriendsPanel = ref(false)
const showAddLinkDialog = ref(false)
const newLinkLabel = ref("")
const newLinkUrl = ref("")
const newLinkIcon = ref("pi pi-link")

const customLinkIconOptions = [
  { icon: "pi pi-link", labelKey: "links.icons.link" },
  { icon: "pi pi-globe", labelKey: "links.icons.website" },
  { icon: "pi pi-briefcase", labelKey: "links.icons.business" },
  { icon: "pi pi-video", labelKey: "links.icons.video" },
  { icon: "pi pi-image", labelKey: "links.icons.image" },
  { icon: "pi pi-users", labelKey: "links.icons.community" },
  { icon: "pi pi-envelope", labelKey: "links.icons.email" },
  { icon: "pi pi-bookmark", labelKey: "links.icons.bookmark" },
] as const

const filterEnabled = computed(() => filterStore.enabled)

const setFilterEnabled = () => filterStore.toggle()

function openAddLinkDialog() {
  newLinkLabel.value = ""
  newLinkUrl.value = ""
  newLinkIcon.value = "pi pi-link"
  setAddLinkTooltipOverlay(true)
  showAddLinkDialog.value = true
}

function setAddLinkTooltipOverlay(active: boolean) {
  window.dispatchEvent(
    new CustomEvent("communityglows-webview-overlay-state", {
      detail: { active },
    }),
  )
}

watch(showAddLinkDialog, (isOpen) => {
  if (!isOpen) {
    setAddLinkTooltipOverlay(false)
  }
})

const props = defineProps<{
  modelValue: boolean
  controlBarPosition: DesktopControlBarPosition
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "network-selected": [network: MenuItem]
  "manage-profiles": []
  "open-settings": []
}>()

const iconsOnly = ref(false)
const sidebarPanel = ref<{
  collapse: () => void
  getSize: () => number
  resize: (size: number) => void
} | null>(null)
const lastVisibleSidebarSize = ref(SIDEBAR_EXPANDED_SIZE)

onMounted(() => {
  if (!props.modelValue) sidebarPanel.value?.collapse()
})

watch(iconsOnly, async (compact) => {
  await nextTick()
  sidebarPanel.value?.resize(sidebarSizeForMode(compact))
})

// Keep the splitter and its default slot mounted while the panel is hidden.
// Replacing the whole splitter branch used to remount the central native
// WebView host, which closed/reopened WebView2 and produced a visible flash.
watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      const currentSize = sidebarPanel.value?.getSize()
      if (typeof currentSize === "number" && currentSize > 0) {
        lastVisibleSidebarSize.value = currentSize
      }
      sidebarPanel.value?.collapse()
      return
    }
    await nextTick()
    sidebarPanel.value?.resize(clampSidebarSize(lastVisibleSidebarSize.value))
  },
)

const toggleSidebar = () => emit("update:modelValue", !props.modelValue)

const handleResize = (sizes: number[]) => {
  if (!props.modelValue) return
  const newSize = sizes[0]
  if (typeof newSize !== "number") return

  if (newSize > 0) lastVisibleSidebarSize.value = clampSidebarSize(newSize)
  iconsOnly.value = isCompactSidebarSize(newSize)
}

const builtinMenuItems = builtInSocialNetworks.map((network, index) => ({
  id: index + 1,
  label: network.label,
  icon: network.icon,
  route: network.route,
}))

const menuItems = ref<MenuItem[]>([
  ...builtinMenuItems,
  {
    id: builtinMenuItems.length + 1,
    label: "CRM",
    icon: "pi pi-briefcase",
    route: "/crm",
  },
  {
    id: builtinMenuItems.length + 2,
    label: "Tâches",
    icon: "pi pi-check-square",
    route: "/tasks",
  },
])

const networkEditMode = ref(false)

const visibleMenuItems = computed(() => {
  if (networkEditMode.value) return menuItems.value
  const profileId = profilesStore.activeProfileId
  if (!profileId) return menuItems.value
  return menuItems.value.filter(
    (item) => !profilesStore.isNetworkHidden(profileId, item.route.slice(1)),
  )
})

const isNetworkHiddenForProfile = (item: MenuItem) => {
  const profileId = profilesStore.activeProfileId
  return (
    !!profileId && profilesStore.isNetworkHidden(profileId, item.route.slice(1))
  )
}

const toggleNetworkVisibility = (item: MenuItem) => {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  profilesStore.toggleNetworkHidden(profileId, item.route.slice(1))
}

const toggleNetworkEditMode = () => {
  networkEditMode.value = !networkEditMode.value
}

const customLinkItems = computed<MenuItem[]>(() => {
  const profileId = profilesStore.activeProfileId ?? ""
  return customLinksStore.getLinks(profileId).map((link, i) => ({
    id: 1000 + i,
    label: link.label,
    icon: link.icon,
    route: `/${link.id}`,
  }))
})

const isNetworkActive = (item: MenuItem): boolean =>
  item.route === "/crm"
    ? webviewStore.activeNetworkId === "gmail" ||
      (webviewStore.activeNetworkId === null &&
        (route.path === "/crm" || route.path === "/gmail"))
    : item.route === "/tasks"
      ? route.path === "/tasks" || webviewStore.activeNetworkId === "tasks"
      : webviewStore.activeNetworkId === item.route.slice(1)

const navigateToNetwork = (network: MenuItem): void => {
  const networkId = network.route.slice(1) // '/twitter' → 'twitter'

  if (networkId.startsWith("custom-")) {
    const profileId = profilesStore.activeProfileId ?? ""
    const link = customLinksStore
      .getLinks(profileId)
      .find((l) => l.id === networkId)
    if (link) {
      profilesStore.ensureDefault()
      webviewStore.selectCustom(link.id, link.url)
    }
  } else if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }

  emit("network-selected", network)
}

const addCustomLink = () => {
  if (!newLinkLabel.value.trim() || !newLinkUrl.value.trim()) return
  const profileId = profilesStore.activeProfileId ?? ""
  customLinksStore.addLink(
    profileId,
    newLinkLabel.value,
    newLinkUrl.value,
    newLinkIcon.value,
  )
  newLinkLabel.value = ""
  newLinkUrl.value = ""
  showAddLinkDialog.value = false
}

const removeCustomLink = (linkId: string) => {
  const profileId = profilesStore.activeProfileId ?? ""
  customLinksStore.removeLink(profileId, linkId)
}

onUnmounted(() => {
  setAddLinkTooltipOverlay(false)
})
</script>

<style scoped>
.sidebar {
  background-color: var(--sg-color-surface-raised);
  height: var(--sg-sidebar-viewport-height);
  margin-top: 0;
  transition: var(--sg-sidebar-panel-transition);
  will-change: flex-basis;
  --left-sidebar-compact-icon-size: var(--sg-sidebar-network-icon-size);
}

.sidebar.icons-only {
  min-width: var(--sg-sidebar-compact-width);
  max-width: var(--sg-sidebar-compact-width);
  --left-sidebar-compact-icon-size: calc(var(--sg-sidebar-network-icon-size) * 3);
}

.sidebar.icons-only .network-btn,
.sidebar.icons-only .friends-toggle .sg-button,
.sidebar.icons-only .section-footer .sg-button {
  min-height: calc(var(--sg-sidebar-network-row-height) * 1.35);
}

.sidebar.icons-only .sg-button__content .sg-icon {
  width: var(--left-sidebar-compact-icon-size);
  height: var(--left-sidebar-compact-icon-size);
}

.sidebar.icons-only :deep(.network-brand-icon) {
  width: var(--left-sidebar-compact-icon-size);
  height: var(--left-sidebar-compact-icon-size);
}

.sidebar:not(.icons-only) {
  min-width: var(--sg-sidebar-expanded-min-width);
}

.main-panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.sidebar-content {
  height: var(--sg-sidebar-fill-size);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar.icons-only .sidebar-content {
  overflow: visible;
}

.profile-switcher-bottom {
  width: var(--sg-sidebar-fill-size);
  flex: 0 0 auto;
  position: relative;
  z-index: var(--sg-layer-1000);
}

.sidebar-bottom-toggle {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: var(--sg-sidebar-header-height);
  padding: var(--sg-sidebar-control-padding);
}

.sidebar-bottom-toggle--left {
  justify-content: flex-start;
}

.sidebar-main {
  flex: 1;
  min-height: 0;
  width: var(--sg-sidebar-fill-size);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-scrollable-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--sg-scrollbar-thumb) transparent;
}

.sidebar-scrollable-content::-webkit-scrollbar {
  width: var(--sg-scrollbar-width);
  -webkit-appearance: none;
}

.sidebar-scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scrollable-content::-webkit-scrollbar-thumb {
  background: var(--sg-scrollbar-thumb);
  border-radius: var(--sg-scrollbar-radius);
}

.sidebar-scrollable-content::-webkit-scrollbar-thumb:hover {
  background: var(--sg-scrollbar-thumb-hover);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-control-gap);
  min-height: var(--sg-sidebar-header-height);
  padding: var(--sg-sidebar-control-padding);
}

.sidebar-header--centered {
  justify-content: center;
}

.sidebar-header--spaced {
  justify-content: space-between;
}

.app-title {
  margin: 0;
  color: var(--sg-color-text);
  font-size: var(--sg-sidebar-app-title-size);
  white-space: nowrap;
}

.content-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-centered .menu-items {
  width: var(--sg-sidebar-fill-size);
}

.flex.align-items-center.mb-3 {
  padding: var(--sg-sidebar-control-padding);
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item-group {
  display: flex;
  flex-direction: column;
}

.network-row {
  display: flex;
  align-items: center;
  position: relative;
}

.network-row.active {
  background-color: var(--sg-color-surface-hover);
  border-left: var(--sg-sidebar-active-indicator-width) solid
    var(--sg-color-action);
}

.network-row--editing {
  cursor: pointer;
}

.network-row--hidden {
  opacity: var(--sg-opacity-muted);
}

.network-visibility-indicator {
  position: absolute;
  right: var(--sg-sidebar-compact-control-spacing);
  color: var(--sg-color-text-muted);
  pointer-events: none;
}

.network-btn {
  flex: 1;
  border-radius: 0;
  height: var(--sg-sidebar-network-row-height);
}

.network-btn {
  width: var(--sg-sidebar-fill-size);
  border-radius: 0;
  height: var(--sg-sidebar-network-row-height);
}

.network-btn--leading {
  justify-content: flex-start;
  padding: 0 var(--sg-sidebar-network-row-padding-inline);
}

.network-btn--editing {
  padding-right: var(--sg-space-2rem);
}

.network-btn--centered {
  justify-content: center;
  padding: 0;
}

.network-btn:hover,
.network-row:hover {
  background-color: var(--sg-color-surface-hover);
}

.menu-section {
  margin-bottom: var(--sg-sidebar-section-spacing);
}

.network-edit-mode-button {
  width: var(--sg-sidebar-fill-size);
  justify-content: flex-start;
  opacity: 0;
  pointer-events: none;
}

.network-menu-section:hover .network-edit-mode-button,
.network-menu-section:focus-within .network-edit-mode-button {
  opacity: 1;
  pointer-events: auto;
}

.content-centered .network-edit-mode-button {
  justify-content: center;
}

.section-header {
  padding: var(--sg-sidebar-section-padding-block)
    var(--sg-sidebar-section-padding-inline);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: var(--sg-sidebar-section-title-size);
  color: var(--sg-color-text-muted);
}

.friends-section {
  margin-bottom: var(--sg-sidebar-subsection-spacing);
  border-top: 1px solid var(--sg-color-border);
  padding-top: var(--sg-sidebar-subsection-spacing);
}

.friends-section--hidden {
  display: none;
}

.friends-toggle {
  display: flex;
  flex-direction: column;
}

.friends-toggle--centered {
  align-items: center;
  padding: var(--sg-sidebar-compact-control-spacing) 0;
}

.friends-manage-btn {
  margin-top: var(--sg-sidebar-compact-control-spacing);
}

.custom-links-section {
  border-top: 1px solid var(--sg-color-border);
  padding-top: var(--sg-sidebar-subsection-spacing);
  margin-bottom: var(--sg-sidebar-subsection-spacing);
}

.custom-link-delete {
  position: absolute;
  right: var(--sg-sidebar-compact-control-spacing);
}

.custom-link-add-icon {
  margin: var(--sg-sidebar-compact-control-spacing) auto;
  display: block;
}

.add-link-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
}

.add-link-hint {
  margin: 0;
  color: var(--sg-color-text-muted);
}

.add-link-field {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-2);
  color: var(--sg-color-text);
}

.add-link-input {
  width: var(--sg-sidebar-fill-size);
  min-height: var(--sg-control-height-lg);
  padding: var(--sg-button-padding);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
}

.add-link-input:focus-visible,
.add-link-icon-option:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.add-link-icon-field {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--sg-color-text);
}

.add-link-icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sg-space-2);
  margin-top: var(--sg-space-2);
}

.add-link-icon-option {
  min-height: var(--sg-control-height-lg);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  cursor: pointer;
}

.add-link-icon-option:hover {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}

.add-link-icon-option--selected {
  border-color: var(--sg-color-action);
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-action);
}

.friends-filter-button {
  width: var(--sg-sidebar-fill-size);
  min-height: var(--sg-sidebar-filter-height);
  border-radius: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar {
    transition: none;
  }

  .sidebar-resize-handle {
    transition: none;
  }
}

.sidebar-resize-handle {
  width: var(--sg-sidebar-resize-handle-width);
  background: var(--sg-color-transparent);
  transition: var(--sg-sidebar-gutter-transition);
}
.sidebar-resize-handle:hover {
  background: var(--sg-color-surface-muted);
}
.sidebar-resize-handle:focus-visible {
  background: var(--sg-color-surface-hover);
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}
</style>
