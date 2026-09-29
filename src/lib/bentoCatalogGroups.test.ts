import { describe, expect, it } from 'vitest'
import { isSafeDesktopWorkspaceLayout, loadDesktopWorkspaceAutosave, persistDesktopWorkspaceAutosave } from './desktopWorkspaceLayouts'
import {
  BENTO_CATALOG_GROUP_KEY,
  bentoGroupDestinationValue,
  resolveBentoGroupDestination,
  type BentoGroupDestination,
} from './bentoCatalogGroups'

describe('Bento catalog group destinations', () => {
  const clients: BentoGroupDestination = {
    groupId: 'dock-2', tabGroupId: 'personal-1', label: 'Clients', catalogGroupId: 'crm',
  }
  const unrelated: BentoGroupDestination = {
    groupId: 'dock-1', tabGroupId: 'personal-2', label: 'CRM',
  }

  it('reuses identity after rename and moving the entire group, never a matching label', () => {
    const moved = { ...clients, groupId: 'dock-3' }
    const groups = [unrelated, moved]
    expect(resolveBentoGroupDestination('category', 'crm', groups)).toBe(moved)
    expect(groups).toEqual([unrelated, moved])
  })

  it('honors a personal destination irrespective of the site category', () => {
    expect(resolveBentoGroupDestination(
      bentoGroupDestinationValue(unrelated), 'crm', [clients, unrelated],
    )).toBe(unrelated)
  })

  it('does not reconstruct a removed personal destination or group by its old name', () => {
    expect(resolveBentoGroupDestination(bentoGroupDestinationValue(clients), 'crm', [unrelated])).toBeUndefined()
    expect(resolveBentoGroupDestination('category', 'crm', [unrelated])).toBeUndefined()
  })

  it('supports ungrouped, new-group and unknown-site additions without reusing a group', () => {
    expect(resolveBentoGroupDestination('ungrouped', 'crm', [clients])).toBeUndefined()
    expect(resolveBentoGroupDestination('new-category', 'crm', [clients])).toBeUndefined()
    expect(resolveBentoGroupDestination('category', undefined, [clients])).toBeUndefined()
  })

  it('preserves catalog identity, personal label and membership through workspace storage', () => {
    const catalog = new Map([['linkedin', { canonicalUrl: 'https://www.linkedin.com', allowSubdomains: true }]])
    const tabGroup = {
      id: 'personal-1', label: 'Clients', collapsed: false, panelIds: ['network:linkedin'],
      componentParams: { [BENTO_CATALOG_GROUP_KEY]: 'crm' },
    }
    const layout = {
      grid: {
        root: { type: 'leaf', data: { id: 'dock-2', views: ['network:linkedin'], activeView: 'network:linkedin', tabGroups: [tabGroup] } },
        width: 900, height: 600, orientation: 'HORIZONTAL',
      },
      panels: { 'network:linkedin': {
        id: 'network:linkedin', contentComponent: 'network',
        params: { networkId: 'linkedin', url: 'https://www.linkedin.com' },
      } },
      activeGroup: 'dock-2',
    }
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
      removeItem: (key: string) => { values.delete(key) },
    }
    expect(isSafeDesktopWorkspaceLayout(layout, catalog)).toBe(true)
    if (!isSafeDesktopWorkspaceLayout(layout, catalog)) throw new Error('Invalid layout fixture')
    expect(persistDesktopWorkspaceAutosave(storage, layout, catalog, 'profile-1')).toEqual({ ok: true })
    expect(loadDesktopWorkspaceAutosave(storage, catalog, 'profile-1')).toEqual(layout)
  })

})
