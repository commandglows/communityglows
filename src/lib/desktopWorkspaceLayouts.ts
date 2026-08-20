import type { SerializedDockview } from 'dockview-vue'

export const DESKTOP_WORKSPACE_STATE_KEY =
  'communityglows.desktop-workspaces.v1'
export const DESKTOP_WORKSPACE_AUTOSAVE_KEY =
  'communityglows.desktop-workspace.autosave.v1'
export const DESKTOP_WORKSPACE_VERSION = 1 as const
export const MAX_SAVED_WORKSPACE_LAYOUTS = 12
export const MAX_DESKTOP_WORKSPACE_PANELS = 24
export const MAX_DESKTOP_WORKSPACE_LAYOUT_DEPTH = 64
export const MAX_DESKTOP_WORKSPACE_LAYOUT_NODES = 4_096
export const MAX_DESKTOP_WORKSPACE_AUTOSAVE_CHARS = 500_000
export const MAX_DESKTOP_WORKSPACE_STATE_CHARS = 2_000_000
export const MAX_DESKTOP_WORKSPACE_SYNC_CHARS = 500_000

export type WorkspaceNetworkTarget = {
  canonicalUrl: string
  allowSubdomains: boolean
}

export type WorkspaceNetworkCatalog = ReadonlyMap<
  string,
  WorkspaceNetworkTarget
>

export type NetworkWorkspacePanelParams = {
  networkId: string
  url: string
}

export const DESKTOP_WORKSPACE_PRESETS = [
  'columns',
  'rows',
  'focus',
  'grid',
] as const

export type DesktopWorkspacePreset =
  (typeof DESKTOP_WORKSPACE_PRESETS)[number]

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

export type WorkspacePersistenceResult =
  { ok: true } | { ok: false; reason: 'invalid' | 'too-large' | 'unavailable' }

type WorkspaceGridNode = SerializedDockview['grid']['root']
type WorkspaceGroup = Extract<WorkspaceGridNode['data'], { id: string }>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function workspacePanelOrder(layout: SerializedDockview): string[] {
  const ordered: string[] = []
  const knownPanels = new Set(Object.keys(layout.panels))
  const seen = new Set<string>()
  const pending = [layout.grid.root]

  while (pending.length) {
    const node = pending.shift()
    if (!node) continue
    if (node.type === 'branch' && Array.isArray(node.data)) {
      pending.unshift(...node.data)
      continue
    }
    if (node.type !== 'leaf' || !isRecord(node.data)) continue
    const views = Array.isArray(node.data.views) ? node.data.views : []
    for (const panelId of views) {
      if (
        typeof panelId === 'string' &&
        knownPanels.has(panelId) &&
        !seen.has(panelId)
      ) {
        seen.add(panelId)
        ordered.push(panelId)
      }
    }
  }

  for (const panelId of knownPanels) {
    if (!seen.has(panelId)) ordered.push(panelId)
  }
  return ordered
}

function activeWorkspacePanel(layout: SerializedDockview): string | undefined {
  if (!layout.activeGroup) return undefined
  const pending = [layout.grid.root]
  while (pending.length) {
    const node = pending.pop()
    if (!node) continue
    if (node.type === 'branch' && Array.isArray(node.data)) {
      pending.push(...node.data)
      continue
    }
    if (
      node.type === 'leaf' &&
      isRecord(node.data) &&
      node.data.id === layout.activeGroup &&
      typeof node.data.activeView === 'string'
    ) {
      return node.data.activeView
    }
  }
  return undefined
}

function presetGroup(
  preset: DesktopWorkspacePreset,
  panelId: string,
  index: number,
): WorkspaceGroup {
  return {
    id: `preset-${preset}-${index + 1}`,
    views: [panelId],
    activeView: panelId,
  }
}

function presetLeaf(
  preset: DesktopWorkspacePreset,
  panelId: string,
  index: number,
  size: number,
): WorkspaceGridNode {
  return {
    type: 'leaf',
    data: presetGroup(preset, panelId, index),
    size,
  }
}

/**
 * Reflows every existing panel into a deterministic, fully visible preset.
 * Panel state remains untouched so Dockview can reuse always-rendered WebViews.
 */
export function createDesktopWorkspacePresetLayout(
  layout: SerializedDockview,
  preset: DesktopWorkspacePreset,
): SerializedDockview | null {
  const panelIds = workspacePanelOrder(layout)
  if (panelIds.length === 0) return null

  const width = Math.max(1, layout.grid.width)
  const height = Math.max(1, layout.grid.height)
  const activePanel = activeWorkspacePanel(layout)
  if (preset === 'focus' && activePanel) {
    const activeIndex = panelIds.indexOf(activePanel)
    if (activeIndex > 0) {
      panelIds.splice(activeIndex, 1)
      panelIds.unshift(activePanel)
    }
  }

  let orientation: 'HORIZONTAL' | 'VERTICAL'
  let rootData: WorkspaceGridNode[]

  if (preset === 'columns' || preset === 'rows') {
    orientation = preset === 'columns' ? 'HORIZONTAL' : 'VERTICAL'
    const availableSize = orientation === 'HORIZONTAL' ? width : height
    const panelSize = availableSize / panelIds.length
    rootData = panelIds.map((panelId, index) =>
      presetLeaf(preset, panelId, index, panelSize),
    )
  } else if (preset === 'focus' && panelIds.length > 1) {
    orientation = 'HORIZONTAL'
    const focusWidth = (width * 2) / 3
    const sideWidth = width - focusWidth
    const sidePanelHeight = height / (panelIds.length - 1)
    rootData = [
      presetLeaf(preset, panelIds[0], 0, focusWidth),
      {
        type: 'branch',
        size: sideWidth,
        data: panelIds
          .slice(1)
          .map((panelId, index) =>
            presetLeaf(preset, panelId, index + 1, sidePanelHeight),
          ),
      },
    ]
  } else if (preset === 'grid') {
    orientation = 'HORIZONTAL'
    const columnCount = Math.ceil(Math.sqrt(panelIds.length))
    const columnWidth = width / columnCount
    rootData = Array.from({ length: columnCount }, (_, columnIndex) => {
      const columnPanelIds = panelIds.filter(
        (_, panelIndex) => panelIndex % columnCount === columnIndex,
      )
      if (columnPanelIds.length === 1) {
        const panelIndex = panelIds.indexOf(columnPanelIds[0])
        return presetLeaf(
          preset,
          columnPanelIds[0],
          panelIndex,
          columnWidth,
        )
      }
      return {
        type: 'branch',
        size: columnWidth,
        data: columnPanelIds.map((panelId) => {
          const panelIndex = panelIds.indexOf(panelId)
          return presetLeaf(
            preset,
            panelId,
            panelIndex,
            height / columnPanelIds.length,
          )
        }),
      }
    })
  } else {
    orientation = 'HORIZONTAL'
    rootData = [presetLeaf(preset, panelIds[0], 0, width)]
  }

  const activePanelId = activePanel ?? panelIds[0]
  const activeIndex = panelIds.indexOf(activePanelId)
  return {
    grid: {
      root: {
        type: 'branch',
        data: rootData,
        size: orientation === 'HORIZONTAL' ? height : width,
      },
      width,
      height,
      orientation,
    },
    panels: layout.panels,
    activeGroup: `preset-${preset}-${Math.max(0, activeIndex) + 1}`,
  }
}

function isBoundedJsonStructure(value: unknown): boolean {
  const pending: Array<{ value: unknown; depth: number }> = [
    { value, depth: 0 },
  ]
  const seen = new WeakSet<object>()
  let nodes = 0

  while (pending.length) {
    const current = pending.pop()
    if (!current || current.depth > MAX_DESKTOP_WORKSPACE_LAYOUT_DEPTH)
      return false

    const candidate = current.value
    if (
      candidate === null ||
      typeof candidate === 'string' ||
      typeof candidate === 'boolean'
    ) {
      continue
    }
    if (typeof candidate === 'number') {
      if (!Number.isFinite(candidate)) return false
      continue
    }
    if (typeof candidate !== 'object' || seen.has(candidate)) return false

    seen.add(candidate)
    nodes += 1
    if (nodes > MAX_DESKTOP_WORKSPACE_LAYOUT_NODES) return false

    const children = Array.isArray(candidate)
      ? candidate
      : Object.values(candidate)
    for (const child of children) {
      pending.push({ value: child, depth: current.depth + 1 })
    }
  }

  return true
}

function persistBoundedValue(
  storage: WorkspaceStorage,
  key: string,
  value: unknown,
  maxChars: number,
): WorkspacePersistenceResult {
  try {
    const serialized = JSON.stringify(value)
    if (typeof serialized !== 'string') {
      return { ok: false, reason: 'invalid' }
    }
    if (serialized.length > maxChars) {
      return { ok: false, reason: 'too-large' }
    }
    storage.setItem(key, serialized)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

const parseHttpsUrl = (value: unknown): URL | null => {
  if (typeof value !== 'string') return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' &&
      parsed.hostname &&
      !parsed.username &&
      !parsed.password
      ? parsed
      : null
  } catch {
    return null
  }
}

const customNetworkIdPattern =
  /^custom-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isTrustedNetworkUrl(
  networkId: string,
  value: unknown,
  catalog: WorkspaceNetworkCatalog,
  allowUnregisteredCustom = false,
): value is string {
  const candidate = parseHttpsUrl(value)
  const target = catalog.get(networkId)
  if (!candidate) return false

  if (
    allowUnregisteredCustom &&
    customNetworkIdPattern.test(networkId) &&
    !target
  ) {
    return true
  }

  const canonical = parseHttpsUrl(target?.canonicalUrl)
  if (!target || !canonical) return false

  if (networkId.startsWith('custom-')) {
    return (
      customNetworkIdPattern.test(networkId) &&
      candidate.href === canonical.href
    )
  }

  const canonicalHost = canonical.hostname.replace(/^www\./i, '')
  const candidateHost = candidate.hostname.replace(/^www\./i, '')
  return target.allowSubdomains
    ? candidateHost === canonicalHost ||
        candidateHost.endsWith(`.${canonicalHost}`)
    : candidateHost === canonicalHost
}

function hasValidGridPanelReferences(
  layout: Record<string, unknown>,
  panelIds: ReadonlySet<string>,
): boolean {
  const grid = layout.grid
  if (!isRecord(grid) || !isRecord(grid.root)) return false
  if (
    typeof grid.width !== 'number' ||
    !Number.isFinite(grid.width) ||
    grid.width <= 0 ||
    typeof grid.height !== 'number' ||
    !Number.isFinite(grid.height) ||
    grid.height <= 0 ||
    (grid.orientation !== 'HORIZONTAL' && grid.orientation !== 'VERTICAL')
  ) {
    return false
  }

  const pending: Record<string, unknown>[] = [grid.root]
  const referencedPanels = new Set<string>()
  const groupIds = new Set<string>()

  while (pending.length) {
    const node = pending.pop()
    if (!node) return false

    if (node.type === 'branch') {
      if (!Array.isArray(node.data) || node.data.length === 0) return false
      for (const child of node.data) {
        if (!isRecord(child)) return false
        pending.push(child)
      }
      continue
    }

    if (node.type !== 'leaf' || !isRecord(node.data)) return false
    const group = node.data
    if (
      typeof group.id !== 'string' ||
      !group.id ||
      group.id.length > 128 ||
      groupIds.has(group.id) ||
      !Array.isArray(group.views) ||
      group.views.length === 0
    ) {
      return false
    }
    groupIds.add(group.id)

    for (const viewId of group.views) {
      if (
        typeof viewId !== 'string' ||
        !panelIds.has(viewId) ||
        referencedPanels.has(viewId)
      ) {
        return false
      }
      referencedPanels.add(viewId)
    }
    if (
      group.activeView !== undefined &&
      (typeof group.activeView !== 'string' ||
        !group.views.includes(group.activeView))
    ) {
      return false
    }
  }

  if (
    layout.activeGroup !== undefined &&
    (typeof layout.activeGroup !== 'string' ||
      !groupIds.has(layout.activeGroup))
  ) {
    return false
  }
  if (
    (layout.floatingGroups !== undefined &&
      (!Array.isArray(layout.floatingGroups) ||
        layout.floatingGroups.length > 0)) ||
    (layout.popoutGroups !== undefined &&
      (!Array.isArray(layout.popoutGroups) || layout.popoutGroups.length > 0))
  ) {
    return false
  }

  return referencedPanels.size === panelIds.size
}

export function isNetworkWorkspacePanelParams(
  value: unknown,
  catalog: WorkspaceNetworkCatalog,
  allowUnregisteredCustom = false,
): value is NetworkWorkspacePanelParams {
  if (!isRecord(value)) return false
  return (
    typeof value.networkId === 'string' &&
    isTrustedNetworkUrl(
      value.networkId,
      value.url,
      catalog,
      allowUnregisteredCustom,
    )
  )
}

function validatesDesktopWorkspaceLayout(
  value: unknown,
  catalog: WorkspaceNetworkCatalog,
  allowUnregisteredCustom: boolean,
): value is SerializedDockview {
  if (!isBoundedJsonStructure(value)) return false
  if (!isRecord(value) || !isRecord(value.grid) || !isRecord(value.panels))
    return false
  if (!isRecord(value.grid.root)) return false

  const panels = Object.entries(value.panels)
  if (panels.length === 0 || panels.length > MAX_DESKTOP_WORKSPACE_PANELS) {
    return false
  }

  const panelsAreSafe = panels.every(([panelId, panel]) => {
    if (!isRecord(panel)) return false
    const params = panel.params
    return (
      panel.contentComponent === 'network' &&
      isNetworkWorkspacePanelParams(params, catalog, allowUnregisteredCustom) &&
      panel.id === panelId &&
      panelId === `network:${encodeURIComponent(params.networkId)}`
    )
  })
  return (
    panelsAreSafe &&
    hasValidGridPanelReferences(value, new Set(panels.map(([id]) => id)))
  )
}

export function isSafeDesktopWorkspaceLayout(
  value: unknown,
  catalog: WorkspaceNetworkCatalog,
): value is SerializedDockview {
  return validatesDesktopWorkspaceLayout(value, catalog, false)
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
  catalog: WorkspaceNetworkCatalog,
): SavedDesktopWorkspace | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    !value.id ||
    value.id.length > 128 ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.trim().length > 64 ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    value.createdAt.length > 64 ||
    value.updatedAt.length > 64 ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    !validatesDesktopWorkspaceLayout(value.layout, catalog, true)
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
  catalog: WorkspaceNetworkCatalog,
): DesktopWorkspaceState {
  if (!raw || raw.length > MAX_DESKTOP_WORKSPACE_STATE_CHARS)
    return emptyDesktopWorkspaceState()

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
      .map((layout) => parseSavedLayout(layout, catalog))
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
  catalog: WorkspaceNetworkCatalog,
): DesktopWorkspaceState {
  try {
    return parseDesktopWorkspaceState(
      storage.getItem(DESKTOP_WORKSPACE_STATE_KEY),
      catalog,
    )
  } catch {
    return emptyDesktopWorkspaceState()
  }
}

export function persistDesktopWorkspaceState(
  storage: WorkspaceStorage,
  state: DesktopWorkspaceState,
): WorkspacePersistenceResult {
  return persistBoundedValue(
    storage,
    DESKTOP_WORKSPACE_STATE_KEY,
    state,
    MAX_DESKTOP_WORKSPACE_STATE_CHARS,
  )
}

export function loadDesktopWorkspaceAutosave(
  storage: WorkspaceStorage,
  catalog: WorkspaceNetworkCatalog,
): SerializedDockview | null {
  try {
    const raw = storage.getItem(DESKTOP_WORKSPACE_AUTOSAVE_KEY)
    if (!raw || raw.length > MAX_DESKTOP_WORKSPACE_AUTOSAVE_CHARS) return null
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.version !== DESKTOP_WORKSPACE_VERSION)
      return null
    return isSafeDesktopWorkspaceLayout(value.layout, catalog)
      ? value.layout
      : null
  } catch {
    return null
  }
}

export function persistDesktopWorkspaceAutosave(
  storage: WorkspaceStorage,
  layout: SerializedDockview,
  catalog: WorkspaceNetworkCatalog,
): WorkspacePersistenceResult {
  if (!isSafeDesktopWorkspaceLayout(layout, catalog)) {
    return { ok: false, reason: 'invalid' }
  }
  return persistBoundedValue(
    storage,
    DESKTOP_WORKSPACE_AUTOSAVE_KEY,
    {
      version: DESKTOP_WORKSPACE_VERSION,
      layout,
    },
    MAX_DESKTOP_WORKSPACE_AUTOSAVE_CHARS,
  )
}

export function clearDesktopWorkspaceAutosave(
  storage: WorkspaceStorage,
): WorkspacePersistenceResult {
  try {
    storage.removeItem(DESKTOP_WORKSPACE_AUTOSAVE_KEY)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
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
