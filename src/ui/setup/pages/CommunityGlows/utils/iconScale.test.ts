import { describe, expect, it } from 'vitest'
import {
  ICON_SCALE_DEFAULT,
  normalizeIconScaleLevel,
  resolveSidebarIconScale,
  resolveSidebarPresentation,
} from './iconScale'

describe('icon scale', () => {
  it('normalizes values to the supported 5px tiers', () => {
    expect(normalizeIconScaleLevel(Number.NaN)).toBe(ICON_SCALE_DEFAULT)
    expect(normalizeIconScaleLevel(12)).toBe(15)
    expect(normalizeIconScaleLevel(27)).toBe(25)
    expect(normalizeIconScaleLevel(53)).toBe(50)
  })

  it('caps a sidebar icon at the largest tier that fits', () => {
    const widthsAndTiers = [
      [39, 15],
      [44, 20],
      [49, 25],
      [54, 30],
      [59, 35],
      [64, 40],
      [69, 45],
      [74, 50],
    ] as const

    for (const [width, tier] of widthsAndTiers) {
      expect(resolveSidebarIconScale(50, width)).toBe(tier)
    }

    expect(resolveSidebarIconScale(30, 64)).toBe(30)
  })

  it('derives compact mode from real pixel width', () => {
    expect(resolveSidebarPresentation(50, 120)).toEqual({ compact: true, iconSize: 50 })
    expect(resolveSidebarPresentation(50, 184)).toEqual({ compact: false, iconSize: 50 })
  })
})
