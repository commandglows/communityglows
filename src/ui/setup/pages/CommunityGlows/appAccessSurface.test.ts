import { describe, expect, it } from 'vitest'
import { canPreloadProtectedNetworks, resolveAppAccessSurface, type AppAccessState } from './appAccessSurface'

const restoredSession: AppAccessState = {
  languageSelected: true,
  onboardingCompleted: true,
  localOnly: false,
  accountVerified: true,
  accountUnavailable: false,
  authLoading: false,
  authenticated: true,
  sessionLocked: false,
  canAccessProtected: false,
  routePath: '/twitter',
  activeNetworkUrl: 'https://x.com',
  bentoActive: true,
}

describe('application authentication and access boundary', () => {
  it('asks for language before any restored session, lock or billing result', () => {
    expect(resolveAppAccessSurface({ ...restoredSession, languageSelected: false, sessionLocked: true, canAccessProtected: true })).toBe('onboarding')
  })

  it('keeps a restored trial behind the onboarding acknowledgement and session lock', () => {
    expect(resolveAppAccessSurface({ ...restoredSession, onboardingCompleted: false, canAccessProtected: true })).toBe('onboarding')
    expect(resolveAppAccessSurface({ ...restoredSession, onboardingCompleted: false, sessionLocked: true })).toBe('session-lock')
    expect(resolveAppAccessSurface({ ...restoredSession, localOnly: true, canAccessProtected: true })).toBe('authentication')
  })

  it('does not open account B with an onboarding acknowledgement and local profiles from account A', () => {
    const pendingAccount = { ...restoredSession, canAccessProtected: true, accountVerified: false }
    expect(resolveAppAccessSurface(pendingAccount)).toBe('loading')
    expect(canPreloadProtectedNetworks(pendingAccount)).toBe(false)
    expect(resolveAppAccessSurface({ ...pendingAccount, accountUnavailable: true })).toBe('authentication')
  })

  it('never preloads a network during an anonymous onboarding, lock or local-only task session', () => {
    const allowed = { ...restoredSession, canAccessProtected: true }
    expect(canPreloadProtectedNetworks(allowed)).toBe(true)
    for (const change of [{ onboardingCompleted: false }, { languageSelected: false }, { sessionLocked: true }, { localOnly: true }, { routePath: '/local-kanban' }]) {
      expect(canPreloadProtectedNetworks({ ...allowed, ...change })).toBe(false)
    }
  })

  it('keeps a new signed-out launch on authentication without mounting restored networks', () => {
    expect(resolveAppAccessSurface({ ...restoredSession, authenticated: false })).toBe('authentication')
  })

  it('waits for authentication before presenting any entitlement result', () => {
    for (const authenticated of [false, true]) {
      expect(resolveAppAccessSurface({ ...restoredSession, authenticated, authLoading: true })).toBe('loading')
    }
  })

  it('keeps failed and denied rights fail-closed and makes explicit login recovery independent', () => {
    expect(resolveAppAccessSurface(restoredSession)).toBe('access-gate')
    expect(resolveAppAccessSurface({ ...restoredSession, routePath: '/login' })).toBe('authentication')
    expect(resolveAppAccessSurface({ ...restoredSession, routePath: '/tasks' })).toBe('access-gate')
  })

  it('shows the lock screen before a failed entitlement or recovery route', () => {
    for (const routePath of ['/twitter', '/login', '/local-kanban']) {
      expect(resolveAppAccessSurface({ ...restoredSession, routePath, sessionLocked: true })).toBe('session-lock')
    }
  })

  it('opens protected work only after confirmed rights and removes it after sign-out', () => {
    expect(resolveAppAccessSurface({ ...restoredSession, canAccessProtected: true })).toBe('workspace')
    expect(resolveAppAccessSurface({ ...restoredSession, canAccessProtected: true, authenticated: false })).toBe('authentication')
  })

  it('allows local tasks only when no protected network or Bento can mount', () => {
    const local = { ...restoredSession, routePath: '/local-kanban', authenticated: false, activeNetworkUrl: null, bentoActive: false }
    expect(resolveAppAccessSurface(local)).toBe('workspace')
    expect(resolveAppAccessSurface({ ...local, bentoActive: true })).toBe('authentication')
    expect(resolveAppAccessSurface({ ...local, activeNetworkUrl: 'https://x.com' })).toBe('authentication')
  })
})
