import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(
  new URL("./DesktopWorkspace.vue", import.meta.url),
  "utf8",
)
const panelSource = readFileSync(
  new URL("./NetworkWorkspacePanel.vue", import.meta.url),
  "utf8",
)
const tasksPanelSource = readFileSync(
  new URL("./TasksWorkspacePanel.vue", import.meta.url),
  "utf8",
)
const tokenSource = readFileSync(
  new URL("../assets/generated/tokens.css", import.meta.url),
  "utf8",
)

describe("DesktopWorkspace Dockview registration", () => {
  it("registers the network renderer through the Dockview v8 components API", () => {
    expect(source).toContain(':components="dockviewComponents"')
    expect(source).toContain("network: markRaw(NetworkWorkspacePanel)")
    expect(source).not.toContain("<template #network")
  })

  it("registers Tasks through a dedicated Dockview adapter that reuses TasksView", () => {
    expect(source).toContain("tasks: markRaw(TasksWorkspacePanel)")
    expect(tasksPanelSource).toContain("<TasksView />")
    expect(tasksPanelSource).toContain("TasksWorkspacePanelParams")
  })

  it("does not enable unavailable Dockview Enterprise options", () => {
    expect(source).not.toContain(":keyboard-navigation")
    expect(source).not.toContain(":layout-history")
  })

  it("adapts the nested props envelope emitted by Dockview v8", () => {
    expect(panelSource).toContain(':network-id="params.params.networkId"')
    expect(panelSource).toContain(':url="params.params.url"')
    expect(panelSource).toContain("props.params.api.isVisible")
    expect(panelSource).toContain("props.params.api.onDidVisibilityChange")
    expect(panelSource).not.toContain("props.api")
  })

  it("opens every Bento choice menu on hover", () => {
    const selectMenus = source.match(/<SgSelect\b[\s\S]*?\/>/g) ?? []
    expect(selectMenus.length).toBeGreaterThan(0)
    for (const menu of selectMenus) expect(menu).toContain("open-on-hover")
    expect(source).toContain(
      'aria-label="Emplacement des prochains réseaux ajoutés au Bento"',
    )
    expect(source).toContain('placeholder="Disposition"')
    expect(source).toContain('placeholder="Bentos enregistrés"')
    expect(source).toContain('aria-label="Icône du Bento"')
    expect(source).toContain('aria-label="Couleur du Bento"')
  })

  it("only exposes Bento settings while creating or editing a Bento", () => {
    expect(source).toMatch(
      /v-if="sceneEditorVisible"[\s\S]*?v-model="newPanelDestination"[\s\S]*?placeholder="Disposition"[\s\S]*?placeholder="Bentos enregistrés"/,
    )
    expect(source).toContain('v-if="sceneEditorVisible || groupRenameVisible"')
    expect(source).not.toContain("desktop-workspace__context-controls")
    expect(source).not.toContain("desktop-workspace__identity")
    expect(source).toContain("Nouveaux réseaux : selon leur catégorie")
    expect(source).toContain("Nouveaux réseaux : dans un nouveau groupe")
    expect(source).toContain("Nouveaux réseaux : hors groupe")
  })

  it("keeps tab actions in the context menu with close and rename gestures", () => {
    expect(source).toContain('@dblclick.capture="closeDockTabOnDoubleClick"')
    expect(source).toContain(
      '@pointerdown.capture="beginDockGroupRenameLongPress"',
    )
    expect(source).toContain("DOCK_GROUP_RENAME_LONG_PRESS_MS = 600")
    expect(source).toContain("panel.api.close()")
    expect(source).toContain('@select="startGroupRename"')
    expect(source).toContain('@contextmenu.capture="prepareDockContextMenu"')
  })

  it("frames the whole Dockview surface with theme-derived colors", () => {
    expect(source).toContain('class="desktop-workspace__active-frame"')
    expect(source).toContain(".desktop-workspace__active-frame")
    expect(source).toContain("inset: 0 auto auto 0;")
    expect(source).toContain("height: calc(100% / var(--sg-ui-css-scale, 1));")
    expect(source).toContain(".dv-groupview.dv-active-group")
    expect(source).toContain(".dv-tab-group-chip")
    expect(source).toContain("var(--sg-workspace-active-frame-color)")
    expect(source).toContain("var(--sg-workspace-active-indicator-color)")
    expect(source).toContain(
      "border: var(--sg-border-2px) solid var(--sg-workspace-active-frame-color)",
    )
    expect(source).toContain("background: color-mix(")
    expect(tokenSource).toContain(
      "--sg-workspace-active-frame-color: color-mix(in srgb, var(--sg-color-action) 68%, var(--sg-color-border-strong));",
    )
    expect(tokenSource).toContain(
      "--sg-workspace-active-indicator-color: color-mix(in srgb, var(--sg-color-action) 84%, var(--sg-color-surface-raised));",
    )
  })

  it("renames the exact tab group pressed even before Dockview updates the active panel", () => {
    expect(source).toContain("void startGroupRename(panelId)")
    expect(source).toContain("groupRenameTarget")
    expect(source).toContain("getTabGroupForPanel({")
    expect(source).toContain("activePanelMatchesGroupRenameTarget")
  })
})
