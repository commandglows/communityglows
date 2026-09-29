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
const sidebar = readFileSync(new URL("./AppSidebar.vue", import.meta.url), "utf8")

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

  it("keeps scene controls and editors in responsive toolbar rows", () => {
    expect(workspace).toContain("desktop-workspace__primary-controls")
    expect(workspace).toContain("desktop-workspace__editor")
    expect(workspace).toContain("flex: 1 1 var(--sg-size-200px)")
    expect(workspace).toContain("flex-wrap: wrap")
  })

  it("identifies the selected Bento with its icon and name in the sidebar", () => {
    expect(sidebar).toContain(":label=\"selectedBento?.name ?? 'Bento'\"")
    expect(sidebar).toContain("{{ selectedBento.icon }}")
    expect(sidebar).toContain('class="sidebar-bento-scene__name"')
    expect(sidebar).toContain("{{ scene.name }}")
  })

  it("focuses the group rename field and closes the editor after save or cancellation", () => {
    expect(workspace).toContain('ref="groupNameInput"')
    expect(workspace).toContain("input?.focus()")
    expect(workspace).toContain("input?.select()")
    expect(workspace).toContain('@keydown.esc="cancelGroupRename"')
    expect(workspace).toContain("groupRenameVisible.value = false")
    expect(workspace).toContain("groupNameInput.value?.$el")
    expect(workspace).toContain("group.setLabel(name)")
  })

  it("exposes active-tab removal in its contextual action menu", () => {
    expect(workspace).toContain('v-if="activeTabGroup"')
    expect(workspace).toContain('@select="removeActivePanelFromGroup"')
    expect(workspace).toContain("Sortir du groupe")
    expect(workspace).toContain("function removeActivePanelFromGroup()")
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
