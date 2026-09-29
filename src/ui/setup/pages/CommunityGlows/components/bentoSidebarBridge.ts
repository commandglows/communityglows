import type { DockviewApi, SerializedDockview } from "dockview-core"
import {
  desktopWorkspacePanelId,
  MAX_DESKTOP_WORKSPACE_PANELS,
  type NetworkWorkspacePanelParams,
} from "@/lib/desktopWorkspaceLayouts"
import { isNetworkInstanceId } from "@/lib/networkInstance"

export interface BentoSidebarTab {
  id: string
  title: string
  active: boolean
  canDuplicate?: boolean
}
export interface BentoSidebarGroup {
  paneId: string
  id: string
  blockId: string
  title: string
  tabs: BentoSidebarTab[]
}
export interface BentoSidebarSnapshot {
  profileId: string
  sceneId: string
  groups: BentoSidebarGroup[]
}
export type BentoSidebarCommand = { profileId: string; sceneId?: string } & (
  | { action: "activate" | "ungroup"; panelId: string }
  | { action: "duplicate"; panelId: string; instanceId?: string }
  | { action: "create"; panelId: string; name: string }
  | {
      action: "move"
      panelId: string
      paneId: string
      groupId: string
      beforeId?: string
    }
  | {
      action: "rename" | "dissolve"
      paneId: string
      groupId: string
      name?: string
    }
  | { action: "reorder-group"; paneId: string; groupId: string; index: number }
)

type SerializedPane = {
  id: string
  views: string[]
  tabGroups?: Array<{ id: string; panelIds: string[] }>
}

export function snapshotBentoSidebar(
  api: DockviewApi,
  profileId: string,
  sceneId = "",
): BentoSidebarSnapshot {
  return {
    profileId,
    sceneId,
    groups: api.groups.flatMap((pane) => {
      const tabGroups = [...api.getTabGroups({ groupId: pane.id })]
      const tab = (id: string): BentoSidebarTab => ({
        id,
        title: api.getPanel(id)?.api.title ?? id,
        active: api.activePanel?.id === id,
        canDuplicate: !!(
          api.getPanel(id)?.toJSON().params as
            NetworkWorkspacePanelParams | undefined
        )?.networkId,
      })
      const emittedGroups = new Set<string>()
      return pane.panels.flatMap((panel) => {
        const group = tabGroups.find((item) => item.panelIds.includes(panel.id))
        if (!group)
          return [
            {
              paneId: pane.id,
              id: "",
              blockId: `panel:${panel.id}`,
              title: "",
              tabs: [tab(panel.id)],
            },
          ]
        if (emittedGroups.has(group.id)) return []
        emittedGroups.add(group.id)
        const memberIds = pane.panels
          .filter((item) => group.panelIds.includes(item.id))
          .map((item) => item.id)
        return [
          {
            paneId: pane.id,
            id: group.id,
            blockId: `group:${group.id}`,
            title: group.label,
            tabs: memberIds.map(tab),
          },
        ]
      })
    }),
  }
}

/** Keep Dockview the sole live owner; never close panels during organization. */
export function applyBentoSidebarCommand(
  api: DockviewApi,
  profileId: string,
  command: BentoSidebarCommand,
): boolean {
  if (command.profileId !== profileId) return false
  if ("panelId" in command) {
    const panel = api.getPanel(command.panelId)
    if (!panel) return false
    if (command.action === "duplicate") {
      const source = panel.toJSON().params as
        NetworkWorkspacePanelParams | undefined
      if (
        !source?.networkId ||
        !source.url ||
        api.panels.length >= MAX_DESKTOP_WORKSPACE_PANELS
      )
        return false
      const instanceId = command.instanceId ?? crypto.randomUUID()
      if (!isNetworkInstanceId(instanceId)) return false
      const params = { ...source, instanceId }
      const id = desktopWorkspacePanelId(params)
      if (api.getPanel(id)) return false
      const sourceGroup = api.getTabGroupForPanel({
        groupId: panel.group.id,
        panelId: panel.id,
      })
      const sourceIndex = panel.group.panels.findIndex(
        (item) => item.id === panel.id,
      )
      const copy = api.addPanel({
        id,
        component: "network",
        title: panel.api.title,
        params,
        renderer: "always",
        position: {
          referencePanel: panel,
          direction: "within",
          index: sourceIndex + 1,
        },
      })
      if (sourceGroup)
        api.addPanelToTabGroup({
          groupId: panel.group.id,
          tabGroupId: sourceGroup.id,
          panelId: copy.id,
          index: sourceGroup.panelIds.indexOf(panel.id) + 1,
        })
      return true
    }
    if (command.action === "activate") {
      panel.api.setActive()
      return true
    }
    if (command.action === "ungroup") {
      api.removePanelFromTabGroup({
        groupId: panel.group.id,
        panelId: panel.id,
      })
      return true
    }
    if (command.action === "create") {
      const name = command.name.trim().slice(0, 64)
      if (!name) return false
      const group = api.createTabGroup({
        groupId: panel.group.id,
        label: name,
        color: "blue",
      })
      api.addPanelToTabGroup({
        groupId: panel.group.id,
        tabGroupId: group.id,
        panelId: panel.id,
      })
      return true
    }
    if (command.action !== "move") return false
    const pane = api.getGroup(command.paneId)
    if (!pane || command.beforeId === panel.id) return false
    const group = command.groupId
      ? api
          .getTabGroups({ groupId: pane.id })
          .find((item) => item.id === command.groupId)
      : undefined
    if (command.groupId && !group) return false
    const before = command.beforeId ? api.getPanel(command.beforeId) : undefined
    if (
      command.beforeId &&
      (!before ||
        before.group.id !== pane.id ||
        (group && !group.panelIds.includes(before.id)))
    )
      return false
    const layout = api.toJSON()
    let sourcePane: SerializedPane | undefined
    let targetPane: SerializedPane | undefined
    const findPanes = (node: SerializedDockview["grid"]["root"]) => {
      if (Array.isArray(node.data)) {
        node.data.forEach(findPanes)
        return
      }
      const data = node.data as SerializedPane
      if (data.views.includes(panel.id)) sourcePane = data
      if (data.id === pane.id) targetPane = data
    }
    findPanes(layout.grid.root)
    if (!sourcePane || !targetPane) return false

    const sourceGroupId = api.getTabGroupForPanel({
      groupId: panel.group.id,
      panelId: panel.id,
    })?.id
    sourcePane.views = sourcePane.views.filter((id) => id !== panel.id)
    sourcePane.tabGroups = (sourcePane.tabGroups ?? [])
      .map((item) => ({
        ...item,
        panelIds: item.panelIds.filter((id) => id !== panel.id),
      }))
      .filter(
        (item) =>
          item.panelIds.length > 0 ||
          (sourcePane === targetPane &&
            item.id === group?.id &&
            item.id === sourceGroupId),
      )

    const targetViews = targetPane.views.filter((id) => id !== panel.id)
    const serializedTargetGroup = group
      ? targetPane.tabGroups?.find((item) => item.id === group.id)
      : undefined
    const lastTargetMember = serializedTargetGroup?.panelIds.slice(-1)[0]
    const index = before
      ? targetViews.indexOf(before.id)
      : lastTargetMember
        ? targetViews.indexOf(lastTargetMember) + 1
        : targetViews.length
    if (index < 0) return false
    targetViews.splice(index, 0, panel.id)
    targetPane.views = targetViews

    if (group) {
      if (!serializedTargetGroup) return false
      const members = new Set([...serializedTargetGroup.panelIds, panel.id])
      serializedTargetGroup.panelIds = targetViews.filter((id) =>
        members.has(id),
      )
    }
    for (const item of targetPane.tabGroups ?? []) {
      const members = new Set(item.panelIds)
      item.panelIds = targetViews.filter((id) => members.has(id))
    }
    api.fromJSON(layout)
    return true
  }
  const group = api
    .getTabGroups({ groupId: command.paneId })
    .find((item) => item.id === command.groupId)
  if (!group) return false
  if (command.action === "dissolve")
    api.dissolveTabGroup({ groupId: command.paneId, tabGroupId: group.id })
  else if (command.action === "rename") {
    const name = command.name?.trim().slice(0, 64)
    if (!name) return false
    group.setLabel(name)
  } else if (command.action === "reorder-group") {
    const pane = api.getGroup(command.paneId)
    if (!pane) return false
    const groups = snapshotBentoSidebar(api, profileId).groups.filter(
      (item) => item.paneId === pane.id && item.id,
    )
    const currentIndex = groups.findIndex((item) => item.id === group.id)
    const target =
      groups[Math.max(0, Math.min(groups.length - 1, command.index))]
    if (!target || target.id === group.id) return false
    const targetPanels = target.tabs.map((tab) => tab.id)
    const indices = pane.panels
      .map((panel, index) => (targetPanels.includes(panel.id) ? index : -1))
      .filter((index) => index >= 0)
    const index =
      command.index > currentIndex
        ? Math.max(...indices) + 1
        : Math.min(...indices)
    api.moveTabGroup({ groupId: command.paneId, tabGroupId: group.id, index })
  }
  return true
}
