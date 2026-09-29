import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebar = readFileSync(
  new URL("./AppSidebar.vue", import.meta.url),
  "utf8",
)
const workspace = readFileSync(
  new URL("./DesktopWorkspace.vue", import.meta.url),
  "utf8",
)
const app = readFileSync(new URL("../App.vue", import.meta.url), "utf8")
const select = readFileSync(
  new URL("./ui/SgSelect.vue", import.meta.url),
  "utf8",
)

describe("Bento sidebar scene menu", () => {
  it("promotes the current or last selected Bento into the sidebar header", () => {
    expect(sidebar).toContain("const selectedBento = computed")
    expect(sidebar).toContain(":label=\"selectedBento?.name ?? 'Bento'\"")
    expect(sidebar).toContain("{{ selectedBento.icon }}")
    expect(sidebar).toMatch(/<SgIcon\s+v-else\s+icon="pi pi-th-large"/)
  })

  it("only opens for saved scenes and closes outside Bento", () => {
    expect(sidebar).toContain("if (bentoMenuPinned.value) dismissBentoMenu()")
    expect(sidebar).toContain("else bentoMenuPinned.value = true")
    expect(sidebar).toContain("bentoScenes.value.length > 0")
    expect(sidebar).toMatch(/target\.closest\(["']\.sidebar-bento-entry["']\)/)
    expect(sidebar).toContain("bentoMenuPinned.value = false")
    expect(sidebar).not.toContain("Aucune scène enregistrée")
  })

  it("includes Bento in sidebar visibility editing from the empty area", () => {
    expect(sidebar).toContain('@contextmenu="identifySidebarContextTarget"')
    expect(sidebar).toContain('@select="toggleNetworkEditMode"')
    expect(sidebar).toContain("sidebar.finish_editing_networks")
    expect(sidebar).toContain("sidebar.edit_displayed_networks")
    expect(sidebar).not.toContain('@click.self="toggleNetworkEditMode"')
    expect(sidebar).toMatch(/const BENTO_VISIBILITY_ID = ["']bento["']/)
    expect(sidebar).toContain("toggleBentoVisibility")
    expect(sidebar).toContain("'sidebar-bento-entry--hidden': bentoHidden")
    expect(sidebar).not.toContain('class="network-edit-mode-button"')
  })

  it("exposes creation and contextual scene management", () => {
    expect(sidebar).toContain("requestSceneAction('create')")
    expect(sidebar).toContain(
      '@contextmenu.prevent="openSceneContextMenu(scene.id)"',
    )
    expect(sidebar).toContain("requestSceneAction('edit', scene.id)")
    expect(sidebar).toContain("requestSceneAction('delete', scene.id)")
    expect(workspace).toContain('v-if="sceneEditorVisible"')
    expect(workspace).toContain("sceneEditorVisible.value = false")
  })

  it("keeps creation in the context menu without standalone add rows", () => {
    expect(sidebar).not.toContain('class="sidebar-organization-heading"')
    expect(sidebar).not.toContain('class="sidebar-bento-entry__add"')
    expect(sidebar).toContain('@select="createSidebarGroup(undefined, true)"')
  })

  it("keeps Kanban fixed immediately below Bento and always opens its dedicated route", () => {
    expect(sidebar).toContain('class="sidebar-kanban-entry"')
    expect(sidebar).toContain("@open=\"emit('open-tasks', $event)\"")
    expect(sidebar).toContain(
      "const menuItems = ref<MenuItem[]>(builtinMenuItems)",
    )
    expect(app).toContain('@open-tasks="openSidebarTasks"')
    expect(app).toContain("desktopBentoActive.value = false")
    expect(app).toMatch(/\? ["']\/local-kanban["'] : ["']\/tasks["']/)
    expect(app).not.toMatch(/webviewStore\.selectNetwork\(["']tasks["']\)/)
  })

  it("filters the left network list without mutating its organization", () => {
    expect(sidebar).toContain('type="search"')
    expect(sidebar).toContain('v-model="networkSearch"')
    expect(sidebar).toContain("filteredSidebarDisplaySections")
    expect(sidebar).toContain("networkSearchNormalized")
    expect(sidebar).toContain("sidebar.network_search.clear")
    expect(sidebar).toContain("sidebar.network_search.no_results")
    expect(sidebar).not.toContain("persistSidebarGroups(filtered")
  })

  it("sizes each shared dropdown from its trigger", () => {
    expect(select).toContain("width: var(--reka-select-trigger-width)")
    expect(select).toContain("max-width: var(--reka-select-trigger-width)")
    expect(select).not.toContain("getBoundingClientRect")
  })
})
