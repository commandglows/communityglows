import { describe, expect, it } from 'vitest'
import {
  clampSidebarSize,
  isCompactSidebarSize,
  sidebarSizeForMode,
  SIDEBAR_COMPACT_SIZE,
  SIDEBAR_EXPANDED_SIZE,
  SIDEBAR_MAX_SIZE,
} from './sidebarLayout'

describe('sidebar layout', () => {
  it('maps compact and expanded modes to stable panel sizes', () => {
    expect(sidebarSizeForMode(true)).toBe(SIDEBAR_COMPACT_SIZE)
    expect(sidebarSizeForMode(false)).toBe(SIDEBAR_EXPANDED_SIZE)
  })

  it('switches mode at the compact drag threshold', () => {
    expect(isCompactSidebarSize(10)).toBe(true)
    expect(isCompactSidebarSize(10.01)).toBe(false)
  })

  it('keeps restored desktop panel sizes within the shared range', () => {
    expect(clampSidebarSize(0)).toBe(SIDEBAR_COMPACT_SIZE)
    expect(clampSidebarSize(SIDEBAR_EXPANDED_SIZE)).toBe(SIDEBAR_EXPANDED_SIZE)
    expect(clampSidebarSize(80)).toBe(SIDEBAR_MAX_SIZE)
  })
})
