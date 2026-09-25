import { defineStore } from 'pinia'
import { KanbanContactsService, type KanbanContact, type KanbanContactInput, type KanbanContactProfileLink } from '@/services/kanbanContactsService'
import { enqueueKanbanContactsSnapshot, flushCloudSyncQueue } from '@/lib/cloudSyncQueue'

const createContactsStore = (id: string, localOnly = false) => defineStore(id, {
  state: () => ({
    service: new KanbanContactsService(localOnly ? 'communityglows.guest-kanban-contacts.v1' : undefined),
    contacts: [] as KanbanContact[], initialized: false, error: null as string | null,
  }),
  actions: {
    initialize() {
      if (this.initialized) return
      try { this.service.loadState(); this.contacts = this.service.getContacts(); this.error = null; this.initialized = true }
      catch { this.error = 'invalid_contacts_state' }
    },
    replaceFromCloud(serialized: string | undefined) {
      if (serialized === undefined) return true
      try {
        this.service.replaceState(JSON.parse(serialized)); this.contacts = this.service.getContacts()
        this.initialized = true; this.error = null; return true
      } catch { this.error = 'invalid_contacts_state'; return false }
    },
    syncToCloud() {
      if (localOnly) return Promise.resolve()
      enqueueKanbanContactsSnapshot(this.service.serializeState())
      return flushCloudSyncQueue()
    },
    create(input: KanbanContactInput) {
      this.initialize()
      if (!this.initialized) return null
      try {
        const contact = this.service.add(input); this.contacts = this.service.getContacts(); this.error = null
        void this.syncToCloud(); return contact
      } catch (error) { this.error = error instanceof Error ? error.message : 'contact_create_failed'; return null }
    },
    update(id: string, patch: Partial<KanbanContactInput>) {
      this.initialize()
      if (!this.initialized) return false
      try {
        this.service.update(id, patch); this.contacts = this.service.getContacts(); this.error = null
        void this.syncToCloud(); return true
      } catch (error) { this.error = error instanceof Error ? error.message : 'contact_update_failed'; return false }
    },
    remove(id: string) {
      this.initialize()
      if (!this.initialized) return false
      try {
        this.service.remove(id); this.contacts = this.service.getContacts(); this.error = null
        void this.syncToCloud(); return true
      } catch { this.error = 'contact_remove_failed'; return false }
    },
    importLocalContacts(contacts: KanbanContact[]) {
      if (localOnly) return false
      this.initialize()
      if (!this.initialized) return false
      const known = new Set(this.contacts.map(contact => contact.id))
      if (!this.replaceFromCloud(JSON.stringify([...this.contacts, ...contacts.filter(contact => !known.has(contact.id))]))) return false
      void this.syncToCloud(); return true
    },
    clearLocal() {
      this.service.replaceState([]); this.contacts = []; this.initialized = false; this.error = null
    },
    clearError() { this.error = null },
  },
})
export const useKanbanContactsStore = createContactsStore('kanbanContacts')
export const useLocalKanbanContactsStore = createContactsStore('localKanbanContacts', true)
export type { KanbanContact, KanbanContactInput, KanbanContactProfileLink }
