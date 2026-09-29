import { describe, expect, it, vi } from 'vitest'
import {
  collectPortableLocalStorage,
  PORTABLE_LOCAL_STORAGE_KEYS,
  restorePortableLocalStorage,
} from './backupData'

describe('portable backup data', () => {
  it('round-trips guest contact associations, column names and local choice together', () => {
    const values = new Map([
      ['communityglows.guest-kanban-contacts.v1', '[{"id":"contact-a","name":"Alex"}]'],
      ['communityglows.guest-tasks.v1', '[{"id":"card-a","contactIds":["contact-a"]}]'],
      ['communityglows.guest-task-labels.v1', '{"todo":"À relancer"}'],
      ['communityglows-prefer-local-kanban', '1'],
    ])
    const snapshot = collectPortableLocalStorage({ getItem: key => values.get(key) ?? null })
    const restored = new Map<string, string>()
    restorePortableLocalStorage(snapshot, { setItem: (key, value) => { restored.set(key, value) }, removeItem: key => { restored.delete(key) } })
    expect(restored).toEqual(values)
  })
  it('captures every declared portable preference, including empty values', () => {
    const getItem = vi.fn((key: string) => key === 'communityglows_keyboard_shortcuts' ? '[]' : null)

    const snapshot = collectPortableLocalStorage({ getItem })

    expect(Object.keys(snapshot)).toEqual([...PORTABLE_LOCAL_STORAGE_KEYS])
    expect(snapshot.communityglows_keyboard_shortcuts).toBe('[]')
    expect(snapshot['contextual-tasks-v1']).toBeNull()
    expect(snapshot['communityglows.desktop-workspaces.v1']).toBeNull()
    expect(snapshot['communityglows.desktop-workspaces.v2']).toBeNull()
  })

  it('restores exact values and clears keys explicitly absent from the source device', () => {
    const setItem = vi.fn()
    const removeItem = vi.fn()

    restorePortableLocalStorage({
      communityglows_username: '',
      'kanban-state': null,
    }, { setItem, removeItem })

    expect(setItem).toHaveBeenCalledWith('communityglows_username', '')
    expect(removeItem).toHaveBeenCalledWith('kanban-state')
  })

  it('does not clear keys omitted by a legacy backup', () => {
    const setItem = vi.fn()
    const removeItem = vi.fn()

    restorePortableLocalStorage({ theme: 'dark' }, { setItem, removeItem })

    expect(setItem).toHaveBeenCalledTimes(1)
    expect(removeItem).not.toHaveBeenCalled()
  })
})
