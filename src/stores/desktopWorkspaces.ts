import { defineStore } from 'pinia'
import {
  DESKTOP_WORKSPACE_STATE_KEY,
  emptyDesktopWorkspaceState,
  loadDesktopWorkspaceState,
  MAX_DESKTOP_WORKSPACE_SYNC_CHARS,
  parseDesktopWorkspaceState,
  persistDesktopWorkspaceState,
  type DesktopWorkspaceState,
  type WorkspaceNetworkCatalog,
  type WorkspacePersistenceResult,
} from '@/lib/desktopWorkspaceLayouts'
import {
  enqueueDesktopWorkspacesSnapshot,
  flushCloudSyncQueue,
} from '@/lib/cloudSyncQueue'

export type DesktopWorkspaceSyncResult = {
  local: WorkspacePersistenceResult
  cloud: WorkspacePersistenceResult
}

function serializeForCloud(
  state: DesktopWorkspaceState,
):
  | { ok: true; value: string }
  | { ok: false; reason: 'invalid' | 'too-large' } {
  try {
    const value = JSON.stringify(state)
    return value.length <= MAX_DESKTOP_WORKSPACE_SYNC_CHARS
      ? { ok: true, value }
      : { ok: false, reason: 'too-large' }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

export const useDesktopWorkspacesStore = defineStore('desktopWorkspaces', {
  state: () => ({
    workspaceState: emptyDesktopWorkspaceState(),
    initialized: false,
  }),

  actions: {
    initialize(catalog: WorkspaceNetworkCatalog) {
      if (this.initialized) return
      this.workspaceState = loadDesktopWorkspaceState(localStorage, catalog)
      this.initialized = true
    },

    reloadFromLocal(catalog: WorkspaceNetworkCatalog) {
      this.workspaceState = loadDesktopWorkspaceState(localStorage, catalog)
      this.initialized = true
    },

    persist(state: DesktopWorkspaceState, sync = true): DesktopWorkspaceSyncResult {
      const local = persistDesktopWorkspaceState(localStorage, state)
      if (!local.ok) return { local, cloud: local }

      this.workspaceState = state
      this.initialized = true
      if (!sync) return { local, cloud: { ok: true } }

      const serialized = serializeForCloud(state)
      if (!serialized.ok) {
        return { local, cloud: { ok: false, reason: serialized.reason } }
      }
      try {
        enqueueDesktopWorkspacesSnapshot(serialized.value)
        void flushCloudSyncQueue()
        return { local, cloud: { ok: true } }
      } catch {
        return { local, cloud: { ok: false, reason: 'unavailable' } }
      }
    },

    replaceFromCloud(serialized: string, catalog: WorkspaceNetworkCatalog) {
      if (serialized.length > MAX_DESKTOP_WORKSPACE_SYNC_CHARS) return false
      const state = parseDesktopWorkspaceState(serialized, catalog)
      const result = persistDesktopWorkspaceState(localStorage, state)
      if (!result.ok) return false
      this.workspaceState = state
      this.initialized = true
      return true
    },

    syncToCloud() {
      const serialized = serializeForCloud(this.workspaceState)
      if (!serialized.ok) return false
      try {
        enqueueDesktopWorkspacesSnapshot(serialized.value)
        void flushCloudSyncQueue()
        return true
      } catch {
        return false
      }
    },

    clearLocal() {
      this.workspaceState = emptyDesktopWorkspaceState()
      this.initialized = true
      localStorage.removeItem(DESKTOP_WORKSPACE_STATE_KEY)
    },
  },
})
