import { describe, expect, it, vi } from "vitest"
import type { DockviewApi } from "dockview-core"
import {
  applyBentoSidebarCommand,
  snapshotBentoSidebar,
} from "./bentoSidebarBridge"

function fixture() {
  const group = {
    id: "g",
    label: "Research",
    panelIds: ["a", "b"],
    setLabel: vi.fn(),
  }
  const pane = { id: "pane", panels: [] as unknown[] }
  const panels = ["a", "b", "c"].map((id) => ({
    id,
    group: pane,
    toJSON: () => ({ id, params: undefined }),
    api: { title: id.toUpperCase(), setActive: vi.fn(), moveTo: vi.fn() },
  }))
  pane.panels = panels
  const layout = {
    grid: {
      root: {
        type: "leaf",
        data: {
          id: pane.id,
          views: ["a", "b", "c"],
          tabGroups: [{ id: "g", panelIds: ["a", "b"] }],
        },
      },
    },
    panels: {},
  }
  const api = {
    groups: [pane],
    activePanel: panels[0],
    getPanel: (id: string) => panels.find((panel) => panel.id === id),
    getGroup: (id: string) => (id === pane.id ? pane : undefined),
    getTabGroups: () => [group],
    getTabGroupForPanel: ({ panelId }: { panelId: string }) =>
      group.panelIds.includes(panelId) ? group : undefined,
    toJSON: () => structuredClone(layout),
    fromJSON: vi.fn((_layout: typeof layout, _options?: unknown) => undefined),
    addPanelToTabGroup: vi.fn(),
    removePanelFromTabGroup: vi.fn(),
    dissolveTabGroup: vi.fn(),
    moveTabGroup: vi.fn(),
    createTabGroup: vi.fn(() => ({ id: "new" })),
  }
  return { api, dock: api as unknown as DockviewApi, group, panels }
}

describe("Bento sidebar commands", () => {
  it("snapshots grouped and ungrouped tabs once with active identity", () => {
    const { dock } = fixture()
    const snapshot = snapshotBentoSidebar(dock, "profile")
    expect(
      snapshot.groups.map((group) => group.tabs.map((tab) => tab.id)),
    ).toEqual([["a", "b"], ["c"]])
    expect(snapshot.groups.map((group) => group.blockId)).toEqual([
      "group:g",
      "panel:c",
    ])
    expect(snapshot.groups[0].tabs[0].active).toBe(true)
  })
  it("rejects a stale profile and unknown destination before mutations", () => {
    const { dock, api } = fixture()
    expect(
      applyBentoSidebarCommand(dock, "profile", {
        profileId: "old",
        action: "ungroup",
        panelId: "a",
      }),
    ).toBe(false)
    expect(
      applyBentoSidebarCommand(dock, "profile", {
        profileId: "profile",
        action: "move",
        panelId: "a",
        paneId: "missing",
        groupId: "",
      }),
    ).toBe(false)
    expect(api.removePanelFromTabGroup).not.toHaveBeenCalled()
  })
  it("reorders both serialized orders without dissolving the source group", () => {
    const { dock, api } = fixture()
    applyBentoSidebarCommand(dock, "profile", {
      profileId: "profile",
      action: "move",
      panelId: "a",
      paneId: "pane",
      groupId: "g",
    })
    const restored = api.fromJSON.mock.calls[0][0]
    expect(restored.grid.root.data.views).toEqual(["b", "a", "c"])
    expect(restored.grid.root.data.tabGroups[0].panelIds).toEqual(["b", "a"])
    expect(api.fromJSON).toHaveBeenCalledWith(restored)
    expect(api.removePanelFromTabGroup).not.toHaveBeenCalled()
  })
  it("ungroups and dissolves without closing content", () => {
    const { dock, api } = fixture()
    expect(
      applyBentoSidebarCommand(dock, "profile", {
        profileId: "profile",
        action: "ungroup",
        panelId: "a",
      }),
    ).toBe(true)
    expect(api.removePanelFromTabGroup).toHaveBeenCalledWith({
      groupId: "pane",
      panelId: "a",
    })
    applyBentoSidebarCommand(dock, "profile", {
      profileId: "profile",
      action: "dissolve",
      paneId: "pane",
      groupId: "g",
    })
    expect(api.dissolveTabGroup).toHaveBeenCalledWith({
      groupId: "pane",
      tabGroupId: "g",
    })
    expect(api.groups[0].panels).toHaveLength(3)
  })
  it("joins an existing group through its owner after moving the panel", () => {
    const { dock, api } = fixture()
    applyBentoSidebarCommand(dock, "profile", {
      profileId: "profile",
      action: "move",
      panelId: "c",
      paneId: "pane",
      groupId: "g",
      beforeId: "b",
    })
    const restored = api.fromJSON.mock.calls[0][0]
    expect(restored.grid.root.data.views).toEqual(["a", "c", "b"])
    expect(restored.grid.root.data.tabGroups[0].panelIds).toEqual([
      "a",
      "c",
      "b",
    ])
  })
  it.each([
    ["before the first group", "a", ["b", "a", "c"]],
    ["between a group and the next standalone tab", "c", ["a", "b", "c"]],
    ["after the final block", undefined, ["a", "c", "b"]],
  ])(
    "places a grouped tab at the root %s",
    (_label, beforeId, expectedViews) => {
      const { dock, api } = fixture()
      applyBentoSidebarCommand(dock, "profile", {
        profileId: "profile",
        action: "move",
        panelId: "b",
        paneId: "pane",
        groupId: "",
        beforeId,
      })
      const restored = api.fromJSON.mock.calls[0][0]
      expect(restored.grid.root.data.views).toEqual(expectedViews)
      expect(restored.grid.root.data.tabGroups[0].panelIds).toEqual(["a"])
    },
  )
  it("translates a group rank to the flat Dockview panel boundary", () => {
    const { dock, api } = fixture()
    const extra = {
      id: "other",
      label: "Other",
      panelIds: ["c"],
      setLabel: vi.fn(),
    }
    const first = api.getTabGroups()[0]
    api.getTabGroups = () => [first, extra]
    applyBentoSidebarCommand(dock, "profile", {
      profileId: "profile",
      action: "reorder-group",
      paneId: "pane",
      groupId: "g",
      index: 1,
    })
    expect(api.moveTabGroup).toHaveBeenCalledWith({
      groupId: "pane",
      tabGroupId: "g",
      index: 3,
    })
  })
  it("rejects blank names and creates a group around an existing panel", () => {
    const { dock, api } = fixture()
    expect(
      applyBentoSidebarCommand(dock, "profile", {
        profileId: "profile",
        action: "create",
        panelId: "a",
        name: "  ",
      }),
    ).toBe(false)
    applyBentoSidebarCommand(dock, "profile", {
      profileId: "profile",
      action: "create",
      panelId: "a",
      name: " Personal ",
    })
    expect(api.createTabGroup).toHaveBeenCalledWith({
      groupId: "pane",
      label: "Personal",
      color: "blue",
    })
    expect(api.addPanelToTabGroup).toHaveBeenCalledWith({
      groupId: "pane",
      tabGroupId: "new",
      panelId: "a",
    })
  })
})
