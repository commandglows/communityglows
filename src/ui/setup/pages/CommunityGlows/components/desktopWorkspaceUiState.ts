export type DesktopWorkspaceUiState = {
  hasPanels: boolean
  canApplyPreset: boolean
  canCreateScene: boolean
  showEmptyGuide: boolean
}

export function resolveDesktopWorkspaceUiState(
  ready: boolean,
  panelCount: number,
): DesktopWorkspaceUiState {
  const hasPanels = ready && Number.isInteger(panelCount) && panelCount > 0
  return {
    hasPanels,
    canApplyPreset: hasPanels,
    canCreateScene: hasPanels,
    showEmptyGuide: ready && !hasPanels,
  }
}
