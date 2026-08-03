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
        :class="{ 'icons-only': iconsOnly }"
      >
        <div
          class="sidebar-content"
          :class="{ 'content-centered': iconsOnly }"
        >
          <div
            class="sidebar-header"
            :class="{ 'justify-content-center': iconsOnly, 'justify-content-between': !iconsOnly }"
          >
            <div class="sidebar-actions">
              <Button
                v-sg-tooltip.left="diagnosticsCopied ? 'Diagnostic copié' : 'Copier le diagnostic'"
                :icon="diagnosticsCopied ? 'pi pi-check' : 'pi pi-info-circle'"
                text
                :aria-label="diagnosticsCopied ? 'Diagnostic copié' : 'Copier le diagnostic'"
                @click="copyDiagnostics"
              />
              <Button
                v-if="!iconsOnly"
                v-sg-tooltip.left="$t('common.settings')"
                icon="pi pi-cog"
                text
                :aria-label="$t('common.settings')"
                @click="emit('open-settings')"
              />
            </div>
            <Button
              v-sg-tooltip.left="'Toggle right sidebar'"
              icon="pi pi-bars"
              text
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
            <h3>{{ profilesStore.activeProfile?.name ?? 'Profil' }}</h3>
            <p>{{ profilesStore.profiles.length }} {{ profilesStore.profiles.length > 1 ? 'profils' : 'profil' }}</p>
            <ProfileSwitcher :icons-only="false" />
            <Button
              label="Ajouter un profil"
              icon="pi pi-plus"
              text
              size="small"
              @click="openProfileCreator"
            />
          </div>

          <!-- Menu principal -->
          <div class="menu-section">
            <Button
              icon="pi pi-home"
              :label="iconsOnly ? undefined : $t('sidebar.feed_button')"
              :aria-label="iconsOnly ? $t('sidebar.feed_button') : undefined"
              text
              :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']"
            />
            <Button
              icon="pi pi-user"
              :label="iconsOnly ? undefined : $t('sidebar.profile_button')"
              :aria-label="iconsOnly ? $t('sidebar.profile_button') : undefined"
              text
              :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']"
            />
            <Button
              icon="pi pi-users"
              :label="iconsOnly ? undefined : $t('sidebar.friends_button')"
              :aria-label="iconsOnly ? $t('sidebar.friends_button') : undefined"
              text
              :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']"
            />
            <Button
              icon="pi pi-bell"
              :label="iconsOnly ? undefined : $t('common.notifications')"
              :aria-label="iconsOnly ? $t('common.notifications') : undefined"
              :badge="'3'"
              text
              :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']"
            />
            <Button
              icon="pi pi-bookmark"
              :label="iconsOnly ? undefined : $t('sidebar.saved_button')"
              :aria-label="iconsOnly ? $t('sidebar.saved_button') : undefined"
              text
              :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']"
            />
            <Button
              icon="pi pi-calendar"
              :label="iconsOnly ? undefined : $t('sidebar.events_button')"
              :aria-label="iconsOnly ? $t('sidebar.events_button') : undefined"
              text
              :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']"
            />
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </template>
  <template v-else>
    <Button
      v-sg-tooltip.left="'Ouvrir le panneau droit'"
      icon="pi pi-bars"
      text
      aria-label="Ouvrir le panneau droit"
      class="sidebar-reopen sidebar-reopen--right"
      @click="toggleSidebar"
    />
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import Button from './ui/SgButton.vue'
import Avatar from './ui/SgAvatar.vue'
import { useProfilesStore } from '@/stores/profiles'
import ProfileSwitcher from './ProfileSwitcher.vue'
import { buildDiagnosticsReport } from '@/lib/buildDiagnostics'
import { getPlatformCapabilities } from '@/platform/capabilities'
import { useWebviewStore } from '@/stores/webviewState'
import { isCompactSidebarSize, sidebarSizeForMode, SIDEBAR_EXPANDED_SIZE } from './sidebarLayout'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-settings': []
}>()

const webviewStore = useWebviewStore()
const diagnosticsCopied = ref(false)

const toggleSidebar = () => emit('update:modelValue', !props.modelValue)

async function copyDiagnostics() {
  const capabilities = getPlatformCapabilities()
  const report = buildDiagnosticsReport({
    surface: 'desktop-right-sidebar',
    active_network: webviewStore.activeNetworkId ?? 'none',
    profile_selected: profilesStore.activeProfileId ? 'yes' : 'no',
    profile_count: String(profilesStore.profiles.length),
    desktop_tauri: String(capabilities.isDesktopTauri),
    native_webview: String(capabilities.supportsNativeWebview),
    native_session_isolation: String(capabilities.supportsNativeSessionIsolation),
  })

  try {
    await navigator.clipboard.writeText(report)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = report
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  diagnosticsCopied.value = true
  window.setTimeout(() => { diagnosticsCopied.value = false }, 2000)
}

const iconsOnly = ref(false)
const profilesStore = useProfilesStore()
const sidebarPanel = ref<{ resize: (size: number) => void } | null>(null)

watch(iconsOnly, async compact => {
  await nextTick()
  sidebarPanel.value?.resize(sidebarSizeForMode(compact))
})

const openProfileCreator = () => {
  window.dispatchEvent(new CustomEvent('sfz-create-profile'))
}

const handleResize = (sizes: number[]) => {
  const newSize = sizes[1]
  if (typeof newSize !== 'number') return

  iconsOnly.value = isCompactSidebarSize(newSize)
}

</script>

<style scoped>
.sidebar {
  background-color: var(--surface-card);
  border-left: 1px solid var(--surface-border);
  height: var(--sg-right-sidebar-viewport-height);
  margin-top: 0;
  transition: var(--sg-right-sidebar-transition);
}

.sidebar-reopen {
  position: fixed;
  top: var(--sg-sidebar-control-padding);
  z-index: var(--sg-sidebar-overlay-z-index, 1100);
  color: var(--text-color);
  background: transparent;
}

.sidebar-reopen--right {
  right: var(--sg-sidebar-control-padding);
}

.sidebar-reopen:hover {
  background: var(--surface-hover);
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

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-control-gap);
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
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: var(--sg-right-sidebar-profile-spacing);
}

.profile-section h3 {
  margin: var(--sg-right-sidebar-profile-title-margin-block-start) 0 var(--sg-right-sidebar-profile-title-margin-block-end);
  font-size: var(--sg-right-sidebar-profile-title-size);
}

.profile-section p {
  color: var(--text-color-secondary);
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

.menu-section :deep(.sg-button.justify-content-start) {
  padding: 0 var(--sg-right-sidebar-menu-padding-inline);
}

.menu-section :deep(.sg-button.justify-content-center) {
  padding: 0;
  display: flex;
  align-items: center;
}

.menu-section :deep(.sg-button:hover) {
  background-color: var(--surface-hover);
}

.menu-section :deep(.sg-button__badge) {
  position: absolute;
  top: var(--sg-right-sidebar-badge-inset);
  right: var(--sg-right-sidebar-badge-inset);
}

.icons-only .menu-section :deep(.sg-button__badge) {
  right: var(--sg-right-sidebar-badge-compact-offset);
  top: 0;
  transform: scale(0.8);
  min-width: var(--sg-right-sidebar-badge-size);
  height: var(--sg-right-sidebar-badge-size);
}

@media (max-width: 768px) {
  .sidebar {
    width: var(--sg-sidebar-fill-size);
    background-color: var(--surface-overlay);
  }
}

.sidebar-resize-handle { width: var(--sg-sidebar-resize-handle-width); background: var(--surface-border); transition: var(--sg-right-sidebar-gutter-transition); }
.sidebar-resize-handle:hover { background: var(--primary-color); }
.sidebar-resize-handle:focus-visible { background: var(--primary-color); outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-resize-handle {
    transition: var(--sg-motion-none);
  }
}
</style> 
