import { afterEach, expect, it, vi } from "vitest"
import { ref } from "vue"
import { useNetworkWebview } from "./useNetworkWebview"
const { invoke, unmount } = vi.hoisted(() => ({
  invoke: vi.fn(),
  unmount: { callback: () => {} },
}))
vi.mock("@tauri-apps/api/core", () => ({ invoke }))
vi.mock("@/lib/buildDiagnostics", () => ({ recordDiagnosticEvent: vi.fn() }))
vi.mock("vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue")>()),
  onUnmounted: (callback: () => void) => {
    unmount.callback = callback
  },
}))
vi.mock("@vueuse/core", () => ({
  useElementBounding: () => ({
    x: ref(0),
    y: ref(0),
    width: ref(100),
    height: ref(100),
  }),
}))
afterEach(() => {
  vi.unstubAllGlobals()
  invoke.mockReset()
})
it("routes tabs independently through hide, restore and unmount while retaining canonical account identity", async () => {
  vi.stubGlobal("window", {
    __TAURI_INTERNALS__: {},
    requestAnimationFrame: vi.fn(),
    cancelAnimationFrame: vi.fn(),
    dispatchEvent: vi.fn(),
  })
  vi.stubGlobal("document", {
    documentElement: { classList: { contains: () => false } },
  })
  vi.stubGlobal(
    "CustomEvent",
    class {
      constructor(
        public name: string,
        public detail: unknown,
      ) {}
    },
  )
  const host = ref({
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 600, height: 400 }),
  } as HTMLElement)
  const view = useNetworkWebview(host)
  await view.open("https://x.com", "profile1", "twitter")
  await view.switchTo("https://x.com", "profile1", "twitter", "copy-1")
  expect(invoke).toHaveBeenCalledWith("hide_webview", {
    profileId: "profile1",
    networkId: "twitter",
    instanceId: undefined,
  })
  expect(invoke).toHaveBeenCalledWith(
    "open_webview",
    expect.objectContaining({
      profileId: "profile1",
      networkId: "twitter",
      instanceId: "copy-1",
    }),
  )
  await view.suspend()
  expect(invoke).toHaveBeenCalledWith("hide_webview", {
    profileId: "profile1",
    networkId: "twitter",
    instanceId: "copy-1",
  })
  invoke.mockImplementation(async (cmd) =>
    cmd === "show_webview" ? true : undefined,
  )
  await view.resume("https://x.com", "profile1", "twitter", "copy-1")
  expect(invoke).toHaveBeenCalledWith(
    "show_webview",
    expect.objectContaining({ instanceId: "copy-1" }),
  )
  unmount.callback()
  await vi.waitFor(() => expect(view.isOpen.value).toBe(false))
  expect(invoke).not.toHaveBeenCalledWith('close_webview', expect.anything())
})
