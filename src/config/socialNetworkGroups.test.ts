import { describe, expect, it } from 'vitest'

import { builtInSocialNetworks } from '@/config/socialNetworks'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import {
  getNetworkGroupId,
  groupNetworks,
  networkGroups,
  networkGroupSelection,
  toggleNetworkGroupSelection,
} from '@/config/socialNetworkGroups'

describe('network catalogue groups', () => {
  it('classifies every built-in site exactly once using stable category IDs', () => {
    expect(networkGroups.map(group => group.id)).toEqual([
      'social', 'communities', 'webdev', 'startups', 'design', 'video',
      'publishing', 'freelance', 'local', 'creators', 'crm', 'tools',
    ])
    const assignedIds = networkGroups.flatMap(group => group.networkIds)
    expect(new Set(assignedIds).size).toBe(assignedIds.length)
    expect([...assignedIds].sort()).toEqual(builtInSocialNetworks.map(item => item.id).sort())
    expect(networkGroups.every(group => group.labelKey === `networkGroups.${group.id}`)).toBe(true)
    expect(['breakcold', 'clarkup', 'clay', 'dex'].map(getNetworkGroupId)).toEqual([
      'crm', 'crm', 'crm', 'crm',
    ])
  })

  it('provides every category label in French and English', () => {
    for (const group of networkGroups) {
      expect((fr.networkGroups as Record<string, string>)[group.id]).toBeTruthy()
      expect((en.networkGroups as Record<string, string>)[group.id]).toBeTruthy()
    }
  })

  it('keeps category order, source item order, and custom entries without empty groups', () => {
    const items = [
      { id: 'dex' }, { id: 'tasks' }, { id: 'linkedin' },
      { id: 'breakcold' }, { id: 'custom-link' }, { id: 'twitter' },
    ]
    const grouped = groupNetworks(items, item => item.id)
    expect(grouped.map(group => group.id)).toEqual(['social', 'crm', 'other'])
    expect(grouped.map(group => group.items.map(item => item.id))).toEqual([
      ['linkedin', 'twitter'], ['dex', 'breakcold'], ['tasks', 'custom-link'],
    ])
    expect(grouped[1]?.items[0]).toBe(items[0])
    expect(getNetworkGroupId('custom-link')).toBe('other')
    expect(groupNetworks([], String)).toEqual([])
  })
})

describe('network group selection', () => {
  const ids = ['breakcold', 'clarkup', 'clay', 'dex']

  it('identifies none, partial, and full selections without counting unrelated sites', () => {
    expect(networkGroupSelection(ids, ['twitter'])).toBe('none')
    expect(networkGroupSelection(ids, ['twitter', 'dex'])).toBe('some')
    expect(networkGroupSelection(ids, ['twitter', ...ids])).toBe('all')
    expect(networkGroupSelection([], ['twitter'])).toBe('none')
  })

  it('completes partial selections and removes full groups while retaining unrelated sites', () => {
    const selected = ['twitter', 'dex', 'linkedin']
    const complete = toggleNetworkGroupSelection(ids, selected)
    expect(complete).toEqual(['twitter', 'dex', 'linkedin', 'breakcold', 'clarkup', 'clay'])
    expect(toggleNetworkGroupSelection(ids, complete)).toEqual(['twitter', 'linkedin'])
    expect(selected).toEqual(['twitter', 'dex', 'linkedin'])
    expect(toggleNetworkGroupSelection(ids, ['twitter'])).toEqual(['twitter', ...ids])
    expect(toggleNetworkGroupSelection([], selected)).toEqual(selected)
  })
})
