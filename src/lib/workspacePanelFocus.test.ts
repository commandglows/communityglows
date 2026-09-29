import { describe, expect, it, vi } from "vitest"
import { focusWorkspacePanelTab } from "./workspacePanelFocus"

function tab(panelId: string, connected = true, tabIndex = 0) {
  return {
    dataset: { tabPanelId: panelId },
    isConnected: connected,
    tabIndex,
    setAttribute: vi.fn(),
    focus: vi.fn(),
  }
}

function root(tabs: ReturnType<typeof tab>[]) {
  return { querySelectorAll: () => tabs } as unknown as HTMLElement
}

describe("returning focus after a Bento group edit", () => {
  it("returns to the originating panel without moving the page", () => {
    const other = tab("other")
    const origin = tab("origin")
    expect(focusWorkspacePanelTab(root([other, origin]), "origin")).toBe(true)
    expect(origin.focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(other.focus).not.toHaveBeenCalled()
    expect(origin.setAttribute).not.toHaveBeenCalled()
  })

  it("does not steal focus if the panel or workspace was removed", () => {
    const other = tab("other")
    const detached = tab("origin", false)
    expect(focusWorkspacePanelTab(root([other]), "origin")).toBe(false)
    expect(focusWorkspacePanelTab(root([detached]), "origin")).toBe(false)
    expect(focusWorkspacePanelTab(null, "origin")).toBe(false)
    expect(other.focus).not.toHaveBeenCalled()
    expect(detached.focus).not.toHaveBeenCalled()
  })

  it("permits programmatic return without adding a new tab stop", () => {
    const origin = tab("origin", true, -1)
    expect(focusWorkspacePanelTab(root([origin]), "origin")).toBe(true)
    expect(origin.setAttribute).toHaveBeenCalledWith("tabindex", "-1")
    expect(origin.focus).toHaveBeenCalledOnce()
  })
})
