<template>
  <template v-if="modelValue">
    <SplitterGroup
      direction="horizontal"
      @layout="handleResize"
    >
      <SplitterPanel :default-size="100 - SIDEBAR_EXPANDED_SIZE">
        <slot></slot>
      </SplitterPanel>
      <SplitterResizeHandle class="sidebar-resize-handle" />
      <SplitterPanel
        ref="sidebarPanel"
        :default-size="SIDEBAR_EXPANDED_SIZE"
        :min-size="5"
        class="sidebar"
        :class="{ 'is-mobile': isSidebarMobile, 'icons-only': iconsOnly }"
      >
        <div
          class="sidebar-content"
          :class="{ 'content-centered': iconsOnly }"
        >
          <div
            class="sidebar-header"
            :class="{
              'sidebar-header--compact': iconsOnly,
              'sidebar-header--spaced': !iconsOnly,
            }"
          >
            <div
              class="sidebar-actions"
              :class="{ 'sidebar-actions--compact': iconsOnly }"
            >
              <Button
                v-sg-tooltip.left="
                  diagnosticsCopied
                    ? 'Diagnostic copié'
                    : 'Copier le diagnostic'
                "
                :icon="diagnosticsCopied ? 'pi pi-check' : 'pi pi-info-circle'"
                text
                :class="['sidebar-header-button', { 'w-full': iconsOnly }]"
                :aria-label="
                  diagnosticsCopied
                    ? 'Diagnostic copié'
                    : 'Copier le diagnostic'
                "
                @click="copyDiagnostics"
              />
              <Button
                v-sg-tooltip.left="$t('common.settings')"
                icon="pi pi-cog"
                text
                :class="['sidebar-header-button', { 'w-full': iconsOnly }]"
                :aria-label="$t('common.settings')"
                @click="emit('open-settings')"
              />
            </div>
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
          <div
            v-show="!iconsOnly"
            class="profile-section"
          >
            <Avatar
              v-if="profilesStore.activeProfile?.avatar"
              :image="profilesStore.activeProfile.avatar"
              size="xlarge"
              shape="circle"
            />
            <Avatar
              v-else
              :label="profilesStore.activeProfile?.emoji ?? '👤'"
              size="xlarge"
              shape="circle"
            />
            <h3>{{ profilesStore.activeProfile?.name ?? "Profil" }}</h3>
            <p>
              {{ profilesStore.profiles.length }}
              {{ profilesStore.profiles.length > 1 ? "profils" : "profil" }}
            </p>
            <Button
              label="Gérer les profils"
              icon="pi pi-cog"
              text
              size="small"
              @click="emit('manage-profiles')"
            />
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
              icon="pi pi-users"
              :label="iconsOnly ? undefined : $t('sidebar.friends_button')"
              :aria-label="iconsOnly ? $t('sidebar.friends_button') : undefined"
              text
              :class="[
                'w-full',
                iconsOnly ? 'menu-button--centered' : 'menu-button--leading',
              ]"
              @click="emit('open-rightpanel-section', 'friends')"
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
            class="kanban-host"
          >
            <div class="sidebar-widget">
              <button
                class="sidebar-widget__toggle"
                type="button"
                :aria-label="
                  isKanbanCollapsed
                    ? 'Replier puis ouvrir Kanban'
                    : 'Déplier et réduire Kanban'
                "
                :aria-expanded="String(!isKanbanCollapsed)"
                @click="isKanbanCollapsed = !isKanbanCollapsed"
              >
                <span class="sidebar-widget__title">Kanban</span>
                <span class="sidebar-widget__state">
                  {{ isKanbanCollapsed ? "Replié" : "Déplié" }}
                </span>
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

          <div
            v-if="!iconsOnly"
            class="crm-host"
          >
            <div class="sidebar-widget">
              <button
                class="sidebar-widget__toggle"
                type="button"
                :aria-label="
                  isCrmCollapsed
                    ? 'Replier puis ouvrir CRM'
                    : 'Déplier et réduire CRM'
                "
                :aria-expanded="String(!isCrmCollapsed)"
                @click="isCrmCollapsed = !isCrmCollapsed"
              >
                <span class="sidebar-widget__title">CRM</span>
                <span class="sidebar-widget__state">
                  {{ isCrmCollapsed ? "Replié" : "Déplié" }}
                </span>
                <SgIcon
                  :icon="[
                    'pi',
                    isCrmCollapsed ? 'pi-chevron-down' : 'pi-chevron-up',
                  ]"
                />
              </button>
              <div
                class="sidebar-widget__body sidebar-widget__body--crm"
                :class="{ 'sidebar-widget__body--collapsed': isCrmCollapsed }"
              >
                <CrmSidebarWidget />
              </div>
            </div>
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue"
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from "reka-ui"
import Button from "./ui/SgButton.vue"
import Avatar from "./ui/SgAvatar.vue"
import { useProfilesStore } from "@/stores/profiles"
import { useMediaQuery } from "@/composables/useMediaQuery"
import { buildDiagnosticsReport } from "@/lib/buildDiagnostics"
import { getPlatformCapabilities } from "@/platform/capabilities"
import { useWebviewStore } from "@/stores/webviewState"
import {
  isCompactSidebarSize,
  sidebarSizeForMode,
  SIDEBAR_EXPANDED_SIZE,
} from "./sidebarLayout"
import KanbanSidebar from "./kanban/KanbanSidebar.vue"
import CrmSidebarWidget from "./CrmSidebarWidget.vue"
import { RESPONSIVE_BREAKPOINTS } from "@/design-tokens"

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "open-settings": []
  "open-rightpanel-section": [sectionId: string]
  "manage-profiles": []
}>()

const webviewStore = useWebviewStore()
const isSidebarMobile = useMediaQuery(
  `(max-width: ${RESPONSIVE_BREAKPOINTS.sidebarTablet}px)`,
)
const diagnosticsCopied = ref(false)

const toggleSidebar = () => emit("update:modelValue", !props.modelValue)

async function copyDiagnostics() {
  const capabilities = getPlatformCapabilities()
  const report = buildDiagnosticsReport({
    surface: "desktop-right-sidebar",
    active_network: webviewStore.activeNetworkId ?? "none",
    profile_selected: profilesStore.activeProfileId ? "yes" : "no",
    profile_count: String(profilesStore.profiles.length),
    desktop_tauri: String(capabilities.isDesktopTauri),
    native_webview: String(capabilities.supportsNativeWebview),
    native_session_isolation: String(
      capabilities.supportsNativeSessionIsolation,
    ),
  })

  try {
    await navigator.clipboard.writeText(report)
  } catch {
    const textarea = document.createElement("textarea")
    textarea.value = report
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
  }

  diagnosticsCopied.value = true
  window.setTimeout(() => {
    diagnosticsCopied.value = false
  }, 2000)
}

const iconsOnly = ref(false)
const profilesStore = useProfilesStore()
const isKanbanCollapsed = ref(false)
const isCrmCollapsed = ref(true)
const KANBAN_COLLAPSE_KEY = "communityglows-right-sidebar-kanban-collapsed"
const CRM_COLLAPSE_KEY = "communityglows-right-sidebar-crm-collapsed"
const sidebarPanel = ref<{ resize: (size: number) => void } | null>(null)

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

onMounted(() => {
  isKanbanCollapsed.value = readBoolFromStorage(KANBAN_COLLAPSE_KEY, false)
  isCrmCollapsed.value = readBoolFromStorage(CRM_COLLAPSE_KEY, true)
})

watch(isKanbanCollapsed, (isCollapsed) => {
  writeBoolToStorage(KANBAN_COLLAPSE_KEY, isCollapsed)
})

watch(isCrmCollapsed, (isCollapsed) => {
  writeBoolToStorage(CRM_COLLAPSE_KEY, isCollapsed)
})

watch(iconsOnly, async (compact) => {
  await nextTick()
  sidebarPanel.value?.resize(sidebarSizeForMode(compact))
})

const handleResize = (sizes: number[]) => {
  const newSize = sizes[1]
  if (typeof newSize !== "number") return

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
}

.sidebar.icons-only {
  min-width: var(--sg-right-sidebar-compact-width);
  max-width: var(--sg-right-sidebar-compact-width);
}

.sidebar:not(.icons-only) {
  min-width: var(--sg-right-sidebar-expanded-min-width);
}

.sidebar-content {
  height: var(--sg-sidebar-fill-size);
  padding: var(--sg-right-sidebar-content-padding);
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

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-control-gap);
}

.sidebar-actions--compact {
  width: var(--sg-sidebar-fill-size);
  flex-direction: column;
  gap: var(--sg-sidebar-subsection-spacing);
}

.sidebar-header-button {
  height: var(--sg-right-sidebar-menu-row-height);
}

.sidebar-header--compact :deep(.sg-button) {
  width: var(--sg-sidebar-fill-size);
  justify-content: center;
}

.sidebar-toggle-button {
  width: fit-content;
}

.sidebar-header--compact .sidebar-toggle-button {
  width: var(--sg-sidebar-fill-size);
  justify-content: center;
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
  text-align: center;
  padding-bottom: var(--sg-right-sidebar-profile-spacing);
  border-bottom: 1px solid var(--sg-color-border);
  margin-bottom: var(--sg-right-sidebar-profile-spacing);
}

.profile-section h3 {
  margin: var(--sg-right-sidebar-profile-title-margin-block-start) 0
    var(--sg-right-sidebar-profile-title-margin-block-end);
  font-size: var(--sg-right-sidebar-profile-title-size);
}

.profile-section p {
  color: var(--sg-color-text-muted);
  margin: 0;
  font-size: var(--sg-right-sidebar-profile-copy-size);
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
  margin-top: var(--sg-sidebar-section-spacing);
  min-height: 0;
}

.crm-host {
  margin-top: var(--sg-sidebar-section-spacing);
  min-height: 0;
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

.sidebar-widget__state {
  margin-left: auto;
  margin-right: var(--sg-sidebar-control-gap);
  font-size: var(--sg-font-size-0d8rem);
  color: var(--sg-color-text-muted);
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

.sidebar-widget__body--crm {
  max-height: var(--sg-right-sidebar-widget-crm-max-height);
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
  background: var(--sg-color-border);
  transition: var(--sg-right-sidebar-gutter-transition);
}
.sidebar-resize-handle:hover {
  background: var(--sg-color-action);
}
.sidebar-resize-handle:focus-visible {
  background: var(--sg-color-action);
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
