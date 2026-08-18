import { describe, expect, it } from 'vitest'
import {
  UI_SCALE_DEFAULT,
  normalizeUiScaleLevel,
} from './uiScale'

describe('UI scale normalization', () => {
  it('keeps the app scale within its independent range', () => {
    expect(normalizeUiScaleLevel(Number.NaN)).toBe(UI_SCALE_DEFAULT)
    expect(normalizeUiScaleLevel(70)).toBe(75)
    expect(normalizeUiScaleLevel(112)).toBe(110)
    expect(normalizeUiScaleLevel(153)).toBe(150)
  })
})
