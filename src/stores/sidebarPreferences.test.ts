import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { BENTO_DISPLAY_KEY, useSidebarPreferencesStore } from './sidebarPreferences'
import { moveSidebarItem, normalizeSidebarOrganization, organizeSidebarItems } from '@/lib/sidebarOrganization'

describe('Bento display preference', () => {
  afterEach(() => vi.unstubAllGlobals())
  let values: Map<string, string>
  beforeEach(() => {
    values = new Map()
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) })
    setActivePinia(createPinia())
  })
  it('defaults to grouped and restores the selected mode', () => {
    const store = useSidebarPreferencesStore()
    expect(store.bentoDisplay).toBe('grouped')
    store.setBentoDisplay('tabs')
    setActivePinia(createPinia())
    expect(useSidebarPreferencesStore().bentoDisplay).toBe('tabs')
    expect(values.get(BENTO_DISPLAY_KEY)).toBe('tabs')
  })
  it('keeps mixed scene/network membership and order across display switches', () => {
    const ids = ['twitter', 'bento-scene:one', 'bento-scene:two']
    const organization = moveSidebarItem(normalizeSidebarOrganization(null), ids[1], 'social', ids, 'twitter')
    const store = useSidebarPreferencesStore()
    store.setBentoDisplay('tabs'); store.setBentoDisplay('grouped'); store.setBentoDisplay('tabs')
    expect(organizeSidebarItems(ids, id => id, organization).find(group => group.id === 'social')?.items).toEqual(['bento-scene:one', 'twitter'])
  })
  it('keeps the last working display if persistence fails', () => {
    const store = useSidebarPreferencesStore()
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('quota') } })
    store.setBentoDisplay('tabs')
    expect(store.bentoDisplay).toBe('grouped')
    expect(store.saveError).toBe(true)
  })
})
