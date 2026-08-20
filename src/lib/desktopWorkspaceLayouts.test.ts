import { describe, expect, it } from 'vitest'
import type { SerializedDockview } from 'dockview-vue'
import { DESKTOP_WORKSPACE_CONSTRAINTS } from '@/design-tokens'
import {
  deleteDesktopWorkspaceLayout,
  emptyDesktopWorkspaceState,
  isSafeDesktopWorkspaceLayout,
  parseDesktopWorkspaceState,
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
