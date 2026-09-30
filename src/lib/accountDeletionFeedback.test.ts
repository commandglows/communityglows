import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { accountDeletionConfirmed, awaitAccountDeletionConfirmation, dismissAccountDeletionConfirmation } from './accountDeletionFeedback'

describe('server-confirmed account deletion feedback', () => {
  beforeEach(dismissAccountDeletionConfirmation)
  afterEach(dismissAccountDeletionConfirmation)

  it('keeps success hidden until the server confirms destruction', async () => {
    let respond!: (result: unknown) => void
    const request = new Promise(resolve => { respond = resolve })
    const pending = awaitAccountDeletionConfirmation(() => request)
    expect(accountDeletionConfirmed.value).toBe(false)
    respond({ status: 'deleted' })
    await pending
    expect(accountDeletionConfirmed.value).toBe(true)
    dismissAccountDeletionConfirmation()
    expect(accountDeletionConfirmed.value).toBe(false)
  })

  it('does not show success on a rejected request', async () => {
    await expect(awaitAccountDeletionConfirmation(() => Promise.reject(new Error('server unavailable')))).rejects.toThrow('server unavailable')
    expect(accountDeletionConfirmed.value).toBe(false)
  })

  it.each([undefined, null, {}, { status: 'pending' }, { status: 'failed' }])('does not treat an unconfirmed response as destruction: %j', async (result) => {
    await expect(awaitAccountDeletionConfirmation(() => Promise.resolve(result))).rejects.toThrow('account_deletion_not_confirmed')
    expect(accountDeletionConfirmed.value).toBe(false)
  })

  it('accepts an explicit already-deleted server result', async () => {
    await awaitAccountDeletionConfirmation(() => Promise.resolve({ status: 'already_deleted' }))
    expect(accountDeletionConfirmed.value).toBe(true)
  })
})
