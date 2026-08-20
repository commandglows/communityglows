<template>
  <section
    class="desktop-workspace"
    aria-label="Workspace multi-réseaux"
  >
    <header class="desktop-workspace__toolbar">
      <div class="desktop-workspace__identity">
        <SgIcon
          icon="pi pi-th-large"
          aria-hidden="true"
        />
        <span>Bento</span>
      </div>

      <SgSelect
        v-model="selectedLayoutId"
        class="desktop-workspace__layout-select"
        :options="layoutOptions"
        placeholder="Layouts enregistrés"
        aria-label="Charger un layout"
        :disabled="layoutOptions.length === 0"
        @update:model-value="loadNamedLayout"
      />
      <SgInput
        v-model="layoutName"
        class="desktop-workspace__name"
        maxlength="64"
        placeholder="Nom du layout"
        aria-label="Nom du layout"
        @keydown.enter="saveNamedLayout"
      />

      <div class="desktop-workspace__actions">
        <SgButton
          icon="pi pi-save"
          label="Enregistrer"
          size="small"
          @click="saveNamedLayout"
        />
        <SgButton
          icon="pi pi-plus"
          text
          size="small"
          aria-label="Nouveau layout"
          tooltip="Nouveau layout"
          @click="startNewLayout"
        />
        <SgButton
          icon="pi pi-refresh"
          text
          size="small"
          aria-label="Réinitialiser le layout"
          tooltip="Réinitialiser le layout"
          @click="resetCurrentLayout"
        />
        <SgButton
          icon="pi pi-trash"
          text
          severity="danger"
          size="small"
          aria-label="Supprimer le layout enregistré"
          tooltip="Supprimer le layout enregistré"
          :disabled="!workspaceState.selectedLayoutId"
          @click="deleteNamedLayout"
        />
      </div>
    </header>

    <div class="desktop-workspace__dock">
      <DockviewVue
        class="desktop-workspace__dockview"
        :theme="dockviewTheme"
        :disable-floating-groups="true"
        :keyboard-navigation="true"
        :layout-history="{ enabled: true }"
        @ready="onDockviewReady"
      >
        <template #network="{ params, api, containerApi }">
          <NetworkWorkspacePanel
            :params="params"
            :api="api"
            :container-api="containerApi"
          />
        </template>
      </DockviewVue>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, provide, ref, shallowRef, watch } from 'vue'
import { push } from 'notivue'
import {
  DockviewVue,
  themeDark,
  themeLight,
  type DockviewApi,
  type DockviewReadyEvent,
  type GroupDragEvent,
  type SerializedDockview,
  type TabDragEvent,
} from 'dockview-vue'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import { DESKTOP_WORKSPACE_CONSTRAINTS } from '@/design-tokens'
import {
  clearDesktopWorkspaceAutosave,
  deleteDesktopWorkspaceLayout,
  isNetworkWorkspacePanelParams,
  isSafeDesktopWorkspaceLayout,
  loadDesktopWorkspaceAutosave,
  loadDesktopWorkspaceState,
  persistDesktopWorkspaceAutosave,
  persistDesktopWorkspaceState,
  saveDesktopWorkspaceLayout,
  type NetworkWorkspacePanelParams,
} from '@/lib/desktopWorkspaceLayouts'
import { useCustomLinksStore } from '@/stores/customLinks'
import { useProfilesStore } from '@/stores/profiles'
import { useThemeStore } from '@/stores/theme'
import { useWebviewStore } from '@/stores/webviewState'
import SgButton from './ui/SgButton.vue'
import SgIcon from './ui/SgIcon.vue'
import SgInput from './ui/SgInput.vue'
import SgSelect from './ui/SgSelect.vue'
import NetworkWorkspacePanel from './NetworkWorkspacePanel.vue'
import { workspaceWebviewsSuspendedKey } from './workspaceContext'

const props = withDefaults(
  defineProps<{
    suspended?: boolean
  }>(),
  {
    suspended: false,
  },
)
const emit = defineEmits<{
  contentChange: [hasContent: boolean]
}>()

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const customLinksStore = useCustomLinksStore()
const networkById = new Map(
  builtInSocialNetworks.map((network) => [network.id, network]),
)
const workspaceNetworkCatalog = computed(() => {
  const catalog = new Map(
    builtInSocialNetworks.map((network) => [
      network.id,
      { canonicalUrl: network.url, allowSubdomains: true },
    ]),
  )
  for (const link of customLinksStore.getLinks(profilesStore.activeProfileId)) {
    catalog.set(link.id, {
      canonicalUrl: link.url,
      allowSubdomains: false,
    })
  }
  return catalog
})
const dockviewApi = shallowRef<DockviewApi | null>(null)
const workspaceState = ref(
  loadDesktopWorkspaceState(localStorage, workspaceNetworkCatalog.value),
)
const layoutName = ref('')
const dockDragActive = ref(false)
const disposables: Array<{ dispose: () => void }> = []
let autosaveTimer: number | undefined
let dockDragWatchdog: number | undefined
let restoringLayout = false
const DOCK_DRAG_WATCHDOG_MS = 15_000

const workspaceSuspended = computed(
  () => props.suspended || dockDragActive.value,
)
provide(workspaceWebviewsSuspendedKey, workspaceSuspended)

const dockviewTheme = computed(() =>
  themeStore.isDarkMode ? themeDark : themeLight,
)
const layoutOptions = computed(() =>
  workspaceState.value.layouts.map((layout) => ({
    value: layout.id,
    label: layout.name,
    icon: 'pi pi-th-large',
  })),
)
const selectedLayoutId = computed({
  get: () => workspaceState.value.selectedLayoutId ?? '',
  set: (id: string) => {
    workspaceState.value = {
      ...workspaceState.value,
      selectedLayoutId: id || null,
    }
  },
})

function panelId(networkId: string): string {
  return `network:${encodeURIComponent(networkId)}`
}

function scheduleAutosave() {
  if (restoringLayout) return
  window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    const api = dockviewApi.value
    if (!api) return
    const hasContent = api.panels.length > 0
    emit('contentChange', hasContent)
    if (!hasContent) {
      clearDesktopWorkspaceAutosave(localStorage)
      return
    }
    persistDesktopWorkspaceAutosave(localStorage, api.toJSON())
  }, 200)
}

function endDockDrag() {
  dockDragActive.value = false
  window.clearTimeout(dockDragWatchdog)
  dockDragWatchdog = undefined
  window.removeEventListener('dragend', endDockDrag, true)
  window.removeEventListener('drop', endDockDrag, true)
  window.removeEventListener('pointerup', endDockDrag, true)
  window.removeEventListener('pointercancel', endDockDrag, true)
  window.removeEventListener('blur', endDockDrag, true)
  window.removeEventListener('keydown', endDockDragOnEscape, true)
  document.removeEventListener('visibilitychange', endDockDragWhenHidden, true)
}

function endDockDragOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') endDockDrag()
}

function endDockDragWhenHidden() {
  if (document.hidden) endDockDrag()
}

function beginDockDrag(event: TabDragEvent | GroupDragEvent) {
  endDockDrag()
  dockDragActive.value = true
  window.addEventListener('blur', endDockDrag, { capture: true, once: true })
  window.addEventListener('keydown', endDockDragOnEscape, true)
  document.addEventListener('visibilitychange', endDockDragWhenHidden, true)
  dockDragWatchdog = window.setTimeout(endDockDrag, DOCK_DRAG_WATCHDOG_MS)
  if ('dataTransfer' in event.nativeEvent) {
    window.addEventListener('dragend', endDockDrag, {
      capture: true,
      once: true,
    })
    window.addEventListener('drop', endDockDrag, { capture: true, once: true })
  } else {
    window.addEventListener('pointerup', endDockDrag, {
      capture: true,
      once: true,
    })
    window.addEventListener('pointercancel', endDockDrag, {
      capture: true,
      once: true,
    })
  }
}

function syncActiveNetworkFromDockview() {
  const panel = dockviewApi.value?.activePanel
  if (!panel) {
    webviewStore.clearNetwork()
    return
  }
  const params = panel.api.getParameters<NetworkWorkspacePanelParams>()
  if (!params?.networkId || !params.url) return
  if (
    webviewStore.activeNetworkId === params.networkId &&
    webviewStore.activeUrl === params.url
  )
    return
  webviewStore.selectNetwork(params.networkId, params.url)
}

function ensureNetworkPanel(networkId: string, url: string) {
  const api = dockviewApi.value
  if (!api) return
  const params = { networkId, url }
  if (!isNetworkWorkspacePanelParams(params, workspaceNetworkCatalog.value)) {
    console.warn(
      '[CommunityGlows] Ignoring an untrusted desktop workspace target.',
    )
    return
  }
  const id = panelId(networkId)
  const existing = api.getPanel(id)
  if (existing) {
    existing.api.setActive()
    return
  }

  const network = networkById.get(networkId)
  const referencePanel = api.activePanel ?? api.panels[api.panels.length - 1]
  const direction = api.panels.length % 2 === 0 ? 'below' : 'right'
  api.addPanel<NetworkWorkspacePanelParams>({
    id,
    component: 'network',
    title: network?.label ?? 'Lien personnalisé',
    renderer: 'always',
    params,
    minimumWidth: DESKTOP_WORKSPACE_CONSTRAINTS.panelMinWidth,
    minimumHeight: DESKTOP_WORKSPACE_CONSTRAINTS.panelMinHeight,
    ...(referencePanel ? { position: { referencePanel, direction } } : {}),
  })
}

function restoreLayout(layout: SerializedDockview): boolean {
  const api = dockviewApi.value
  if (
    !api ||
    !isSafeDesktopWorkspaceLayout(layout, workspaceNetworkCatalog.value)
  )
    return false
  restoringLayout = true
  try {
    api.fromJSON(layout)
    return true
  } catch (error) {
    console.warn(
      '[CommunityGlows] Ignoring an invalid desktop workspace layout.',
      error,
    )
    api.clear()
    return false
  } finally {
    restoringLayout = false
    emit('contentChange', api.panels.length > 0)
  }
}

function onDockviewReady(event: DockviewReadyEvent) {
  dockviewApi.value = event.api
  disposables.push(
    event.api.onDidLayoutChange(scheduleAutosave),
    event.api.onDidActivePanelChange(syncActiveNetworkFromDockview),
    event.api.onDidRemovePanel(() =>
      window.setTimeout(syncActiveNetworkFromDockview),
    ),
    event.api.onWillDragPanel(beginDockDrag),
    event.api.onWillDragGroup(beginDockDrag),
    event.api.onDidDrop(endDockDrag),
  )

  const autosave = loadDesktopWorkspaceAutosave(
    localStorage,
    workspaceNetworkCatalog.value,
  )
  if (autosave) restoreLayout(autosave)

  const selected = workspaceState.value.layouts.find(
    (layout) => layout.id === workspaceState.value.selectedLayoutId,
  )
  layoutName.value = selected?.name ?? ''

  if (webviewStore.activeNetworkId && webviewStore.activeUrl) {
    ensureNetworkPanel(webviewStore.activeNetworkId, webviewStore.activeUrl)
  }
  emit('contentChange', event.api.panels.length > 0)
}

function loadNamedLayout(id: string) {
  const saved = workspaceState.value.layouts.find((layout) => layout.id === id)
  if (!saved || !restoreLayout(saved.layout)) return
  workspaceState.value = { ...workspaceState.value, selectedLayoutId: saved.id }
  layoutName.value = saved.name
  persistDesktopWorkspaceState(localStorage, workspaceState.value)
  persistDesktopWorkspaceAutosave(localStorage, saved.layout)
  syncActiveNetworkFromDockview()
}

function saveNamedLayout() {
  const api = dockviewApi.value
  if (!api || api.panels.length === 0) {
    push.warning({
      message: 'Ajoutez au moins un réseau avant d’enregistrer ce layout.',
    })
    return
  }
  const fallbackName = `Layout ${workspaceState.value.layouts.length + 1}`
  workspaceState.value = saveDesktopWorkspaceLayout(workspaceState.value, {
    id: workspaceState.value.selectedLayoutId ?? undefined,
    name: layoutName.value || fallbackName,
    layout: api.toJSON(),
  })
  layoutName.value =
    workspaceState.value.layouts.find(
      (layout) => layout.id === workspaceState.value.selectedLayoutId,
    )?.name ?? fallbackName
  persistDesktopWorkspaceState(localStorage, workspaceState.value)
  persistDesktopWorkspaceAutosave(localStorage, api.toJSON())
  push.success({ message: 'Layout enregistré.' })
}

function startNewLayout() {
  const api = dockviewApi.value
  if (!api) return
  workspaceState.value = { ...workspaceState.value, selectedLayoutId: null }
  layoutName.value = ''
  api.clear()
  clearDesktopWorkspaceAutosave(localStorage)
  persistDesktopWorkspaceState(localStorage, workspaceState.value)
  emit('contentChange', false)
}

function resetCurrentLayout() {
  const api = dockviewApi.value
  const networkId = webviewStore.activeNetworkId
  const url = webviewStore.activeUrl
  if (!api) return
  api.clear()
  clearDesktopWorkspaceAutosave(localStorage)
  if (networkId && url) ensureNetworkPanel(networkId, url)
}

function deleteNamedLayout() {
  const id = workspaceState.value.selectedLayoutId
  if (!id) return
  workspaceState.value = deleteDesktopWorkspaceLayout(workspaceState.value, id)
  layoutName.value = ''
  persistDesktopWorkspaceState(localStorage, workspaceState.value)
  push.success({
    message: 'Layout enregistré supprimé. Le bento courant reste ouvert.',
  })
}

watch(
  [() => webviewStore.activeNetworkId, () => webviewStore.activeUrl],
  ([networkId, url]) => {
    if (networkId && url) ensureNetworkPanel(networkId, url)
  },
)

watch(workspaceNetworkCatalog, (catalog) => {
  const api = dockviewApi.value
  if (!api) return
  for (const panel of [...api.panels]) {
    const params = panel.api.getParameters<Record<string, unknown>>()
    if (!isNetworkWorkspacePanelParams(params, catalog)) {
      panel.api.close()
    }
  }
})

onUnmounted(() => {
  endDockDrag()
  window.clearTimeout(autosaveTimer)
  const api = dockviewApi.value
  if (api?.panels.length)
    persistDesktopWorkspaceAutosave(localStorage, api.toJSON())
  disposables.splice(0).forEach((disposable) => disposable.dispose())
})
</script>

<style scoped>
.desktop-workspace {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--sg-color-background);
}

.desktop-workspace__toolbar {
  position: relative;
  z-index: var(--sg-layer-dropdown);
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  padding: var(--sg-space-2);
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
  background: var(--sg-color-surface-muted);
}

.desktop-workspace__identity {
  display: inline-flex;
  align-items: center;
  gap: var(--sg-space-2);
  color: var(--sg-color-text);
  font-weight: 700;
}

.desktop-workspace__layout-select,
.desktop-workspace__name {
  min-width: 0;
  flex: 1;
}

.desktop-workspace__actions {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1);
}

.desktop-workspace__dock {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  --dv-group-view-background-color: var(--sg-color-background);
  --dv-tabs-and-actions-container-background-color: var(
    --sg-color-surface-muted
  );
  --dv-activegroup-visiblepanel-tab-background-color: var(
    --sg-color-background
  );
  --dv-activegroup-hiddenpanel-tab-background-color: var(
    --sg-color-surface-hover
  );
  --dv-inactivegroup-visiblepanel-tab-background-color: var(
    --sg-color-background
  );
  --dv-inactivegroup-hiddenpanel-tab-background-color: var(
    --sg-color-surface-muted
  );
  --dv-activegroup-visiblepanel-tab-color: var(--sg-color-text);
  --dv-activegroup-hiddenpanel-tab-color: var(--sg-color-text-muted);
  --dv-inactivegroup-visiblepanel-tab-color: var(--sg-color-text-muted);
  --dv-inactivegroup-hiddenpanel-tab-color: var(--sg-color-text-muted);
  --dv-tab-divider-color: var(--sg-color-border);
  --dv-separator-border: var(--sg-color-border-strong);
  --dv-active-sash-color: var(--sg-color-action);
  --dv-icon-hover-background-color: var(--sg-color-surface-hover);
  --dv-drag-over-border-color: var(--sg-color-action);
  --dv-edge-dock-indicator-color: var(--sg-color-action);
  --dv-tabs-and-actions-container-height: var(--sg-control-height-lg);
  --dv-tab-font-size: inherit;
  --dv-border-radius: var(--sg-radius-sm);
  --dv-tab-border-radius: var(--sg-radius-sm);
}

.desktop-workspace__dock :deep(.desktop-workspace__dockview) {
  width: var(--sg-size-full);
  height: var(--sg-size-full);
}
</style>
