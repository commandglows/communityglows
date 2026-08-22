import { describe, expect, it } from 'vitest'
import {
  TRIAL_REMINDER_SNOOZE_MS,
  createTrialReminderSnooze,
  getTrialReminderCycleKey,
  getTrialReminderDecision,
} from './useTrialReminder'

const DAY_MS = TRIAL_REMINDER_SNOOZE_MS
const START = 1_000

function decision(daysRemaining: number, state = null) {
  const now = START + DAY_MS
  return getTrialReminderDecision({
    enabled: true,
    now,
    state,
    trialStartedAt: START,
    trialEndsAt: now + daysRemaining * DAY_MS,
  })
}

describe('trial reminder milestones', () => {
  it.each([
    [8, null],
    [7, 7],
    [4, 7],
    [3, 3],
    [2, 3],
    [1, 1],
  ])('maps %s remaining days to milestone %s', (daysRemaining, milestone) => {
    expect(decision(daysRemaining)?.milestone ?? null).toBe(milestone)
  })

  it('does not show for inactive, expired, or malformed trial windows', () => {
    const now = START + DAY_MS
    expect(getTrialReminderDecision({
      enabled: false,
      now,
      state: null,
      trialStartedAt: START,
      trialEndsAt: now + DAY_MS,
    })).toBeNull()
    expect(getTrialReminderDecision({
      enabled: true,
      now,
      state: null,
      trialStartedAt: START,
      trialEndsAt: now,
    })).toBeNull()
    expect(getTrialReminderCycleKey(now, START)).toBeNull()
  })

  it('hides only the snoozed milestone for its exact trial cycle', () => {
    const current = decision(3)
    expect(current).not.toBeNull()
    const now = START + DAY_MS
    const snoozed = createTrialReminderSnooze(current!, now)

    expect(getTrialReminderDecision({
      enabled: true,
      now: now + DAY_MS / 2,
      state: snoozed,
      trialStartedAt: START,
      trialEndsAt: now + 3 * DAY_MS,
    })).toBeNull()

    expect(getTrialReminderDecision({
      enabled: true,
      now: now + DAY_MS + 1,
      state: snoozed,
      trialStartedAt: START,
      trialEndsAt: now + 3 * DAY_MS,
    })?.milestone).toBe(3)

    expect(getTrialReminderDecision({
      enabled: true,
      now: now + DAY_MS / 2,
      state: snoozed,
      trialStartedAt: START + 1,
      trialEndsAt: now + 3 * DAY_MS,
    })?.milestone).toBe(3)
  })
})
