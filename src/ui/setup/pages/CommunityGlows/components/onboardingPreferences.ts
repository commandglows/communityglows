import type { Profile, ProfileDraft } from '@/stores/profiles'

/** Tutorial replay changes only fields the user actually edited. */
export function onboardingProfileDraft(
  profile: Profile,
  choices: { name: string; emoji: string; profileEdited: boolean; networksEdited: boolean; networkIds: string[]; selectedNetworks: ReadonlySet<string> },
): ProfileDraft | null {
  if (!choices.profileEdited && !choices.networksEdited) return null
  const networkIds = new Set(choices.networkIds)
  return {
    name: choices.profileEdited && choices.name.trim() ? choices.name.trim() : profile.name,
    emoji: choices.profileEdited ? choices.emoji : profile.emoji,
    avatar: profile.avatar,
    hiddenNetworks: choices.networksEdited
      ? [...(profile.hiddenNetworks ?? []).filter(id => !networkIds.has(id)),
        ...choices.networkIds.filter(id => !choices.selectedNetworks.has(id))]
      : profile.hiddenNetworks,
  }
}
