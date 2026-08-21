export const RESPONSIVE_BREAKPOINTS = {
  headerWide: 1200,
  sidebarTablet: 768,
  filtersCompact: 1180,
  settingsDesktop: 1280,
  settingsUltraWide: 1600,
  billingCompact: 520,
  mobileSettingsCompact: 420,
  postAuthSyncCompact: 640,
  gmailCompact: 1024,
  twitterCompact: 900,
  tasksCompact: 768,
  dialogSettingsWide: 960,
  dialogSettingsNarrow: 641,
} as const

const DESKTOP_WORKSPACE_TOKEN_NAMES = {
  panelMinWidth: '--sg-workspace-panel-min-width',
  panelMinHeight: '--sg-workspace-panel-min-height',
} as const

function readRequiredPixelToken(name: string): number {
  const value = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name),
  )
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Required pixel design token is unavailable: ${name}`)
  }
  return value
}

export function readDesktopWorkspaceConstraints() {
  return {
    panelMinWidth: readRequiredPixelToken(
      DESKTOP_WORKSPACE_TOKEN_NAMES.panelMinWidth,
    ),
    panelMinHeight: readRequiredPixelToken(
      DESKTOP_WORKSPACE_TOKEN_NAMES.panelMinHeight,
    ),
  }
}
