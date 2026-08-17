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
      :min-size="5"
      :max-size="SIDEBAR_MAX_SIZE"
      :collapsed-size="0"
      collapsible
      class="sidebar"
      :class="{ 'is-mobile': isSidebarMobile, 'icons-only': iconsOnly }"
    >
      <div
        class="sidebar-content"
        :class="{ 'content-centered': iconsOnly }"
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
          <Button
            icon="pi pi-home"
            :label="iconsOnly ? undefined : $t('sidebar.feed_button')"
            :aria-label="iconsOnly ? $t('sidebar.feed_button') : undefined"
            text
            :class="[
              'w-full',
              iconsOnly ? 'menu-button--centered' : 'menu-button--leading',
            ]"
            @click="emit('open-rightpanel-section', 'feed')"
          />
          <Button
            icon="pi pi-user"
            :label="iconsOnly ? undefined : $t('sidebar.profile_button')"
            :aria-label="iconsOnly ? $t('sidebar.profile_button') : undefined"
            text
            :class="[
              'w-full',
              iconsOnly ? 'menu-button--centered' : 'menu-button--leading',
            ]"
            @click="emit('open-rightpanel-section', 'profile')"
          />
          <Button
            icon="pi pi-bell"
            :label="iconsOnly ? undefined : $t('common.notifications')"
            :aria-label="iconsOnly ? $t('common.notifications') : undefined"
            :badge="'3'"
            text
            :class="[
              'w-full',
              iconsOnly ? 'menu-button--centered' : 'menu-button--leading',
            ]"
            @click="emit('open-rightpanel-section', 'notifications')"
          />
          <Button
            icon="pi pi-bookmark"
            :label="iconsOnly ? undefined : $t('sidebar.saved_button')"
            :aria-label="iconsOnly ? $t('sidebar.saved_button') : undefined"
            text
            :class="[
              'w-full',
              iconsOnly ? 'menu-button--centered' : 'menu-button--leading',
            ]"
            @click="emit('open-rightpanel-section', 'saved')"
          />
          <Button
            icon="pi pi-calendar"
            :label="iconsOnly ? undefined : $t('sidebar.events_button')"
            :aria-label="iconsOnly ? $t('sidebar.events_button') : undefined"
            text
            :class="[
              'w-full',
              iconsOnly ? 'menu-button--centered' : 'menu-button--leading',
            ]"
            @click="emit('open-rightpanel-section', 'events')"
          />
        </div>

        <div
          v-if="!iconsOnly"
          class="sidebar-widget-stack"
        >
          <div class="kanban-host">
            <div class="sidebar-widget">
              <button
                class="sidebar-widget__toggle"
                type="button"
                :aria-label="
                  isKanbanCollapsed ? 'Ouvrir Kanban' : 'Replier Kanban'
                "
                :aria-expanded="String(!isKanbanCollapsed)"
                @click="isKanbanCollapsed = !isKanbanCollapsed"
              >
                <span class="sidebar-widget__title">Kanban</span>
                <Button
                  class="sidebar-widget__link-action"
                  icon="pi pi-external-link"
                  text
                  size="small"
                  aria-label="Ouvrir Kanban"
                  @click.stop="openKanbanPage"
                />
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
              <div
                class="sidebar-widget__body sidebar-widget__body--kanban"
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
    </SplitterPanel>
  </SplitterGroup>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue"
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui"
import Button from "./ui/SgButton.vue"
import Avatar from "./ui/SgAvatar.vue"
import { useRouter } from "vue-router"
import { useMediaQuery } from "@/composables/useMediaQuery"
import { useProfilesStore } from "@/stores/profiles"
import {
  clampSidebarSize,
  isCompactSidebarSize,
  sidebarSizeForMode,
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
  "manage-profiles": []
  "edit-profile-avatar": []
}>()

const isSidebarMobile = useMediaQuery(
  `(max-width: ${RESPONSIVE_BREAKPOINTS.sidebarTablet}px)`,
)
const profilesStore = useProfilesStore()
const router = useRouter()

const toggleSidebar = () => emit("update:modelValue", !props.modelValue)

const iconsOnly = ref(false)
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
  router.push("/tasks")
}

onMounted(() => {
  isKanbanCollapsed.value = readBoolFromStorage(KANBAN_COLLAPSE_KEY, false)
  if (!props.modelValue) sidebarPanel.value?.collapse()
})

watch(isKanbanCollapsed, (isCollapsed) => {
  writeBoolToStorage(KANBAN_COLLAPSE_KEY, isCollapsed)
})


watch(iconsOnly, async (compact) => {
  await nextTick()
  sidebarPanel.value?.resize(sidebarSizeForMode(compact))
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
  iconsOnly.value = isCompactSidebarSize(newSize)
}
</script>

<style scoped>
.sidebar {
  background-color: var(--sg-color-surface-raised);
  border-left: 1px solid var(--sg-color-border);
  height: var(--sg-right-sidebar-viewport-height);
  margin-top: 0;
  transition: var(--sg-right-sidebar-transition);
  --right-sidebar-compact-icon-size: var(--sg-size-1rem);
}

.sidebar.icons-only {
  min-width: var(--sg-right-sidebar-compact-width);
  max-width: var(--sg-right-sidebar-compact-width);
  --right-sidebar-compact-icon-size: calc(var(--sg-size-1rem) * 3);
}

.sidebar.icons-only .menu-section :deep(.sg-button) {
  height: calc(var(--sg-right-sidebar-menu-row-height) * 1.33);
}

.sidebar.icons-only :deep(.sg-button__content .sg-icon),
.sidebar.icons-only :deep(.sidebar-toggle-button .sg-icon) {
  width: var(--right-sidebar-compact-icon-size);
  height: var(--right-sidebar-compact-icon-size);
}

.sidebar:not(.icons-only) {
  min-width: var(--sg-right-sidebar-expanded-min-width);
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
  justify-content: space-between;
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
  margin-bottom: var(--sg-right-sidebar-profile-spacing);
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

.menu-section :deep(.sg-button.menu-button--leading) {
  justify-content: flex-start;
  padding: 0 var(--sg-right-sidebar-menu-padding-inline);
}

.menu-section :deep(.sg-button.menu-button--centered) {
  justify-content: center;
  padding: 0;
  display: flex;
  align-items: center;
}

.menu-section :deep(.sg-button:hover) {
  background-color: var(--sg-color-surface-hover);
}

.menu-section :deep(.sg-button__badge) {
  position: absolute;
  top: var(--sg-right-sidebar-badge-inset);
  right: var(--sg-right-sidebar-badge-inset);
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

.sidebar-widget__toggle {
  margin: 0;
  border: 0;
  width: var(--sg-sidebar-fill-size);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-sidebar-control-gap);
  padding: var(--sg-sidebar-section-padding-block)
    var(--sg-sidebar-section-padding-inline);
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
  width: var(--sg-sidebar-resize-handle-width);
  background: var(--sg-color-transparent);
  transition: var(--sg-right-sidebar-gutter-transition);
}
.sidebar-resize-handle:hover {
  background: var(--sg-color-surface-muted);
}
.sidebar-resize-handle:focus-visible {
  background: var(--sg-color-surface-hover);
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-resize-handle {
    transition: var(--sg-motion-none);
  }
}
</style>
