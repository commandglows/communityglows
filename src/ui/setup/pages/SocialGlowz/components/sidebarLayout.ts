export const SIDEBAR_COMPACT_SIZE = 5
export const SIDEBAR_EXPANDED_SIZE = 20
export const SIDEBAR_COMPACT_THRESHOLD = 10

export function isCompactSidebarSize(size: number): boolean {
  return size <= SIDEBAR_COMPACT_THRESHOLD
}

export function sidebarSizeForMode(compact: boolean): number {
  return compact ? SIDEBAR_COMPACT_SIZE : SIDEBAR_EXPANDED_SIZE
}
