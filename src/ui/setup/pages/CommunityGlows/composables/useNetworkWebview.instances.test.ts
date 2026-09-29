import { afterEach, expect, it, vi } from "vitest"
import { nextTick, ref } from "vue"
import { useNetworkWebview } from "./useNetworkWebview"
const { invoke, unmount } = vi.hoisted(() => ({
  invoke: vi.fn(),
  unmount: { callback: () => {} },
}))
vi.mock("@tauri-apps/api/core", () => ({ invoke }))
const { scaleFactor } = vi.hoisted(() => ({ scaleFactor: vi.fn(async () => 1.5) }))
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ scaleFactor }),
}))
let pixelRatio = ref(1.95)
vi.mock("@/lib/buildDiagnostics", () => ({ recordDiagnosticEvent: vi.fn() }))
vi.mock("vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue")>()),
  onUnmounted: (callback: () => void) => {
    unmount.callback = callback
  },
}))
vi.mock("@vueuse/core", () => ({
  useDevicePixelRatio: () => ({ pixelRatio }),
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
  scaleFactor.mockClear()
  pixelRatio = ref(1.95)
})
it("routes tabs independently through hide, restore and unmount while retaining canonical account identity", async () => {
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal("window", {
    __TAURI_INTERNALS__: {},
    devicePixelRatio: 1.95,
    requestAnimationFrame: (callback: FrameRequestCallback) => frames.push(callback),
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
  expect(invoke).toHaveBeenCalledWith("open_webview", expect.objectContaining({
    width: 780, height: 520,
  }))
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
    expect.objectContaining({ instanceId: "copy-1", width: 780, height: 520 }),
  )
  // Changing only shell zoom must resize even if the CSS host rect is unchanged.
  window.devicePixelRatio = 1.5
  pixelRatio.value = 1.5
  await nextTick()
  frames.shift()?.(0)
  await vi.waitFor(() => expect(invoke).toHaveBeenCalledWith("resize_webview", {
    profileId: "profile1", networkId: "twitter", instanceId: "copy-1",
    x: 0, y: 0, width: 100, height: 100,
  }))
  vi.stubGlobal("navigator", { userAgent: "Android" })
  scaleFactor.mockClear()
  await view.open("https://x.com", "profile1", "twitter")
  expect(invoke).toHaveBeenLastCalledWith("get_desktop_webview_pool_stats", undefined)
  expect(invoke).toHaveBeenCalledWith("open_webview", expect.objectContaining({
    width: 600, height: 400,
  }))
  expect(scaleFactor).not.toHaveBeenCalled()
  unmount.callback()
  await vi.waitFor(() => expect(view.isOpen.value).toBe(false))
  expect(invoke).not.toHaveBeenCalledWith('close_webview', expect.anything())
})
