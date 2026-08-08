export const SIDEBAR_COMPACT_SIZE = 5
export const SIDEBAR_EXPANDED_SIZE = 20
export const SIDEBAR_COMPACT_THRESHOLD = 10
// Splitter sizes are percentages of their owning desktop layout container.
// This layout-only constraint is enforced by Reka during pointer, keyboard,
// and imperative resizing; it does not affect the native WebView lifecycle.
export const SIDEBAR_MAX_SIZE = 30

export function isCompactSidebarSize(size: number): boolean {
  return size <= SIDEBAR_COMPACT_THRESHOLD
}

export function sidebarSizeForMode(compact: boolean): number {
  return compact ? SIDEBAR_COMPACT_SIZE : SIDEBAR_EXPANDED_SIZE
}

export function clampSidebarSize(size: number): number {
  return Math.min(Math.max(size, SIDEBAR_COMPACT_SIZE), SIDEBAR_MAX_SIZE)
}
