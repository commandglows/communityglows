import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from '@vue/compiler-sfc'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'

function templateOf(fileName: string): string {
  const source = readFileSync(new URL(fileName, import.meta.url), 'utf8')
  const parsed = parse(source, { filename: fileName })
  expect(parsed.errors).toEqual([])
  return parsed.descriptor.template?.content ?? ''
}

describe('CommunityGlows billing UI contract', () => {
  it.each(['BillingAccessPanel.vue', 'ProductAccessGate.vue'])(
    '%s offers restart only through server eligibility and starts authenticated checkout',
    (fileName) => {
      const template = templateOf(fileName)
      expect(template).toContain('canRestartTrial')
      expect(template).toContain('restart')
      expect(template).toContain('purchase')
      expect(template).not.toContain('communityglows.com/lifetime-deal')
      expect(template).not.toContain('/api/commerce/checkout')
    },
  )

  it('keeps EN and FR keys aligned for restart, exhaustion and Stripe checkout', () => {
    const keys = [
      'status_trial_exhausted',
      'trial_exhausted_hint',
      'restarts_remaining',
      'restarts_exhausted',
      'restart_trial',
      'restart_success',
      'opening_checkout',
      'checkout_opened',
      'gate_trial_exhausted_title',
      'gate_trial_exhausted_message',
      'gate_access_required_title',
      'gate_access_required_message',
      'license_title',
      'license_purchased_on',
      'license_activated_on',
      'license_installations_count',
      'license_access_communityglows',
    ] as const

    for (const key of keys) {
      expect(en.billing[key]).toBeTruthy()
      expect(fr.billing[key]).toBeTruthy()
    }
  })

  it('renders the account-scoped licence summary without claiming a device cap', () => {
    const template = templateOf('BillingAccessPanel.vue')
    expect(template).toContain('showLicenseSummary')
    expect(template).toContain('recognizedInstallationsLabel')
    expect(template).toContain('licenseDateValue')
    expect(fr.billing.license_installations_note).toContain('Aucune limite')
    expect(en.billing.license_installations_note).toContain('No device limit')
  })

  it('offers localized trial reminders with a bounded snooze action', () => {
    const template = templateOf('BillingAccessPanel.vue')
    expect(template).toContain('trialReminder')
    expect(template).toContain('snoozeTrialReminder')
    expect(template).toContain('trialReminderTitleKey')
    expect(template).toContain('purchase')
    expect(en.billing.trial_reminder_title_7).toBeTruthy()
    expect(en.billing.trial_reminder_title_3).toBeTruthy()
    expect(en.billing.trial_reminder_title_1).toBeTruthy()
    expect(en.billing.trial_reminder_snooze).toBeTruthy()
    expect(fr.billing.trial_reminder_title_7).toBeTruthy()
    expect(fr.billing.trial_reminder_title_3).toBeTruthy()
    expect(fr.billing.trial_reminder_title_1).toBeTruthy()
    expect(fr.billing.trial_reminder_snooze).toBeTruthy()
    expect(fr.billing.trial_reminder_message).toContain('données restent en sécurité')
    expect(en.billing.trial_reminder_message).toContain('data stays safe')
    expect(fr.billing.trial_reminder_price).toContain('79 €')
    expect(en.billing.trial_reminder_price).toContain('€79')
  })

  it('turns the expired-access gate into an honest lifetime conversion moment', () => {
    const template = templateOf('ProductAccessGate.vue')
    expect(template).toContain('gate_value_title')
    expect(template).toContain('gate_lifetime_price')
    expect(template).toContain('gate_founder_note')
    expect(template).toContain('canRestartTrial')
    expect(template).toContain('recovery_paths_available')
    expect(fr.billing.gate_trial_expired_message).toContain('données restent en sécurité')
    expect(en.billing.gate_trial_expired_message).toContain('data stays safe')
    expect(fr.billing.gate_lifetime_price).toContain('79 €')
    expect(en.billing.gate_lifetime_price).toContain('€79')
  })
})
