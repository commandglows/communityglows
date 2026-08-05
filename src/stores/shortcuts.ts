import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { syncSettingsPatch } from '@/lib/cloudSettings'

export type CoreShortcutAction =
  | 'toggle-left-sidebar'
  | 'toggle-right-sidebar'
  | 'open-settings'
  | 'open-crm'
  | 'open-profile-selector'
export type NetworkShortcutAction = 'open-network'
export type ProfileShortcutAction = 'open-profile'
export type RightPanelShortcutAction = 'open-rightpanel-section'
export type ShortcutAction = CoreShortcutAction | NetworkShortcutAction | ProfileShortcutAction | RightPanelShortcutAction

export interface AppShortcut {
  id: string
  action: ShortcutAction
  label: string
  keys: string
  enabled: boolean
  target?: string
}

const STORAGE_KEY = 'communityglows_keyboard_shortcuts'

const defaults: AppShortcut[] = [
  { id: 'toggle-left-sidebar', action: 'toggle-left-sidebar', label: 'Afficher/masquer le panneau gauche', keys: 'Alt+L', enabled: true },
  { id: 'toggle-right-sidebar', action: 'toggle-right-sidebar', label: 'Afficher/masquer le panneau droit', keys: 'Alt+R', enabled: true },
  { id: 'open-settings', action: 'open-settings', label: 'Ouvrir les paramètres', keys: 'Alt+,', enabled: true },
  { id: 'open-crm', action: 'open-crm', label: 'Ouvrir le CRM', keys: 'Alt+C', enabled: true },
  { id: 'open-profile-selector', action: 'open-profile-selector', label: 'Ouvrir le sélecteur de profil', keys: 'Alt+P', enabled: true },
]

const NETWORK_SHORTCUT_PREFIX = 'open-network:'
const PROFILE_SHORTCUT_PREFIX = 'open-profile:'
const RIGHT_PANEL_SECTION_PREFIX = 'open-rightpanel-section:'

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeShortcutAction(value: unknown): ShortcutAction {
  if (
    value === 'toggle-left-sidebar'
    || value === 'toggle-right-sidebar'
    || value === 'open-settings'
    || value === 'open-crm'
    || value === 'open-profile-selector'
    || value === 'open-network'
    || value === 'open-profile'
    || value === 'open-rightpanel-section'
  ) {
    return value
  }
  return 'open-settings'
}

function parseShortcutEntry(entry: unknown): Partial<AppShortcut> {
  if (!isObject(entry)) return {}
  return {
    ...entry,
    id: typeof entry.id === 'string' ? entry.id : '',
    action: normalizeShortcutAction(entry.action),
    label: typeof entry.label === 'string' ? entry.label : '',
    keys: typeof entry.keys === 'string' ? entry.keys : '',
    enabled: parseBoolean(entry.enabled, false),
    target: typeof entry.target === 'string' ? entry.target : undefined,
  }
}

function normalizeShortcutList(raw: unknown): AppShortcut[] {
  if (!Array.isArray(raw)) return structuredClone(defaults)

  const loaded = raw.map(parseShortcutEntry).filter(entry => entry.id)
  const normalized: AppShortcut[] = defaults.map((fallback) => {
    const item = loaded.find((entry: Partial<AppShortcut>) => entry.id === fallback.id) ?? {}
    return {
      ...fallback,
      ...item,
      enabled: parseBoolean(item.enabled, fallback.enabled),
    }
  })

  for (const entry of loaded) {
    if (defaults.some((fallback) => fallback.id === entry.id)) continue
    if (!entry.id || typeof entry.id !== 'string') continue

    const hasTarget = typeof entry.target === 'string' && entry.target.length > 0
    if (entry.action === 'open-network' && hasTarget) {
      normalized.push({
        id: entry.id,
        action: 'open-network',
        label: entry.label || `Ouvrir ${entry.target}`,
        keys: typeof entry.keys === 'string' ? entry.keys : '',
        enabled: parseBoolean(entry.enabled, false),
        target: entry.target!,
      })
      continue
    }

    if (entry.action === 'open-rightpanel-section' && hasTarget) {
      normalized.push({
        id: entry.id,
        action: 'open-rightpanel-section',
        label: entry.label || entry.id,
        keys: typeof entry.keys === 'string' ? entry.keys : '',
        enabled: parseBoolean(entry.enabled, false),
        target: entry.target,
      })
      continue
    }

    if (entry.label) {
      normalized.push({
        id: entry.id,
        action: normalizeShortcutAction(entry.action),
        label: entry.label || entry.id!,
        keys: typeof entry.keys === 'string' ? entry.keys : '',
        enabled: parseBoolean(entry.enabled, false),
        target: entry.target,
      })
    }
  }

  return normalized
}

function toNetworkShortcutId(networkId: string): string {
  return `${NETWORK_SHORTCUT_PREFIX}${networkId}`
}

function toProfileShortcutId(profileId: string): string {
  return `${PROFILE_SHORTCUT_PREFIX}${profileId}`
}

function toRightPanelSectionShortcutId(sectionId: string): string {
  return `${RIGHT_PANEL_SECTION_PREFIX}${sectionId}`
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

function loadShortcuts(): AppShortcut[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return structuredClone(defaults)
    const parsed = JSON.parse(stored)
    return normalizeShortcutList(parsed)
  } catch {
    return structuredClone(defaults)
  }
}

export const useShortcutsStore = defineStore('shortcuts', () => {
  const shortcuts = ref<AppShortcut[]>(loadShortcuts())
  const enabledShortcuts = computed(() => shortcuts.value.filter(shortcut => shortcut.enabled && shortcut.keys))

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts.value))
  }

  function syncShortcutSettings() {
    const snapshot = structuredClone(toRaw(shortcuts.value))
    void syncSettingsPatch({ keyboardShortcuts: snapshot })
  }

  function keyForNetwork(networkId: string): string {
    return toNetworkShortcutId(networkId)
  }

  function findById(id: string) {
    return shortcuts.value.find(item => item.id === id)
  }

  function hasKeysConflict(keys: string, exceptId?: string): boolean {
    return shortcuts.value.some(
      shortcut => shortcut.id !== exceptId && shortcut.keys.length > 0 && shortcut.keys === keys
    )
  }

  function setKeys(id: string, keys: string): boolean {
    if (hasKeysConflict(keys, id)) return false
    const index = shortcuts.value.findIndex(item => item.id === id)
    if (index < 0) return false
    shortcuts.value[index] = { ...shortcuts.value[index], keys }
    persist()
    syncShortcutSettings()
    return true
  }

  function setEnabled(id: string, enabled: boolean) {
    shortcuts.value = shortcuts.value.map((shortcut) => (
      shortcut.id === id ? { ...shortcut, enabled: parseBoolean(enabled, false) } : shortcut
    ))
    persist()
    syncShortcutSettings()
  }

  function ensureNetworkShortcut(networkId: string, label: string): AppShortcut {
    const id = keyForNetwork(networkId)
    const existing = findById(id)
    if (existing) return existing
    const next: AppShortcut = {
      id,
      action: 'open-network',
      target: networkId,
      label: `Ouvrir ${label}`,
      keys: '',
      enabled: false,
    }
    shortcuts.value = [...shortcuts.value, next]
    persist()
    return next
  }

  function ensureProfileShortcut(profileId: string, label: string): AppShortcut {
    const id = toProfileShortcutId(profileId)
    const existing = findById(id)
    if (existing) return existing
    const next: AppShortcut = {
      id,
      action: 'open-profile',
      target: profileId,
      label: `Activer ${label}`,
      keys: '',
      enabled: false,
    }
    shortcuts.value = [...shortcuts.value, next]
    persist()
    return next
  }

  function ensureRightPanelShortcut(sectionId: string, label: string): AppShortcut {
    const id = toRightPanelSectionShortcutId(sectionId)
    const existing = findById(id)
    if (existing) return existing
    const next: AppShortcut = {
      id,
      action: 'open-rightpanel-section',
      target: sectionId,
      label,
      keys: '',
      enabled: false,
    }
    shortcuts.value = [...shortcuts.value, next]
    persist()
    return next
  }

  function reset() {
    shortcuts.value = structuredClone(defaults)
    persist()
    syncShortcutSettings()
  }

  function setFromCloud(payload: unknown) {
    shortcuts.value = normalizeShortcutList(payload)
    persist()
  }

  function serializeForSync(): AppShortcut[] {
    return structuredClone(toRaw(shortcuts.value))
  }

  return {
    shortcuts,
    enabledShortcuts,
    keyForNetwork,
    setKeys,
    setEnabled,
    ensureNetworkShortcut,
    ensureProfileShortcut,
    ensureRightPanelShortcut,
    hasKeysConflict,
    findById,
    reset,
    setFromCloud,
    serializeForSync,
  }
})

export function normalizeShortcutEvent(event: KeyboardEvent): string {
  const modifiers = [
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Meta' : '',
  ].filter(Boolean)
  const key = event.key === ' ' ? 'Space' : event.key.length === 1 ? event.key.toUpperCase() : event.key
  return [...modifiers, key].join('+')
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined') return false
  if (!(target instanceof HTMLElement)) return false
  return target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]') !== null
}
