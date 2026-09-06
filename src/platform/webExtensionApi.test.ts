import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createExtensionTab,
  getExtensionStorage,
  queryExtensionTabs,
  setExtensionStorage,
} from "@/platform/webExtensionApi"

describe("webExtensionApi", () => {
  const originalChrome = globalThis.chrome
  const originalBrowser = (globalThis as { browser?: unknown }).browser

  afterEach(() => {
    if (originalChrome === undefined) delete (globalThis as { chrome?: unknown }).chrome
    else (globalThis as { chrome?: unknown }).chrome = originalChrome

    if (originalBrowser === undefined) delete (globalThis as { browser?: unknown }).browser
    else (globalThis as { browser?: unknown }).browser = originalBrowser
  })

  it("prefers promise-based browser APIs when available", async () => {
    const create = vi.fn().mockResolvedValue({ id: 7 })
    const query = vi.fn().mockResolvedValue([{ id: 7, url: "https://example.com/" }])
    ;(globalThis as { browser?: unknown }).browser = { tabs: { create, query } }

    await expect(createExtensionTab({ url: "https://example.com/" })).resolves.toEqual({ id: 7 })
    await expect(queryExtensionTabs({ active: true })).resolves.toHaveLength(1)
  })

  it("surfaces callback runtime errors", async () => {
    ;(globalThis as { chrome?: unknown }).chrome = {
      runtime: { lastError: { message: "tab rejected" } },
      tabs: { create: (_: unknown, callback: (tab?: unknown) => void) => callback() },
    }

    await expect(createExtensionTab({ url: "https://example.com/" })).rejects.toThrow("tab rejected")
  })

  it("reads and writes storage through the promise namespace", async () => {
    const get = vi.fn().mockResolvedValue({ settings: { theme: "dark" } })
    const set = vi.fn().mockResolvedValue(undefined)
    ;(globalThis as { browser?: unknown }).browser = { storage: { local: { get, set } } }

    await expect(getExtensionStorage("local", "settings")).resolves.toEqual({ theme: "dark" })
    await setExtensionStorage("local", "settings", { theme: "light" })
    expect(set).toHaveBeenCalledWith({ settings: { theme: "light" } })
  })
})

it('keeps the storage receiver required by real browser methods', async () => {
  const area = { get(this: unknown) { expect(this).toBe(area); return Promise.resolve({ value: 42 }) }, set(this: unknown) { expect(this).toBe(area); return Promise.resolve() } }
  vi.stubGlobal('browser', { storage: { local: area } })
  try { expect(await getExtensionStorage('local', 'value')).toBe(42); await setExtensionStorage('local', 'value', 7) }
  finally { vi.unstubAllGlobals() }
})
