export const THEME_PALETTES = [
  { id: 'blue', hue: 215, saturation: 45 },
  { id: 'neutral', hue: 0, saturation: 0 },
  { id: 'yellow', hue: 50, saturation: 65 },
  { id: 'teal', hue: 175, saturation: 38 },
  { id: 'green', hue: 125, saturation: 30 },
  { id: 'apricot', hue: 25, saturation: 45 },
  { id: 'rose', hue: 340, saturation: 38 },
  { id: 'violet', hue: 270, saturation: 38 },
] as const
export type ThemePalette = (typeof THEME_PALETTES)[number]['id']
export const normalizePalette = (value: unknown): ThemePalette =>
  value === 'slate'
    ? 'yellow'
    : (THEME_PALETTES.find((p) => p.id === value)?.id ?? 'blue')

export function paletteTokens(
  id: ThemePalette,
  dark: boolean,
): Record<string, string> {
  const palette = THEME_PALETTES.find((p) => p.id === id) ?? THEME_PALETTES[0]
  const c = (lightness: number, saturation: number = palette.saturation) =>
    `hsl(${palette.hue} ${saturation}% ${lightness}%)`
  const surfaceSaturation = dark ? palette.saturation / 2 : palette.saturation
  return {
    '--sg-color-background': c(dark ? 7 : 88, surfaceSaturation),
    '--sg-color-surface-raised': c(dark ? 13 : 94, surfaceSaturation),
    '--sg-color-surface-muted': c(dark ? 18 : 86, surfaceSaturation),
    '--sg-color-surface-hover': c(dark ? 24 : 80, surfaceSaturation),
    '--sg-color-text': c(dark ? 96 : 12, palette.saturation / 2),
    '--sg-color-text-muted': c(dark ? 78 : 27, palette.saturation / 2),
    '--sg-color-action': c(dark ? 78 : 30),
    '--sg-color-action-hover': c(dark ? 85 : 24),
    '--sg-color-text-on-action': c(dark ? 10 : 100, 0),
    '--sg-color-border': c(dark ? 35 : 74, palette.saturation / 2),
    '--sg-color-border-strong': c(dark ? 65 : 40, palette.saturation / 2),
    '--sg-focus-ring': `3px solid ${c(dark ? 78 : 30)}`,
  }
}

export function applyPalette(id: ThemePalette, dark: boolean) {
  const tokens = paletteTokens(id, dark)
  for (const key of Object.keys(tokens)) {
    const value = tokens[key]
    if (id === 'blue' && dark)
      document.documentElement.style.removeProperty(key)
    else document.documentElement.style.setProperty(key, value)
  }
  document.documentElement.dataset.palette = id
}
