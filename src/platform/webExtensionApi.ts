type TabSummary = { id?: number; url?: string }
type TabQuery = { active?: boolean; currentWindow?: boolean; lastFocusedWindow?: boolean }
type CreatedTab = { id?: number }
type WindowSummary = { id?: number }
type StorageAreaName = "local" | "sync"
type StorageValues = Record<string, unknown>
type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>

type BrowserApi = {
  runtime?: { id?: string; getURL?: (path: string) => string }
  tabs?: {
    create?: (properties: { active?: boolean; url: string }) => Promise<CreatedTab>
    query?: (query: TabQuery) => Promise<TabSummary[]>
  }
  windows?: { getCurrent?: () => Promise<WindowSummary> }
  sidePanel?: { open?: (options: { windowId: number }) => Promise<void> }
  storage?: {
    local?: BrowserStorageArea
    sync?: BrowserStorageArea
    onChanged?: BrowserStorageChanges
  }
}

type BrowserStorageArea = {
  get?: (key: string) => Promise<StorageValues>
  set?: (values: StorageValues) => Promise<void>
  clear?: () => Promise<void>
}

type BrowserStorageChanges = {
  addListener?: (listener: (changes: StorageChanges, areaName: string) => void) => void
  removeListener?: (listener: (changes: StorageChanges, areaName: string) => void) => void
}

function browserApi(): BrowserApi | undefined {
  return (globalThis as { browser?: BrowserApi }).browser
}

function chromeLastError(): string | undefined {
  return (globalThis.chrome?.runtime as { lastError?: { message?: string } } | undefined)
    ?.lastError?.message
}

export function extensionRuntimeId(): string | undefined {
  return browserApi()?.runtime?.id ?? globalThis.chrome?.runtime?.id
}

export function extensionUrl(path: string): string | undefined {
  return browserApi()?.runtime?.getURL?.(path) ?? globalThis.chrome?.runtime?.getURL?.(path)
}

export async function createExtensionTab(
  properties: { active?: boolean; url: string },
): Promise<CreatedTab> {
  const browserCreate = browserApi()?.tabs?.create?.bind(browserApi()?.tabs)
  if (browserCreate) return browserCreate(properties)

  const chromeCreate = globalThis.chrome?.tabs?.create?.bind(globalThis.chrome?.tabs)
  if (!chromeCreate) throw new Error("tabs_api_unavailable")
  return new Promise((resolve, reject) => {
    chromeCreate(properties, (tab) => {
      const error = chromeLastError()
      if (error) reject(new Error(error))
      else resolve(tab ?? {})
    })
  })
}

export async function queryExtensionTabs(query: TabQuery): Promise<TabSummary[]> {
  const browserQuery = browserApi()?.tabs?.query?.bind(browserApi()?.tabs)
  if (browserQuery) return browserQuery(query)

  const chromeQuery = globalThis.chrome?.tabs?.query?.bind(globalThis.chrome?.tabs)
  if (!chromeQuery) throw new Error("tabs_api_unavailable")
  return new Promise((resolve, reject) => {
    chromeQuery(query, (tabs) => {
      const error = chromeLastError()
      if (error) reject(new Error(error))
      else resolve(tabs ?? [])
    })
  })
}

export async function currentExtensionWindowId(): Promise<number> {
  const browserGetCurrent = browserApi()?.windows?.getCurrent?.bind(browserApi()?.windows)
  const currentWindow = browserGetCurrent
    ? await browserGetCurrent()
    : await new Promise<WindowSummary>((resolve, reject) => {
        const chromeGetCurrent = globalThis.chrome?.windows?.getCurrent?.bind(globalThis.chrome?.windows)
        if (!chromeGetCurrent) {
          reject(new Error("windows_api_unavailable"))
          return
        }
        chromeGetCurrent({}, (window: WindowSummary) => {
          const error = chromeLastError()
          if (error) reject(new Error(error))
          else resolve(window ?? {})
        })
      })

  if (typeof currentWindow.id !== "number") throw new Error("window_unavailable")
  return currentWindow.id
}

export async function openExtensionSidePanel(windowId: number): Promise<void> {
  const open = browserApi()?.sidePanel?.open?.bind(browserApi()?.sidePanel) ?? globalThis.chrome?.sidePanel?.open?.bind(globalThis.chrome?.sidePanel)
  if (!open) throw new Error("side_panel_unavailable")
  await open({ windowId })
}

function browserStorageArea(areaName: StorageAreaName): BrowserStorageArea | undefined {
  return browserApi()?.storage?.[areaName]
}

function chromeStorageArea(areaName: StorageAreaName) {
  return globalThis.chrome?.storage?.[areaName]
}

export async function getExtensionStorage(areaName: StorageAreaName, key: string): Promise<unknown> {
  const browserGet = browserStorageArea(areaName)?.get?.bind(browserStorageArea(areaName))
  if (browserGet) return (await browserGet(key))[key]

  const chromeGet = chromeStorageArea(areaName)?.get?.bind(chromeStorageArea(areaName))
  if (!chromeGet) throw new Error("storage_api_unavailable")
  return new Promise((resolve, reject) => {
    chromeGet(key, (values) => {
      const error = chromeLastError()
      if (error) reject(new Error(error))
      else resolve(values?.[key])
    })
  })
}

export async function setExtensionStorage(
  areaName: StorageAreaName,
  key: string,
  value: unknown,
): Promise<void> {
  const values = { [key]: value }
  const browserSet = browserStorageArea(areaName)?.set?.bind(browserStorageArea(areaName))
  if (browserSet) {
    await browserSet(values)
    return
  }

  const chromeSet = chromeStorageArea(areaName)?.set?.bind(chromeStorageArea(areaName))
  if (!chromeSet) throw new Error("storage_api_unavailable")
  await new Promise<void>((resolve, reject) => {
    chromeSet(values, () => {
      const error = chromeLastError()
      if (error) reject(new Error(error))
      else resolve()
    })
  })
}

export async function clearExtensionStorage(areaName: StorageAreaName): Promise<void> {
  const browserClear = browserStorageArea(areaName)?.clear?.bind(browserStorageArea(areaName))
  if (browserClear) {
    await browserClear()
    return
  }

  const chromeClear = chromeStorageArea(areaName)?.clear?.bind(chromeStorageArea(areaName))
  if (!chromeClear) throw new Error("storage_api_unavailable")
  await new Promise<void>((resolve, reject) => {
    chromeClear(() => {
      const error = chromeLastError()
      if (error) reject(new Error(error))
      else resolve()
    })
  })
}

export function subscribeExtensionStorage(
  areaName: StorageAreaName,
  key: string,
  listener: (value: unknown) => void,
): () => void {
  const changes = browserApi()?.storage?.onChanged ?? globalThis.chrome?.storage?.onChanged
  if (!changes?.addListener) return () => undefined

  const onChanged = (storageChanges: StorageChanges, changedArea: string) => {
    if (changedArea === areaName && key in storageChanges) listener(storageChanges[key]?.newValue)
  }
  changes.addListener(onChanged)
  return () => changes.removeListener?.(onChanged)
}
