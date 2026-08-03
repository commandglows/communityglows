import { afterEach, describe, expect, it, vi } from 'vitest'
import { isEditableShortcutTarget, normalizeShortcutEvent } from './shortcuts'

describe('keyboard shortcut guards', () => {
  afterEach(() => vi.unstubAllGlobals())

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
