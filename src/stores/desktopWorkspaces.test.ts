import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  DESKTOP_WORKSPACE_STATE_KEY,
  emptyDesktopWorkspaceState,
  MAX_DESKTOP_WORKSPACE_SYNC_CHARS,
  type DesktopWorkspaceState,
} from '@/lib/desktopWorkspaceLayouts'

const mocked = vi.hoisted(() => ({
  enqueue: vi.fn(),
  flush: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/cloudSyncQueue', () => ({
  enqueueDesktopWorkspacesSnapshot: mocked.enqueue,
  flushCloudSyncQueue: mocked.flush,
}))

import { useDesktopWorkspacesStore } from './desktopWorkspaces'

class MemoryStorage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mocked.enqueue.mockReset()
  mocked.flush.mockClear()
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  })
})

describe('desktop workspace sync store', () => {
  it('persists locally before queuing the cloud snapshot', () => {
    const store = useDesktopWorkspacesStore()
    const state = emptyDesktopWorkspaceState()

    expect(store.persist(state)).toEqual({
      local: { ok: true },
      cloud: { ok: true },
    })
    expect(localStorage.getItem(DESKTOP_WORKSPACE_STATE_KEY)).toBe(
      JSON.stringify(state),
    )
    expect(mocked.enqueue).toHaveBeenCalledWith(JSON.stringify(state))
  })

  it('keeps an oversized scene state local without queuing it', () => {
    const store = useDesktopWorkspacesStore()
    const state = {
      ...emptyDesktopWorkspaceState(),
      padding: 'x'.repeat(MAX_DESKTOP_WORKSPACE_SYNC_CHARS),
    } as DesktopWorkspaceState

    expect(store.persist(state).cloud).toEqual({
      ok: false,
      reason: 'too-large',
    })
    expect(localStorage.getItem(DESKTOP_WORKSPACE_STATE_KEY)).not.toBeNull()
    expect(mocked.enqueue).not.toHaveBeenCalled()
  })

  it('replaces local scenes from a bounded cloud snapshot', () => {
    const store = useDesktopWorkspacesStore()
    const serialized = JSON.stringify(emptyDesktopWorkspaceState())

    expect(store.replaceFromCloud(serialized, new Map(), 'profile-1')).toBe(
      true,
    )
    expect(store.initialized).toBe(true)
    expect(localStorage.getItem(DESKTOP_WORKSPACE_STATE_KEY)).toBe(serialized)
  })

  it('migrates a legacy cloud snapshot to the active profile once', () => {
    const store = useDesktopWorkspacesStore()
    const legacy = JSON.stringify({
      version: 1,
      selectedLayoutId: null,
      layouts: [],
    })

    expect(store.replaceFromCloud(legacy, new Map(), 'profile-1')).toBe(true)
    expect(store.workspaceState).toEqual({
      version: 2,
      selectedLayoutIds: { 'profile-1': null },
      layouts: [],
    })
    expect(mocked.enqueue).toHaveBeenCalledWith(
      JSON.stringify(store.workspaceState),
    )
  })
})
