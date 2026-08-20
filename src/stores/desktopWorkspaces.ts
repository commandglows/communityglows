import { defineStore } from 'pinia'
import {
  DESKTOP_WORKSPACE_STATE_KEY,
  LEGACY_DESKTOP_WORKSPACE_STATE_KEY,
  DESKTOP_WORKSPACE_AUTOSAVE_KEY,
  LEGACY_DESKTOP_WORKSPACE_AUTOSAVE_KEY,
  clearDesktopWorkspaceAutosave,
  emptyDesktopWorkspaceState,
  loadDesktopWorkspaceState,
  MAX_DESKTOP_WORKSPACE_SYNC_CHARS,
  parseDesktopWorkspaceState,
  persistDesktopWorkspaceState,
  removeDesktopWorkspaceProfile,
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
    initialize(catalog: WorkspaceNetworkCatalog, legacyProfileId = '') {
      if (this.initialized) return
      this.workspaceState = loadDesktopWorkspaceState(
        localStorage,
        catalog,
        legacyProfileId,
      )
      this.initialized = true
    },

    reloadFromLocal(catalog: WorkspaceNetworkCatalog, legacyProfileId = '') {
      this.workspaceState = loadDesktopWorkspaceState(
        localStorage,
        catalog,
        legacyProfileId,
      )
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

    replaceFromCloud(
      serialized: string,
      catalog: WorkspaceNetworkCatalog,
      legacyProfileId: string,
      availableProfileIds?: ReadonlySet<string>,
    ) {
      if (serialized.length > MAX_DESKTOP_WORKSPACE_SYNC_CHARS) return false
      let version: unknown
      try {
        version = (JSON.parse(serialized) as { version?: unknown }).version
      } catch {
        return false
      }
      const parsed = parseDesktopWorkspaceState(
        serialized,
        catalog,
        legacyProfileId,
      )
      let state =
        version === 1 && this.initialized
          ? {
              ...parsed,
              selectedLayoutIds: {
                ...this.workspaceState.selectedLayoutIds,
                ...parsed.selectedLayoutIds,
              },
              layouts: [
                ...parsed.layouts,
                ...this.workspaceState.layouts.filter(
                  (layout) => layout.profileId !== legacyProfileId,
                ),
              ],
            }
          : parsed
      let pruned = false
      if (availableProfileIds) {
        const removedProfileIds = new Set(
          [
            ...state.layouts.map((layout) => layout.profileId),
            ...Object.keys(state.selectedLayoutIds),
          ].filter((profileId) => !availableProfileIds.has(profileId)),
        )
        if (removedProfileIds.size > 0) {
          pruned = true
          for (const profileId of removedProfileIds) {
            state = removeDesktopWorkspaceProfile(state, profileId)
            clearDesktopWorkspaceAutosave(localStorage, profileId)
          }
        }
      }
      const result = persistDesktopWorkspaceState(localStorage, state)
      if (!result.ok) return false
      this.workspaceState = state
      this.initialized = true
      if (version === 1 || pruned) this.syncToCloud()
      return true
    },

    removeProfile(profileId: string) {
      const state = removeDesktopWorkspaceProfile(
        this.workspaceState,
        profileId,
      )
      clearDesktopWorkspaceAutosave(localStorage, profileId)
      return this.persist(state)
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
      const autosavePrefix = `${DESKTOP_WORKSPACE_AUTOSAVE_KEY}:`
      const autosaveKeys: string[] = []
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (key?.startsWith(autosavePrefix)) autosaveKeys.push(key)
      }
      autosaveKeys.forEach((key) => localStorage.removeItem(key))
      this.workspaceState = emptyDesktopWorkspaceState()
      this.initialized = true
      localStorage.removeItem(DESKTOP_WORKSPACE_STATE_KEY)
      localStorage.removeItem(LEGACY_DESKTOP_WORKSPACE_STATE_KEY)
      localStorage.removeItem(LEGACY_DESKTOP_WORKSPACE_AUTOSAVE_KEY)
    },
  },
})
