<template>
  <SplitterGroup
    direction="horizontal"
    @layout="handleResize"
  >
    <SplitterPanel
      :default-size="100 - SIDEBAR_EXPANDED_SIZE"
      class="main-panel"
    >
      <slot></slot>
    </SplitterPanel>
    <SplitterResizeHandle
      v-show="modelValue"
      class="sidebar-resize-handle"
    />
    <SplitterPanel
      v-show="modelValue"
      ref="sidebarPanel"
      :default-size="SIDEBAR_EXPANDED_SIZE"
      :min-size="3"
      :max-size="SIDEBAR_MAX_SIZE"
      :collapsed-size="0"
      collapsible
      class="sidebar"
      :class="{ 'is-mobile': isSidebarMobile, 'icons-only': iconsOnly }"
    >
      <ContextMenuRoot @update:open="setGeneralMenuOpen">
      <ContextMenuTrigger as-child>
      <div
        ref="sidebarElement"
        class="sidebar-content"
        :class="{ 'content-centered': iconsOnly }"
        :style="sidebarStyle"
      >
        <div
          v-if="controlBarPosition === 'top'"
          class="sidebar-header"
          :class="{
            'sidebar-header--compact': iconsOnly,
            'sidebar-header--spaced': !iconsOnly,
          }"
        >
          <Button
            v-sg-tooltip.left="'Toggle right sidebar'"
            icon="pi pi-bars"
            text
            class="sidebar-toggle-button"
            aria-label="Toggle right sidebar"
            @click="toggleSidebar"
          />
        </div>

        <!-- Section profil -->
        <div class="profile-section">
          <div
            v-if="iconsOnly"
            class="profile-section__compact"
          >
            <ProfileSwitcher
              :icons-only="true"
              menu-direction="down"
              :show-avatar-trigger="true"
              avatar-trigger-size="large"
              @manage-profiles="emit('manage-profiles')"
              @open-settings="emit('open-settings')"
            />
          </div>
          <template v-if="!iconsOnly">
            <div class="profile-avatar">
              <Avatar
                :image="profilesStore.activeProfile?.avatar"
                :label="profilesStore.activeProfile?.emoji ?? '👤'"
                :alt="profilesStore.activeProfile?.name ?? 'Profil'"
                size="xlarge"
                shape="circle"
              />
              <button
                type="button"
                class="profile-avatar__edit"
                aria-label="Modifier l’image du profil"
                @click="emit('edit-profile-avatar')"
              >
                <SgIcon icon="pi pi-pencil" />
              </button>
            </div>
            <ProfileSwitcher
              :icons-only="false"
              menu-direction="down"
              trigger-variant="avatar-heading"
              @manage-profiles="emit('manage-profiles')"
              @open-settings="emit('open-settings')"
            />
          </template>
        </div>

        <!-- Menu principal -->
        <div class="menu-section">
          <SidebarNavButton
            icon="pi pi-home"
            :label="$t('sidebar.feed_button')"
            :compact="iconsOnly"
            @click="emit('open-rightpanel-section', 'feed')"
            @contextmenu.prevent.stop="emit('open-rightpanel-general', 'feed')"
          />
          <SidebarNavButton
            icon="pi pi-user"
            :label="$t('sidebar.profile_button')"
            :compact="iconsOnly"
            @click="emit('open-rightpanel-section', 'profile')"
            @contextmenu.prevent.stop="emit('open-rightpanel-general', 'profile')"
          />
          <SidebarNavButton
            icon="pi pi-bell"
            :label="$t('common.notifications')"
            :compact="iconsOnly"
            @click="emit('open-rightpanel-section', 'notifications')"
            @contextmenu.prevent.stop="emit('open-rightpanel-general', 'notifications')"
          >
            <template #icon>
              <span class="notification-bell">
                <SgIcon icon="pi pi-bell" />
                <span class="notification-bell__badge">3</span>
              </span>
            </template>
          </SidebarNavButton>
          <SidebarNavButton
            icon="pi pi-bookmark"
            :label="$t('sidebar.saved_button')"
            :compact="iconsOnly"
            @click="emit('open-rightpanel-section', 'saved')"
            @contextmenu.prevent.stop="emit('open-rightpanel-general', 'saved')"
          />
          <SidebarNavButton
            icon="pi pi-calendar"
            :label="$t('sidebar.events_button')"
            :compact="iconsOnly"
            @click="emit('open-rightpanel-section', 'events')"
            @contextmenu.prevent.stop="emit('open-rightpanel-general', 'events')"
          />
        </div>

        <div
          v-if="!iconsOnly"
          class="sidebar-widget-stack"
        >
          <div class="kanban-host">
            <div class="sidebar-widget">
              <div class="sidebar-widget__header">
              <button
                class="sidebar-widget__toggle"
                type="button"
                :aria-label="
                  isKanbanCollapsed ? 'Ouvrir Kanban' : 'Replier Kanban'
                "
                :aria-expanded="String(!isKanbanCollapsed)"
                @click="isKanbanCollapsed = !isKanbanCollapsed"
              >
                <span class="sidebar-widget__icon"><SgIcon icon="pi pi-table" /></span>
                <span class="sidebar-widget__title">Kanban</span>
                <span
                  aria-hidden="true"
                  class="sidebar-widget__spacer"
                ></span>
                <SgIcon
                  :icon="[
                    'pi',
                    isKanbanCollapsed ? 'pi-chevron-down' : 'pi-chevron-up',
                  ]"
                />
              </button>
              <button
                class="sidebar-widget__open-action"
                type="button"
                aria-label="Ouvrir Kanban"
                @click="openKanbanPage"
              ><SgIcon icon="pi pi-external-link" aria-hidden="true" /></button>
              </div>
              <div
                class="sidebar-widget__body sidebar-widget__body--kanban"
                :inert="isKanbanCollapsed"
                :aria-hidden="isKanbanCollapsed"
                :class="{
                  'sidebar-widget__body--collapsed': isKanbanCollapsed,
                }"
              >
                <KanbanSidebar />
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="controlBarPosition === 'bottom'"
          class="sidebar-bottom-toggle sidebar-bottom-toggle--right"
        >
          <Button
            v-sg-tooltip.left="'Toggle right sidebar'"
            icon="pi pi-bars"
            text
            class="sidebar-toggle-button"
            aria-label="Toggle right sidebar"
            @click="toggleSidebar"
          />
        </div>
      </div>
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="sidebar-network-context-menu" data-right-general-menu :side-offset="4">
          <ContextMenuItem class="sidebar-network-context-menu__item" @select="emit('open-settings')"><SgIcon icon="pi pi-cog" />{{ $t('common.settings') }}</ContextMenuItem>
          <ContextMenuItem class="sidebar-network-context-menu__item" @select="emit('manage-profiles')"><SgIcon icon="pi pi-users" />{{ $t('profiles.title') }}</ContextMenuItem>
          <ContextMenuSeparator class="theme-mode-separator" />
          <SidebarThemeMenu />
        </ContextMenuContent>
      </ContextMenuPortal>
      </ContextMenuRoot>
    </SplitterPanel>
  </SplitterGroup>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { ContextMenuRoot, ContextMenuTrigger, ContextMenuPortal, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui"
import SidebarThemeMenu from "./SidebarThemeMenu.vue"
import Button from "./ui/SgButton.vue"
import SidebarNavButton from "./SidebarNavButton.vue"
import Avatar from "./ui/SgAvatar.vue"
import { useMediaQuery } from "@/composables/useMediaQuery"
import { useProfilesStore } from "@/stores/profiles"
import { useSidebarSizing } from "../composables/useSidebarSizing"
import {
  clampSidebarSize,
  SIDEBAR_EXPANDED_SIZE,
  SIDEBAR_MAX_SIZE,
} from "./sidebarLayout"
import KanbanSidebar from "./kanban/KanbanSidebar.vue"
import ProfileSwitcher from "./ProfileSwitcher.vue"
import { RESPONSIVE_BREAKPOINTS } from "@/design-tokens"
import type { DesktopControlBarPosition } from "@/stores/desktopControlBar"

const props = defineProps<{
  modelValue: boolean
  controlBarPosition: DesktopControlBarPosition
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "open-settings": []
  "open-rightpanel-section": [sectionId: string]
  "open-rightpanel-general": [sectionId: string]
  "manage-profiles": []
  "edit-profile-avatar": []
  "open-tasks": []
}>()

const isSidebarMobile = useMediaQuery(
  `(max-width: ${RESPONSIVE_BREAKPOINTS.sidebarTablet}px)`,
)
const profilesStore = useProfilesStore()

let generalMenuOpen = false
function setGeneralMenuOpen(open: boolean) {
  if (open === generalMenuOpen) return
  generalMenuOpen = open
  window.dispatchEvent(new CustomEvent('communityglows-webview-overlay-state', { detail: { active: open } }))
}
onUnmounted(() => setGeneralMenuOpen(false))
const toggleSidebar = () => emit("update:modelValue", !props.modelValue)

const sidebarElement = ref<HTMLElement | null>(null)
const { compact: iconsOnly, style: sidebarStyle } = useSidebarSizing(sidebarElement)
const isKanbanCollapsed = ref(false)
const KANBAN_COLLAPSE_KEY = "communityglows-right-sidebar-kanban-collapsed"
const sidebarPanel = ref<{
  collapse: () => void
  getSize: () => number
  resize: (size: number) => void
} | null>(null)
const lastVisibleSidebarSize = ref(SIDEBAR_EXPANDED_SIZE)

const readBoolFromStorage = (key: string, fallback: boolean) => {
  try {
    const value = window.localStorage.getItem(key)
    if (value === null) return fallback
    return value === "1" || value.toLowerCase() === "true"
  } catch {
    return fallback
  }
}

const writeBoolToStorage = (key: string, value: boolean) => {
  try {
    window.localStorage.setItem(key, value ? "1" : "0")
  } catch {
    // noop
  }
}

const openKanbanPage = () => {
  emit('open-tasks')
}

onMounted(() => {
  isKanbanCollapsed.value = readBoolFromStorage(KANBAN_COLLAPSE_KEY, false)
  if (!props.modelValue) sidebarPanel.value?.collapse()
})

watch(isKanbanCollapsed, (isCollapsed) => {
  writeBoolToStorage(KANBAN_COLLAPSE_KEY, isCollapsed)
})


// Preserve the central slot's component identity across panel visibility
// changes. The previous v-if/v-else wrapper destroyed NetworkWebviewHost and
// made the native WebView2 instance briefly disappear before reopening.
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

const handleResize = (sizes: number[]) => {
  if (!props.modelValue) return
  const newSize = sizes[1]
  if (typeof newSize !== "number") return

  if (newSize > 0) lastVisibleSidebarSize.value = clampSidebarSize(newSize)
}
</script>

<style scoped>
.sidebar {
  background-color: var(--sg-color-surface-raised);
  height: var(--sg-right-sidebar-viewport-height);
  margin-top: 0;
}

.main-panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.sidebar-content {
  height: var(--sg-sidebar-fill-size);
  padding: var(--sg-right-sidebar-content-padding);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-control-gap);
  min-height: var(--sg-sidebar-header-height);
  margin-bottom: var(--sg-sidebar-section-gap);
}

.sidebar-header--spaced {
  justify-content: flex-end;
}

.sidebar-header--compact {
  flex-direction: column;
  align-items: stretch;
  gap: var(--sg-sidebar-subsection-spacing);
  min-height: auto;
}

.sidebar-header--compact :deep(.sg-button) {
  width: var(--sg-sidebar-fill-size);
  justify-content: center;
}

.sidebar-toggle-button {
  width: fit-content;
  margin-left: auto;
}

.sidebar-bottom-toggle {
  position: sticky;
  bottom: 0;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: var(--sg-sidebar-header-height);
  margin-top: auto;
  background-color: var(--sg-color-surface-raised);
}

.sidebar-bottom-toggle--right {
  justify-content: flex-end;
}

.sidebar-header--compact .sidebar-toggle-button {
  width: var(--sg-sidebar-fill-size);
  justify-content: center;
  margin-left: 0;
}

.content-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-centered .menu-section {
  width: var(--sg-sidebar-fill-size);
}

.profile-section {
  position: relative;
  margin-bottom: var(--sg-right-sidebar-profile-spacing);
}

.sidebar:not(.icons-only) .profile-section::after {
  content: '';
  position: absolute;
  inset-inline: calc(-1 * var(--sg-right-sidebar-content-padding));
  bottom: 0;
  border-bottom: 1px solid var(--sg-color-border);
  pointer-events: none;
}

.profile-section :deep(.profile-switcher.avatar-heading) {
  border-bottom-color: transparent;
}

.profile-avatar {
  position: relative;
  width: fit-content;
  margin-inline: auto;
  margin-bottom: var(--sg-sidebar-subsection-spacing);
  text-align: center;
}
.profile-avatar__edit {
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  width: var(--sg-control-height-sm);
  height: var(--sg-control-height-sm);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: var(--sg-motion-opacity-0d15s), var(--sg-motion-transform-0d15s);
  transform: scale(0.9);
}

.profile-avatar__edit:hover {
  background: var(--sg-color-surface-hover);
}

.profile-avatar__edit:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.profile-avatar:hover .profile-avatar__edit,
.profile-avatar:focus-within .profile-avatar__edit {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: var(--sg-right-sidebar-menu-gap);
}

.menu-section :deep(.sg-button) {
  height: var(--sg-right-sidebar-menu-row-height);
  position: relative;
}

.menu-section :deep(.sg-button:hover) {
  background-color: var(--sg-color-surface-hover);
}

.notification-bell { position: relative; display: inline-flex; align-items: center; }
.notification-bell__badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  display: grid;
  place-items: center;
  min-width: var(--sg-right-sidebar-badge-size);
  height: var(--sg-right-sidebar-badge-size);
  padding-inline: var(--sg-space-1);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-danger);
  color: #fff;
  font-size: var(--sg-font-size-0d65rem);
  line-height: 1;
  font-weight: 700;
}

.kanban-host {
  width: var(--sg-sidebar-fill-size);
}


.sidebar-widget-stack {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-section-spacing);
  min-height: 0;
}

.kanban-host {
  min-height: 0;
  position: relative;
}

.sidebar-widget {
  background: transparent;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  overflow: hidden;
}

.sidebar-widget__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--sg-control-height-sm);
  align-items: center;
  padding-right: var(--sg-space-2);
  background: var(--sg-color-surface-raised);
}

.sidebar-widget__open-action {
  display: inline-grid;
  place-items: center;
  width: var(--sg-control-height-sm);
  height: var(--sg-control-height-sm);
  padding: 0;
  border: 0;
  border-radius: var(--sg-radius-sm);
  background: transparent;
  color: var(--sg-color-text-muted);
  cursor: pointer;
}

.sidebar-widget__open-action:hover {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}

.sidebar-widget__open-action:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: calc(-1 * var(--sg-focus-offset));
}

.sidebar-widget__toggle {
  min-width: 0;
  margin: 0;
  border: 0;
  width: var(--sg-sidebar-fill-size);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--sg-sidebar-control-gap);
  padding: var(--sg-sidebar-section-padding-block)
    var(--sg-sidebar-network-row-padding-inline);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  cursor: pointer;
  font: inherit;
}

.sidebar-widget__toggle:hover {
  background: var(--sg-color-surface-hover);
}

.sidebar-widget__toggle:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.sidebar-widget__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--sg-sidebar-section-title-size);
  font-weight: 600;
  color: var(--sg-color-text-muted);
}

.sidebar-widget__spacer {
  flex: 1;
}

.sidebar-widget__link-action {
  flex-shrink: 0;
  width: auto;
  min-width: auto;
  padding: 0;
}

.sidebar-widget__link-action :deep(.sg-button__icon) {
  margin: 0;
}

.sidebar-widget__link-action:deep(.sg-button__content) {
  gap: 0;
}

.sidebar-widget__body {
  overflow: hidden;
  transition:
    max-height var(--sg-motion-all-0d2s-ease),
    opacity var(--sg-motion-all-0d2s-ease);
  opacity: 1;
}

.sidebar-widget__body--kanban {
  max-height: var(--sg-right-sidebar-widget-kanban-max-height);
}


.sidebar-widget__body--collapsed {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.icons-only .menu-section :deep(.sg-button__badge) {
  right: var(--sg-right-sidebar-badge-compact-offset);
  top: 0;
  transform: scale(0.8);
  min-width: var(--sg-right-sidebar-badge-size);
  height: var(--sg-right-sidebar-badge-size);
}

.sidebar.is-mobile {
  width: var(--sg-sidebar-fill-size);
  background-color: var(--sg-color-surface-overlay);
}

.sidebar-resize-handle {
  position: relative;
  width: var(--sg-sidebar-resize-handle-width);
  background: var(--sg-color-surface-raised);
}


.sidebar .sidebar-content :deep(button:focus-visible) {
  outline-offset: calc(-1 * var(--sg-focus-offset));
}

.sidebar-widget__icon {
  display: inline-flex;
  justify-content: center;
  flex: 0 0 calc(var(--sg-sidebar-effective-icon-size) + 2 * var(--sg-space-1));
  width: calc(var(--sg-sidebar-effective-icon-size) + 2 * var(--sg-space-1));
}
.sidebar-resize-handle::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: var(--sg-radius-lg);
  height: var(--sg-radius-lg);
  background: radial-gradient(circle at top right, transparent var(--sg-radius-lg), var(--sg-color-background) var(--sg-radius-lg));
  pointer-events: none;
  z-index: 1;
}
.sidebar-resize-handle:hover {
  background: var(--sg-color-surface-raised);
}
.sidebar-resize-handle:focus-visible {
  background: var(--sg-color-surface-raised);
  outline: none;
}
.sidebar-resize-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sg-space-1);
  height: calc(4 * var(--sg-space-2));
  transform: translate(-50%, -50%);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-border-strong);
  opacity: 0;
  pointer-events: none;
}
.sidebar-resize-handle:hover::before,
.sidebar-resize-handle[data-resize-handle-state='drag']::before {
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-resize-handle {
    transition: var(--sg-motion-none);
  }
}
</style>
