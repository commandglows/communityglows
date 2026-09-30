export function isValidShortcutKeys(keys: string): boolean {
  return /^(?:(?:Ctrl|Alt|Shift|Meta)\+)+.+$/.test(keys)
    && /^(?:.*\+)?(?:Ctrl|Alt|Meta)\+/.test(keys)
    && !/(?:^|\+)(?:Escape|Esc|Control|Alt|Shift|Meta)$/.test(keys)
}
