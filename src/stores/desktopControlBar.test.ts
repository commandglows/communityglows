import { describe, expect, it } from 'vitest'
import {
  normalizeDesktopControlBarHeight,
  normalizeDesktopControlBarPosition,
} from './desktopControlBar'

describe('normalizeDesktopControlBarPosition', () => {
  it('keeps the supported bottom position', () => {
    expect(normalizeDesktopControlBarPosition('bottom')).toBe('bottom')
  })

  it('defaults unknown values to top', () => {
    expect(normalizeDesktopControlBarPosition('side')).toBe('top')
    expect(normalizeDesktopControlBarPosition(null)).toBe('top')
  })
})

describe('normalizeDesktopControlBarHeight', () => {
  it('keeps a saved height inside the available desktop range', () => {
    expect(normalizeDesktopControlBarHeight(120, 56, 200)).toBe(120)
  })

  it('clamps heights to the compact minimum and viewport-based maximum', () => {
    expect(normalizeDesktopControlBarHeight(24, 56, 200)).toBe(56)
    expect(normalizeDesktopControlBarHeight(280, 56, 200)).toBe(200)
  })

  it('ignores malformed persisted values and impossible ranges', () => {
    expect(normalizeDesktopControlBarHeight('120', 56, 200)).toBeNull()
    expect(normalizeDesktopControlBarHeight(120, 200, 56)).toBeNull()
  })
})
