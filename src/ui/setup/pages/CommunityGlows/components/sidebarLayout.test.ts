import { describe, expect, it } from 'vitest'
import {
  clampSidebarSize,
  SIDEBAR_EXPANDED_SIZE,
  SIDEBAR_MIN_SIZE,
  SIDEBAR_MAX_SIZE,
} from './sidebarLayout'

describe('sidebar layout', () => {
  it('keeps restored desktop panel sizes within the shared range', () => {
    expect(clampSidebarSize(0)).toBe(SIDEBAR_MIN_SIZE)
    expect(clampSidebarSize(SIDEBAR_EXPANDED_SIZE)).toBe(SIDEBAR_EXPANDED_SIZE)
    expect(clampSidebarSize(80)).toBe(SIDEBAR_MAX_SIZE)
  })
})
