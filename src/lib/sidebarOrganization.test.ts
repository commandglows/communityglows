import { describe, expect, it } from 'vitest'
import { sidebarChildren, moveSidebarGroupAtItem, canNestSidebarGroup, nestSidebarGroup, sidebarGroupAncestors, duplicateSidebarNetwork, dissolveSidebarGroup, moveSidebarGroup, moveSidebarItem, normalizeSidebarOrganization, organizeSidebarItems, sidebarItemGroup } from './sidebarOrganization'

describe('sidebar hierarchy', () => {
  const initial = () => normalizeSidebarOrganization({ customGroups: ['personal:a', 'personal:b', 'personal:c', 'personal:d'] })
  it('limits the whole moved subtree to three levels and prevents cycles', () => {
    let state = nestSidebarGroup(initial(), 'personal:b', 'personal:a')
    state = nestSidebarGroup(state, 'personal:c', 'personal:b')
    expect(sidebarGroupAncestors(state, 'personal:c')).toEqual(['personal:b', 'personal:a'])
    expect(canNestSidebarGroup(state, 'personal:d', 'personal:c')).toBe(false)
    expect(canNestSidebarGroup(state, 'personal:a', 'personal:d')).toBe(false)
    expect(canNestSidebarGroup(state, 'personal:a', 'personal:c')).toBe(false)
    expect(nestSidebarGroup(state, 'personal:a', 'personal:c')).toBe(state)
    expect(normalizeSidebarOrganization(JSON.parse(JSON.stringify(state)))).toEqual(state)
  })
  it('dissolves into the parent and retains children and all items', () => {
    let state = nestSidebarGroup(initial(), 'personal:b', 'personal:a')
    state = nestSidebarGroup(state, 'personal:c', 'personal:b')
    state = moveSidebarItem(state, 'twitter', 'personal:b', ['twitter'])
    state = dissolveSidebarGroup(state, 'personal:b', ['twitter'])
    expect(state.parents['personal:c']).toBe('personal:a')
    expect(sidebarItemGroup(state, 'twitter')).toBe('personal:a')
    state = dissolveSidebarGroup(state, 'personal:a', ['twitter'])
    expect(state.parents['personal:c']).toBeUndefined()
    expect(sidebarItemGroup(state, 'twitter')).toBe('other')
  })
  it('repairs invalid saved ancestry without dropping items or groups', () => {
    const state = normalizeSidebarOrganization({ ...initial(), parents: { 'personal:a': 'personal:b', 'personal:b': 'personal:a', 'personal:c': 'missing', other: 'personal:a' } })
    expect(sidebarGroupAncestors(state, 'personal:a')).toEqual(['personal:b'])
    expect(state.parents['personal:b']).toBeUndefined()
    expect(state.parents['personal:c']).toBeUndefined()
    expect(organizeSidebarItems(['tasks'], id => id, state).flatMap(group => group.items)).toEqual(['tasks'])
  })
  it('moves a subtree to a sibling position and keeps preorder contiguous', () => {
    let state = nestSidebarGroup(initial(), 'personal:b', 'personal:a')
    state = nestSidebarGroup(state, 'personal:c', 'personal:b')
    state = moveSidebarGroup(state, 'personal:b', 'personal:d', true)
    expect(state.parents['personal:b']).toBeUndefined()
    expect(state.parents['personal:c']).toBe('personal:b')
    const order = organizeSidebarItems([], String, state).map(group => group.id)
    expect(order.slice(order.indexOf('personal:d'), order.indexOf('personal:d') + 3)).toEqual(['personal:d', 'personal:b', 'personal:c'])
  })
})

describe('personal sidebar organization', () => {
  const ids = ['twitter', 'facebook', 'discord', 'custom-site', 'tasks']
  it('migrates names and dissolved categories without losing custom items', () => {
    const state = normalizeSidebarOrganization({ names: { social: 'Clients' }, removed: ['communities'] })
    const groups = organizeSidebarItems(ids, id => id, state)
    expect(state.names.social).toBe('Clients')
    expect(groups.find(group => group.id === 'other')?.items).toEqual(['discord', 'custom-site', 'tasks'])
    expect(groups.flatMap(group => group.items).sort()).toEqual([...ids].sort())
  })
  it('joins, reorders and ungroups without duplicates after repeated moves', () => {
    let state = normalizeSidebarOrganization(null)
    state = moveSidebarItem(state, 'discord', 'social', ids, 'facebook')
    state = moveSidebarItem(state, 'twitter', 'social', ids, 'facebook', true)
    expect(organizeSidebarItems(ids, id => id, state).find(group => group.id === 'social')?.items).toEqual(['discord', 'facebook', 'twitter'])
    state = moveSidebarItem(state, 'discord', 'other', ids)
    state = moveSidebarItem(state, 'discord', 'other', ids)
    expect(organizeSidebarItems(ids, id => id, state).flatMap(group => group.items)).toHaveLength(ids.length)
    expect(sidebarItemGroup(state, 'discord')).toBe('other')
  })
  it('preserves hidden members during reorder and incorporates new catalogue items', () => {
    const state = moveSidebarItem(normalizeSidebarOrganization(null), 'facebook', 'social', ids, 'twitter')
    expect(organizeSidebarItems(['twitter'], id => id, state).find(group => group.id === 'social')?.items).toEqual(['twitter'])
    expect(organizeSidebarItems([...ids, 'instagram'], id => id, state).find(group => group.id === 'social')?.items).toEqual(['facebook', 'twitter', 'instagram'])
  })
  it('retains empty personal destinations and safely dissolves the last member', () => {
    let state = normalizeSidebarOrganization({ customGroups: ['personal:one'], names: { 'personal:one': 'Travail' } })
    expect(organizeSidebarItems(ids, id => id, state).find(group => group.id === 'personal:one')?.items).toEqual([])
    state = moveSidebarItem(state, 'twitter', 'personal:one', ids)
    state = dissolveSidebarGroup(state, 'personal:one', ids)
    expect(sidebarItemGroup(state, 'twitter')).toBe('other')
    expect(state.customGroups).toEqual([])
  })
  it('roundtrips group order and keeps the original profile value untouched', () => {
    const first = normalizeSidebarOrganization(null)
    const next = moveSidebarGroup(first, 'crm', 'social')
    const restored = normalizeSidebarOrganization(JSON.parse(JSON.stringify(next)))
    expect(organizeSidebarItems(ids, id => id, restored)[0].id).toBe('crm')
    expect(first.groupOrder).toEqual([])
  })
  it('rejects malformed preferences and invalid or stale drop targets', () => {
    const state = normalizeSidebarOrganization({ names: [], customGroups: [3, 'social'], membership: { twitter: 'missing' }, itemOrder: ['twitter', 'twitter'] })
    expect(state.customGroups).toEqual([])
    expect(state.itemOrder).toEqual(['twitter'])
    expect(sidebarItemGroup(state, 'twitter')).toBe('other')
    expect(moveSidebarItem(state, 'twitter', 'missing', ids)).toBe(state)
    expect(moveSidebarItem(state, 'twitter', 'social', ids, 'discord')).toBe(state)
    expect(moveSidebarGroup(state, 'social', 'other')).toBe(state)
  })
})


describe('duplicate network shortcuts', () => {
  it('inserts independent copies after their source with canonical identity and stable persistence', () => {
    const original = normalizeSidebarOrganization(null)
    const first = duplicateSidebarNetwork(original, 'twitter', 'first', ['twitter', 'facebook'])
    const second = duplicateSidebarNetwork(first, 'copy:first', 'second', ['twitter', 'copy:first', 'facebook'])
    const restored = normalizeSidebarOrganization(JSON.parse(JSON.stringify(second)))
    expect(restored.copies).toEqual({ 'copy:first': 'twitter', 'copy:second': 'twitter' })
    expect(organizeSidebarItems(['twitter', 'facebook', 'copy:first', 'copy:second'], id => id, restored).find(group => group.id === 'social')?.items).toEqual(['twitter', 'copy:first', 'copy:second', 'facebook'])
    expect(original.copies).toEqual({})
  })
  it('rejects malformed copy identities and non-network targets', () => {
    const state = normalizeSidebarOrganization(null)
    expect(duplicateSidebarNetwork(state, 'tasks', 'valid', ['tasks'])).toBe(state)
    expect(duplicateSidebarNetwork(state, 'twitter', '../bad', ['twitter'])).toBe(state)
    expect(normalizeSidebarOrganization({copies:{'copy:../bad':'twitter','copy:ok':'tasks'}}).copies).toEqual({})
  })
})

describe('mixed tab and group positions', () => {
  const ids = ['twitter', 'facebook', 'instagram']
  it('persists an exact insertion boundary and supports moving in either direction', () => {
    let state = normalizeSidebarOrganization({ customGroups: ['personal:a'] })
    state = moveSidebarGroupAtItem(state, 'personal:a', 'twitter', ids, true)
    expect(sidebarChildren(state, 'social', ids)).toEqual(['i:twitter', 'g:personal:a', 'i:facebook', 'i:instagram'])
    state = normalizeSidebarOrganization(JSON.parse(JSON.stringify(state)))
    state = moveSidebarGroupAtItem(state, 'personal:a', 'instagram', ids, true)
    expect(sidebarChildren(state, 'social', ids)).toEqual(['i:twitter', 'i:facebook', 'i:instagram', 'g:personal:a'])
    state = moveSidebarGroupAtItem(state, 'personal:a', 'twitter', ids)
    expect(sidebarChildren(state, 'social', ids)).toEqual(['g:personal:a', 'i:twitter', 'i:facebook', 'i:instagram'])
  })
  it('keeps subtree membership and refuses insertion into its own descendant', () => {
    let state = normalizeSidebarOrganization({ customGroups: ['personal:a', 'personal:b'], parents: { 'personal:b': 'personal:a' }, membership: { instagram: 'personal:b' } })
    state = moveSidebarGroupAtItem(state, 'personal:a', 'twitter', ids, true)
    expect(state.parents['personal:b']).toBe('personal:a')
    expect(moveSidebarGroupAtItem(state, 'personal:a', 'instagram', ids)).toBe(state)
    expect(sidebarChildren(state, 'social', ids)).toEqual(['i:twitter', 'g:personal:a', 'i:facebook'])
  })
})