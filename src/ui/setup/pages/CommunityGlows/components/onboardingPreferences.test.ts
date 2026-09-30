import { describe, expect, it } from 'vitest'
import { onboardingProfileDraft } from './onboardingPreferences'

const profile = { id: 'personal', name: 'Existing profile', emoji: '🌊', avatar: 'https://example.com/avatar.png', hiddenNetworks: ['twitter', 'custom-link'], createdAt: 1 }
const choices = { name: '', emoji: '🟦', profileEdited: false, networksEdited: false, networkIds: ['twitter', 'linkedin'], selectedNetworks: new Set(['twitter']) }

describe('existing onboarding preferences', () => {
  it('does not overwrite anything when the introduction is skipped or replayed without edits', () => {
    expect(onboardingProfileDraft(profile, choices)).toBeNull()
  })

  it('keeps existing name, emoji, avatar and unrelated network choices when only networks change', () => {
    expect(onboardingProfileDraft(profile, { ...choices, networksEdited: true })).toEqual({
      name: profile.name, emoji: profile.emoji, avatar: profile.avatar, hiddenNetworks: ['custom-link', 'linkedin'],
    })
  })

  it('keeps all network preferences when only the profile changes', () => {
    expect(onboardingProfileDraft(profile, { ...choices, profileEdited: true, name: ' Work ' })).toEqual({
      name: 'Work', emoji: choices.emoji, avatar: profile.avatar, hiddenNetworks: profile.hiddenNetworks,
    })
  })
})
