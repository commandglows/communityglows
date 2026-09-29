export type AppAccessSurface = 'onboarding' | 'loading' | 'authentication' | 'session-lock' | 'access-gate' | 'workspace'

export interface AppAccessState {
  onboardingCompleted: boolean
  authLoading: boolean
  authenticated: boolean
  sessionLocked: boolean
  canAccessProtected: boolean
  routePath: string
  activeNetworkUrl: string | null
  bentoActive: boolean
}

/** Recovery screens never render the protected workspace, even with a restored session. */
export function resolveAppAccessSurface(state: AppAccessState): AppAccessSurface {
  if (!state.onboardingCompleted) return 'onboarding'
  if (state.authLoading) return 'loading'
  if (state.authenticated && state.sessionLocked) return 'session-lock'
  if (state.routePath === '/login' || state.routePath === '/sign-up') return 'authentication'

  const isolatedLocalTasks = state.routePath === '/local-kanban' &&
    !state.activeNetworkUrl && !state.bentoActive
  if (isolatedLocalTasks) return 'workspace'
  if (!state.authenticated) return 'authentication'
  if (!state.canAccessProtected) return 'access-gate'
  return 'workspace'
}
