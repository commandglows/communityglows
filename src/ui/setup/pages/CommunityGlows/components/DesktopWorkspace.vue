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
        v-model="selectedPreset"
        :options="presetOptions"
        placeholder="Disposition"
        aria-label="Appliquer une disposition"
        :disabled="!dockviewApi"
        @update:model-value="applyPreset"
      />
      <SgSelect
        v-model="selectedLayoutId"
        class="desktop-workspace__layout-select"
        :options="layoutOptions"
        placeholder="Scènes enregistrées"
        aria-label="Charger une scène"
        :disabled="layoutOptions.length === 0"
        @update:model-value="loadNamedLayout"
      />
      <SgInput
        v-model="layoutName"
        class="desktop-workspace__name"
        maxlength="64"
        placeholder="Nom de la scène"
        aria-label="Nom de la scène"
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
          aria-label="Nouvelle scène"
          tooltip="Nouvelle scène"
          @click="startNewLayout"
        />
        <SgButton
          icon="pi pi-refresh"
          text
          size="small"
          aria-label="Réinitialiser le bento"
          tooltip="Réinitialiser le bento"
          @click="resetCurrentLayout"
        />
        <SgButton
          icon="pi pi-trash"
          text
          severity="danger"
          size="small"
          aria-label="Supprimer la scène enregistrée"
          tooltip="Supprimer la scène enregistrée"
          :disabled="!selectedLayoutId"
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
import { storeToRefs } from 'pinia'
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
  createDesktopWorkspacePresetLayout,
  deleteDesktopWorkspaceLayout,
  isNetworkWorkspacePanelParams,
  isSafeDesktopWorkspaceLayout,
  loadDesktopWorkspaceAutosave,
  MAX_DESKTOP_WORKSPACE_PANELS,
  persistDesktopWorkspaceAutosave,
  saveDesktopWorkspaceLayout,
  selectDesktopWorkspaceLayout,
  type DesktopWorkspacePreset,
  type NetworkWorkspacePanelParams,
  type WorkspacePersistenceResult,
} from '@/lib/desktopWorkspaceLayouts'
import { useCustomLinksStore } from '@/stores/customLinks'
import { useDesktopWorkspacesStore } from '@/stores/desktopWorkspaces'
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
const desktopWorkspacesStore = useDesktopWorkspacesStore()
const networkById = new Map(
  builtInSocialNetworks.map((network) => [network.id, network]),
)
function networkCatalogForProfile(profileId: string) {
  const catalog = new Map(
    builtInSocialNetworks.map((network) => [
      network.id,
      { canonicalUrl: network.url, allowSubdomains: true },
    ]),
  )
  for (const link of customLinksStore.getLinks(profileId)) {
    catalog.set(link.id, {
      canonicalUrl: link.url,
      allowSubdomains: false,
    })
  }
  return catalog
}
const workspaceNetworkCatalog = computed(() =>
  networkCatalogForProfile(profilesStore.activeProfileId),
)
const dockviewApi = shallowRef<DockviewApi | null>(null)
desktopWorkspacesStore.initialize(
  workspaceNetworkCatalog.value,
  profilesStore.activeProfile?.localOnly
    ? ''
    : profilesStore.activeProfileId,
)
const { workspaceState } = storeToRefs(desktopWorkspacesStore)
const layoutName = ref('')
const selectedPreset = ref('')
const dockDragActive = ref(false)
const disposables: Array<{ dispose: () => void }> = []
let autosaveTimer: number | undefined
let dockDragWatchdog: number | undefined
let restoringLayout = false
let profileSwitching = false
let autosaveWarningShown = false
const DOCK_DRAG_WATCHDOG_MS = 15_000

const workspaceSuspended = computed(
  () => props.suspended || dockDragActive.value,
)
provide(workspaceWebviewsSuspendedKey, workspaceSuspended)

function workspacePersistenceMessage(
  result: WorkspacePersistenceResult,
): string {
  if (result.ok || result.reason === 'unavailable') {
    return 'Le stockage local est indisponible. Cette modification ne pourra pas être conservée.'
  }
  return result.reason === 'too-large'
    ? 'Cette scène dépasse la taille autorisée. Réduisez le nombre ou la complexité des panneaux avant de l’enregistrer.'
    : 'Cette scène contient trop de panneaux ou une structure incohérente et ne peut pas être enregistrée.'
}

function workspaceSyncMessage(result: WorkspacePersistenceResult): string {
  return !result.ok && result.reason === 'too-large'
    ? 'Cette scène dépasse la limite de synchronisation et reste disponible uniquement sur cet appareil.'
    : 'La synchronisation est temporairement indisponible. Cette scène reste enregistrée sur cet appareil.'
}

const dockviewTheme = computed(() =>
  themeStore.isDarkMode ? themeDark : themeLight,
)
const profileLayouts = computed(() =>
  workspaceState.value.layouts
    .filter((layout) => layout.profileId === profilesStore.activeProfileId),
)
const layoutOptions = computed(() =>
  profileLayouts.value.map((layout) => ({
      value: layout.id,
      label: layout.name,
      icon: 'pi pi-th-large',
    })),
)
const presetOptions = [
  { value: 'columns', label: 'Colonnes', icon: 'pi pi-arrows-h' },
  { value: 'rows', label: 'Lignes', icon: 'pi pi-arrows-v' },
  { value: 'focus', label: 'Focus', icon: 'pi pi-window-maximize' },
  { value: 'grid', label: 'Grille', icon: 'pi pi-th-large' },
]
const selectedLayoutId = computed({
  get: () =>
    workspaceState.value.selectedLayoutIds[profilesStore.activeProfileId] ?? '',
  set: (id: string) => {
    workspaceState.value = selectDesktopWorkspaceLayout(
      workspaceState.value,
      profilesStore.activeProfileId,
      id || null,
    )
  },
})

function panelId(networkId: string): string {
  return `network:${encodeURIComponent(networkId)}`
}

function scheduleAutosave() {
  if (restoringLayout || profileSwitching) return
  window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    const api = dockviewApi.value
    if (!api) return
    const profileId = profilesStore.activeProfileId
    const hasContent = api.panels.length > 0
    emit('contentChange', hasContent)
    if (!hasContent) {
      const result = clearDesktopWorkspaceAutosave(localStorage, profileId)
      if (!result.ok && !autosaveWarningShown) {
        autosaveWarningShown = true
        push.warning({ message: workspacePersistenceMessage(result) })
      }
      return
    }
    const result = persistDesktopWorkspaceAutosave(
      localStorage,
      api.toJSON(),
      workspaceNetworkCatalog.value,
      profileId,
    )
    if (!result.ok && !autosaveWarningShown) {
      autosaveWarningShown = true
      push.warning({ message: workspacePersistenceMessage(result) })
    }
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
  if (!api || profileSwitching) return
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
  if (api.panels.length >= MAX_DESKTOP_WORKSPACE_PANELS) {
    push.warning({
      message: `Ce bento est limité à ${MAX_DESKTOP_WORKSPACE_PANELS} panneaux pour préserver sa stabilité.`,
    })
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

function applyPreset(value: string) {
  const api = dockviewApi.value
  selectedPreset.value = ''
  if (!api || api.panels.length === 0) {
    push.warning({
      message: 'Ajoutez au moins un réseau avant de choisir une disposition.',
    })
    return
  }

  const preset = value as DesktopWorkspacePreset
  const previousLayout = api.toJSON()
  const layout = createDesktopWorkspacePresetLayout(previousLayout, preset)
  if (!layout) return

  restoringLayout = true
  let applied = false
  try {
    api.fromJSON(layout, { reuseExistingPanels: true })
    applied = true
    syncActiveNetworkFromDockview()
  } catch (error) {
    console.warn(
      '[CommunityGlows] Failed to apply a desktop workspace preset.',
      error,
    )
    push.warning({
      message: 'Cette disposition n’a pas pu être appliquée.',
    })
    try {
      api.fromJSON(previousLayout)
    } catch (restoreError) {
      console.error(
        '[CommunityGlows] Failed to restore the previous desktop workspace.',
        restoreError,
      )
    }
  } finally {
    restoringLayout = false
    emit('contentChange', api.panels.length > 0)
  }
  if (applied) scheduleAutosave()
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
    profilesStore.activeProfileId,
  )
  if (autosave) restoreLayout(autosave)

  const selected = workspaceState.value.layouts.find(
    (layout) =>
      layout.profileId === profilesStore.activeProfileId &&
      layout.id ===
        workspaceState.value.selectedLayoutIds[profilesStore.activeProfileId],
  )
  layoutName.value = selected?.name ?? ''

  if (webviewStore.activeNetworkId && webviewStore.activeUrl) {
    ensureNetworkPanel(webviewStore.activeNetworkId, webviewStore.activeUrl)
  }
  emit('contentChange', event.api.panels.length > 0)
}

function loadNamedLayout(id: string) {
  const profileId = profilesStore.activeProfileId
  const saved = workspaceState.value.layouts.find(
    (layout) => layout.id === id && layout.profileId === profileId,
  )
  if (!saved || !restoreLayout(saved.layout)) return
  workspaceState.value = selectDesktopWorkspaceLayout(
    workspaceState.value,
    profileId,
    saved.id,
  )
  layoutName.value = saved.name
  const stateResult = desktopWorkspacesStore.persist(workspaceState.value)
  const autosaveResult = persistDesktopWorkspaceAutosave(
    localStorage,
    saved.layout,
    workspaceNetworkCatalog.value,
    profileId,
  )
  if (!stateResult.local.ok || !stateResult.cloud.ok || !autosaveResult.ok) {
    push.warning({
      message: !stateResult.local.ok
        ? workspacePersistenceMessage(stateResult.local)
        : !stateResult.cloud.ok
          ? workspaceSyncMessage(stateResult.cloud)
          : workspacePersistenceMessage(autosaveResult),
    })
  }
  syncActiveNetworkFromDockview()
}

function saveNamedLayout() {
  const api = dockviewApi.value
  if (!api || api.panels.length === 0) {
    push.warning({
      message: 'Ajoutez au moins un réseau avant d’enregistrer cette scène.',
    })
    return
  }
  const fallbackName = `Scène ${profileLayouts.value.length + 1}`
  const profileId = profilesStore.activeProfileId
  const currentLayout = api.toJSON()
  if (
    !isSafeDesktopWorkspaceLayout(currentLayout, workspaceNetworkCatalog.value)
  ) {
    push.warning({
      message: workspacePersistenceMessage({ ok: false, reason: 'invalid' }),
    })
    return
  }
  const nextState = saveDesktopWorkspaceLayout(workspaceState.value, {
    id: workspaceState.value.selectedLayoutIds[profileId] ?? undefined,
    profileId,
    name: layoutName.value || fallbackName,
    layout: currentLayout,
  })
  const stateResult = desktopWorkspacesStore.persist(nextState)
  if (!stateResult.local.ok) {
    push.warning({ message: workspacePersistenceMessage(stateResult.local) })
    return
  }
  layoutName.value =
    workspaceState.value.layouts.find(
      (layout) =>
        layout.profileId === profileId &&
        layout.id === workspaceState.value.selectedLayoutIds[profileId],
    )?.name ?? fallbackName
  const autosaveResult = persistDesktopWorkspaceAutosave(
    localStorage,
    currentLayout,
    workspaceNetworkCatalog.value,
    profileId,
  )
  if (!stateResult.cloud.ok || !autosaveResult.ok) {
    push.warning({
      message: `Scène enregistrée localement. ${
        !stateResult.cloud.ok
          ? workspaceSyncMessage(stateResult.cloud)
          : workspacePersistenceMessage(autosaveResult)
      }`,
    })
  } else {
    push.success({ message: 'Scène enregistrée.' })
  }
}

function startNewLayout() {
  const api = dockviewApi.value
  if (!api) return
  const profileId = profilesStore.activeProfileId
  const nextState = selectDesktopWorkspaceLayout(
    workspaceState.value,
    profileId,
    null,
  )
  layoutName.value = ''
  api.clear()
  const clearResult = clearDesktopWorkspaceAutosave(localStorage, profileId)
  const stateResult = desktopWorkspacesStore.persist(nextState)
  if (!clearResult.ok || !stateResult.local.ok || !stateResult.cloud.ok) {
    push.warning({
      message: !clearResult.ok
        ? workspacePersistenceMessage(clearResult)
        : !stateResult.local.ok
          ? workspacePersistenceMessage(stateResult.local)
          : workspaceSyncMessage(stateResult.cloud),
    })
  }
  emit('contentChange', false)
}

function resetCurrentLayout() {
  const api = dockviewApi.value
  const networkId = webviewStore.activeNetworkId
  const url = webviewStore.activeUrl
  if (!api) return
  api.clear()
  const result = clearDesktopWorkspaceAutosave(
    localStorage,
    profilesStore.activeProfileId,
  )
  if (!result.ok) {
    push.warning({ message: workspacePersistenceMessage(result) })
  }
  if (networkId && url) ensureNetworkPanel(networkId, url)
}

function deleteNamedLayout() {
  const profileId = profilesStore.activeProfileId
  const id = workspaceState.value.selectedLayoutIds[profileId]
  if (!id) return
  const nextState = deleteDesktopWorkspaceLayout(
    workspaceState.value,
    profileId,
    id,
  )
  const result = desktopWorkspacesStore.persist(nextState)
  if (!result.local.ok) {
    push.warning({ message: workspacePersistenceMessage(result.local) })
    return
  }
  layoutName.value = ''
  if (!result.cloud.ok) {
    push.warning({
      message: `Scène supprimée localement. ${workspaceSyncMessage(result.cloud)}`,
    })
  } else {
    push.success({
      message: 'Scène supprimée. Le bento courant reste ouvert.',
    })
  }
}

watch(
  [() => webviewStore.activeNetworkId, () => webviewStore.activeUrl],
  ([networkId, url]) => {
    if (networkId && url) ensureNetworkPanel(networkId, url)
  },
)

watch(
  [
    () => profilesStore.activeProfileId,
    () => profilesStore.activeProfile?.localOnly ?? true,
  ],
  ([profileId, localOnly], [previousProfileId, previousLocalOnly]) => {
    if (
      profileId === previousProfileId &&
      previousLocalOnly &&
      !localOnly &&
      workspaceState.value.layouts.length === 0
    ) {
      desktopWorkspacesStore.reloadFromLocal(
        networkCatalogForProfile(profileId),
        profileId,
      )
      return
    }
    if (!profileId || profileId === previousProfileId) return

    const api = dockviewApi.value
    if (!api) return
    profileSwitching = true
    restoringLayout = true
    window.clearTimeout(autosaveTimer)

    try {
      const previousProfileStillExists = profilesStore.profiles.some(
        (profile) => profile.id === previousProfileId,
      )
      if (previousProfileId && previousProfileStillExists) {
        if (api.panels.length > 0) {
          persistDesktopWorkspaceAutosave(
            localStorage,
            api.toJSON(),
            networkCatalogForProfile(previousProfileId),
            previousProfileId,
          )
        } else {
          clearDesktopWorkspaceAutosave(localStorage, previousProfileId)
        }
      }

      api.clear()
      const catalog = networkCatalogForProfile(profileId)
      const autosave = loadDesktopWorkspaceAutosave(
        localStorage,
        catalog,
        profileId,
      )
      if (autosave) api.fromJSON(autosave)
    } catch (error) {
      console.warn(
        '[CommunityGlows] Failed to switch the desktop workspace profile.',
        error,
      )
      api.clear()
    } finally {
      restoringLayout = false
      profileSwitching = false
      emit('contentChange', api.panels.length > 0)
    }

    if (api.panels.length === 0) {
      const networkId = webviewStore.activeNetworkId
      const url = webviewStore.activeUrl
      if (networkId && url) ensureNetworkPanel(networkId, url)
    }
    syncActiveNetworkFromDockview()
  },
)

watch(workspaceNetworkCatalog, (catalog) => {
  const api = dockviewApi.value
  if (!api || profileSwitching) return
  for (const panel of [...api.panels]) {
    const params = panel.api.getParameters<Record<string, unknown>>()
    if (!isNetworkWorkspacePanelParams(params, catalog)) {
      panel.api.close()
    }
  }
})

watch([workspaceState, () => profilesStore.activeProfileId], ([state, profileId]) => {
  layoutName.value =
    state.layouts.find(
      (layout) =>
        layout.profileId === profileId &&
        layout.id === state.selectedLayoutIds[profileId],
    )?.name ?? ''
})

onUnmounted(() => {
  endDockDrag()
  window.clearTimeout(autosaveTimer)
  const api = dockviewApi.value
  if (api?.panels.length)
    persistDesktopWorkspaceAutosave(
      localStorage,
      api.toJSON(),
      workspaceNetworkCatalog.value,
      profilesStore.activeProfileId,
    )
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
