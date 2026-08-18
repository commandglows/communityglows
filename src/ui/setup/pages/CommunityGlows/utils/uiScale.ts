import { isDesktopTauri } from '@/platform/capabilities'

export const UI_SCALE_STORAGE_KEY = 'communityglows_ui_scale'
export const UI_SCALE_MIN = 75
export const UI_SCALE_MAX = 150
export const UI_SCALE_STEP = 5
export const UI_SCALE_DEFAULT = 100

export function normalizeUiScaleLevel(level: number) {
  if (!Number.isFinite(level)) return UI_SCALE_DEFAULT

  const clamped = Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, level))
  const snapped =
    Math.round((clamped - UI_SCALE_MIN) / UI_SCALE_STEP) * UI_SCALE_STEP + UI_SCALE_MIN

  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, snapped))
}

export function readUiScaleLevel() {
  return normalizeUiScaleLevel(
    Number(localStorage.getItem(UI_SCALE_STORAGE_KEY) ?? String(UI_SCALE_DEFAULT)),
  )
}

export function persistUiScaleLevel(level: number) {
  const normalized = normalizeUiScaleLevel(level)
  localStorage.setItem(UI_SCALE_STORAGE_KEY, String(normalized))
  return normalized
}

export async function applyUiScaleLevel(level: number) {
  const normalized = normalizeUiScaleLevel(level)

  if (isDesktopTauri()) {
    const { getCurrentWebview } = await import('@tauri-apps/api/webview')
    await getCurrentWebview().setZoom(normalized / 100)
    document.documentElement.style.removeProperty('zoom')
    return normalized
  }

  document.documentElement.style.zoom = String(normalized / 100)
  return normalized
}
