import { getNetworkGroupId, networkGroups, type GroupedNetworks } from '@/config/socialNetworkGroups'

export interface SidebarOrganization {
  names: Record<string, string>
  removed: string[]
  customGroups: string[]
  groupOrder: string[]
  itemOrder: string[]
  membership: Record<string, string>
  copies: Record<string, string>
  parents: Record<string, string>
  treeOrder: string[]
}

const strings = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 160))]
  : []
const record = (value: unknown): Record<string, string> => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).filter(([key, entry]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype' && typeof entry === 'string' && entry.length <= 160))
  : {}

/** v1 names/removed remain compatible; new fields only customize the sidebar. */
export function normalizeSidebarOrganization(value: unknown): SidebarOrganization {
  const saved = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const state: SidebarOrganization = {
    names: record(saved.names), removed: strings(saved.removed),
    customGroups: strings(saved.customGroups).filter(id => id.startsWith('personal:')),
    groupOrder: strings(saved.groupOrder), itemOrder: strings(saved.itemOrder),
    membership: record(saved.membership),
    parents: {},
    treeOrder: strings(saved.treeOrder),
    copies: Object.fromEntries(Object.entries(record(saved.copies)).filter(([id, source]) => /^copy:[A-Za-z0-9_-]{1,64}$/.test(id) && source !== 'tasks' && !source.startsWith('bento-scene:') && !source.startsWith('copy:'))),
  }
  for (const [id, parent] of Object.entries(record(saved.parents))) {
    if (canNestSidebarGroup(state, id, parent)) state.parents[id] = parent
  }
  return state
}

export const MAX_SIDEBAR_GROUP_DEPTH = 3
const groupNode = (id: string) => `g:${id}`
const itemNode = (id: string) => `i:${id}`
/** Direct children share one order: groups and tabs can occupy the same boundary. */
export function sidebarChildren(state: SidebarOrganization, parent: string, allIds: readonly string[]): string[] {
  const groups = sidebarGroupIds(state).filter(id => id !== 'other' && (state.parents[id] ?? '') === parent).map(groupNode)
  const items = [...new Set([...state.itemOrder, ...allIds])].filter(id => allIds.includes(id) && sidebarItemGroup(state, id) === (parent || 'other')).map(itemNode)
  const defaults = parent ? [...items, ...groups] : [...groups, ...items]
  const known = new Set(defaults)
  return [...state.treeOrder.filter(id => known.has(id)), ...defaults.filter(id => !state.treeOrder.includes(id))]
}
function initializeTreeOrder(state: SidebarOrganization, allIds: readonly string[]) {
  const visit = (parent: string): string[] => sidebarChildren(state, parent, allIds).flatMap(node => node.startsWith('g:') ? [node, ...visit(node.slice(2))] : [node])
  return visit('')
}
function positionNode(state: SidebarOrganization, node: string, anchor?: string, after = false) {
  state.treeOrder = state.treeOrder.filter(id => id !== node)
  const index = anchor ? state.treeOrder.indexOf(anchor) : -1
  state.treeOrder.splice(index < 0 ? state.treeOrder.length : index + (after ? 1 : 0), 0, node)
}
export function moveSidebarGroupAtItem(state: SidebarOrganization, id: string, anchor: string, allIds: readonly string[], after = false): SidebarOrganization {
  if (!allIds.includes(anchor)) return state
  const group = sidebarItemGroup(state, anchor)
  const parent = group === 'other' ? '' : group
  if (!canNestSidebarGroup(state, id, parent)) return state
  const next = normalizeSidebarOrganization(state)
  next.treeOrder = initializeTreeOrder(state, allIds)
  if (parent) next.parents[id] = parent
  else delete next.parents[id]
  positionNode(next, groupNode(id), itemNode(anchor), after)
  return next
}
export function sidebarGroupAncestors(state: SidebarOrganization, id: string): string[] {
  const ancestors: string[] = []
  let parent = state.parents[id]
  while (parent && !ancestors.includes(parent) && parent !== id) {
    ancestors.push(parent)
    parent = state.parents[parent]
  }
  return ancestors
}
export function canNestSidebarGroup(state: SidebarOrganization, id: string, parent = ''): boolean {
  const ids = sidebarGroupIds(state).filter(group => group !== 'other')
  if (!ids.includes(id) || (parent && !ids.includes(parent)) || id === parent) return false
  if (parent && sidebarGroupAncestors(state, parent).includes(id)) return false
  const subtreeHeight = Math.max(1, ...ids.map(child => {
    const ancestors = sidebarGroupAncestors(state, child)
    return ancestors.includes(id) ? ancestors.indexOf(id) + 2 : 1
  }))
  return (parent ? sidebarGroupAncestors(state, parent).length + 1 : 0) + subtreeHeight <= MAX_SIDEBAR_GROUP_DEPTH
}
export function nestSidebarGroup(state: SidebarOrganization, id: string, parent = ''): SidebarOrganization {
  if (!canNestSidebarGroup(state, id, parent)) return state
  const next = normalizeSidebarOrganization(state)
  if (parent) next.parents[id] = parent
  else delete next.parents[id]
  if (next.treeOrder.length) positionNode(next, groupNode(id))
  return next
}

/** A copy has its own sidebar identity but resolves to the same canonical network. */
export function duplicateSidebarNetwork(state: SidebarOrganization, sourceId: string, instanceId: string, allIds: readonly string[]): SidebarOrganization {
  if (!allIds.includes(sourceId) || sourceId === 'tasks' || sourceId.startsWith('bento-scene:') || !/^[A-Za-z0-9_-]{1,64}$/.test(instanceId)) return state
  const id = `copy:${instanceId}`
  if (allIds.includes(id)) return state
  const next = normalizeSidebarOrganization(state)
  next.treeOrder = initializeTreeOrder(state, allIds)
  next.copies[id] = state.copies[sourceId] ?? sourceId
  return moveSidebarItem(next, id, sidebarItemGroup(state, sourceId), [...allIds, id], sourceId, true)
}

export function sidebarGroupIds(state: SidebarOrganization): string[] {
  const ids = [...networkGroups.map(group => group.id), ...state.customGroups]
    .filter(id => !state.removed.includes(id))
  const known = new Set(ids)
  return [...state.groupOrder.filter(id => known.has(id)), ...ids.filter(id => !state.groupOrder.includes(id)), 'other']
}

export function sidebarItemGroup(state: SidebarOrganization, id: string): string {
  const requested = state.membership[id] ?? getNetworkGroupId(id)
  return sidebarGroupIds(state).includes(requested) ? requested : 'other'
}

export function organizeSidebarItems<T>(items: readonly T[], getId: (item: T) => string, state: SidebarOrganization): GroupedNetworks<T>[] {
  const byId = new Map(items.map(item => [getId(item), item]))
  const ordered = [...state.itemOrder.filter(id => byId.has(id)), ...byId.keys()].filter((id, index, all) => all.indexOf(id) === index)
  const ids = sidebarGroupIds(state)
  const visit = (parent: string): string[] => ids.filter(id => id !== 'other' && (state.parents[id] ?? '') === parent).flatMap(id => [id, ...visit(id)])
  return [...visit(''), 'other'].map(id => {
    const category = networkGroups.find(group => group.id === id)
    return {
      id, labelKey: category?.labelKey ?? (id === 'other' ? 'sidebar.organization.ungrouped' : 'sidebar.organization.new_group'),
      icon: category?.icon ?? 'pi pi-folder',
      items: ordered.filter(itemId => sidebarItemGroup(state, itemId) === id).map(itemId => byId.get(itemId)!),
    }
  })
}

export function moveSidebarItem(state: SidebarOrganization, id: string, groupId: string, allIds: readonly string[], anchor?: string, after = false): SidebarOrganization {
  if (!allIds.includes(id) || !sidebarGroupIds(state).includes(groupId) || anchor === id) return state
  if (anchor && (!allIds.includes(anchor) || sidebarItemGroup(state, anchor) !== groupId)) return state
  const next = normalizeSidebarOrganization(state)
  next.treeOrder = initializeTreeOrder(state, allIds)
  const order = [...new Set([...next.itemOrder, ...allIds])].filter(item => item !== id)
  const index = anchor ? order.indexOf(anchor) + (after ? 1 : 0) : order.length
  order.splice(index, 0, id)
  next.itemOrder = order
  next.membership[id] = groupId
  positionNode(next, itemNode(id), anchor ? itemNode(anchor) : undefined, after)
  return next
}

export function moveSidebarGroup(state: SidebarOrganization, id: string, anchor: string, after = false): SidebarOrganization {
  const groups = sidebarGroupIds(state).filter(group => group !== 'other')
  if (id === anchor || !groups.includes(id) || !groups.includes(anchor)) return state
  const parent = state.parents[anchor] ?? ''
  if (!canNestSidebarGroup(state, id, parent)) return state
  const next = nestSidebarGroup(state, id, parent)
  next.groupOrder = groups.filter(group => group !== id)
  next.groupOrder.splice(next.groupOrder.indexOf(anchor) + (after ? 1 : 0), 0, id)
  if (next.treeOrder.length) positionNode(next, groupNode(id), groupNode(anchor), after)
  return next
}

export function dissolveSidebarGroup(state: SidebarOrganization, id: string, allIds: readonly string[]): SidebarOrganization {
  if (id === 'other' || !sidebarGroupIds(state).includes(id)) return state
  const next = normalizeSidebarOrganization(state)
  const parent = state.parents[id]
  for (const item of allIds) if (sidebarItemGroup(state, item) === id) next.membership[item] = parent ?? 'other'
  for (const child of sidebarGroupIds(state)) if (state.parents[child] === id) {
    if (parent) next.parents[child] = parent
    else delete next.parents[child]
  }
  delete next.parents[id]
  next.removed = [...new Set([...next.removed, id])]
  next.customGroups = next.customGroups.filter(group => group !== id)
  next.groupOrder = next.groupOrder.filter(group => group !== id)
  delete next.names[id]
  return next
}
