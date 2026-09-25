/** Translate failures without exposing provider internals or account existence. */
export function loginErrorKey(
  error: unknown,
  flow: 'signIn' | 'signUp',
  authenticated = false,
): string {
  if (authenticated) return 'login.sync_failed'
  const message = error instanceof Error ? error.message : ''
  if (/TooManyFailedAttempts|rate.?limit/i.test(message)) {
    return 'login.too_many_attempts'
  }
  if (/network|fetch|connection|socket|timed? ?out/i.test(message)) {
    return 'login.network_failed'
  }
  if (/InvalidAccountId|InvalidSecret|InvalidCredentials/i.test(message)) {
    return 'login.credentials_failed'
  }
  return flow === 'signUp' ? 'login.sign_up_failed' : 'login.sign_in_failed'
}
