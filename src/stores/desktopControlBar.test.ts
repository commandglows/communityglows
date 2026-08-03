import { describe, expect, it } from 'vitest'
import { normalizeDesktopControlBarPosition } from './desktopControlBar'

describe('normalizeDesktopControlBarPosition', () => {
  it('keeps the supported bottom position', () => {
    expect(normalizeDesktopControlBarPosition('bottom')).toBe('bottom')
  })

  it('defaults unknown values to top', () => {
    expect(normalizeDesktopControlBarPosition('side')).toBe('top')
    expect(normalizeDesktopControlBarPosition(null)).toBe('top')
  })
})
