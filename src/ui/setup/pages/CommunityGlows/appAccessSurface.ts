export type AppAccessSurface = 'onboarding' | 'loading' | 'authentication' | 'session-lock' | 'access-gate' | 'workspace'

export interface AppAccessState {
  languageSelected: boolean
  onboardingCompleted: boolean
  localOnly: boolean
  accountVerified: boolean
  accountUnavailable: boolean
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
  if (!state.languageSelected) return 'onboarding'
  if (state.authenticated && state.sessionLocked) return 'session-lock'
  if (!state.onboardingCompleted) return 'onboarding'
  if (state.authLoading) return 'loading'
  if (state.authenticated && !state.localOnly && !state.accountVerified) {
    return state.accountUnavailable ? 'authentication' : 'loading'
  }
  if (state.routePath === '/login' || state.routePath === '/sign-up') return 'authentication'

  const isolatedLocalTasks = state.routePath === '/local-kanban' &&
    !state.activeNetworkUrl && !state.bentoActive
  if (isolatedLocalTasks) return 'workspace'
  if (state.localOnly) return 'authentication'
  if (!state.authenticated) return 'authentication'
  if (!state.canAccessProtected) return 'access-gate'
  return 'workspace'
}

/** Native preloading uses the same identity/onboarding boundary as the visible workspace. */
export function canPreloadProtectedNetworks(state: AppAccessState): boolean {
  return resolveAppAccessSurface(state) === 'workspace' && state.routePath !== '/local-kanban' &&
    state.authenticated && state.canAccessProtected && !state.localOnly
}
