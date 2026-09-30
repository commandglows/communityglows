<template>
  <section
    ref="workspaceElement"
    class="desktop-workspace"
    aria-label="Workspace multi-réseaux"
    @keydown="handleWorkspaceKeyboard"
  >
    <header
      v-if="sceneEditorVisible || groupRenameVisible"
      class="desktop-workspace__toolbar"
    >
      <div
        v-if="sceneEditorVisible"
        class="desktop-workspace__primary-controls"
      >
        <SgSelect
          v-model="newPanelDestination"
          class="desktop-workspace__toolbar-select"
          :options="newPanelDestinationOptions"
          aria-label="Emplacement des prochains réseaux ajoutés au Bento"
          open-on-hover
        />
        <SgSelect
          v-model="selectedPreset"
          class="desktop-workspace__toolbar-select"
          :options="presetOptions"
          placeholder="Disposition"
          aria-label="Appliquer une disposition"
          open-on-hover
          :disabled="!workspaceUiState.canApplyPreset"
          @update:model-value="applyPreset"
        />
        <SgSelect
          :model-value="selectedLayoutId"
          class="desktop-workspace__toolbar-select desktop-workspace__layout-select"
          :options="layoutOptions"
          placeholder="Bentos enregistrés"
          aria-label="Charger un Bento"
          open-on-hover
          :disabled="layoutOptions.length === 0"
          @update:model-value="loadNamedLayout"
        />
      </div>

      <section
        v-if="sceneEditorVisible"
        class="desktop-workspace__editor"
        aria-labelledby="desktop-workspace-scene-editor-title"
      >
        <div class="desktop-workspace__editor-heading">
          <strong id="desktop-workspace-scene-editor-title">
            {{ selectedLayoutId ? "Modifier le Bento" : "Créer un Bento" }}
          </strong>
          <span
            v-if="sceneSaveLabel"
            class="desktop-workspace__save-status"
            aria-live="polite"
          >
            {{ sceneSaveLabel }}
          </span>
        </div>
        <div class="desktop-workspace__editor-fields">
          <label
            class="desktop-workspace__field desktop-workspace__field--name"
          >
            <span>Nom</span>
            <SgInput
              ref="sceneNameInput"
              v-model="layoutName"
              class="desktop-workspace__name"
              maxlength="64"
              placeholder="Nom du Bento"
              :disabled="!workspaceUiState.canCreateScene"
              @keydown.enter="commitSceneName"
            />
          </label>
          <div class="desktop-workspace__scene-style">
            <span
              class="desktop-workspace__scene-color"
              :class="`desktop-workspace__scene-color--${sceneColor}`"
              aria-hidden="true"
            >
              {{ sceneIcon }}
            </span>
            <div class="desktop-workspace__field">
              <span>Icône</span>
              <SgSelect
                v-model="sceneIcon"
                :options="sceneIconOptions"
                aria-label="Icône du Bento"
                open-on-hover
                :disabled="!workspaceUiState.canCreateScene"
              />
            </div>
            <div class="desktop-workspace__field">
              <span>Accent</span>
              <SgSelect
                v-model="sceneColor"
                :options="sceneColorOptions"
                aria-label="Couleur du Bento"
                open-on-hover
                :disabled="!workspaceUiState.canCreateScene"
              />
            </div>
          </div>
        </div>
        <div class="desktop-workspace__editor-actions">
          <SgButton
            label="Fermer"
            text
            size="small"
            @click="closeSceneEditor"
          />
          <SgButton
            icon="pi pi-save"
            :label="selectedLayoutId ? 'Terminer' : 'Créer le Bento'"
            size="small"
            :disabled="!workspaceUiState.canCreateScene"
            @click="commitSceneEditor"
          />
        </div>
      </section>

      <section
        v-if="groupRenameVisible"
        class="desktop-workspace__editor"
        aria-labelledby="desktop-workspace-group-editor-title"
      >
        <strong id="desktop-workspace-group-editor-title">
          Renommer le groupe
        </strong>
        <div class="desktop-workspace__group-editor">
          <SgInput
            ref="groupNameInput"
            v-model="groupName"
            maxlength="40"
            aria-label="Nom du groupe"
            placeholder="Nom du groupe"
            @keydown.enter="commitGroupRename"
            @keydown.esc="cancelGroupRename"
          />
          <SgButton
            label="Annuler"
            text
            size="small"
            @click="cancelGroupRename"
          />
          <SgButton
            icon="pi pi-check"
            label="Enregistrer"
            size="small"
            @click="commitGroupRename"
          />
        </div>
      </section>
    </header>

    <ContextMenuRoot
      :open="dockContextMenuOpen"
      @update:open="setDockContextMenuOpen"
    >
      <ContextMenuTrigger as-child>
        <div
          class="desktop-workspace__dock"
          @contextmenu.capture="prepareDockContextMenu"
          @keydown.shift.f10.capture="prepareDockContextMenu"
          @dblclick.capture="closeDockTabOnDoubleClick"
          @pointerdown.capture="beginDockGroupRenameLongPress"
          @pointermove.capture="cancelDockGroupRenameLongPressIfMoved"
          @pointerup.capture="cancelDockGroupRenameLongPress"
          @pointercancel.capture="cancelDockGroupRenameLongPress"
        >
          <DockviewVue
            class="desktop-workspace__dockview"
            :theme="dockviewTheme"
            :components="dockviewComponents"
            :disable-floating-groups="true"
            tab-animation="smooth"
            @ready="onDockviewReady"
          />
          <div
            class="desktop-workspace__active-frame"
            aria-hidden="true"
          />
          <div
            v-if="workspaceUiState.showEmptyGuide"
            class="desktop-workspace__empty"
            role="status"
          >
            <SgIcon
              icon="pi pi-th-large"
              aria-hidden="true"
            />
            <p>
              Choisissez un réseau dans la barre latérale pour commencer votre
              bento.
            </p>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent
          v-if="dockContextKind"
          class="desktop-workspace-context-menu"
          :aria-label="
            dockContextKind === 'group'
              ? 'Actions du groupe'
              : `Actions de ${activePanelLabel}`
          "
        >
          <template v-if="dockContextKind === 'panel'">
            <ContextMenuItem @select="toggleActivePanelPinned">
              {{ activePanelPinned ? "Désépingler" : "Épingler" }}
            </ContextMenuItem>
            <ContextMenuItem
              :disabled="!canReorderActivePanel(-1)"
              @select="reorderActivePanel(-1)"
            >
              Déplacer vers la gauche
            </ContextMenuItem>
            <ContextMenuItem
              :disabled="!canReorderActivePanel(1)"
              @select="reorderActivePanel(1)"
            >
              Déplacer vers la droite
            </ContextMenuItem>
            <ContextMenuItem
              v-if="activePanelCanDuplicate"
              @select="duplicateActivePanel"
            >
              Dupliquer
            </ContextMenuItem>
            <ContextMenuItem
              v-if="!activeTabGroup"
              @select="createGroupForActivePanel"
            >
              Créer un groupe
            </ContextMenuItem>
            <ContextMenuItem
              v-if="activeTabGroup"
              @select="() => startGroupRename()"
            >
              Renommer le groupe
            </ContextMenuItem>
            <ContextMenuItem
              v-if="activeTabGroup"
              @select="removeActivePanelFromGroup"
            >
              Sortir du groupe
            </ContextMenuItem>
          </template>
          <template v-else>
            <ContextMenuItem
              :disabled="!canReorderActiveGroup(-1)"
              @select="reorderActiveGroup(-1)"
            >
              Déplacer le groupe vers la gauche
            </ContextMenuItem>
            <ContextMenuItem
              :disabled="!canReorderActiveGroup(1)"
              @select="reorderActiveGroup(1)"
            >
              Déplacer le groupe vers la droite
            </ContextMenuItem>
            <ContextMenuItem @select="() => startGroupRename()">
              Renommer le groupe
            </ContextMenuItem>
            <ContextMenuItem @select="dissolveActiveGroup">
              Dissoudre le groupe
            </ContextMenuItem>
          </template>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenuRoot>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  markRaw,
  nextTick,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  watch,
} from "vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { push } from "notivue"
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from "reka-ui"
import {
  DockviewVue,
  themeDark,
  themeLight,
  type DockviewApi,
  type DockviewReadyEvent,
  type GroupDragEvent,
  type SerializedDockview,
  type TabDragEvent,
} from "dockview-vue"
import { builtInSocialNetworks } from "@/config/socialNetworks"
import { focusWorkspacePanelTab } from "@/lib/workspacePanelFocus"
import { getNetworkGroupId, networkGroups } from "@/config/socialNetworkGroups"
import {
  BENTO_CATALOG_GROUP_KEY,
  bentoGroupDestinationValue,
  resolveBentoGroupDestination,
} from "@/lib/bentoCatalogGroups"
import { readDesktopWorkspaceConstraints } from "@/design-tokens"
import {
  clearDesktopWorkspaceAutosave,
  createDesktopWorkspacePresetLayout,
  DEFAULT_DESKTOP_SCENE_COLOR,
  DEFAULT_DESKTOP_SCENE_ICON,
  DESKTOP_SCENE_COLORS,
  DESKTOP_SCENE_ICONS,
  desktopWorkspacePanelId,
  deleteDesktopWorkspaceLayout,
  isNetworkWorkspacePanelParams,
  isTasksWorkspacePanelParams,
  isSafeDesktopWorkspaceLayout,
  loadDesktopWorkspaceAutosave,
  MAX_DESKTOP_WORKSPACE_PANELS,
  persistDesktopWorkspaceAutosave,
  saveDesktopWorkspaceLayout,
  selectDesktopWorkspaceLayout,
  type DesktopWorkspacePreset,
  type NetworkWorkspacePanelParams,
  type DesktopWorkspacePanelParams,
  type DesktopSceneColor,
  type DesktopSceneIcon,
  type WorkspacePersistenceResult,
} from "@/lib/desktopWorkspaceLayouts"
import { useCustomLinksStore } from "@/stores/customLinks"
import { useDesktopWorkspacesStore } from "@/stores/desktopWorkspaces"
import { useProfilesStore } from "@/stores/profiles"
import { useThemeStore } from "@/stores/theme"
import { useWebviewStore } from "@/stores/webviewState"
import SgButton from "./ui/SgButton.vue"
import SgIcon from "./ui/SgIcon.vue"
import SgInput from "./ui/SgInput.vue"
import SgSelect from "./ui/SgSelect.vue"
import NetworkWorkspacePanel from "./NetworkWorkspacePanel.vue"
import TasksWorkspacePanel from "./TasksWorkspacePanel.vue"
import { workspaceWebviewsSuspendedKey } from "./workspaceContext"
import {
  applyBentoSidebarCommand,
  snapshotBentoSidebar,
  type BentoSidebarCommand,
  type BentoSidebarSnapshot,
} from "./bentoSidebarBridge"
import { resolveDesktopWorkspaceUiState } from "./desktopWorkspaceUiState"

const dockviewComponents = {
  network: markRaw(NetworkWorkspacePanel),
  tasks: markRaw(TasksWorkspacePanel),
} as unknown as InstanceType<typeof DockviewVue>["$props"]["components"]

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
  organizationChange: [snapshot: BentoSidebarSnapshot | null]
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
const workspacePanelCount = ref(0)
const organizationRevision = ref(0)
watch(
  organizationRevision,
  () => {
    if (dockviewApi.value && !profileSwitching)
      emit(
        "organizationChange",
        snapshotBentoSidebar(
          dockviewApi.value,
          profilesStore.activeProfileId,
          selectedLayoutId.value,
        ),
      )
  },
  { flush: "post" },
)
function organizeFromSidebar(command: BentoSidebarCommand) {
  if (
    !dockviewApi.value ||
    restoringLayout ||
    profileSwitching ||
    command.sceneId !== selectedLayoutId.value
  )
    return
  try {
    if (
      applyBentoSidebarCommand(
        dockviewApi.value,
        profilesStore.activeProfileId,
        command,
      )
    ) {
      organizationRevision.value += 1
      scheduleAutosave()
    }
  } catch (error) {
    console.error("[CommunityGlows] Sidebar organization failed", error)
    push.error({ message: t("sidebarTabs.error") })
  }
}
function closeNetworkInstance(instanceId: string) {
  const api = dockviewApi.value
  if (!api || profileSwitching) return
  for (const panel of api.panels) {
    if (
      (panel.toJSON().params as NetworkWorkspacePanelParams | undefined)
        ?.instanceId === instanceId
    )
      api.removePanel(panel)
  }
}
function duplicateNetworkInstance(
  networkId: string,
  instanceId: string,
  sourceInstanceId?: string,
) {
  const api = dockviewApi.value
  if (!api || profileSwitching) return
  const source = api.panels.find((panel) => {
    const params = panel.toJSON().params as
      NetworkWorkspacePanelParams | undefined
    return (
      params?.networkId === networkId && params.instanceId === sourceInstanceId
    )
  })
  if (source)
    organizeFromSidebar({
      action: "duplicate",
      panelId: source.id,
      instanceId,
      profileId: profilesStore.activeProfileId,
      sceneId: selectedLayoutId.value,
    })
}
defineExpose({
  organizeFromSidebar,
  closeNetworkInstance,
  duplicateNetworkInstance,
})
const groupRenameVisible = ref(false)
const workspaceElement = ref<HTMLElement | null>(null)
const groupName = ref("")
const groupRenameTarget = ref<
  | {
      groupId: string
      tabGroupId: string
      panelId: string
    }
  | undefined
>()
const groupNameInput = ref<InstanceType<typeof SgInput> | null>(null)
const sceneNameInput = ref<InstanceType<typeof SgInput> | null>(null)
const dockContextKind = ref<"panel" | "group" | null>(null)
const dockContextMenuOpen = ref(false)

const { t } = useI18n()
const newPanelDestination = ref("category")
const availableTabGroups = computed(() => {
  void organizationRevision.value
  const api = dockviewApi.value
  if (!api) return []
  return api.groups.flatMap((group) =>
    api.getTabGroups({ groupId: group.id }).map((tabGroup) => ({
      groupId: group.id,
      tabGroupId: tabGroup.id,
      label: tabGroup.label,
      catalogGroupId:
        typeof tabGroup.componentParams?.[BENTO_CATALOG_GROUP_KEY] === "string"
          ? (tabGroup.componentParams[BENTO_CATALOG_GROUP_KEY] as string)
          : undefined,
    })),
  )
})
const newPanelDestinationOptions = computed(() => [
  {
    value: "category",
    label: "Nouveaux réseaux : selon leur catégorie",
    icon: "pi pi-folder",
  },
  {
    value: "new-category",
    label: "Nouveaux réseaux : dans un nouveau groupe",
    icon: "pi pi-folder-plus",
  },
  {
    value: "ungrouped",
    label: "Nouveaux réseaux : hors groupe",
    icon: "pi pi-window-maximize",
  },
  ...availableTabGroups.value.map((group) => ({
    value: bentoGroupDestinationValue(group),
    label: `Nouveaux réseaux : ${group.label}`,
    icon: "pi pi-folder",
  })),
])

function activePanelParams() {
  void organizationRevision.value
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel) return undefined
  return api.toJSON().panels[panel.id]?.params as
    DesktopWorkspacePanelParams | undefined
}

const activePanelPinned = computed(
  () => activePanelParams()?.bentoPinned === true,
)
const activePanelCanDuplicate = computed(() => {
  const params = activePanelParams()
  return Boolean(params && params.type !== "tasks")
})
const activePanelLabel = computed(() => {
  void organizationRevision.value
  return (
    dockviewApi.value?.activePanel?.api.title?.replace(/^📌\s*/, "") ||
    "le panneau actif"
  )
})

const activeTabGroup = computed(() => {
  void organizationRevision.value
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel) return undefined
  return api.getTabGroupForPanel({
    groupId: panel.group.id,
    panelId: panel.id,
  })
})

function findFirstPanelIdAfterGroupChip(chip: Element) {
  let sibling = chip.nextElementSibling
  while (sibling) {
    if (sibling.classList.contains("dv-tab-group-chip")) return undefined
    if (sibling instanceof HTMLElement && sibling.dataset.tabPanelId)
      return sibling.dataset.tabPanelId
    sibling = sibling.nextElementSibling
  }
  return undefined
}

function dockPanelFromTarget(target: Element) {
  const tab = target.closest<HTMLElement>("[data-tab-panel-id]")
  const groupChip = target.closest<HTMLElement>(".dv-tab-group-chip")
  const panelId =
    tab?.dataset.tabPanelId ||
    (groupChip ? findFirstPanelIdAfterGroupChip(groupChip) : undefined)
  const panel = panelId ? dockviewApi.value?.getPanel(panelId) : undefined
  return { groupChip, panel, tab }
}

function prepareDockContextMenu(event: MouseEvent | KeyboardEvent) {
  if (!(event.target instanceof Element)) {
    dockContextKind.value = null
    return
  }
  const { groupChip, panel } = dockPanelFromTarget(event.target)
  if (!panel) {
    dockContextKind.value = null
    return
  }
  panel.api.setActive()
  dockContextKind.value = groupChip ? "group" : "panel"
  organizationRevision.value += 1
}

const DOCK_GROUP_RENAME_LONG_PRESS_MS = 600
const DOCK_LONG_PRESS_MOVE_TOLERANCE_PX = 8
let dockGroupRenameLongPress:
  | { clientX: number; clientY: number; panelId: string; timer: number }
  | undefined

function cancelDockGroupRenameLongPress() {
  if (!dockGroupRenameLongPress) return
  window.clearTimeout(dockGroupRenameLongPress.timer)
  dockGroupRenameLongPress = undefined
}

function cancelDockGroupRenameLongPressIfMoved(event: PointerEvent) {
  if (!dockGroupRenameLongPress) return
  const horizontal = event.clientX - dockGroupRenameLongPress.clientX
  const vertical = event.clientY - dockGroupRenameLongPress.clientY
  if (Math.hypot(horizontal, vertical) > DOCK_LONG_PRESS_MOVE_TOLERANCE_PX)
    cancelDockGroupRenameLongPress()
}

function beginDockGroupRenameLongPress(event: PointerEvent) {
  if (
    !event.isPrimary ||
    event.button !== 0 ||
    !(event.target instanceof Element)
  )
    return
  const { groupChip, panel } = dockPanelFromTarget(event.target)
  if (!groupChip || !panel) return
  cancelDockGroupRenameLongPress()
  const panelId = panel.id
  dockGroupRenameLongPress = {
    clientX: event.clientX,
    clientY: event.clientY,
    panelId,
    timer: window.setTimeout(() => {
      const pending = dockGroupRenameLongPress
      dockGroupRenameLongPress = undefined
      if (!pending || pending.panelId !== panelId) return
      organizationRevision.value += 1
      void startGroupRename(panelId)
    }, DOCK_GROUP_RENAME_LONG_PRESS_MS),
  }
}

function closeDockTabOnDoubleClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  const { panel, tab } = dockPanelFromTarget(event.target)
  if (!panel || !tab || event.target.closest("button")) return
  event.preventDefault()
  panel.api.close()
}

function setDockContextMenuOpen(open: boolean) {
  dockContextMenuOpen.value = open && dockContextKind.value !== null
  if (!open) dockContextKind.value = null
}

function findSerializedGroup(
  node: SerializedDockview["grid"]["root"],
  panelId: string,
): Record<string, unknown> | null {
  if (node.type === "leaf") {
    const data = node.data as unknown as Record<string, unknown>
    return Array.isArray(data.views) && data.views.includes(panelId)
      ? data
      : null
  }
  if (!Array.isArray(node.data)) return null
  for (const child of node.data) {
    const found = findSerializedGroup(child, panelId)
    if (found) return found
  }
  return null
}

function reorderSerializedTabGroup(
  group: Record<string, unknown>,
  orderedViews: string[],
) {
  if (!Array.isArray(group.tabGroups)) return
  for (const candidate of group.tabGroups) {
    if (!candidate || typeof candidate !== "object") continue
    const tabGroup = candidate as { panelIds?: string[] }
    if (!Array.isArray(tabGroup.panelIds)) continue
    const members = new Set(tabGroup.panelIds)
    tabGroup.panelIds = orderedViews.filter((id) => members.has(id))
  }
}

function toggleActivePanelPinned() {
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel) return
  const layout = api.toJSON()
  const serializedPanel = layout.panels[panel.id]
  const params = serializedPanel.params as DesktopWorkspacePanelParams
  const pinned = params.bentoPinned !== true
  serializedPanel.params = { ...params, bentoPinned: pinned }
  const titledPanel = serializedPanel as typeof serializedPanel & {
    title?: string
  }
  const currentTitle = titledPanel.title ?? panel.api.title ?? panel.id
  titledPanel.title = pinned
    ? `📌 ${currentTitle.replace(/^📌\s*/, "")}`
    : currentTitle.replace(/^📌\s*/, "")
  const group = findSerializedGroup(layout.grid.root, panel.id)
  if (group && Array.isArray(group.views)) {
    const views = group.views.filter((id) => id !== panel.id)
    const orderedViews = pinned ? [panel.id, ...views] : [...views, panel.id]
    group.views = orderedViews
    reorderSerializedTabGroup(group, orderedViews)
  }
  restoringLayout = true
  try {
    api.fromJSON(layout)
    api.getPanel(panel.id)?.api.setActive()
    organizationRevision.value += 1
  } finally {
    restoringLayout = false
  }
  scheduleAutosave()
}

function normalizePinnedPanelOrder() {
  const api = dockviewApi.value
  if (!api || restoringLayout) return
  const layout = api.toJSON()
  let changed = false
  const visit = (node: SerializedDockview["grid"]["root"]) => {
    if (node.type === "branch" && Array.isArray(node.data)) {
      node.data.forEach(visit)
      return
    }
    const group = node.data as unknown as { views?: string[] }
    if (!Array.isArray(group.views)) return
    const pinned = group.views.filter((id) => {
      const params = layout.panels[id]?.params as
        DesktopWorkspacePanelParams | undefined
      return params?.bentoPinned === true
    })
    const regular = group.views.filter((id) => !pinned.includes(id))
    const ordered = [...pinned, ...regular]
    if (ordered.some((id, index) => id !== group.views?.[index])) {
      group.views = ordered
      reorderSerializedTabGroup(
        group as unknown as Record<string, unknown>,
        ordered,
      )
      changed = true
    }
  }
  visit(layout.grid.root)
  if (!changed) return
  restoringLayout = true
  try {
    api.fromJSON(layout, { reuseExistingPanels: true })
    organizationRevision.value += 1
  } finally {
    restoringLayout = false
  }
  scheduleAutosave()
}

function createGroupForActivePanel() {
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel) return
  const existingCount = api.getTabGroups({ groupId: panel.group.id }).length
  const tabGroup = api.createTabGroup({
    groupId: panel.group.id,
    label: `Groupe ${existingCount + 1}`,
    color: "blue",
  })
  api.addPanelToTabGroup({
    groupId: panel.group.id,
    tabGroupId: tabGroup.id,
    panelId: panel.id,
  })
  organizationRevision.value += 1
  scheduleAutosave()
}

function renamedTabGroup() {
  const api = dockviewApi.value
  const target = groupRenameTarget.value
  if (!api || !target) return undefined
  return api
    .getTabGroups({ groupId: target.groupId })
    .find((group) => group.id === target.tabGroupId)
}

async function startGroupRename(panelId?: string) {
  const api = dockviewApi.value
  const panel = panelId ? api?.getPanel(panelId) : api?.activePanel
  if (!api || !panel) return
  const group = api.getTabGroupForPanel({
    groupId: panel.group.id,
    panelId: panel.id,
  })
  if (!group) return
  panel.api.setActive()
  groupRenameTarget.value = {
    groupId: panel.group.id,
    tabGroupId: group.id,
    panelId: panel.id,
  }
  sceneEditorVisible.value = false
  groupName.value = group.label
  groupRenameVisible.value = true
  await nextTick()
  const input = groupNameInput.value?.$el as HTMLInputElement | undefined
  input?.focus()
  input?.select()
}

function cancelGroupRename() {
  const panelId = groupRenameTarget.value?.panelId
  groupRenameVisible.value = false
  groupRenameTarget.value = undefined
  void nextTick(() => {
    if (panelId && dockviewApi.value?.activePanel?.id === panelId)
      focusWorkspacePanelTab(workspaceElement.value, panelId)
  })
}

function activePanelMatchesGroupRenameTarget() {
  const api = dockviewApi.value
  const panel = api?.activePanel
  const target = groupRenameTarget.value
  if (!api || !panel || !target || panel.group.id !== target.groupId)
    return false
  return (
    api.getTabGroupForPanel({
      groupId: panel.group.id,
      panelId: panel.id,
    })?.id === target.tabGroupId
  )
}

function commitGroupRename() {
  const name = groupName.value.trim().slice(0, 40)
  const group = renamedTabGroup()
  if (!name || !group) return
  group.setLabel(name)
  cancelGroupRename()
  organizationRevision.value += 1
  scheduleAutosave()
}

function removeActivePanelFromGroup() {
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel || !activeTabGroup.value) return
  api.removePanelFromTabGroup({ groupId: panel.group.id, panelId: panel.id })
  organizationRevision.value += 1
  scheduleAutosave()
}

function duplicateActivePanel() {
  const panel = dockviewApi.value?.activePanel
  if (!panel || !activePanelCanDuplicate.value) return
  organizeFromSidebar({
    action: "duplicate",
    panelId: panel.id,
    profileId: profilesStore.activeProfileId,
    sceneId: selectedLayoutId.value,
  })
}

function canReorderActivePanel(offset: -1 | 1) {
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel) return false
  const group = findSerializedGroup(api.toJSON().grid.root, panel.id)
  if (!group || !Array.isArray(group.views)) return false
  const index = group.views.indexOf(panel.id)
  return (
    index >= 0 && index + offset >= 0 && index + offset < group.views.length
  )
}

function activeGroupOrder() {
  const api = dockviewApi.value
  const panel = api?.activePanel
  const group = activeTabGroup.value
  if (!api || !panel || !group) return undefined
  const groups = snapshotBentoSidebar(
    api,
    profilesStore.activeProfileId,
    selectedLayoutId.value,
  ).groups.filter((item) => item.paneId === panel.group.id && item.id)
  return {
    group,
    paneId: panel.group.id,
    index: groups.findIndex((item) => item.id === group.id),
    length: groups.length,
  }
}

function canReorderActiveGroup(offset: -1 | 1) {
  const order = activeGroupOrder()
  return Boolean(
    order &&
    order.index >= 0 &&
    order.index + offset >= 0 &&
    order.index + offset < order.length,
  )
}

function reorderActiveGroup(offset: -1 | 1) {
  const order = activeGroupOrder()
  if (!order || !canReorderActiveGroup(offset)) return
  organizeFromSidebar({
    action: "reorder-group",
    paneId: order.paneId,
    groupId: order.group.id,
    index: order.index + offset,
    profileId: profilesStore.activeProfileId,
    sceneId: selectedLayoutId.value,
  })
}

function dissolveActiveGroup() {
  const order = activeGroupOrder()
  if (!order) return
  organizeFromSidebar({
    action: "dissolve",
    paneId: order.paneId,
    groupId: order.group.id,
    profileId: profilesStore.activeProfileId,
    sceneId: selectedLayoutId.value,
  })
}

function reorderActivePanel(offset: -1 | 1) {
  const api = dockviewApi.value
  const panel = api?.activePanel
  if (!api || !panel) return
  const layout = api.toJSON()
  const group = findSerializedGroup(layout.grid.root, panel.id)
  if (!group || !Array.isArray(group.views)) return
  const index = group.views.indexOf(panel.id)
  const target = Math.max(0, Math.min(group.views.length - 1, index + offset))
  if (index < 0 || target === index) return
  group.views.splice(index, 1)
  group.views.splice(target, 0, panel.id)
  reorderSerializedTabGroup(group, group.views)
  restoringLayout = true
  try {
    api.fromJSON(layout, { reuseExistingPanels: true })
    organizationRevision.value += 1
  } finally {
    restoringLayout = false
  }
  scheduleAutosave()
}

function handleWorkspaceKeyboard(event: KeyboardEvent) {
  if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
    event.preventDefault()
    toggleActivePanelPinned()
  } else if (event.altKey && event.shiftKey && event.key === "ArrowLeft") {
    event.preventDefault()
    reorderActivePanel(-1)
  } else if (event.altKey && event.shiftKey && event.key === "ArrowRight") {
    event.preventDefault()
    reorderActivePanel(1)
  }
}
const workspaceUiState = computed(() =>
  resolveDesktopWorkspaceUiState(
    Boolean(dockviewApi.value),
    workspacePanelCount.value,
  ),
)

function syncWorkspacePanelCount() {
  workspacePanelCount.value = dockviewApi.value?.panels.length ?? 0
}
const desktopWorkspaceConstraints = readDesktopWorkspaceConstraints()
desktopWorkspacesStore.initialize(
  workspaceNetworkCatalog.value,
  profilesStore.activeProfile?.localOnly ? "" : profilesStore.activeProfileId,
)
const { workspaceState } = storeToRefs(desktopWorkspacesStore)
const layoutName = ref("")
const sceneIcon = ref<DesktopSceneIcon>(DEFAULT_DESKTOP_SCENE_ICON)
const sceneColor = ref<DesktopSceneColor>(DEFAULT_DESKTOP_SCENE_COLOR)
const selectedPreset = ref("")
const dockDragActive = ref(false)
const sceneSaveStatus = ref<"idle" | "saving" | "saved" | "local-only">("idle")
const sceneEditorVisible = ref(false)
const disposables: Array<{ dispose: () => void }> = []
let autosaveTimer: number | undefined
let sceneAutosaveTimer: number | undefined
let dockDragWatchdog: number | undefined
let restoringLayout = false
let profileSwitching = false
let autosaveWarningShown = false
let handledSceneCommandRevision = 0
const DOCK_DRAG_WATCHDOG_MS = 15_000
const SCENE_AUTOSAVE_DELAY_MS = 800

const workspaceSuspended = computed(
  () => props.suspended || dockDragActive.value,
)
provide(workspaceWebviewsSuspendedKey, workspaceSuspended)

function workspacePersistenceMessage(
  result: WorkspacePersistenceResult,
): string {
  if (result.ok || result.reason === "unavailable") {
    return "Le stockage local est indisponible. Cette modification ne pourra pas être conservée."
  }
  return result.reason === "too-large"
    ? "Ce Bento dépasse la taille autorisée. Réduisez le nombre ou la complexité des panneaux avant de l’enregistrer."
    : "Ce Bento contient trop de panneaux ou une structure incohérente et ne peut pas être enregistré."
}

function workspaceSyncMessage(result: WorkspacePersistenceResult): string {
  return !result.ok && result.reason === "too-large"
    ? "Ce Bento dépasse la limite de synchronisation et reste disponible uniquement sur cet appareil."
    : "La synchronisation est temporairement indisponible. Ce Bento reste enregistré sur cet appareil."
}

const dockviewTheme = computed(() =>
  themeStore.isDarkMode ? themeDark : themeLight,
)
const profileLayouts = computed(() =>
  workspaceState.value.layouts.filter(
    (layout) => layout.profileId === profilesStore.activeProfileId,
  ),
)
const layoutOptions = computed(() =>
  profileLayouts.value.map((layout) => ({
    value: layout.id,
    label: `${layout.icon ?? DEFAULT_DESKTOP_SCENE_ICON} ${layout.name}`,
    icon: "pi pi-th-large",
  })),
)
const sceneIconOptions = DESKTOP_SCENE_ICONS.map((icon) => ({
  value: icon,
  label: icon,
}))
const sceneColorLabels: Record<DesktopSceneColor, string> = {
  accent: "Accent",
  success: "Vert",
  warning: "Jaune",
  danger: "Rouge",
  info: "Bleu",
  neutral: "Neutre",
}
const sceneColorOptions = DESKTOP_SCENE_COLORS.map((color) => ({
  value: color,
  label: sceneColorLabels[color],
}))
const presetOptions = [
  { value: "columns", label: "Colonnes", icon: "pi pi-arrows-h" },
  { value: "rows", label: "Lignes", icon: "pi pi-arrows-v" },
  { value: "focus", label: "Focus", icon: "pi pi-window-maximize" },
  { value: "grid", label: "Grille", icon: "pi pi-th-large" },
]
const selectedLayoutId = computed({
  get: () =>
    workspaceState.value.selectedLayoutIds[profilesStore.activeProfileId] ?? "",
  set: (id: string) => {
    workspaceState.value = selectDesktopWorkspaceLayout(
      workspaceState.value,
      profilesStore.activeProfileId,
      id || null,
    )
  },
})
watch(selectedLayoutId, () => {
  organizationRevision.value += 1
})
const sceneSaveLabel = computed(() => {
  if (!selectedLayoutId.value) return ""
  if (sceneSaveStatus.value === "saving") return "Enregistrement…"
  if (sceneSaveStatus.value === "local-only") {
    return "Local · sync en attente"
  }
  return sceneSaveStatus.value === "saved" ? "Enregistré" : ""
})

function panelId(networkId: string, url: string, instanceId?: string): string {
  return desktopWorkspacePanelId({ networkId, url, instanceId })
}

function scheduleAutosave() {
  syncWorkspacePanelCount()
  if (restoringLayout || profileSwitching) return
  window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    const api = dockviewApi.value
    if (!api) return
    const profileId = profilesStore.activeProfileId
    const hasContent = api.panels.length > 0
    emit("contentChange", hasContent)
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
  scheduleNamedSceneAutosave()
}

function persistActiveNamedScene(
  profileId: string,
  catalog = networkCatalogForProfile(profileId),
): boolean {
  const api = dockviewApi.value
  const id = workspaceState.value.selectedLayoutIds[profileId]
  const saved = workspaceState.value.layouts.find(
    (layout) => layout.profileId === profileId && layout.id === id,
  )
  if (!api || !id || !saved || api.panels.length === 0) return false

  const layout = api.toJSON()
  if (!isSafeDesktopWorkspaceLayout(layout, catalog)) {
    sceneSaveStatus.value = "local-only"
    return false
  }
  const nextState = saveDesktopWorkspaceLayout(workspaceState.value, {
    id,
    profileId,
    name:
      profileId === profilesStore.activeProfileId
        ? layoutName.value.trim() || saved.name
        : saved.name,
    layout,
    icon:
      profileId === profilesStore.activeProfileId
        ? sceneIcon.value
        : saved.icon,
    color:
      profileId === profilesStore.activeProfileId
        ? sceneColor.value
        : saved.color,
  })
  const result = desktopWorkspacesStore.persist(nextState)
  if (!result.local.ok) {
    sceneSaveStatus.value = "local-only"
    if (!autosaveWarningShown) {
      autosaveWarningShown = true
      push.warning({ message: workspacePersistenceMessage(result.local) })
    }
    return false
  }
  sceneSaveStatus.value =
    result.cloud.ok && navigator.onLine ? "saved" : "local-only"
  return true
}

function flushNamedSceneAutosave(
  profileId = profilesStore.activeProfileId,
  catalog = networkCatalogForProfile(profileId),
) {
  window.clearTimeout(sceneAutosaveTimer)
  sceneAutosaveTimer = undefined
  if (!profileId || restoringLayout || profileSwitching) return
  persistActiveNamedScene(profileId, catalog)
}

function scheduleNamedSceneAutosave() {
  if (
    restoringLayout ||
    profileSwitching ||
    !workspaceState.value.selectedLayoutIds[profilesStore.activeProfileId]
  )
    return
  sceneSaveStatus.value = "saving"
  window.clearTimeout(sceneAutosaveTimer)
  sceneAutosaveTimer = window.setTimeout(() => {
    sceneAutosaveTimer = undefined
    persistActiveNamedScene(profilesStore.activeProfileId)
  }, SCENE_AUTOSAVE_DELAY_MS)
}

function endDockDrag() {
  const shouldNormalize = dockDragActive.value
  dockDragActive.value = false
  window.clearTimeout(dockDragWatchdog)
  dockDragWatchdog = undefined
  window.removeEventListener("dragend", endDockDrag, true)
  window.removeEventListener("drop", endDockDrag, true)
  window.removeEventListener("pointerup", endDockDrag, true)
  window.removeEventListener("pointercancel", endDockDrag, true)
  window.removeEventListener("blur", endDockDrag, true)
  window.removeEventListener("keydown", endDockDragOnEscape, true)
  document.removeEventListener("visibilitychange", endDockDragWhenHidden, true)
  if (shouldNormalize) window.setTimeout(normalizePinnedPanelOrder)
}

function endDockDragOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") endDockDrag()
}

function endDockDragWhenHidden() {
  if (document.hidden) endDockDrag()
}

function beginDockDrag(event: TabDragEvent | GroupDragEvent) {
  endDockDrag()
  dockDragActive.value = true
  window.addEventListener("blur", endDockDrag, { capture: true, once: true })
  window.addEventListener("keydown", endDockDragOnEscape, true)
  document.addEventListener("visibilitychange", endDockDragWhenHidden, true)
  dockDragWatchdog = window.setTimeout(endDockDrag, DOCK_DRAG_WATCHDOG_MS)
  if ("dataTransfer" in event.nativeEvent) {
    window.addEventListener("dragend", endDockDrag, {
      capture: true,
      once: true,
    })
    window.addEventListener("drop", endDockDrag, { capture: true, once: true })
  } else {
    window.addEventListener("pointerup", endDockDrag, {
      capture: true,
      once: true,
    })
    window.addEventListener("pointercancel", endDockDrag, {
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
  const params = panel.toJSON().params as
    DesktopWorkspacePanelParams | undefined
  if (isTasksWorkspacePanelParams(params)) {
    if (webviewStore.activeNetworkId !== "tasks") {
      webviewStore.selectNetwork("tasks")
    }
    return
  }
  if (!params?.networkId || !params.url) return
  if (
    webviewStore.activeNetworkId === params.networkId &&
    webviewStore.activeUrl === params.url &&
    (webviewStore.activeInstanceId ?? undefined) === params.instanceId
  )
    return
  webviewStore.selectNetwork(params.networkId, params.url, params.instanceId)
}

function ensureTasksPanel() {
  const api = dockviewApi.value
  if (!api || profileSwitching) return
  const id = desktopWorkspacePanelId({ type: "tasks" })
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
  const referencePanel = api.activePanel ?? api.panels[api.panels.length - 1]
  api.addPanel({
    id,
    component: "tasks",
    title: "Kanban",
    params: { type: "tasks" },
    ...(referencePanel
      ? { position: { referencePanel, direction: "right" as const } }
      : {}),
  })
  syncWorkspacePanelCount()
}

function ensureNetworkPanel(
  networkId: string,
  url: string,
  instanceId?: string,
) {
  const api = dockviewApi.value
  if (!api || profileSwitching) return
  const params = { networkId, url, ...(instanceId ? { instanceId } : {}) }
  if (!isNetworkWorkspacePanelParams(params, workspaceNetworkCatalog.value)) {
    console.warn(
      "[CommunityGlows] Ignoring an untrusted desktop workspace target.",
    )
    return
  }
  const id = panelId(networkId, url, instanceId)
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
  const categoryId = getNetworkGroupId(networkId)
  const destination = resolveBentoGroupDestination(
    newPanelDestination.value,
    categoryId,
    availableTabGroups.value,
  )
  const destinationGroup = destination
    ? api.getGroup(destination.groupId)
    : undefined
  const referencePanel = api.activePanel ?? api.panels[api.panels.length - 1]
  const direction = api.panels.length % 2 === 0 ? "below" : "right"
  const panel = api.addPanel<NetworkWorkspacePanelParams>({
    id,
    component: "network",
    title: network?.label ?? "Lien personnalisé",
    renderer: "always",
    params,
    minimumWidth: desktopWorkspaceConstraints.panelMinWidth,
    minimumHeight: desktopWorkspaceConstraints.panelMinHeight,
    ...(destinationGroup
      ? {
          position: {
            referenceGroup: destinationGroup,
            direction: "within" as const,
          },
        }
      : referencePanel
        ? { position: { referencePanel, direction } }
        : {}),
  })
  if (destination && destinationGroup) {
    api.addPanelToTabGroup({ ...destination, panelId: panel.id })
  } else if (
    categoryId !== "other" &&
    ["category", "new-category"].includes(newPanelDestination.value)
  ) {
    const category = networkGroups.find((group) => group.id === categoryId)
    const tabGroup = api.createTabGroup({
      groupId: panel.group.id,
      label: category ? t(category.labelKey) : categoryId,
      color: "blue",
      componentParams: { [BENTO_CATALOG_GROUP_KEY]: categoryId },
    })
    api.addPanelToTabGroup({
      groupId: panel.group.id,
      tabGroupId: tabGroup.id,
      panelId: panel.id,
    })
    // Further additions follow this exact group even after a personal rename.
    if (newPanelDestination.value === "new-category") {
      newPanelDestination.value = bentoGroupDestinationValue({
        groupId: panel.group.id,
        tabGroupId: tabGroup.id,
        label: tabGroup.label,
      })
    }
  }
  organizationRevision.value += 1
  syncWorkspacePanelCount()
  scheduleAutosave()
}

function restoreLayout(layout: SerializedDockview): boolean {
  const api = dockviewApi.value
  if (
    !api ||
    !isSafeDesktopWorkspaceLayout(layout, workspaceNetworkCatalog.value)
  )
    return false
  newPanelDestination.value = "category"
  restoringLayout = true
  try {
    api.fromJSON(layout)
    return true
  } catch (error) {
    console.warn(
      "[CommunityGlows] Ignoring an invalid desktop workspace layout.",
      error,
    )
    api.clear()
    return false
  } finally {
    restoringLayout = false
    syncWorkspacePanelCount()
    emit("contentChange", api.panels.length > 0)
  }
}

function applyPreset(value: string) {
  const api = dockviewApi.value
  selectedPreset.value = ""
  if (!api || !workspaceUiState.value.canApplyPreset) return

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
      "[CommunityGlows] Failed to apply a desktop workspace preset.",
      error,
    )
    push.warning({
      message: "Cette disposition n’a pas pu être appliquée.",
    })
    try {
      api.fromJSON(previousLayout)
    } catch (restoreError) {
      console.error(
        "[CommunityGlows] Failed to restore the previous desktop workspace.",
        restoreError,
      )
    }
  } finally {
    restoringLayout = false
    emit("contentChange", api.panels.length > 0)
  }
  if (applied) scheduleAutosave()
}

function onDockviewReady(event: DockviewReadyEvent) {
  dockviewApi.value = event.api
  syncWorkspacePanelCount()
  disposables.push(
    event.api.onDidLayoutChange(() => {
      organizationRevision.value += 1
      scheduleAutosave()
    }),
    event.api.onDidActivePanelChange(() => {
      organizationRevision.value += 1
      if (groupRenameVisible.value && !activePanelMatchesGroupRenameTarget())
        cancelGroupRename()
      syncActiveNetworkFromDockview()
    }),
    event.api.onDidRemovePanel((panel) => {
      const params = panel.toJSON().params as
        NetworkWorkspacePanelParams | undefined
      const profileId = profilesStore.activeProfileId
      window.setTimeout(async () => {
        syncActiveNetworkFromDockview()
        // Layout restores can remove and recreate the same panel in one turn.
        if (
          dockviewApi.value !== event.api ||
          event.api.getPanel(panel.id) ||
          !params?.instanceId ||
          !("__TAURI_INTERNALS__" in window)
        )
          return
        const { invoke } = await import("@tauri-apps/api/core")
        await invoke("close_webview", {
          profileId,
          networkId: params.networkId,
          instanceId: params.instanceId,
        }).catch(() => {})
      })
    }),
    event.api.onWillDragPanel(beginDockDrag),
    event.api.onWillDragGroup(beginDockDrag),
    event.api.onDidDrop(endDockDrag),
  )

  const autosave = loadDesktopWorkspaceAutosave(
    localStorage,
    workspaceNetworkCatalog.value,
    profilesStore.activeProfileId,
  )
  const restoredAutosave = autosave ? restoreLayout(autosave) : false

  const selected = workspaceState.value.layouts.find(
    (layout) =>
      layout.profileId === profilesStore.activeProfileId &&
      layout.id ===
        workspaceState.value.selectedLayoutIds[profilesStore.activeProfileId],
  )
  layoutName.value = selected?.name ?? ""
  sceneIcon.value = selected?.icon ?? DEFAULT_DESKTOP_SCENE_ICON
  sceneColor.value = selected?.color ?? DEFAULT_DESKTOP_SCENE_COLOR
  sceneSaveStatus.value = selected ? "saved" : "idle"

  if (restoredAutosave) {
    syncActiveNetworkFromDockview()
  } else if (webviewStore.activeNetworkId === "tasks") {
    ensureTasksPanel()
  } else if (webviewStore.activeNetworkId && webviewStore.activeUrl) {
    ensureNetworkPanel(webviewStore.activeNetworkId, webviewStore.activeUrl)
  }
  emit("contentChange", event.api.panels.length > 0)
  organizationRevision.value += 1
  if (selected) scheduleNamedSceneAutosave()
  processSceneCommand(desktopWorkspacesStore.sceneCommand)
}

function loadNamedLayout(id: string) {
  const profileId = profilesStore.activeProfileId
  flushNamedSceneAutosave(profileId)
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
  sceneIcon.value = saved.icon ?? DEFAULT_DESKTOP_SCENE_ICON
  sceneColor.value = saved.color ?? DEFAULT_DESKTOP_SCENE_COLOR
  sceneSaveStatus.value = "saved"
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
  if (!api || !workspaceUiState.value.canCreateScene) return
  const fallbackName = `Bento ${profileLayouts.value.length + 1}`
  const profileId = profilesStore.activeProfileId
  const currentLayout = api.toJSON()
  if (
    !isSafeDesktopWorkspaceLayout(currentLayout, workspaceNetworkCatalog.value)
  ) {
    push.warning({
      message: workspacePersistenceMessage({ ok: false, reason: "invalid" }),
    })
    return
  }
  const nextState = saveDesktopWorkspaceLayout(workspaceState.value, {
    id: workspaceState.value.selectedLayoutIds[profileId] ?? undefined,
    profileId,
    name: layoutName.value || fallbackName,
    layout: currentLayout,
    icon: sceneIcon.value,
    color: sceneColor.value,
  })
  const stateResult = desktopWorkspacesStore.persist(nextState)
  if (!stateResult.local.ok) {
    push.warning({ message: workspacePersistenceMessage(stateResult.local) })
    return
  }
  window.clearTimeout(sceneAutosaveTimer)
  sceneAutosaveTimer = undefined
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
    sceneSaveStatus.value = "local-only"
    push.warning({
      message: `Bento enregistré localement. ${
        !stateResult.cloud.ok
          ? workspaceSyncMessage(stateResult.cloud)
          : workspacePersistenceMessage(autosaveResult)
      }`,
    })
  } else {
    sceneSaveStatus.value = "saved"
    push.success({ message: "Bento enregistré." })
  }
  sceneEditorVisible.value = false
}

function commitSceneEditor() {
  if (selectedLayoutId.value) {
    flushNamedSceneAutosave()
    sceneEditorVisible.value = false
    return
  }
  saveNamedLayout()
}

function closeSceneEditor() {
  sceneEditorVisible.value = false
}

function commitSceneName() {
  if (selectedLayoutId.value) {
    flushNamedSceneAutosave()
    return
  }
  saveNamedLayout()
}

async function startNewLayout() {
  const api = dockviewApi.value
  if (!api) return
  const profileId = profilesStore.activeProfileId
  flushNamedSceneAutosave(profileId)
  const nextState = selectDesktopWorkspaceLayout(
    workspaceState.value,
    profileId,
    null,
  )
  layoutName.value = ""
  sceneIcon.value = DEFAULT_DESKTOP_SCENE_ICON
  sceneColor.value = DEFAULT_DESKTOP_SCENE_COLOR
  sceneSaveStatus.value = "idle"
  newPanelDestination.value = "category"
  api.clear()
  syncWorkspacePanelCount()
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
  emit("contentChange", false)
  groupRenameVisible.value = false
  sceneEditorVisible.value = true
  await nextTick()
  const input = sceneNameInput.value?.$el as HTMLInputElement | undefined
  input?.focus()
}

function deleteNamedLayout() {
  const profileId = profilesStore.activeProfileId
  const id = workspaceState.value.selectedLayoutIds[profileId]
  if (!id) return
  window.clearTimeout(sceneAutosaveTimer)
  sceneAutosaveTimer = undefined
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
  layoutName.value = ""
  sceneIcon.value = DEFAULT_DESKTOP_SCENE_ICON
  sceneColor.value = DEFAULT_DESKTOP_SCENE_COLOR
  sceneSaveStatus.value = "idle"
  if (!result.cloud.ok) {
    push.warning({
      message: `Bento supprimé localement. ${workspaceSyncMessage(result.cloud)}`,
    })
  } else {
    push.success({
      message: "Bento supprimé. Le Bento courant reste ouvert.",
    })
  }
}

function processSceneCommand(
  command: typeof desktopWorkspacesStore.sceneCommand,
) {
  if (
    !command ||
    !dockviewApi.value ||
    command.revision === handledSceneCommandRevision
  )
    return
  handledSceneCommandRevision = command.revision
  if (command.action === "create") {
    startNewLayout()
    return
  }
  if (!command.sceneId) return
  if (command.action === "load" || command.action === "edit") {
    loadNamedLayout(command.sceneId)
    groupRenameVisible.value = false
    sceneEditorVisible.value = command.action === "edit"
    if (command.action === "edit") {
      void nextTick(() => {
        const input = sceneNameInput.value?.$el as HTMLInputElement | undefined
        input?.focus()
        input?.select()
      })
    }
    return
  }
  const profileId = profilesStore.activeProfileId
  workspaceState.value = selectDesktopWorkspaceLayout(
    workspaceState.value,
    profileId,
    command.sceneId,
  )
  deleteNamedLayout()
}

watch(
  () => desktopWorkspacesStore.sceneCommand,
  (command) => {
    processSceneCommand(command)
  },
)

watch(
  [
    () => webviewStore.activeNetworkId,
    () => webviewStore.activeUrl,
    () => webviewStore.selectionRevision,
  ],
  ([networkId, url]) => {
    if (networkId === "tasks") ensureTasksPanel()
    else if (networkId && url)
      ensureNetworkPanel(
        networkId,
        url,
        webviewStore.activeInstanceId ?? undefined,
      )
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
    window.clearTimeout(autosaveTimer)
    window.clearTimeout(sceneAutosaveTimer)
    sceneAutosaveTimer = undefined
    const previousProfileStillExists = profilesStore.profiles.some(
      (profile) => profile.id === previousProfileId,
    )
    if (previousProfileId && previousProfileStillExists) {
      persistActiveNamedScene(
        previousProfileId,
        networkCatalogForProfile(previousProfileId),
      )
    }
    newPanelDestination.value = "category"
    profileSwitching = true
    restoringLayout = true

    try {
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
        "[CommunityGlows] Failed to switch the desktop workspace profile.",
        error,
      )
      api.clear()
    } finally {
      restoringLayout = false
      profileSwitching = false
      organizationRevision.value += 1
      syncWorkspacePanelCount()
      emit("contentChange", api.panels.length > 0)
    }

    if (api.panels.length === 0) {
      const networkId = webviewStore.activeNetworkId
      const url = webviewStore.activeUrl
      if (networkId === "tasks") ensureTasksPanel()
      else if (networkId && url)
        ensureNetworkPanel(
          networkId,
          url,
          webviewStore.activeInstanceId ?? undefined,
        )
    }
    syncActiveNetworkFromDockview()
    sceneSaveStatus.value = workspaceState.value.selectedLayoutIds[profileId]
      ? "saved"
      : "idle"
  },
)

watch(workspaceNetworkCatalog, (catalog) => {
  const api = dockviewApi.value
  if (!api || profileSwitching) return
  for (const panel of [...api.panels]) {
    const params = panel.toJSON().params as
      DesktopWorkspacePanelParams | undefined
    if (
      !isTasksWorkspacePanelParams(params) &&
      !isNetworkWorkspacePanelParams(params, catalog)
    ) {
      panel.api.close()
    }
  }
})

watch(
  [workspaceState, () => profilesStore.activeProfileId],
  ([state, profileId]) => {
    const selected = state.layouts.find(
      (layout) =>
        layout.profileId === profileId &&
        layout.id === state.selectedLayoutIds[profileId],
    )
    layoutName.value = selected?.name ?? ""
    sceneIcon.value = selected?.icon ?? DEFAULT_DESKTOP_SCENE_ICON
    sceneColor.value = selected?.color ?? DEFAULT_DESKTOP_SCENE_COLOR
  },
)

watch(layoutName, (name, previousName) => {
  if (name !== previousName) scheduleNamedSceneAutosave()
})

watch([sceneIcon, sceneColor], () => {
  scheduleNamedSceneAutosave()
})

onUnmounted(() => {
  emit("organizationChange", null)
  endDockDrag()
  cancelDockGroupRenameLongPress()
  window.clearTimeout(autosaveTimer)
  flushNamedSceneAutosave()
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
  display: grid;
  gap: var(--sg-space-2);
  padding: var(--sg-space-2);
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
  background: var(--sg-color-surface-muted);
}

.desktop-workspace__primary-controls {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--sg-space-2);
  flex-wrap: wrap;
}

.desktop-workspace__toolbar-select {
  min-width: 0;
  max-width: var(--sg-size-full);
  flex: 1 1 var(--sg-size-200px);
}

.desktop-workspace__name {
  min-width: 0;
  flex: 1;
}

.desktop-workspace__editor {
  display: grid;
  min-width: 0;
  gap: var(--sg-space-2);
  padding-top: var(--sg-space-2);
  border-top: var(--sg-border-1px) solid var(--sg-color-border);
}

.desktop-workspace__editor-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-2);
  flex-wrap: wrap;
}

.desktop-workspace__editor-fields {
  display: flex;
  min-width: 0;
  align-items: end;
  gap: var(--sg-space-2);
  flex-wrap: wrap;
}

.desktop-workspace__field {
  display: grid;
  min-width: 0;
  gap: var(--sg-space-1);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
}

.desktop-workspace__field--name {
  flex: 1 1 var(--sg-size-200px);
}

.desktop-workspace__scene-style {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--sg-space-1);
  flex-wrap: wrap;
}

.desktop-workspace__scene-color {
  display: inline-grid;
  min-width: var(--sg-control-height-sm);
  min-height: var(--sg-control-height-sm);
  place-items: center;
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-action);
}

.desktop-workspace__scene-color--success {
  background: var(--sg-color-success);
}
.desktop-workspace__scene-color--warning {
  background: var(--sg-color-warning);
}
.desktop-workspace__scene-color--danger {
  background: var(--sg-color-danger);
}
.desktop-workspace__scene-color--info {
  background: var(--sg-color-info);
}
.desktop-workspace__scene-color--neutral {
  background: var(--sg-color-surface-muted);
}

.desktop-workspace__editor-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sg-space-1);
  flex-wrap: wrap;
}

.desktop-workspace__group-editor {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--sg-space-1);
  width: var(--sg-size-full);
  flex-wrap: wrap;
}

.desktop-workspace__group-editor :deep(.sg-input) {
  min-width: 0;
  flex: 1 1 var(--sg-size-200px);
}

.desktop-workspace__save-status {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
  white-space: nowrap;
}

.desktop-workspace__dock {
  position: relative;
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
  --dv-active-sash-color: var(--sg-workspace-active-indicator-color);
  --dv-icon-hover-background-color: var(--sg-color-surface-hover);
  --dv-drag-over-border-color: var(--sg-workspace-active-indicator-color);
  --dv-edge-dock-indicator-color: var(--sg-workspace-active-indicator-color);
  --dv-tabs-and-actions-container-height: var(--sg-control-height-lg);
  --dv-tab-font-size: inherit;
  --dv-border-radius: var(--sg-radius-sm);
  --dv-tab-border-radius: var(--sg-radius-sm);
}

.desktop-workspace__active-frame {
  position: absolute;
  z-index: var(--sg-layer-modal);
  inset: 0 auto auto 0;
  width: var(--sg-size-full);
  height: calc(100% / var(--sg-ui-css-scale, 1));
  border: var(--sg-border-2px) solid var(--sg-workspace-active-frame-color);
  box-shadow: inset 0 0 0 var(--sg-border-1px)
    var(--sg-workspace-active-indicator-color);
  box-sizing: border-box;
  pointer-events: none;
}

.desktop-workspace__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--sg-space-3);
  padding: var(--sg-space-6);
  color: var(--sg-color-text-muted);
  text-align: center;
  pointer-events: none;
}

.desktop-workspace__empty p {
  margin: 0;
}

.desktop-workspace__dock :deep(.desktop-workspace__dockview) {
  width: var(--sg-size-full);
  height: var(--sg-size-full);
}

.desktop-workspace__dock :deep(.dv-groupview.dv-active-group) {
  position: relative;
}

.desktop-workspace__dock :deep(.dv-tab-group-chip) {
  color: var(--sg-color-text);
  background: color-mix(
    in srgb,
    var(--sg-workspace-active-frame-color) 16%,
    var(--sg-color-surface)
  );
  box-shadow: inset 0 0 0 var(--sg-border-1px)
    var(--sg-workspace-active-frame-color);
}

.desktop-workspace__dock :deep(.dv-tab-group-underline),
.desktop-workspace__dock :deep(.dv-tab-group-chip-continuation) {
  background-color: var(--sg-workspace-active-frame-color);
}

:global(.desktop-workspace-context-menu) {
  z-index: var(--sg-layer-modal);
  max-height: calc(var(--sg-size-100vh) - var(--sg-space-4));
  max-width: var(--sg-size-min-100pct-26rem);
  overflow: auto;
  padding: var(--sg-space-1);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-control);
  color: var(--sg-color-text);
}

:global(.desktop-workspace-context-menu [role="menuitem"]) {
  padding: var(--sg-space-2);
  border-radius: var(--sg-radius-sm);
  cursor: pointer;
}

:global(.desktop-workspace-context-menu [data-highlighted]) {
  outline: none;
  background: var(--sg-color-surface-hover);
}

:global(.desktop-workspace-context-menu [data-disabled]) {
  opacity: var(--sg-opacity-disabled);
}

/* Dockview measures this overlay in viewport pixels. Cancel the shell's CSS
   zoom so those coordinates are not scaled a second time. Native webview zoom
   already uses CSS coordinates and leaves this factor at its default. */
.desktop-workspace__dock :deep(.dv-tab-group-underline) {
  zoom: calc(1 / var(--sg-ui-css-scale, 1));
}
</style>
