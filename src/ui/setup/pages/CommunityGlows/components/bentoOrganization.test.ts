import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const workspace = readFileSync(
  new URL("./DesktopWorkspace.vue", import.meta.url),
  "utf8",
)
const sidebarTabs = readFileSync(
  new URL("./BentoSidebarTabs.vue", import.meta.url),
  "utf8",
)

describe("Bento browser-style organisation", () => {
  it("exposes pin, group, rename, ungroup and smooth drag reordering", () => {
    expect(workspace).toContain("toggleActivePanelPinned")
    expect(workspace).toContain("createGroupForActivePanel")
    expect(workspace).toContain("commitGroupRename")
    expect(workspace).toContain("removeActivePanelFromGroup")
    expect(workspace).toContain('tab-animation="smooth"')
  })

  it("keeps pinned panels first and provides keyboard reordering", () => {
    expect(workspace).toContain("normalizePinnedPanelOrder")
    expect(workspace).toContain('event.key === "ArrowLeft"')
    expect(workspace).toContain('event.key === "ArrowRight"')
    expect(workspace).toContain('event.key === "Enter"')
  })

  it("keeps global, contextual and editing controls in separate responsive rows", () => {
    expect(workspace).toContain("desktop-workspace__primary-controls")
    expect(workspace).toContain("desktop-workspace__context-controls")
    expect(workspace).toContain("desktop-workspace__editor")
    expect(workspace).toContain("flex: 1 1 var(--sg-size-200px)")
    expect(workspace).toContain("width: var(--sg-size-full)")
  })

  it("identifies the active Bento with its icon and name, without a redundant prefix", () => {
    expect(workspace).toContain("activeLayout")
    expect(workspace).toContain("{{ activeLayout.name }}")
    expect(workspace).toContain(
      "{{ activeLayout.icon ?? DEFAULT_DESKTOP_SCENE_ICON }}",
    )
    expect(workspace).not.toContain("<span>Bento</span>")
  })

  it("focuses the rename field and restores focus after save or cancellation", () => {
    expect(workspace).toContain('ref="groupNameInput"')
    expect(workspace).toContain('ref="groupRenameTrigger"')
    expect(workspace).toContain("input?.focus()")
    expect(workspace).toContain('@keydown.esc="cancelGroupRename"')
    expect(workspace).toContain("groupRenameTrigger.value?.$el")
  })

  it("exposes active-tab removal directly instead of hiding one action in overflow", () => {
    expect(workspace).toContain('label="Sortir du groupe"')
    expect(workspace).toContain("`Sortir ${activePanelLabel} du groupe`")
    expect(workspace).toContain('@click="removeActivePanelFromGroup"')
    expect(workspace).not.toContain('DropdownMenuRoot v-if="activeTabGroup"')
  })

  it("opens the existing group and tab action menus from right click or Shift+F10", () => {
    expect(sidebarTabs).toContain(
      '@contextmenu.prevent.stop="openMenu(key(group))"',
    )
    expect(sidebarTabs).toContain(
      '@keydown.shift.f10.prevent.stop="openMenu(key(group))"',
    )
    expect(sidebarTabs).toContain(
      '@contextmenu.prevent.stop="openMenu(tab.id)"',
    )
    expect(sidebarTabs).toContain(
      '@keydown.shift.f10.prevent.stop="openMenu(tab.id)"',
    )
    expect(sidebarTabs).toContain("next.clear()")
  })

  it("renders root drop boundaries before, between and after flat Bento blocks", () => {
    expect(sidebarTabs).toContain("enterBoundary")
    expect(sidebarTabs).toContain("dropBoundary")
    expect(sidebarTabs).toContain("bento-sidebar-tabs__boundary--active")
    expect(sidebarTabs).toContain("isLastBlockInPane(groupIndex, group)")
    expect(sidebarTabs).toContain("group.tabs[0]?.id")
    expect(sidebarTabs).toContain("function canShift")
    expect(sidebarTabs).toContain("const beforeBlock")
  })

  it("offers the same contextual access on the rendered Dockview tabs and group chips", () => {
    expect(workspace).toContain("<ContextMenuRoot")
    expect(workspace).toContain('@contextmenu.capture="prepareDockContextMenu"')
    expect(workspace).toContain(
      '@keydown.shift.f10.capture="prepareDockContextMenu"',
    )
    expect(workspace).toContain('"[data-tab-panel-id]"')
    expect(workspace).toContain('".dv-tab-group-chip"')
    expect(workspace).toContain("Dissoudre le groupe")
  })
})
