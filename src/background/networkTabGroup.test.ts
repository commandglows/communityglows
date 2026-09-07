import { describe, expect, it, vi } from 'vitest'
import { createNetworkTabManager, NETWORK_TABS_KEY, type NetworkTarget } from './networkTabGroup'

const target = (networkId = 'one', groupKey = 'social'): NetworkTarget => ({ profileId: 'profile', networkId, groupKey, groupTitle: groupKey, label: networkId, url: `https://${networkId}.example/` })
type Tab = { id: number; windowId: number; groupId: number; index: number; active: boolean; pinned: boolean; url: string }
type Group = { id: number; windowId: number; title: string; collapsed: boolean }

function browser() {
  const tabs = new Map<number, Tab>()
  const groups = new Map<number, Group>()
  let tabId = 0, groupId = 100
  const area = () => {
    const data: Record<string, unknown> = {}
    return { data, get: vi.fn(async (key: string) => structuredClone({ [key]: data[key] })), set: vi.fn(async (value: Record<string, unknown>) => { Object.assign(data, structuredClone(value)) }) }
  }
  const getTab = (id: number) => { const tab = tabs.get(id); if (!tab) throw new Error('No tab'); return tab }
  const getGroup = (id: number) => { const group = groups.get(id); if (!group) throw new Error('No group'); return group }
  const add = (overrides: Partial<Tab> = {}) => {
    const tab = { id: ++tabId, windowId: 1, groupId: -1, index: tabs.size, active: false, pinned: false, url: 'https://personal.example/', ...overrides }
    tabs.set(tab.id, tab)
    return tab
  }
  const api = {
    storage: { session: area(), local: area() },
    tabs: {
      query: vi.fn(async (query: Record<string, unknown>) => structuredClone([...tabs.values()].filter(tab => Object.entries(query).every(([key, value]) => tab[key as keyof Tab] === value)))),
      get: vi.fn(async (id: number) => structuredClone(getTab(id))),
      create: vi.fn(async (props: Partial<Tab>) => structuredClone(add(props))),
      update: vi.fn(async (id: number, props: Partial<Tab>) => {
        const tab = getTab(id)
        if (props.active) for (const other of tabs.values()) if (other.windowId === tab.windowId) other.active = false
        Object.assign(tab, props)
        return structuredClone(tab)
      }),
      group: vi.fn(async (props: { tabIds: number[]; groupId?: number; createProperties?: { windowId: number } }) => {
        const id = props.groupId ?? ++groupId
        if (props.groupId !== undefined) getGroup(id)
        else groups.set(id, { id, windowId: props.createProperties!.windowId, title: '', collapsed: false })
        for (const idOfTab of props.tabIds) getTab(idOfTab).groupId = id
        return id
      }),
      move: vi.fn(async (id: number, props: { windowId: number; index: number }) => {
        Object.assign(getTab(id), props, { groupId: -1 })
        return structuredClone(getTab(id))
      }),
    },
    tabGroups: {
      query: vi.fn(async () => structuredClone([...groups.values()].filter(group => [...tabs.values()].some(tab => tab.groupId === group.id)))),
      get: vi.fn(async (id: number) => structuredClone(getGroup(id))),
      update: vi.fn(async (id: number, props: Partial<Group>) => {
        // Model Chrome's dangerous side effect when the active group is collapsed.
        if (props.collapsed) for (const tab of tabs.values()) if (tab.groupId === id) tab.active = false
        Object.assign(getGroup(id), props)
        return structuredClone(getGroup(id))
      }),
      move: vi.fn(async (id: number, props: { windowId: number; index: number }) => {
        getGroup(id).windowId = props.windowId
        for (const tab of tabs.values()) if (tab.groupId === id) tab.windowId = props.windowId
        return structuredClone(getGroup(id))
      }),
    },
    windows: { update: vi.fn(async (id: number) => ({ id })) },
  }
  const manager = () => createNetworkTabManager(api as unknown as typeof chrome)
  return { tabs, groups, add, api, manager }
}

describe('managed Chrome network tabs', () => {
  it('rejects adoption conflicts without transferring another network ownership', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    await expect(m.execute({ action: 'adopt', target: target('two'), windowId: 1 })).rejects.toThrow('already_managed')
    b.tabs.get(first.entries[0].tabId!)!.active = false
    const personal = b.add({ active: true })
    await expect(m.execute({ action: 'adopt', target: target(), windowId: 1 })).rejects.toThrow('already_managed')
    expect((await m.execute({ action: 'snapshot' })).entries.map(entry => entry.tabId)).toEqual([first.entries[0].tabId])
    expect(personal.groupId).toBe(-1)
  })

  it('can retry grouping after adopting a personal tab encounters an API failure', async () => {
    const b = browser(), m = b.manager()
    const personal = b.add({ active: true })
    b.api.tabs.group.mockRejectedValueOnce(new Error('temporary failure'))
    await expect(m.execute({ action: 'adopt', target: target(), windowId: 1 })).rejects.toThrow('temporary failure')
    const state = await m.execute({ action: 'open', target: target(), windowId: 1 })
    expect(state.entries[0].tabId).toBe(personal.id)
    expect(state.entries[0].groupId).not.toBe(-1)
    expect(b.api.tabs.create).not.toHaveBeenCalled()
  })

  it('serializes rapid clicks without duplicates or URL updates', async () => {
    const b = browser(), m = b.manager()
    await Promise.all(Array.from({ length: 12 }, () => m.execute({ action: 'open', target: target(), windowId: 1 })))
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
    expect(b.api.tabs.update.mock.calls.every(([, props]) => !('url' in props))).toBe(true)
  })

  it('keeps the active group expanded and collapses inactive managed groups', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    const second = await m.execute({ action: 'open', target: target('two', 'work'), windowId: 1 })
    expect(second.groups.find(group => group.id === first.entries[0].groupId)?.collapsed).toBe(true)
    expect(second.groups.find(group => group.active)?.collapsed).toBe(false)
    await expect(m.execute({ action: 'collapse', groupId: second.entries[1].groupId, collapsed: true })).rejects.toThrow('active_group')
    expect(b.tabs.get(second.entries[1].tabId!)?.active).toBe(true)
  })

  it('observes explicit group expansion without immediately undoing it', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    await m.execute({ action: 'open', target: target('two', 'work'), windowId: 1 })
    await m.execute({ action: 'collapse', groupId: first.entries[0].groupId, collapsed: false })
    const state = await m.execute({ action: 'snapshot' })
    expect(state.groups.find(group => group.id === first.entries[0].groupId)?.collapsed).toBe(false)
  })

  it('does not adopt, rename or hide personal members of mixed groups', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    const personal = b.add({ groupId: first.entries[0].groupId })
    const state = await m.execute({ action: 'open', target: target('two', 'work'), windowId: 1 })
    expect(state.entries.some(entry => entry.tabId === personal.id)).toBe(false)
    expect(state.groups.find(group => group.id === personal.groupId)).toMatchObject({ mixed: true, collapsed: false })
    await expect(m.execute({ action: 'rename', groupId: personal.groupId, title: 'Changed' })).rejects.toThrow('mixed_group')
  })

  it('rechecks live membership when a personal tab joins a group during reconciliation', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    const id = first.entries[0].groupId
    b.tabs.get(first.entries[0].tabId!)!.active = false
    const originalQuery = b.api.tabs.query.getMockImplementation()!
    let personal: Tab | undefined
    b.api.tabs.query.mockImplementation(async query => {
      if (query.groupId === id && !personal) personal = b.add({ groupId: id })
      return originalQuery(query)
    })
    const state = await m.execute({ action: 'snapshot', applyPolicy: true })
    expect(personal).toBeDefined()
    expect(state.groups[0]).toMatchObject({ mixed: true, collapsed: false })
    expect(state.entries).toHaveLength(1)
  })

  it('follows a manually moved tab and focuses its actual window without moving it back', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    const tab = b.tabs.get(first.entries[0].tabId!)!
    Object.assign(tab, { windowId: 2, groupId: -1, index: 7 })
    const state = await m.execute({ action: 'open', target: target(), windowId: 1 })
    expect(state.entries[0]).toMatchObject({ tabId: tab.id, windowId: 2, index: 7, closed: false })
    expect(b.api.tabs.move).not.toHaveBeenCalled()
    expect(b.api.windows.update).toHaveBeenLastCalledWith(2, { focused: true })
  })

  it('marks manually closed tabs closed and reopens only on explicit click with fresh target metadata', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    b.tabs.delete(first.entries[0].tabId!)
    expect((await m.execute({ action: 'snapshot' })).entries[0]).toMatchObject({ tabId: null, closed: true })
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
    const changed = { ...target(), label: 'New label', url: 'https://new.example/', groupKey: 'new' }
    const state = await m.execute({ action: 'open', target: changed, windowId: 1 })
    expect(state.entries[0]).toMatchObject({ ...changed, closed: false })
    expect(b.api.tabs.create).toHaveBeenCalledTimes(2)
  })

  it('retains ownership across worker restart', async () => {
    const b = browser()
    const first = await b.manager().execute({ action: 'open', target: target(), windowId: 1 })
    const next = await b.manager().execute({ action: 'open', target: target(), windowId: 1 })
    expect(next.entries[0].tabId).toBe(first.entries[0].tabId)
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
  })

  it('requires explicit recovery after browser restart even when a matching URL is restored', async () => {
    const b = browser()
    await b.manager().execute({ action: 'open', target: target(), windowId: 1 })
    delete b.api.storage.session.data[NETWORK_TABS_KEY]
    const restored = b.manager()
    expect((await restored.execute({ action: 'snapshot' })).entries[0]).toMatchObject({ tabId: null, recovery: true, closed: true })
    await expect(restored.execute({ action: 'open', target: target(), windowId: 1 })).rejects.toThrow('restore_required')
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
    const state = await restored.execute({ action: 'adopt', target: target(), windowId: 1 })
    expect(state.entries[0]).toMatchObject({ recovery: false, closed: false })
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
  })

  it('allows explicit reopen after browser restart without silently claiming restored tabs', async () => {
    const b = browser()
    const first = await b.manager().execute({ action: 'open', target: target(), windowId: 1 })
    delete b.api.storage.session.data[NETWORK_TABS_KEY]
    const state = await b.manager().execute({ action: 'open', target: target(), windowId: 1, reopen: true })
    expect(state.entries[0].tabId).not.toBe(first.entries[0].tabId)
    expect(b.tabs.has(first.entries[0].tabId!)).toBe(true)
  })

  it('retries a partial grouping failure without creating a second tab', async () => {
    const b = browser(), m = b.manager()
    b.api.tabs.group.mockRejectedValueOnce(new Error('temporary failure'))
    await expect(m.execute({ action: 'open', target: target(), windowId: 1 })).rejects.toThrow('temporary failure')
    const state = await m.execute({ action: 'open', target: target(), windowId: 1 })
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
    expect(state.entries[0].groupId).not.toBe(-1)
    expect(state.entries[0].pendingGroup).toBe(false)
  })

  it('retries a partial title failure after a worker restart', async () => {
    const b = browser()
    b.api.tabGroups.update.mockRejectedValueOnce(new Error('temporary title failure'))
    await expect(b.manager().execute({ action: 'open', target: target(), windowId: 1 })).rejects.toThrow('temporary title failure')
    const state = await b.manager().execute({ action: 'open', target: target(), windowId: 1 })
    expect(state.groups[0].title).toBe('social')
    expect(state.entries[0].pendingTitle).toBe(false)
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
  })

  it('reflects manual group rename, move and order and accepts panel rename', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    const id = first.entries[0].groupId
    Object.assign(b.groups.get(id)!, { title: 'Chrome name', windowId: 2 })
    Object.assign(b.tabs.get(first.entries[0].tabId!)!, { windowId: 2, index: 8 })
    const state = await m.execute({ action: 'snapshot' })
    expect(state.groups[0]).toMatchObject({ title: 'Chrome name', windowId: 2, index: 8 })
    expect((await m.execute({ action: 'rename', groupId: id, title: 'Panel name' })).entries[0].groupTitle).toBe('Panel name')
  })

  it('gathers whole managed groups preserving identities and leaves personal tabs in their windows', async () => {
    const b = browser(), m = b.manager()
    const one = await m.execute({ action: 'open', target: target(), windowId: 2 })
    const two = await m.execute({ action: 'open', target: target('two'), windowId: 3 })
    const personal = b.add({ windowId: 2 })
    const state = await m.execute({ action: 'gather', windowId: 1 })
    expect(state.groups.map(group => group.id).sort()).toEqual([one.entries[0].groupId, two.entries[1].groupId].sort())
    expect(state.entries.every(entry => entry.windowId === 1)).toBe(true)
    expect(personal.windowId).toBe(2)
    expect(b.api.tabGroups.move).toHaveBeenCalledTimes(2)
  })

  it('moves only an owned member out of a mixed group when gathering', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 2 })
    const personal = b.add({ windowId: 2, groupId: first.entries[0].groupId })
    const state = await m.execute({ action: 'gather', windowId: 1 })
    expect(state.entries[0].windowId).toBe(1)
    expect(personal).toMatchObject({ windowId: 2, groupId: first.entries[0].groupId })
    expect(b.api.tabGroups.move).not.toHaveBeenCalled()
  })

  it('transfers ownership when Chrome replaces the tab ID', async () => {
    const b = browser(), m = b.manager()
    const first = await m.execute({ action: 'open', target: target(), windowId: 1 })
    const oldId = first.entries[0].tabId!
    const replacement = b.add({ ...b.tabs.get(oldId)!, id: 999 })
    b.tabs.delete(oldId)
    await m.execute({ action: 'replace', oldId, newId: replacement.id })
    const state = await m.execute({ action: 'open', target: target(), windowId: 1 })
    expect(state.entries[0].tabId).toBe(999)
    expect(b.api.tabs.create).toHaveBeenCalledTimes(1)
  })
})
