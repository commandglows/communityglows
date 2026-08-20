import { describe, expect, it } from 'vitest'
import type { SerializedDockview } from 'dockview-vue'
import { DESKTOP_WORKSPACE_CONSTRAINTS } from '@/design-tokens'
import {
  deleteDesktopWorkspaceLayout,
  emptyDesktopWorkspaceState,
  isSafeDesktopWorkspaceLayout,
  loadDesktopWorkspaceAutosave,
  loadDesktopWorkspaceState,
  MAX_DESKTOP_WORKSPACE_AUTOSAVE_CHARS,
  MAX_DESKTOP_WORKSPACE_LAYOUT_DEPTH,
  MAX_DESKTOP_WORKSPACE_PANELS,
  MAX_DESKTOP_WORKSPACE_STATE_CHARS,
  parseDesktopWorkspaceState,
  persistDesktopWorkspaceAutosave,
  persistDesktopWorkspaceState,
  saveDesktopWorkspaceLayout,
} from './desktopWorkspaceLayouts'

const knownNetworks = new Map([
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
      width: DESKTOP_WORKSPACE_CONSTRAINTS.panelMinWidth,
      height: DESKTOP_WORKSPACE_CONSTRAINTS.panelMinHeight,
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
    expect(loadDesktopWorkspaceAutosave(unavailable, knownNetworks)).toBeNull()
    expect(
      persistDesktopWorkspaceState(unavailable, emptyDesktopWorkspaceState()),
    ).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('saves, renames and deletes a named layout without changing its identity', () => {
    const first = saveDesktopWorkspaceLayout(emptyDesktopWorkspaceState(), {
      name: 'Veille du matin',
      layout: layoutFor(),
      now: '2026-08-20T08:00:00.000Z',
      createId: () => 'layout-1',
    })
    const renamed = saveDesktopWorkspaceLayout(first, {
      id: 'layout-1',
      name: 'Veille quotidienne',
      layout: layoutFor('linkedin', 'https://linkedin.com'),
      now: '2026-08-20T09:00:00.000Z',
    })

    expect(renamed.layouts).toHaveLength(1)
    expect(renamed.layouts[0]).toMatchObject({
      id: 'layout-1',
      name: 'Veille quotidienne',
      createdAt: '2026-08-20T08:00:00.000Z',
      updatedAt: '2026-08-20T09:00:00.000Z',
    })
    expect(deleteDesktopWorkspaceLayout(renamed, 'layout-1')).toEqual(
      emptyDesktopWorkspaceState(),
    )
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
    )

    expect(parsed.layouts.map((layout) => layout.id)).toEqual(['valid'])
    expect(parsed.selectedLayoutId).toBe('valid')
  })
})
