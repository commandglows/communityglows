export const ICON_SCALE_STORAGE_KEY = 'communityglows_icon_scale'
export const ICON_SCALE_MIN = 15
export const ICON_SCALE_MAX = 50
export const ICON_SCALE_STEP = 5
export const ICON_SCALE_DEFAULT = 20
export const SIDEBAR_COMPACT_WIDTH = 184
export const SIDEBAR_ICON_INSET = 24

export function normalizeIconScaleLevel(level: number) {
  if (!Number.isFinite(level)) return ICON_SCALE_DEFAULT
  const clamped = Math.min(ICON_SCALE_MAX, Math.max(ICON_SCALE_MIN, level))
  return Math.round((clamped - ICON_SCALE_MIN) / ICON_SCALE_STEP) * ICON_SCALE_STEP + ICON_SCALE_MIN
}

export function readIconScaleLevel() {
  return normalizeIconScaleLevel(
    Number(localStorage.getItem(ICON_SCALE_STORAGE_KEY) ?? String(ICON_SCALE_DEFAULT)),
  )
}

export function persistIconScaleLevel(level: number) {
  const normalized = normalizeIconScaleLevel(level)
  localStorage.setItem(ICON_SCALE_STORAGE_KEY, String(normalized))
  return normalized
}

/** The biggest 5px tier that fits within a sidebar without clipping. */
export function resolveSidebarIconScale(level: number, availableWidth: number) {
  const preferred = normalizeIconScaleLevel(level)
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return preferred
  const maxFitting = Math.floor((availableWidth - SIDEBAR_ICON_INSET) / ICON_SCALE_STEP) * ICON_SCALE_STEP
  return normalizeIconScaleLevel(Math.min(preferred, Math.max(ICON_SCALE_MIN, maxFitting)))
}

export function resolveSidebarPresentation(level: number, width: number) {
  const normalizedWidth = Number.isFinite(width) ? Math.max(0, width) : 0
  return {
    compact: normalizedWidth > 0 && normalizedWidth < SIDEBAR_COMPACT_WIDTH,
    iconSize: resolveSidebarIconScale(level, normalizedWidth),
  }
}
