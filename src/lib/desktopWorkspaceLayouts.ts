import type { SerializedDockview } from 'dockview-vue'

export const DESKTOP_WORKSPACE_STATE_KEY =
  'communityglows.desktop-workspaces.v1'
export const DESKTOP_WORKSPACE_AUTOSAVE_KEY =
  'communityglows.desktop-workspace.autosave.v1'
export const DESKTOP_WORKSPACE_VERSION = 1 as const
export const MAX_SAVED_WORKSPACE_LAYOUTS = 12

export type NetworkWorkspacePanelParams = {
  networkId: string
  url: string
}

export type SavedDesktopWorkspace = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  layout: SerializedDockview
}

export type DesktopWorkspaceState = {
  version: typeof DESKTOP_WORKSPACE_VERSION
  selectedLayoutId: string | null
  layouts: SavedDesktopWorkspace[]
}

type WorkspaceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isKnownNetworkId(
  networkId: unknown,
  knownNetworkIds: ReadonlySet<string>,
): networkId is string {
  return (
    typeof networkId === 'string' &&
    (knownNetworkIds.has(networkId) || networkId.startsWith('custom-'))
  )
}

export function isNetworkWorkspacePanelParams(
  value: unknown,
  knownNetworkIds: ReadonlySet<string>,
): value is NetworkWorkspacePanelParams {
  if (!isRecord(value)) return false
  return (
    isKnownNetworkId(value.networkId, knownNetworkIds) && isHttpsUrl(value.url)
  )
}

export function isSafeDesktopWorkspaceLayout(
  value: unknown,
  knownNetworkIds: ReadonlySet<string>,
): value is SerializedDockview {
  if (!isRecord(value) || !isRecord(value.grid) || !isRecord(value.panels))
    return false
  if (!isRecord(value.grid.root)) return false

  return Object.values(value.panels).every((panel) => {
    if (!isRecord(panel)) return false
    return (
      panel.contentComponent === 'network' &&
      isNetworkWorkspacePanelParams(panel.params, knownNetworkIds)
    )
  })
}

export function emptyDesktopWorkspaceState(): DesktopWorkspaceState {
  return {
    version: DESKTOP_WORKSPACE_VERSION,
    selectedLayoutId: null,
    layouts: [],
  }
}

function parseSavedLayout(
  value: unknown,
  knownNetworkIds: ReadonlySet<string>,
): SavedDesktopWorkspace | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.trim().length > 64 ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !isSafeDesktopWorkspaceLayout(value.layout, knownNetworkIds)
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name.trim(),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    layout: value.layout,
  }
}

export function parseDesktopWorkspaceState(
  raw: string | null,
  knownNetworkIds: ReadonlySet<string>,
): DesktopWorkspaceState {
  if (!raw) return emptyDesktopWorkspaceState()

  try {
    const value: unknown = JSON.parse(raw)
    if (
      !isRecord(value) ||
      value.version !== DESKTOP_WORKSPACE_VERSION ||
      !Array.isArray(value.layouts)
    ) {
      return emptyDesktopWorkspaceState()
    }

    const seen = new Set<string>()
    const layouts = value.layouts
      .map((layout) => parseSavedLayout(layout, knownNetworkIds))
      .filter((layout): layout is SavedDesktopWorkspace => {
        if (!layout || seen.has(layout.id)) return false
        seen.add(layout.id)
        return true
      })
      .slice(0, MAX_SAVED_WORKSPACE_LAYOUTS)

    const selectedLayoutId =
      typeof value.selectedLayoutId === 'string' &&
      layouts.some((layout) => layout.id === value.selectedLayoutId)
        ? value.selectedLayoutId
        : null

    return { version: DESKTOP_WORKSPACE_VERSION, selectedLayoutId, layouts }
  } catch {
    return emptyDesktopWorkspaceState()
  }
}

export function loadDesktopWorkspaceState(
  storage: WorkspaceStorage,
  knownNetworkIds: ReadonlySet<string>,
): DesktopWorkspaceState {
  return parseDesktopWorkspaceState(
    storage.getItem(DESKTOP_WORKSPACE_STATE_KEY),
    knownNetworkIds,
  )
}

export function persistDesktopWorkspaceState(
  storage: WorkspaceStorage,
  state: DesktopWorkspaceState,
): void {
  storage.setItem(DESKTOP_WORKSPACE_STATE_KEY, JSON.stringify(state))
}

export function loadDesktopWorkspaceAutosave(
  storage: WorkspaceStorage,
  knownNetworkIds: ReadonlySet<string>,
): SerializedDockview | null {
  const raw = storage.getItem(DESKTOP_WORKSPACE_AUTOSAVE_KEY)
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.version !== DESKTOP_WORKSPACE_VERSION)
      return null
    return isSafeDesktopWorkspaceLayout(value.layout, knownNetworkIds)
      ? value.layout
      : null
  } catch {
    return null
  }
}

export function persistDesktopWorkspaceAutosave(
  storage: WorkspaceStorage,
  layout: SerializedDockview,
): void {
  storage.setItem(
    DESKTOP_WORKSPACE_AUTOSAVE_KEY,
    JSON.stringify({
      version: DESKTOP_WORKSPACE_VERSION,
      layout,
    }),
  )
}

export function clearDesktopWorkspaceAutosave(storage: WorkspaceStorage): void {
  storage.removeItem(DESKTOP_WORKSPACE_AUTOSAVE_KEY)
}

export function saveDesktopWorkspaceLayout(
  state: DesktopWorkspaceState,
  input: {
    id?: string
    name: string
    layout: SerializedDockview
    now?: string
    createId?: () => string
  },
): DesktopWorkspaceState {
  const name = input.name.trim().slice(0, 64)
  if (!name) return state

  const now = input.now ?? new Date().toISOString()
  const existing = input.id
    ? state.layouts.find((layout) => layout.id === input.id)
    : undefined
  const id = existing?.id ?? input.createId?.() ?? crypto.randomUUID()
  const nextLayout: SavedDesktopWorkspace = {
    id,
    name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    layout: input.layout,
  }
  const layouts = existing
    ? state.layouts.map((layout) => (layout.id === id ? nextLayout : layout))
    : [nextLayout, ...state.layouts].slice(0, MAX_SAVED_WORKSPACE_LAYOUTS)

  return { version: DESKTOP_WORKSPACE_VERSION, selectedLayoutId: id, layouts }
}

export function deleteDesktopWorkspaceLayout(
  state: DesktopWorkspaceState,
  id: string,
): DesktopWorkspaceState {
  return {
    version: DESKTOP_WORKSPACE_VERSION,
    selectedLayoutId:
      state.selectedLayoutId === id ? null : state.selectedLayoutId,
    layouts: state.layouts.filter((layout) => layout.id !== id),
  }
}
