import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { isEditableShortcutTarget, normalizeShortcutEvent, useShortcutsStore } from './shortcuts'

describe('keyboard shortcut guards', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recognizes Ctrl + zero on AZERTY without requiring Shift', () => {
    expect(normalizeShortcutEvent({ ctrlKey: true, code: 'Digit0', key: 'à' } as KeyboardEvent)).toBe('Ctrl+0')
    expect(normalizeShortcutEvent({ ctrlKey: true, altKey: true, code: 'Digit0', key: '@' } as KeyboardEvent)).toBe('Ctrl+Alt+@')
  })

  it('adds reset to saved shortcuts without replacing existing customizations', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify([{ id: 'increase-ui-scale', action: 'increase-ui-scale', keys: 'Alt+=', enabled: false }]),
      setItem: vi.fn(),
    })
    setActivePinia(createPinia())
    const store = useShortcutsStore()
    expect(store.findById('reset-ui-scale')).toMatchObject({ action: 'reset-ui-scale', keys: 'Ctrl+0', enabled: true })
    expect(store.findById('increase-ui-scale')).toMatchObject({ keys: 'Alt+=', enabled: false })
    store.setFromCloud([{ id: 'reset-ui-scale', action: 'reset-ui-scale', keys: 'Alt+0', enabled: false }])
    expect(store.findById('reset-ui-scale')).toMatchObject({ action: 'reset-ui-scale', keys: 'Alt+0', enabled: false })
  })

  it('normalizes modifier combinations consistently', () => {
    expect(normalizeShortcutEvent({
      altKey: true,
      ctrlKey: false,
      shiftKey: true,
      metaKey: false,
      key: 'l',
    } as KeyboardEvent)).toBe('Alt+Shift+L')
  })

  it('does not classify non-elements as editable targets', () => {
    expect(isEditableShortcutTarget(null)).toBe(false)
    expect(isEditableShortcutTarget(new EventTarget())).toBe(false)
  })

  it('classifies descendants of editable controls as editable targets', () => {
    const closest = vi.fn(() => ({}))
    class TestElement {
      closest = closest
    }
    vi.stubGlobal('HTMLElement', TestElement)
    const child = new TestElement()

    expect(isEditableShortcutTarget(child as unknown as EventTarget)).toBe(true)
    expect(closest).toHaveBeenCalledWith('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')
  })

  it('does not treat descendants of contenteditable=false as editable', () => {
    class TestElement {
      closest() { return null }
    }
    vi.stubGlobal('HTMLElement', TestElement)
    const child = new TestElement()

    expect(isEditableShortcutTarget(child as unknown as EventTarget)).toBe(false)
  })
})
