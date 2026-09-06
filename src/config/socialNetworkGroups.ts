export type NetworkGroup = {
  id: string
  labelKey: string
  icon: string
  networkIds: readonly string[]
}

/** Catalogue categories are independent of the user's personal Bento groups. */
export const networkGroups: readonly NetworkGroup[] = [
  {
    id: 'social', labelKey: 'networkGroups.social', icon: 'pi pi-globe',
    networkIds: ['twitter', 'facebook', 'instagram', 'linkedin', 'threads', 'snapchat', 'industrysocial', 'bluesky', 'mastodon', 'nostr', 'folloverse', 'industrysocial-waitlist', 'koru'],
  },
  {
    id: 'communities', labelKey: 'networkGroups.communities', icon: 'pi pi-comments',
    networkIds: ['discord', 'reddit', 'quora', 'telegram', 'circle'],
  },
  {
    id: 'webdev', labelKey: 'networkGroups.webdev', icon: 'pi pi-code',
    networkIds: ['hackernews', 'stackoverflow', 'github-community', 'hackernoon', 'coder', 'hashnode', 'codepen', 'devto'],
  },
  {
    id: 'startups', labelKey: 'networkGroups.startups', icon: 'pi pi-megaphone',
    networkIds: ['producthunt', 'indiehackers', 'huzzler', 'uneed', 'devhunt', 'betalist'],
  },
  {
    id: 'design', labelKey: 'networkGroups.design', icon: 'pi pi-palette',
    networkIds: ['pinterest', 'dribbble', 'behance'],
  },
  {
    id: 'video', labelKey: 'networkGroups.video', icon: 'pi pi-video',
    networkIds: ['tiktok', 'cinderreels', 'kick', 'youtube'],
  },
  {
    id: 'publishing', labelKey: 'networkGroups.publishing', icon: 'pi pi-pencil',
    networkIds: ['substack', 'medium', 'beehiiv'],
  },
  {
    id: 'freelance', labelKey: 'networkGroups.freelance', icon: 'pi pi-briefcase',
    networkIds: ['freelance', 'codeur', 'utest', 'malt', 'superprof'],
  },
  {
    id: 'local', labelKey: 'networkGroups.local', icon: 'pi pi-map-marker',
    networkIds: ['nextdoor', 'couchsurfing', 'luma'],
  },
  {
    id: 'creators', labelKey: 'networkGroups.creators', icon: 'pi pi-heart',
    networkIds: ['patreon', 'ko-fi', 'buymeacoffee'],
  },
  {
    id: 'crm', labelKey: 'networkGroups.crm', icon: 'pi pi-address-book',
    networkIds: ['breakcold', 'clarkup', 'clay', 'dex'],
  },
  {
    id: 'tools', labelKey: 'networkGroups.tools', icon: 'pi pi-wrench',
    networkIds: ['theresanaiforthat'],
  },
]

const groupByNetworkId = new Map(
  networkGroups.flatMap(group => group.networkIds.map(id => [id, group.id] as const)),
)

export function getNetworkGroupId(networkId: string): string {
  return groupByNetworkId.get(networkId) ?? 'other'
}

export type GroupedNetworks<T> = Omit<NetworkGroup, 'networkIds'> & { items: T[] }

/** Preserve input ordering within each category; never discard custom items. */
export function groupNetworks<T>(
  items: readonly T[],
  getId: (item: T) => string,
): GroupedNetworks<T>[] {
  const itemsByGroup = new Map<string, T[]>()
  for (const item of items) {
    const id = getNetworkGroupId(getId(item))
    const grouped = itemsByGroup.get(id) ?? []
    grouped.push(item)
    itemsByGroup.set(id, grouped)
  }

  return [
    ...networkGroups,
    { id: 'other', labelKey: 'networkGroups.other', icon: 'pi pi-link' },
  ].flatMap(({ id, labelKey, icon }) => {
    const grouped = itemsByGroup.get(id)
    return grouped?.length ? [{ id, labelKey, icon, items: grouped }] : []
  })
}

export type NetworkGroupSelection = 'all' | 'some' | 'none'

export function networkGroupSelection(
  ids: readonly string[],
  selectedIds: readonly string[],
): NetworkGroupSelection {
  if (ids.length === 0) return 'none'
  const selected = new Set(selectedIds)
  if (ids.every(id => selected.has(id))) return 'all'
  return ids.some(id => selected.has(id)) ? 'some' : 'none'
}

/** A partial selection becomes complete; clicking a complete group removes it. */
export function toggleNetworkGroupSelection(
  ids: readonly string[],
  selectedIds: readonly string[],
): string[] {
  if (networkGroupSelection(ids, selectedIds) === 'all') {
    const groupIds = new Set(ids)
    return selectedIds.filter(id => !groupIds.has(id))
  }
  return [...new Set([...selectedIds, ...ids])]
}
