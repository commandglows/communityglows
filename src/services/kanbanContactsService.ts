import { builtInSocialNetworks } from '@/config/socialNetworks'
import { inferNetworkId, sanitizeContextualUrl } from './contextualTasksService'

export interface KanbanContactProfileLink {
  id: string
  networkId: string
  url: string
}

export interface KanbanContact {
  id: string
  name: string
  url?: string
  avatarUrl?: string
  profileLinks: KanbanContactProfileLink[]
  note: string
  nextFollowUp?: string
  pinned?: boolean
  createdAt: string
  updatedAt: string
}
export type KanbanContactProfileLinkInput = Partial<Pick<KanbanContactProfileLink, 'id'>> & Pick<KanbanContactProfileLink, 'networkId' | 'url'>
export type KanbanContactInput = Pick<KanbanContact, 'name'> & Partial<Pick<KanbanContact, 'url' | 'avatarUrl' | 'note' | 'nextFollowUp' | 'pinned'> & { profileLinks: KanbanContactProfileLinkInput[] }>

const knownNetworkIds = new Set(builtInSocialNetworks.map(network => network.id))
const invalidProfileLinkError = 'invalid_profile_link'

type ProfileHandleBuilder = (handle: string) => string

function cleanProfileHandle(input: string, options: { allowInstance?: boolean } = {}) {
  const handle = input.trim().replace(/^@+/, '').replace(/^\/+/, '').replace(/\/+$/, '')
  if (!handle
    || /\s/.test(handle)
    || handle.includes('?')
    || handle.includes('#')
    || (!options.allowInstance && handle.includes('@'))) throw new Error(invalidProfileLinkError)
  return handle
}

function pathHandle(input: string) {
  return encodeURIComponent(cleanProfileHandle(input))
}

const profileHandleBuilders: Partial<Record<string, ProfileHandleBuilder>> = {
  twitter: handle => `https://x.com/${pathHandle(handle)}`,
  facebook: handle => `https://www.facebook.com/${pathHandle(handle)}`,
  instagram: handle => `https://www.instagram.com/${pathHandle(handle)}`,
  linkedin: handle => `https://www.linkedin.com/in/${pathHandle(handle)}`,
  tiktok: handle => `https://www.tiktok.com/@${pathHandle(handle)}`,
  threads: handle => `https://www.threads.net/@${pathHandle(handle)}`,
  reddit: handle => `https://www.reddit.com/user/${pathHandle(handle)}`,
  snapchat: handle => `https://www.snapchat.com/add/${pathHandle(handle)}`,
  quora: handle => `https://www.quora.com/profile/${pathHandle(handle)}`,
  pinterest: handle => `https://www.pinterest.com/${pathHandle(handle)}`,
  telegram: handle => `https://t.me/${pathHandle(handle)}`,
  patreon: handle => `https://www.patreon.com/${pathHandle(handle)}`,
  bluesky: handle => {
    const cleanHandle = cleanProfileHandle(handle)
    const blueskyHandle = cleanHandle.includes('.') ? cleanHandle : `${cleanHandle}.bsky.social`
    return `https://bsky.app/profile/${encodeURIComponent(blueskyHandle)}`
  },
  mastodon: handle => {
    const cleanHandle = cleanProfileHandle(handle, { allowInstance: true })
    const [user, instance, ...rest] = cleanHandle.split('@')
    if (!user || !instance || rest.length) throw new Error(invalidProfileLinkError)
    return `https://${instance}/@${encodeURIComponent(user)}`
  },
  substack: handle => `https://${pathHandle(handle)}.substack.com`,
  'ko-fi': handle => `https://ko-fi.com/${pathHandle(handle)}`,
  buymeacoffee: handle => `https://www.buymeacoffee.com/${pathHandle(handle)}`,
  producthunt: handle => `https://www.producthunt.com/@${pathHandle(handle)}`,
  indiehackers: handle => `https://www.indiehackers.com/${pathHandle(handle)}`,
  hackernews: handle => `https://news.ycombinator.com/user?id=${encodeURIComponent(cleanProfileHandle(handle))}`,
  kick: handle => `https://kick.com/${pathHandle(handle)}`,
  medium: handle => `https://medium.com/@${pathHandle(handle)}`,
  youtube: handle => `https://www.youtube.com/@${pathHandle(handle)}`,
  hashnode: handle => `https://hashnode.com/@${pathHandle(handle)}`,
  dribbble: handle => `https://dribbble.com/${pathHandle(handle)}`,
  behance: handle => `https://www.behance.net/${pathHandle(handle)}`,
  codepen: handle => `https://codepen.io/${pathHandle(handle)}`,
  devto: handle => `https://dev.to/${pathHandle(handle)}`,
}

function hasExplicitUrlShape(input: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(input) || input.includes('/')
}

function isHandleCandidate(input: string) {
  const trimmed = input.trim()
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) || trimmed.includes(':')) return false
  try {
    const handle = cleanProfileHandle(trimmed, { allowInstance: true })
    return trimmed === handle
      || trimmed === `@${handle}`
      || trimmed === `/${handle}/`
      || trimmed === `/${handle}`
  } catch {
    return false
  }
}

function sanitizeProfileLink(networkId: string, rawInput: string) {
  const input = rawInput.trim()
  const builder = profileHandleBuilders[networkId]
  const canBuildFromHandle = builder && isHandleCandidate(input)
  const source = canBuildFromHandle
    ? builder(input)
    : input
  if (!hasExplicitUrlShape(input) && !builder && !input.includes('.')) throw new Error(invalidProfileLinkError)
  const url = sanitizeContextualUrl(source)
  if (!url.ok) throw new Error(url.code)
  return url.url
}

function fallbackNetworkId(url: string) {
  try {
    const parsed = new URL(url)
    return inferNetworkId(parsed.host) ?? builtInSocialNetworks[0]?.id ?? 'twitter'
  } catch {
    return builtInSocialNetworks[0]?.id ?? 'twitter'
  }
}

function normalizeProfileLinks(input: KanbanContactInput) {
  const candidates = input.profileLinks?.length
    ? input.profileLinks
    : input.url?.trim()
      ? [{ networkId: fallbackNetworkId(input.url), url: input.url }]
      : []
  const links: KanbanContactProfileLink[] = []
  for (const candidate of candidates) {
    const rawUrl = candidate.url?.trim()
    if (!rawUrl) continue
    const initialNetworkId = knownNetworkIds.has(candidate.networkId) ? candidate.networkId : fallbackNetworkId(rawUrl)
    const normalizedUrl = sanitizeProfileLink(initialNetworkId, rawUrl)
    const networkId = knownNetworkIds.has(candidate.networkId) ? candidate.networkId : fallbackNetworkId(normalizedUrl)
    if (links.some(link => link.networkId === networkId && link.url === normalizedUrl)) continue
    links.push({
      id: candidate.id?.trim() || `profile-link-${crypto.randomUUID()}`,
      networkId,
      url: normalizedUrl,
    })
  }
  return links.slice(0, 20)
}

function normalize(input: KanbanContactInput) {
  const name = input.name.trim().slice(0, 120)
  if (!name) throw new Error('name_required')
  const avatarUrl = input.avatarUrl?.trim() ? sanitizeContextualUrl(input.avatarUrl) : undefined
  if (avatarUrl && !avatarUrl.ok) throw new Error(avatarUrl.code)
  const profileLinks = normalizeProfileLinks(input)
  const nextFollowUp = input.nextFollowUp?.trim() || undefined
  if (nextFollowUp && (!/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUp)
    || !Number.isFinite(Date.parse(nextFollowUp))
    || new Date(nextFollowUp).toISOString().slice(0, 10) !== nextFollowUp)) throw new Error('invalid_follow_up_date')
  return {
    name,
    url: profileLinks[0]?.url,
    avatarUrl: avatarUrl?.ok ? avatarUrl.url : undefined,
    profileLinks,
    note: (input.note ?? '').trim().slice(0, 4000),
    nextFollowUp,
    pinned: input.pinned === true || undefined,
  }
}

export class KanbanContactsService {
  private contacts: KanbanContact[] = []
  constructor(private readonly storageKey = 'communityglows.kanban-contacts.v1') {}
  getContacts() { return this.contacts.map(contact => ({ ...contact })) }
  serializeState() { return JSON.stringify(this.contacts) }
  private parse(value: unknown): KanbanContact[] {
    if (!Array.isArray(value)) throw new Error('invalid_contacts_state')
    const ids = new Set<string>()
    return value.map(contact => {
      if (!contact || typeof contact !== 'object' || typeof contact.id !== 'string' || !contact.id
        || ids.has(contact.id) || typeof contact.name !== 'string' || typeof contact.note !== 'string'
        || (contact.url !== undefined && typeof contact.url !== 'string')
        || (contact.avatarUrl !== undefined && typeof contact.avatarUrl !== 'string')
        || (contact.profileLinks !== undefined && (!Array.isArray(contact.profileLinks) || contact.profileLinks.some((link: unknown) => {
          const value = link as Record<string, unknown> | null
          return !value
            || typeof value !== 'object'
            || typeof value.id !== 'string'
            || typeof value.networkId !== 'string'
            || typeof value.url !== 'string'
        })))
        || (contact.nextFollowUp !== undefined && typeof contact.nextFollowUp !== 'string')
        || (contact.pinned !== undefined && typeof contact.pinned !== 'boolean')
        || typeof contact.createdAt !== 'string' || !Number.isFinite(Date.parse(contact.createdAt))
        || typeof contact.updatedAt !== 'string' || !Number.isFinite(Date.parse(contact.updatedAt))) throw new Error('invalid_contacts_state')
      ids.add(contact.id)
      return { id: contact.id, ...normalize(contact), createdAt: contact.createdAt, updatedAt: contact.updatedAt }
    })
  }
  loadState() {
    const raw = localStorage.getItem(this.storageKey)
    this.contacts = raw ? this.parse(JSON.parse(raw)) : []
  }
  private commit(contacts: KanbanContact[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(contacts))
    this.contacts = contacts
  }
  replaceState(value: unknown) { this.commit(this.parse(value)) }
  add(input: KanbanContactInput) {
    const timestamp = new Date().toISOString()
    const contact = { ...normalize(input), id: `contact-${crypto.randomUUID()}`, createdAt: timestamp, updatedAt: timestamp }
    this.commit([...this.contacts, contact])
    return { ...contact }
  }
  update(id: string, patch: Partial<KanbanContactInput>) {
    const current = this.contacts.find(contact => contact.id === id)
    if (!current) throw new Error('contact_not_found')
    const contact = { ...current, ...normalize({ ...current, ...patch }), updatedAt: new Date().toISOString() }
    this.commit(this.contacts.map(item => item.id === id ? contact : item))
  }
  remove(id: string) { this.commit(this.contacts.filter(contact => contact.id !== id)) }
}
