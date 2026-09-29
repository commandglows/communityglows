import { describe, expect, it } from 'vitest'
import { resolveDesktopWorkspaceUiState } from './desktopWorkspaceUiState'

describe('desktop workspace normal UI states', () => {
  it('does not expose actions or an empty-state flash before Dockview is ready', () => {
    expect(resolveDesktopWorkspaceUiState(false, 0)).toEqual({
      hasPanels: false,
      canApplyPreset: false,
      canCreateScene: false,
      showEmptyGuide: false,
    })
  })

  it('guides an empty ready workspace without enabling impossible actions', () => {
    expect(resolveDesktopWorkspaceUiState(true, 0)).toEqual({
      hasPanels: false,
      canApplyPreset: false,
      canCreateScene: false,
      showEmptyGuide: true,
    })
  })

  it('enables layout and scene actions as soon as one panel exists', () => {
    expect(resolveDesktopWorkspaceUiState(true, 1)).toEqual({
      hasPanels: true,
      canApplyPreset: true,
      canCreateScene: true,
      showEmptyGuide: false,
    })
  })

  it('treats malformed panel counts as empty', () => {
    expect(resolveDesktopWorkspaceUiState(true, Number.NaN).hasPanels).toBe(
      false,
    )
    expect(resolveDesktopWorkspaceUiState(true, -1).hasPanels).toBe(false)
    expect(resolveDesktopWorkspaceUiState(true, 1.5).hasPanels).toBe(false)
  })
})
