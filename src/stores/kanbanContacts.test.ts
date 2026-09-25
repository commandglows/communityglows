import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
vi.mock('@/lib/cloudSyncQueue', () => ({ enqueueKanbanContactsSnapshot: vi.fn(), enqueueContextualTasksSnapshot: vi.fn(), flushCloudSyncQueue: vi.fn(async () => {}) }))
import { enqueueKanbanContactsSnapshot, enqueueContextualTasksSnapshot } from '@/lib/cloudSyncQueue'
import { useKanbanContactsStore, useLocalKanbanContactsStore } from './kanbanContacts'
import { useContextualTasksStore, useLocalTasksStore } from './contextualTasks'

describe('Kanban contacts and card associations', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
    setActivePinia(createPinia()); vi.clearAllMocks()
  })
  it('persists stable contacts and linked cards locally without cloud writes or legacy person conversion', () => {
    const contacts = useLocalKanbanContactsStore()
    const contact = contacts.create({
      name: 'Alex',
      avatarUrl: 'https://example.com/avatar.png#preview',
      profileLinks: [
        { networkId: 'twitter', url: 'https://x.com/alex?token=private' },
        { networkId: 'linkedin', url: 'https://www.linkedin.com/in/alex#about' },
      ],
      note: 'Met today',
      nextFollowUp: '2026-09-09',
      pinned: true,
    })!
    const cards = useLocalTasksStore(); cards.initialize()
    const card = cards.create({ title: 'Follow up', contactIds: [contact.id, contact.id], people: [{ name: 'Alex' }] })!
    contacts.update(contact.id, { name: 'Alex Renamed' })
    setActivePinia(createPinia())
    const restored = useLocalKanbanContactsStore(); restored.initialize()
    const restoredCards = useLocalTasksStore(); restoredCards.initialize()
    expect(restored.contacts[0]).toMatchObject({
      id: contact.id,
      name: 'Alex Renamed',
      url: 'https://x.com/alex',
      avatarUrl: 'https://example.com/avatar.png',
      nextFollowUp: '2026-09-09',
      pinned: true,
    })
    expect(restored.contacts[0].profileLinks).toMatchObject([
      { networkId: 'twitter', url: 'https://x.com/alex' },
      { networkId: 'linkedin', url: 'https://www.linkedin.com/in/alex' },
    ])
    expect(restoredCards.tasks[0]).toMatchObject({ id: card.id, contactIds: [contact.id], people: [{ name: 'Alex' }] })
    expect(enqueueKanbanContactsSnapshot).not.toHaveBeenCalled()
    expect(enqueueContextualTasksSnapshot).not.toHaveBeenCalled()
  })
  it('copies contacts before cards idempotently and preserves guests across account reset', () => {
    const guest = useLocalKanbanContactsStore(); const contact = guest.create({ name: 'Same name', note: '' })!
    guest.create({ name: 'Same name', note: 'A different person' })
    const guestCards = useLocalTasksStore(); guestCards.initialize(); guestCards.create({ title: 'Local', contactIds: [contact.id] })
    const account = useKanbanContactsStore(); account.initialize(); expect(account.contacts).toEqual([])
    const accountCards = useContextualTasksStore(); accountCards.initialize()
    expect(account.importLocalContacts(guest.contacts)).toBe(true)
    expect(accountCards.importLocalTasks(guestCards.tasks)).toBe(true)
    account.importLocalContacts(guest.contacts)
    expect(account.contacts).toHaveLength(2)
    expect(accountCards.tasks[0].contactIds).toEqual([contact.id])
    expect(enqueueKanbanContactsSnapshot).toHaveBeenCalled()
    account.clearLocal(); accountCards.clearLocal()
    expect(guest.contacts).toHaveLength(2); expect(guestCards.tasks).toHaveLength(1)
    account.replaceFromCloud('[]'); expect(account.contacts).toEqual([])
  })
  it('rejects invalid inputs and recovers without losing valid contacts', () => {
    const contacts = useLocalKanbanContactsStore()
    expect(contacts.create({ name: '', note: '' })).toBeNull()
    const contact = contacts.create({ name: 'Alex', note: '' })!
    expect(contacts.update(contact.id, { nextFollowUp: '2026-02-30' })).toBe(false)
    expect(contacts.update(contact.id, { url: 'javascript:alert(1)' })).toBe(false)
    expect(contacts.update(contact.id, { avatarUrl: 'http://example.com/avatar.png' })).toBe(false)
    expect(contacts.update(contact.id, { nextFollowUp: '2026-09-09' })).toBe(true)
    expect(contacts.replaceFromCloud('[{}]')).toBe(false)
    expect(contacts.contacts[0].id).toBe(contact.id)
    expect(contacts.update(contact.id, { nextFollowUp: '', url: '' })).toBe(true)
    expect(contacts.contacts[0].nextFollowUp).toBeUndefined()
  })
  it('migrates a legacy single profile URL into profile links', () => {
    localStorage.setItem('communityglows.guest-kanban-contacts.v1', JSON.stringify([{
      id: 'contact-legacy',
      name: 'Legacy',
      url: 'https://instagram.com/legacy?token=secret',
      note: '',
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-10T10:00:00.000Z',
    }]))
    const contacts = useLocalKanbanContactsStore(); contacts.initialize()
    expect(contacts.contacts[0]).toMatchObject({ url: 'https://instagram.com/legacy' })
    expect(contacts.contacts[0].profileLinks).toMatchObject([{ networkId: 'instagram', url: 'https://instagram.com/legacy' }])
  })
  it('expands supported profile handles into network URLs', () => {
    const contacts = useLocalKanbanContactsStore()
    const contact = contacts.create({
      name: 'Handles',
      profileLinks: [
        { networkId: 'instagram', url: '@diane' },
        { networkId: 'tiktok', url: 'diane' },
        { networkId: 'linkedin', url: '/in-diane/' },
        { networkId: 'bluesky', url: 'diane' },
      ],
    })!
    expect(contact.profileLinks).toMatchObject([
      { networkId: 'instagram', url: 'https://www.instagram.com/diane' },
      { networkId: 'tiktok', url: 'https://www.tiktok.com/@diane' },
      { networkId: 'linkedin', url: 'https://www.linkedin.com/in/in-diane' },
      { networkId: 'bluesky', url: 'https://bsky.app/profile/diane.bsky.social' },
    ])
  })
  it('keeps full profile URLs accepted and refuses ambiguous bare handles', () => {
    const contacts = useLocalKanbanContactsStore()
    const contact = contacts.create({ name: 'Full URL', profileLinks: [{ networkId: 'discord', url: 'https://discord.com/users/123' }] })!
    expect(contact.profileLinks).toMatchObject([{ networkId: 'discord', url: 'https://discord.com/users/123' }])
    expect(contacts.create({ name: 'Ambiguous', profileLinks: [{ networkId: 'discord', url: 'diane' }] })).toBeNull()
  })
  it('keeps failed storage writes from publishing phantom contacts or cloud snapshots', () => {
    const contacts = useKanbanContactsStore(); contacts.initialize()
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
    expect(contacts.create({ name: 'Alex', note: '' })).toBeNull()
    expect(contacts.contacts).toEqual([])
    expect(enqueueKanbanContactsSnapshot).not.toHaveBeenCalled()
  })
  it('refuses malformed persisted contacts without overwriting their source', () => {
    localStorage.setItem('communityglows.guest-kanban-contacts.v1', '[{"id":"broken"}]')
    const contacts = useLocalKanbanContactsStore(); contacts.initialize()
    expect(contacts.create({ name: 'New', note: '' })).toBeNull()
    expect(localStorage.getItem('communityglows.guest-kanban-contacts.v1')).toBe('[{"id":"broken"}]')
  })
})
