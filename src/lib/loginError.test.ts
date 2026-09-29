import { describe, expect, it } from 'vitest'
import { loginErrorKey } from './loginError'

describe('login error presentation', () => {
  it('handles the opaque production error without claiming the account is absent', () => {
    expect(loginErrorKey(new Error('[CONVEX A(auth:signIn)] [Request ID: redacted] Server Error Called by client'), 'signIn')).toBe('login.sign_in_failed')
  })
  it('does not distinguish an unknown account from an incorrect password', () => {
    for (const message of ['InvalidAccountId', 'InvalidSecret']) {
      expect(loginErrorKey(new Error(message), 'signIn')).toBe('login.credentials_failed')
    }
  })
  it('keeps recovery specific to network, throttling and registration', () => {
    expect(loginErrorKey(new TypeError('Failed to fetch'), 'signIn')).toBe('login.network_failed')
    expect(loginErrorKey(new Error('TooManyFailedAttempts'), 'signIn')).toBe('login.too_many_attempts')
    expect(loginErrorKey({}, 'signUp')).toBe('login.sign_up_failed')
  })
  it('does not label a post-login sync failure as invalid credentials', () => {
    expect(loginErrorKey(new Error('Server Error'), 'signIn', true)).toBe('login.sync_failed')
  })
})
