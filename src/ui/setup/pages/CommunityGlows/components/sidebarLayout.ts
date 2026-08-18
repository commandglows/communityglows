export const SIDEBAR_MIN_SIZE = 3
export const SIDEBAR_EXPANDED_SIZE = 20
// Splitter sizes are percentages of their owning desktop layout container.
// This layout-only constraint is enforced by Reka during pointer, keyboard,
// and imperative resizing; it does not affect the native WebView lifecycle.
export const SIDEBAR_MAX_SIZE = 30

export function clampSidebarSize(size: number): number {
  return Math.min(Math.max(size, SIDEBAR_MIN_SIZE), SIDEBAR_MAX_SIZE)
}
