import { describe, expect, it } from 'vitest'
import type { SerializedDockview } from 'dockview-vue'
import {
  DESKTOP_WORKSPACE_AUTOSAVE_KEY,
  DEFAULT_DESKTOP_SCENE_COLOR,
  DEFAULT_DESKTOP_SCENE_ICON,
  LEGACY_DESKTOP_WORKSPACE_AUTOSAVE_KEY,
  createDesktopWorkspacePresetLayout,
  desktopWorkspacePanelId,
  deleteDesktopWorkspaceLayout,
  emptyDesktopWorkspaceState,
  isSafeDesktopWorkspaceLayout,
  isTasksWorkspacePanelParams,
  loadDesktopWorkspaceAutosave,
  loadDesktopWorkspaceState,
  MAX_DESKTOP_WORKSPACE_AUTOSAVE_CHARS,
  MAX_DESKTOP_WORKSPACE_LAYOUT_DEPTH,
  MAX_DESKTOP_WORKSPACE_PANELS,
  MAX_DESKTOP_WORKSPACE_STATE_CHARS,
  parseDesktopWorkspaceState,
  persistDesktopWorkspaceAutosave,
  persistDesktopWorkspaceState,
  removeDesktopWorkspaceProfile,
  saveDesktopWorkspaceLayout,
  selectDesktopWorkspaceLayout,
} from './desktopWorkspaceLayouts'

const PROFILE_ID = 'profile-1'
const OTHER_PROFILE_ID = 'profile-2'
const TEST_WORKSPACE_WIDTH = 240
const TEST_WORKSPACE_HEIGHT = 180

const knownNetworks = new Map([
  ['twitter', { canonicalUrl: 'https://x.com', allowSubdomains: true }],
  [
    'instagram',
    { canonicalUrl: 'https://instagram.com', allowSubdomains: true },
  ],
  ['linkedin', { canonicalUrl: 'https://linkedin.com', allowSubdomains: true }],
  [
    'custom-123e4567-e89b-42d3-a456-426614174000',
    { canonicalUrl: 'https://example.com/dashboard', allowSubdomains: false },
  ],
])

function layoutFor(
  networkId = 'instagram',
  url = 'https://instagram.com',
): SerializedDockview {
  return {
    grid: {
      root: {
        type: 'leaf',
        data: {
          id: 'group-1',
          views: [`network:${networkId}`],
          activeView: `network:${networkId}`,
        },
      },
      width: TEST_WORKSPACE_WIDTH,
      height: TEST_WORKSPACE_HEIGHT,
      orientation: 'HORIZONTAL',
    },
    panels: {
      [`network:${networkId}`]: {
        id: `network:${networkId}`,
        contentComponent: 'network',
        component: 'network',
        params: { networkId, url },
        title: networkId,
      },
    },
    activeGroup: 'group-1',
  } as unknown as SerializedDockview
}

function dockviewV8SinglePanelLayout(): SerializedDockview {
  return {
    grid: {
      root: {
        type: 'branch',
        data: [
          {
            type: 'leaf',
            data: {
              id: 'group-1',
              views: ['network:twitter'],
              activeView: 'network:twitter',
            },
            size: 0,
          },
        ],
        size: 0,
      },
      width: 0,
      height: 0,
      orientation: 'HORIZONTAL',
    },
    panels: {
      'network:twitter': {
        id: 'network:twitter',
        contentComponent: 'network',
        tabComponent: undefined,
        params: { networkId: 'twitter', url: 'https://x.com' },
        title: 'Twitter / X',
        renderer: 'always',
        minimumHeight: 180,
        maximumHeight: undefined,
        minimumWidth: 280,
        maximumWidth: undefined,
        pinned: undefined,
      },
    },
    activeGroup: 'group-1',
  } as unknown as SerializedDockview
}

function networkAndTasksLayout(): SerializedDockview {
  const layout = layoutFor('twitter', 'https://x.com') as unknown as {
    grid: { root: { data: { views: string[]; activeView: string } } }
    panels: Record<string, unknown>
  }
  layout.grid.root.data.views.push('tasks')
  layout.grid.root.data.activeView = 'tasks'
  layout.panels.tasks = {
    id: 'tasks',
    contentComponent: 'tasks',
    component: 'tasks',
    params: { type: 'tasks' },
    title: 'Tâches',
  }
  return layout as unknown as SerializedDockview
}

function customLayoutWithPanelCount(count: number) {
  const layout = layoutFor() as unknown as Record<string, unknown>
  const panels: Record<string, unknown> = {}
  const panelIds: string[] = []
  const catalog = new Map(knownNetworks)

  for (let index = 0; index < count; index += 1) {
    const suffix = index.toString(16).padStart(12, '0')
    const networkId = `custom-00000000-0000-4000-8000-${suffix}`
    const panelId = `network:${encodeURIComponent(networkId)}`
    const url = `https://example.com/${index}`
    panelIds.push(panelId)
    catalog.set(networkId, { canonicalUrl: url, allowSubdomains: false })
    panels[panelId] = {
      id: panelId,
      contentComponent: 'network',
      component: 'network',
      params: { networkId, url },
      title: networkId,
    }
  }

  layout.panels = panels
  const grid = layout.grid as Record<string, unknown>
  const root = grid.root as Record<string, unknown>
  const data = root.data as Record<string, unknown>
  data.views = panelIds
  data.activeView = panelIds[0]
  return { layout: layout as unknown as SerializedDockview, catalog }
}

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('desktop workspace layouts', () => {
  it('accepts and reloads a mixed network and Tasks scene', () => {
    const layout = networkAndTasksLayout()
    const storage = memoryStorage()

    expect(isSafeDesktopWorkspaceLayout(layout, knownNetworks)).toBe(true)
    expect(
      persistDesktopWorkspaceAutosave(storage, layout, knownNetworks, PROFILE_ID),
    ).toEqual({ ok: true })
    expect(
      loadDesktopWorkspaceAutosave(storage, knownNetworks, PROFILE_ID),
    ).toEqual(layout)
  })

  it('round-trips the pinned state for network and Tasks panels', () => {
    const layout = networkAndTasksLayout()
    layout.panels['network:twitter'].params = {
      ...layout.panels['network:twitter'].params,
      bentoPinned: true,
    }
    layout.panels.tasks.params = { type: 'tasks', bentoPinned: true }
    const storage = memoryStorage()

    expect(isSafeDesktopWorkspaceLayout(layout, knownNetworks)).toBe(true)
    expect(
      persistDesktopWorkspaceAutosave(storage, layout, knownNetworks, PROFILE_ID),
    ).toEqual({ ok: true })
    expect(loadDesktopWorkspaceAutosave(storage, knownNetworks, PROFILE_ID)).toEqual(layout)
  })

  it('rejects false Tasks discriminants and unexpected params', () => {
    expect(isTasksWorkspacePanelParams({ type: 'task' })).toBe(false)
    expect(isTasksWorkspacePanelParams({ type: 'tasks', url: 'https://x.com' })).toBe(false)

    const layout = networkAndTasksLayout() as unknown as {
      panels: Record<string, { params: unknown }>
    }
    layout.panels.tasks.params = { type: 'network' }
    expect(isSafeDesktopWorkspaceLayout(layout, knownNetworks)).toBe(false)
  })

  it('keeps legacy network panels without a discriminant compatible', () => {
    expect(isSafeDesktopWorkspaceLayout(layoutFor(), knownNetworks)).toBe(true)
  })

  it('uses one stable panel identity when Tasks is selected repeatedly', () => {
    expect(desktopWorkspacePanelId({ type: 'tasks' })).toBe('tasks')
    expect(desktopWorkspacePanelId({ type: 'tasks' })).toBe('tasks')
    expect(
      desktopWorkspacePanelId({ networkId: 'twitter', url: 'https://x.com' }),
    ).toBe('network:twitter')
  })

  it('accepts a valid single-panel scene serialized before its first measured layout', () => {
    const layout = dockviewV8SinglePanelLayout()

    expect(
      isSafeDesktopWorkspaceLayout(layout, knownNetworks),
    ).toBe(true)

    const storage = memoryStorage()
    expect(
      persistDesktopWorkspaceAutosave(
        storage,
        layout,
        knownNetworks,
        PROFILE_ID,
      ),
    ).toEqual({ ok: true })
    const persisted = storage.getItem(
      `${DESKTOP_WORKSPACE_AUTOSAVE_KEY}:${PROFILE_ID}`,
    )
    expect(persisted).not.toContain('tabComponent')
    expect(persisted).not.toContain('maximumHeight')
    expect(
      loadDesktopWorkspaceAutosave(storage, knownNetworks, PROFILE_ID),
    ).toEqual(JSON.parse(JSON.stringify(layout)))
  })

  it('rejects non-JSON live values instead of silently omitting or coercing them', () => {
    const withFunction = dockviewV8SinglePanelLayout() as unknown as {
      panels: Record<string, Record<string, unknown>>
    }
    withFunction.panels['network:twitter'].tabComponent = () => undefined
    expect(isSafeDesktopWorkspaceLayout(withFunction, knownNetworks)).toBe(false)

    const withNonFiniteNumber = dockviewV8SinglePanelLayout() as unknown as {
      panels: Record<string, Record<string, unknown>>
    }
    withNonFiniteNumber.panels['network:twitter'].maximumHeight = Number.NaN
    expect(
      isSafeDesktopWorkspaceLayout(withNonFiniteNumber, knownNetworks),
    ).toBe(false)

    const cyclic = dockviewV8SinglePanelLayout() as unknown as Record<
      string,
      unknown
    >
    cyclic.cycle = cyclic
    expect(isSafeDesktopWorkspaceLayout(cyclic, knownNetworks)).toBe(false)
  })

  it('still rejects impossible negative workspace dimensions', () => {
    const layout = layoutFor() as unknown as {
      grid: { width: number; height: number }
    }
    layout.grid.width = Number.MIN_SAFE_INTEGER

    expect(
      isSafeDesktopWorkspaceLayout(
        layout as unknown as SerializedDockview,
        knownNetworks,
      ),
    ).toBe(false)
  })

  it('creates linear presets without losing panel state', () => {
    const { layout, catalog } = customLayoutWithPanelCount(3)
    const columns = createDesktopWorkspacePresetLayout(layout, 'columns')
    const rows = createDesktopWorkspacePresetLayout(layout, 'rows')

    expect(columns?.grid.orientation).toBe('HORIZONTAL')
    expect(rows?.grid.orientation).toBe('VERTICAL')
    expect(columns?.grid.root).toMatchObject({ type: 'branch' })
    expect(rows?.grid.root).toMatchObject({ type: 'branch' })
    expect(columns?.panels).toBe(layout.panels)
    expect(rows?.panels).toBe(layout.panels)
    expect((columns?.grid.root.data as unknown[]).length).toBe(3)
    expect((rows?.grid.root.data as unknown[]).length).toBe(3)
    expect(isSafeDesktopWorkspaceLayout(columns, catalog)).toBe(true)
    expect(isSafeDesktopWorkspaceLayout(rows, catalog)).toBe(true)
  })

  it('uses the active panel as the focus and keeps every other panel visible', () => {
    const { layout } = customLayoutWithPanelCount(4)
    const panelIds = Object.keys(layout.panels)
    const root = layout.grid.root as {
      data: { id: string; views: string[]; activeView: string }
    }
    root.data.id = 'current-group'
    root.data.activeView = panelIds[2]
    layout.activeGroup = 'current-group'

    const focused = createDesktopWorkspacePresetLayout(layout, 'focus')
    const focusedRoot = focused?.grid.root.data as Array<{
      type: string
      data: unknown
    }>
    const primary = focusedRoot[0].data as { views: string[] }
    const side = focusedRoot[1].data as Array<unknown>

    expect(primary.views).toEqual([panelIds[2]])
    expect(side).toHaveLength(3)
    expect(focused?.activeGroup).toBe('preset-focus-1')
  })

  it('builds a balanced grid for non-square panel counts', () => {
    const { layout, catalog } = customLayoutWithPanelCount(5)
    const grid = createDesktopWorkspacePresetLayout(layout, 'grid')
    const columns = grid?.grid.root.data as Array<{
      type: string
      data: unknown
    }>

    expect(columns).toHaveLength(3)
    expect(columns.map((column) => column.type)).toEqual([
      'branch',
      'branch',
      'leaf',
    ])
    expect(grid?.panels).toBe(layout.panels)
    expect(isSafeDesktopWorkspaceLayout(grid, catalog)).toBe(true)
  })

  it('uses a valid single-cell branch for every preset', () => {
    const layout = layoutFor()
    for (const preset of ['columns', 'rows', 'focus', 'grid'] as const) {
      const result = createDesktopWorkspacePresetLayout(layout, preset)
      expect(result?.grid.root.type).toBe('branch')
      expect(result?.grid.root.data).toHaveLength(1)
      expect(result?.activeGroup).toBe(`preset-${preset}-1`)
    }
  })

  it('accepts catalog networks and rejects unsafe panel URLs', () => {
    expect(isSafeDesktopWorkspaceLayout(layoutFor(), knownNetworks)).toBe(true)
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor('instagram', 'https://www.instagram.com/reels/123'),
        knownNetworks,
      ),
    ).toBe(true)
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor('instagram', 'javascript:alert(1)'),
        knownNetworks,
      ),
    ).toBe(false)
    expect(
      isSafeDesktopWorkspaceLayout(layoutFor('unknown'), knownNetworks),
    ).toBe(false)
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor('instagram', 'https://instagram.example/reels/123'),
        knownNetworks,
      ),
    ).toBe(false)
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor('instagram', 'https://user:secret@instagram.com/'),
        knownNetworks,
      ),
    ).toBe(false)
  })

  it('only restores registered custom links with their authoritative URL', () => {
    const customId = 'custom-123e4567-e89b-42d3-a456-426614174000'
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor(customId, 'https://example.com/dashboard'),
        knownNetworks,
      ),
    ).toBe(true)
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor(customId, 'https://example.com/other'),
        knownNetworks,
      ),
    ).toBe(false)
    expect(
      isSafeDesktopWorkspaceLayout(
        layoutFor('custom-../../escape', 'https://example.com/dashboard'),
        new Map([
          [
            'custom-../../escape',
            {
              canonicalUrl: 'https://example.com/dashboard',
              allowSubdomains: false,
            },
          ],
        ]),
      ),
    ).toBe(false)
  })

  it('keeps structurally valid custom layouts until their profile catalog is ready', () => {
    const customId = 'custom-123e4567-e89b-42d3-a456-426614174000'
    const saved = {
      id: 'custom-layout',
      name: 'Custom',
      createdAt: '2026-08-20T08:00:00.000Z',
      updatedAt: '2026-08-20T08:00:00.000Z',
      layout: layoutFor(customId, 'https://example.com/dashboard'),
    }
    const parsed = parseDesktopWorkspaceState(
      JSON.stringify({ version: 1, selectedLayoutId: null, layouts: [saved] }),
      new Map(),
      PROFILE_ID,
    )

    expect(parsed.layouts).toHaveLength(1)
    expect(
      isSafeDesktopWorkspaceLayout(parsed.layouts[0].layout, new Map()),
    ).toBe(false)
  })

  it('recovers safely from corrupt or unsupported storage', () => {
    expect(parseDesktopWorkspaceState('{bad json', knownNetworks)).toEqual(
      emptyDesktopWorkspaceState(),
    )
    expect(
      parseDesktopWorkspaceState(
        JSON.stringify({ version: 99, layouts: [] }),
        knownNetworks,
      ),
    ).toEqual(emptyDesktopWorkspaceState())
  })

  it('rejects layouts beyond the panel and nesting budgets', () => {
    const atLimit = customLayoutWithPanelCount(MAX_DESKTOP_WORKSPACE_PANELS)
    const overLimit = customLayoutWithPanelCount(
      MAX_DESKTOP_WORKSPACE_PANELS + 1,
    )
    expect(isSafeDesktopWorkspaceLayout(atLimit.layout, atLimit.catalog)).toBe(
      true,
    )
    expect(
      isSafeDesktopWorkspaceLayout(overLimit.layout, overLimit.catalog),
    ).toBe(false)
    expect(
      persistDesktopWorkspaceAutosave(
        memoryStorage(),
        overLimit.layout,
        overLimit.catalog,
        PROFILE_ID,
      ),
    ).toEqual({ ok: false, reason: 'invalid' })

    const danglingReference = layoutFor() as unknown as {
      grid: { root: { data: { views: string[] } } }
    }
    danglingReference.grid.root.data.views = ['network:missing']
    expect(
      isSafeDesktopWorkspaceLayout(
        danglingReference as unknown as SerializedDockview,
        knownNetworks,
      ),
    ).toBe(false)

    const deeplyNested = layoutFor() as unknown as Record<string, unknown>
    let cursor = deeplyNested
    for (
      let depth = 0;
      depth <= MAX_DESKTOP_WORKSPACE_LAYOUT_DEPTH;
      depth += 1
    ) {
      const child: Record<string, unknown> = {}
      cursor.extra = child
      cursor = child
    }
    expect(
      isSafeDesktopWorkspaceLayout(
        deeplyNested as unknown as SerializedDockview,
        knownNetworks,
      ),
    ).toBe(false)
  })

  it('bounds stored payloads and survives unavailable storage', () => {
    expect(
      parseDesktopWorkspaceState(
        'x'.repeat(MAX_DESKTOP_WORKSPACE_STATE_CHARS + 1),
        knownNetworks,
      ),
    ).toEqual(emptyDesktopWorkspaceState())

    const storage = memoryStorage()
    const oversizedLayout = layoutFor() as unknown as {
      panels: Record<string, { title: string }>
    }
    Object.values(oversizedLayout.panels)[0].title = 'x'.repeat(
      MAX_DESKTOP_WORKSPACE_AUTOSAVE_CHARS,
    )
    expect(
      persistDesktopWorkspaceAutosave(
        storage,
        oversizedLayout as unknown as SerializedDockview,
        knownNetworks,
        PROFILE_ID,
      ),
    ).toEqual({ ok: false, reason: 'too-large' })

    const unavailable = {
      getItem: () => {
        throw new Error('storage disabled')
      },
      setItem: () => {
        throw new Error('quota exceeded')
      },
      removeItem: () => {
        throw new Error('storage disabled')
      },
    }
    expect(loadDesktopWorkspaceState(unavailable, knownNetworks)).toEqual(
      emptyDesktopWorkspaceState(),
    )
    expect(
      loadDesktopWorkspaceAutosave(unavailable, knownNetworks, PROFILE_ID),
    ).toBeNull()
    expect(
      persistDesktopWorkspaceState(unavailable, emptyDesktopWorkspaceState()),
    ).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('saves, renames and deletes a named layout without changing its identity', () => {
    const first = saveDesktopWorkspaceLayout(emptyDesktopWorkspaceState(), {
      profileId: PROFILE_ID,
      name: 'Veille du matin',
      layout: layoutFor(),
      now: '2026-08-20T08:00:00.000Z',
      createId: () => 'layout-1',
      icon: '🚀',
      color: 'success',
    })
    const renamed = saveDesktopWorkspaceLayout(first, {
      id: 'layout-1',
      profileId: PROFILE_ID,
      name: 'Veille quotidienne',
      layout: layoutFor('linkedin', 'https://linkedin.com'),
      now: '2026-08-20T09:00:00.000Z',
    })

    expect(renamed.layouts).toHaveLength(1)
    expect(renamed.layouts[0]).toMatchObject({
      id: 'layout-1',
      profileId: PROFILE_ID,
      name: 'Veille quotidienne',
      createdAt: '2026-08-20T08:00:00.000Z',
      updatedAt: '2026-08-20T09:00:00.000Z',
      icon: '🚀',
      color: 'success',
    })
    expect(
      deleteDesktopWorkspaceLayout(renamed, PROFILE_ID, 'layout-1'),
    ).toEqual({
      version: 2,
      selectedLayoutIds: { [PROFILE_ID]: null },
      layouts: [],
    })
  })

  it('defaults legacy scene appearance and rejects unbounded values', () => {
    const legacy = {
      id: 'legacy-scene',
      name: 'Legacy',
      createdAt: '2026-08-20T08:00:00.000Z',
      updatedAt: '2026-08-20T08:00:00.000Z',
      layout: layoutFor(),
    }
    const parsed = parseDesktopWorkspaceState(
      JSON.stringify({
        version: 1,
        selectedLayoutId: 'legacy-scene',
        layouts: [legacy],
      }),
      knownNetworks,
      PROFILE_ID,
    )
    expect(parsed.layouts[0]).toMatchObject({
      icon: DEFAULT_DESKTOP_SCENE_ICON,
      color: DEFAULT_DESKTOP_SCENE_COLOR,
    })

    const invalidAppearance = parseDesktopWorkspaceState(
      JSON.stringify({
        version: 2,
        selectedLayoutIds: { [PROFILE_ID]: 'invalid-appearance' },
        layouts: [{
          ...legacy,
          id: 'invalid-appearance',
          profileId: PROFILE_ID,
          icon: 'x'.repeat(100),
          color: 'javascript:alert(1)',
        }],
      }),
      knownNetworks,
    )
    expect(invalidAppearance.layouts).toEqual([])
  })

  it('drops invalid layouts while preserving valid entries and selection', () => {
    const valid = {
      id: 'valid',
      name: 'Valide',
      createdAt: '2026-08-20T08:00:00.000Z',
      updatedAt: '2026-08-20T08:00:00.000Z',
      layout: layoutFor(),
    }
    const parsed = parseDesktopWorkspaceState(
      JSON.stringify({
        version: 1,
        selectedLayoutId: 'valid',
        layouts: [
          valid,
          { ...valid, id: 'invalid', layout: layoutFor('unknown') },
        ],
      }),
      knownNetworks,
      PROFILE_ID,
    )

    expect(parsed.layouts.map((layout) => layout.id)).toEqual(['valid'])
    expect(parsed.selectedLayoutIds[PROFILE_ID]).toBe('valid')
  })

  it('isolates scenes and selection by profile', () => {
    const first = saveDesktopWorkspaceLayout(emptyDesktopWorkspaceState(), {
      profileId: PROFILE_ID,
      name: 'Travail',
      layout: layoutFor(),
      createId: () => 'scene-work',
    })
    const second = saveDesktopWorkspaceLayout(first, {
      profileId: OTHER_PROFILE_ID,
      name: 'Personnel',
      layout: layoutFor('linkedin', 'https://linkedin.com'),
      createId: () => 'scene-personal',
    })

    expect(second.layouts.map((layout) => layout.profileId)).toEqual([
      OTHER_PROFILE_ID,
      PROFILE_ID,
    ])
    expect(second.selectedLayoutIds).toEqual({
      [PROFILE_ID]: 'scene-work',
      [OTHER_PROFILE_ID]: 'scene-personal',
    })
    expect(
      selectDesktopWorkspaceLayout(second, PROFILE_ID, 'scene-personal')
        .selectedLayoutIds[PROFILE_ID],
    ).toBeNull()

    const removed = removeDesktopWorkspaceProfile(second, PROFILE_ID)
    expect(removed.layouts.map((layout) => layout.id)).toEqual([
      'scene-personal',
    ])
    expect(removed.selectedLayoutIds).toEqual({
      [OTHER_PROFILE_ID]: 'scene-personal',
    })
  })

  it('isolates autosaved drafts and migrates the legacy draft once', () => {
    const storage = memoryStorage()
    const workLayout = layoutFor()
    const personalLayout = layoutFor('linkedin', 'https://linkedin.com')

    expect(
      persistDesktopWorkspaceAutosave(
        storage,
        workLayout,
        knownNetworks,
        PROFILE_ID,
      ),
    ).toEqual({ ok: true })
    expect(
      persistDesktopWorkspaceAutosave(
        storage,
        personalLayout,
        knownNetworks,
        OTHER_PROFILE_ID,
      ),
    ).toEqual({ ok: true })
    expect(
      loadDesktopWorkspaceAutosave(storage, knownNetworks, PROFILE_ID),
    ).toEqual(workLayout)
    expect(
      loadDesktopWorkspaceAutosave(storage, knownNetworks, OTHER_PROFILE_ID),
    ).toEqual(personalLayout)

    const legacyStorage = memoryStorage()
    legacyStorage.setItem(
      LEGACY_DESKTOP_WORKSPACE_AUTOSAVE_KEY,
      JSON.stringify({ version: 1, layout: workLayout }),
    )
    expect(
      loadDesktopWorkspaceAutosave(legacyStorage, knownNetworks, PROFILE_ID),
    ).toEqual(workLayout)
    persistDesktopWorkspaceAutosave(
      legacyStorage,
      workLayout,
      knownNetworks,
      PROFILE_ID,
    )
    expect(
      legacyStorage.getItem(LEGACY_DESKTOP_WORKSPACE_AUTOSAVE_KEY),
    ).toBeNull()
    expect(
      legacyStorage.getItem(`${DESKTOP_WORKSPACE_AUTOSAVE_KEY}:${PROFILE_ID}`),
    ).not.toBeNull()
  })
})


it('restores independent network instance IDs while preserving canonical network trust', () => {
  const layout = layoutFor()
  const original = layout.panels['network:instagram']
  const id = desktopWorkspacePanelId({networkId:'instagram', url:'https://instagram.com', instanceId:'copy-one'})
  layout.panels[id] = {...original, id, params:{...original.params, instanceId:'copy-one'}}
  const leaf = layout.grid.root.data as {views:string[]}
  leaf.views.push(id)
  expect(isSafeDesktopWorkspaceLayout(layout, knownNetworks)).toBe(true)
  layout.panels[id].params = {...layout.panels[id].params, instanceId:'../invalid'}
  expect(isSafeDesktopWorkspaceLayout(layout, knownNetworks)).toBe(false)
})
