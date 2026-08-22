import { computed, onMounted, onUnmounted, ref, type ComputedRef } from 'vue'

export const TRIAL_REMINDER_STORAGE_KEY = 'communityglows_trial_reminder_v1'
export const TRIAL_REMINDER_SNOOZE_MS = 24 * 60 * 60 * 1000

const TRIAL_REMINDER_REFRESH_MS = 60 * 60 * 1000
const TRIAL_REMINDER_MILESTONES = [1, 3, 7] as const

export type TrialReminderMilestone = (typeof TRIAL_REMINDER_MILESTONES)[number]

export interface TrialReminderState {
  cycleKey: string
  milestone: TrialReminderMilestone
  snoozedUntil: number
}

export interface TrialReminderDecision {
  cycleKey: string
  daysRemaining: number
  milestone: TrialReminderMilestone
}

function isFiniteTimestamp(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function getTrialReminderCycleKey(
  trialStartedAt: number | null | undefined,
  trialEndsAt: number | null | undefined,
): string | null {
  if (!isFiniteTimestamp(trialStartedAt) || !isFiniteTimestamp(trialEndsAt)) return null
  if (trialStartedAt >= trialEndsAt) return null
  return `${trialStartedAt}:${trialEndsAt}`
}

export function getTrialReminderDecision({
  enabled,
  now,
  state,
  trialEndsAt,
  trialStartedAt,
}: {
  enabled: boolean
  now: number
  state: TrialReminderState | null
  trialEndsAt: number | null | undefined
  trialStartedAt: number | null | undefined
}): TrialReminderDecision | null {
  if (!enabled || !isFiniteTimestamp(now)) return null

  const cycleKey = getTrialReminderCycleKey(trialStartedAt, trialEndsAt)
  if (!cycleKey || !isFiniteTimestamp(trialEndsAt) || trialEndsAt <= now) return null

  const remainingMs = trialEndsAt - now
  const milestone = TRIAL_REMINDER_MILESTONES.find(
    (candidate) => remainingMs <= candidate * TRIAL_REMINDER_SNOOZE_MS,
  )
  if (!milestone) return null

  if (
    state?.cycleKey === cycleKey &&
    state.milestone === milestone &&
    state.snoozedUntil > now
  ) {
    return null
  }

  return {
    cycleKey,
    daysRemaining: Math.max(1, Math.ceil(remainingMs / TRIAL_REMINDER_SNOOZE_MS)),
    milestone,
  }
}

export function createTrialReminderSnooze(
  decision: TrialReminderDecision,
  now: number,
): TrialReminderState {
  return {
    cycleKey: decision.cycleKey,
    milestone: decision.milestone,
    snoozedUntil: now + TRIAL_REMINDER_SNOOZE_MS,
  }
}

function readReminderState(): TrialReminderState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(TRIAL_REMINDER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TrialReminderState>
    if (
      typeof parsed.cycleKey !== 'string' ||
      !TRIAL_REMINDER_MILESTONES.includes(parsed.milestone as TrialReminderMilestone) ||
      !isFiniteTimestamp(parsed.snoozedUntil)
    ) {
      return null
    }
    return parsed as TrialReminderState
  } catch {
    return null
  }
}

function writeReminderState(state: TrialReminderState) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(TRIAL_REMINDER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // A storage failure must not break access or extend the trial window.
  }
}

export function useTrialReminder(
  enabled: ComputedRef<boolean>,
  trialStartedAt: ComputedRef<number | null | undefined>,
  trialEndsAt: ComputedRef<number | null | undefined>,
) {
  const now = ref(Date.now())
  const state = ref<TrialReminderState | null>(readReminderState())
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const reminder = computed(() => getTrialReminderDecision({
    enabled: enabled.value,
    now: now.value,
    state: state.value,
    trialEndsAt: trialEndsAt.value,
    trialStartedAt: trialStartedAt.value,
  }))

  function snooze() {
    if (!reminder.value) return
    const snoozedAt = Date.now()
    const nextState = createTrialReminderSnooze(reminder.value, snoozedAt)
    state.value = nextState
    now.value = snoozedAt
    writeReminderState(nextState)
  }

  onMounted(() => {
    now.value = Date.now()
    refreshTimer = setInterval(() => {
      now.value = Date.now()
    }, TRIAL_REMINDER_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer !== null) clearInterval(refreshTimer)
  })

  return {
    reminder,
    snooze,
  }
}
