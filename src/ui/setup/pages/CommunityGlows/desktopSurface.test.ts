import { describe, expect, it } from "vitest"
import { resolveDesktopSurface, resolveTasksNavigation } from "./desktopSurface"

describe("desktop surface selection", () => {
  it("keeps Bento closed at startup even when a network is active", () => {
    expect(resolveDesktopSurface(false, "https://example.com")).toBe("network")
  })

  it("renders the regular route when neither Bento nor a network is active", () => {
    expect(resolveDesktopSurface(false, null)).toBe("route")
  })

  it("renders the workspace only after explicit Bento activation", () => {
    expect(resolveDesktopSurface(true, null)).toBe("bento")
    expect(resolveDesktopSurface(true, "https://example.com")).toBe("bento")
  })
})

describe("tasks navigation target", () => {
  it("keeps Tasks as a regular route outside Bento", () => {
    expect(resolveTasksNavigation(false)).toBe("route")
  })

  it("keeps Tasks on its dedicated route while Bento is active", () => {
    expect(resolveTasksNavigation(true)).toBe("route")
  })
})
