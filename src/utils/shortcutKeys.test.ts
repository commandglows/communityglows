import { expect, it } from 'vitest'
import { isValidShortcutKeys } from './shortcutKeys'

it('rejects unmodified keys, modifier-only combinations and Escape', () => {
  for (const keys of ['D', 'Escape', 'Ctrl+Escape', 'Alt+Esc', 'Shift+D', 'Ctrl+Shift', 'Meta']) {
    expect(isValidShortcutKeys(keys), keys).toBe(false)
  }
})
it('accepts modified shortcuts including punctuation', () => {
  for (const keys of ['Alt+C', 'Ctrl+Alt+-', 'Ctrl+Shift+=', 'Meta+K', 'Ctrl++']) {
    expect(isValidShortcutKeys(keys), keys).toBe(true)
  }
})
