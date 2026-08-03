import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ShortcutAction = 'toggle-left-sidebar' | 'toggle-right-sidebar' | 'open-settings' | 'open-crm'

export interface AppShortcut {
  id: string
  action: ShortcutAction
  label: string
  keys: string
  enabled: boolean
}

const STORAGE_KEY = 'sfz_keyboard_shortcuts'

const defaults: AppShortcut[] = [
  { id: 'toggle-left-sidebar', action: 'toggle-left-sidebar', label: 'Afficher/masquer le panneau gauche', keys: 'Alt+L', enabled: true },
  { id: 'toggle-right-sidebar', action: 'toggle-right-sidebar', label: 'Afficher/masquer le panneau droit', keys: 'Alt+R', enabled: true },
  { id: 'open-settings', action: 'open-settings', label: 'Ouvrir les paramètres', keys: 'Alt+,', enabled: true },
  { id: 'open-crm', action: 'open-crm', label: 'Ouvrir le CRM', keys: 'Alt+C', enabled: true },
]

function loadShortcuts(): AppShortcut[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!Array.isArray(parsed)) return structuredClone(defaults)
    return defaults.map((fallback) => ({
      ...fallback,
      ...(parsed.find((item: AppShortcut) => item.id === fallback.id) ?? {}),
    }))
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

  function setKeys(id: string, keys: string) {
    const shortcut = shortcuts.value.find(item => item.id === id)
    if (!shortcut) return
    shortcut.keys = keys
    persist()
  }

  function setEnabled(id: string, enabled: boolean) {
    const shortcut = shortcuts.value.find(item => item.id === id)
    if (!shortcut) return
    shortcut.enabled = enabled
    persist()
  }

  function reset() {
    shortcuts.value = structuredClone(defaults)
    persist()
  }

  return { shortcuts, enabledShortcuts, setKeys, setEnabled, reset }
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
