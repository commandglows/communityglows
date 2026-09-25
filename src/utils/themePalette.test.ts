import { describe, expect, it } from 'vitest'
import { THEME_PALETTES, normalizePalette, paletteTokens } from './themePalette'

function luminance(color: string) {
  const [h, s0, l0] = color.match(/[\d.]+/g)!.map(Number)
  const s = s0 / 100, l = l0 / 100
  const a = s * Math.min(l, 1 - l)
  const rgb = [0, 8, 4].map(n => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
describe('appearance palettes', () => {
  it('falls back to the original palette for invalid saved preferences', () => {
    expect(normalizePalette('invalid')).toBe('blue')
    expect(normalizePalette(null)).toBe('blue')
  })
  for (const palette of THEME_PALETTES) {
    for (const dark of [false, true]) {
      it(`${palette.id} ${dark ? 'dark' : 'light'} keeps text and focus readable`, () => {
        const t = paletteTokens(palette.id, dark)
        for (const surface of ['background', 'surface-raised', 'surface-muted', 'surface-hover']) {
          for (const text of ['text', 'text-muted']) expect(contrast(t[`--sg-color-${text}`], t[`--sg-color-${surface}`])).toBeGreaterThanOrEqual(4.5)
          expect(contrast(t['--sg-color-action'], t[`--sg-color-${surface}`])).toBeGreaterThanOrEqual(3)
        }
        expect(contrast(t['--sg-color-action'], t['--sg-color-text-on-action'])).toBeGreaterThanOrEqual(4.5)
        expect(Object.keys(t).some(key => /danger|success|facebook|twitter/.test(key))).toBe(false)
      })
    }
  }
})
