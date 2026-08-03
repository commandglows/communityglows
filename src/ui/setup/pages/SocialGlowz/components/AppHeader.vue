<template>
  <header class="header">
    <div class="header-start">
      <Button
        v-sg-tooltip.bottom="'Toggle left sidebar'"
        icon="pi pi-bars"
        text
        aria-label="Toggle left sidebar"
        @click="toggleLeftSidebar"
      />
      <h1 class="app-title">SocialGlowz</h1>
    </div>

    <div class="header-center">
      <div class="search-container">
        <span class="search-field">
          <i class="pi pi-search" />
          <SgInput
            placeholder="Rechercher..."
            aria-label="Rechercher"
            class="search-input"
          />
        </span>
      </div>
      <div class="filters-container">
        <DashboardFilters 
          :current-network="currentNetwork"
          @filter-change="handleFilterChange"
        />
      </div>
    </div>

    <div class="header-end">
      <Button
        v-sg-tooltip.bottom="diagnosticsCopied ? 'Diagnostic copié' : 'Copier le diagnostic'"
        :icon="diagnosticsCopied ? 'pi pi-check' : 'pi pi-info-circle'"
        text
        :aria-label="diagnosticsCopied ? 'Diagnostic copié' : 'Copier le diagnostic'"
        @click="copyDiagnostics"
      />
      <Button
        v-sg-tooltip.bottom="$t('common.settings')"
        icon="pi pi-cog"
        text
        :aria-label="$t('common.settings')"
        @click="openSettings"
      />
      <Button
        v-sg-tooltip.bottom="'Toggle right sidebar'"
        icon="pi pi-bars"
        text
        aria-label="Toggle right sidebar"
        @click="toggleRightSidebar"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from './ui/SgButton.vue'
import SgInput from './ui/SgInput.vue'
import DashboardFilters from './DashboardFilters.vue'
import type { MenuItem } from '../types'
import { buildDiagnosticsReport } from '@/lib/buildDiagnostics'
import { getPlatformCapabilities } from '@/platform/capabilities'
import { useProfilesStore } from '@/stores/profiles'
import { useWebviewStore } from '@/stores/webviewState'

const props = defineProps<{
  sidebarVisible: boolean
  rightSidebarVisible: boolean
}>()

interface DashboardFiltersPayload {
  dateRange: [Date | null, Date | null]
  quickDate: string | null
  selectedFilters: string[]
  sort: string | null
}

const emit = defineEmits<{
  'update:sidebarVisible': [value: boolean]
  'update:rightSidebarVisible': [value: boolean]
  'filter-change': [filters: DashboardFiltersPayload]
  'open-settings': []
}>()

const route = useRoute()
const profilesStore = useProfilesStore()
const webviewStore = useWebviewStore()
const diagnosticsCopied = ref(false)
const currentNetwork = computed<MenuItem | null>(() => {
  if (route.path === '/' || route.path === '/login') return null

  const label = String(route.name)
  return {
    id: -1,
    label,
    icon: 'pi pi-globe',
    route: route.path
  }
})

const toggleLeftSidebar = () => {
  emit('update:sidebarVisible', !props.sidebarVisible)
}

const toggleRightSidebar = () => {
  emit('update:rightSidebarVisible', !props.rightSidebarVisible)
}

const handleFilterChange = (filters: DashboardFiltersPayload) => {
  emit('filter-change', filters)
}

const openSettings = () => {
  emit('open-settings')
}

async function copyDiagnostics() {
  const capabilities = getPlatformCapabilities()
  const report = buildDiagnosticsReport({
    surface: 'desktop-header',
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
  window.setTimeout(() => {
    diagnosticsCopied.value = false
  }, 2000)
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: auto;
  min-height: var(--sg-size-4rem);
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  padding: var(--sg-space-0-1rem);
  z-index: var(--sg-layer-1000);
}

.header-start {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1rem);
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
}

.search-container {
  max-width: var(--sg-size-300px);
  width: var(--sg-size-100pct);
  position: relative;
  margin-right: var(--sg-space-1rem);
}

.search-container .search-field {
  width: var(--sg-size-100pct);
  display: flex;
  align-items: center;
}

.search-container .search-field i {
  left: var(--sg-position-0d75rem);
  top: var(--sg-position-50pct);
  transform: translateY(-50%);
}

.search-container :deep(.sg-input) {
  padding-left: var(--sg-space-2d5rem);
  width: var(--sg-size-100pct);
}

.filters-container {
  flex: 1;
  max-width: var(--sg-size-800px);
  display: flex;
  align-items: center;
}

.header-end {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1rem);
}

.app-title {
  margin: 0;
  font-size: var(--sg-font-size-1d5rem);
  color: var(--primary-color);
}

@media (max-width: 1200px) {
  .header-center {
    flex-direction: column;
    gap: var(--sg-space-1rem);
  }

  .search-container,
  .filters-container {
    max-width: var(--sg-size-100pct);
  }
}

@media (max-width: 768px) {
  .header {
    height: var(--sg-size-4rem);
    min-height: var(--sg-size-4rem);
  }

  .header-center {
    display: none;
  }
}
</style> 
