export const BACKUP_DATA_VERSION = 2

export const PORTABLE_LOCAL_STORAGE_KEYS = [
  'communityglows_username',
  'communityglows_email',
  'user-locale',
  'theme',
  'theme-resolved',
  'grayscale',
  'communityglows_haptic',
  'communityglows_tap_sound',
  'communityglows_tap_sound_variant',
  'communityglows_text_zoom',
  'communityglows_ui_scale',
  'communityglows_keyboard_shortcuts',
  'communityglows_desktop_control_bar_position',
  'communityglows-right-sidebar-kanban-collapsed',
  'contextual-task-stage-labels-v1',
  'kanban-state',
  'contextual-tasks-v1',
  'communityglows.desktop-workspaces.v2',
  'communityglows.desktop-workspaces.v1',
] as const

export type PortableLocalStorageKey = typeof PORTABLE_LOCAL_STORAGE_KEYS[number]
export type PortableLocalStorageSnapshot = Partial<Record<PortableLocalStorageKey, string | null>>

export function collectPortableLocalStorage(storage: Pick<Storage, 'getItem'>): PortableLocalStorageSnapshot {
  return Object.fromEntries(
    PORTABLE_LOCAL_STORAGE_KEYS.map(key => [key, storage.getItem(key)]),
  ) as PortableLocalStorageSnapshot
}

export function restorePortableLocalStorage(
  snapshot: unknown,
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
): void {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return

  const values = snapshot as Record<string, unknown>
  for (const key of PORTABLE_LOCAL_STORAGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) continue
    const value = values[key]
    if (typeof value === 'string') {
      storage.setItem(key, value)
    } else if (value === null) {
      storage.removeItem(key)
    }
  }
}
