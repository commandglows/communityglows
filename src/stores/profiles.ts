import { defineStore } from "pinia"
import { resolveHiddenNetworkIds } from "@/config/socialNetworks"
import { syncSettingsPatch } from "@/lib/cloudSettings"
import {
  enqueueProfileRemove,
  enqueueProfileUpsert,
  flushCloudSyncQueue,
} from "@/lib/cloudSyncQueue"

export interface Profile {
  id: string
  name: string
  emoji: string
  avatar?: string // base64 data URL or remote URL
  hiddenNetworks?: string[] // network IDs hidden for this profile (e.g. ['tiktok', 'discord'])
  createdAt: number
  localOnly?: boolean
}

export type ProfileDraft = {
  name: string
  emoji?: string
  avatar?: string
  hiddenNetworks?: string[]
}

const DEFAULT_EMOJIS = ["🟦", "🟥", "🟩", "🟨", "🟪", "🟧", "⬛", "🔵"]
export const PROFILE_NAME_MAX_LENGTH = 64
export const PROFILE_EMOJI_MAX_LENGTH = 16
export const PROFILE_AVATAR_MAX_LENGTH = 300_000
const PROFILE_AVATAR_DATA_URL = /^data:image\/(?:png|jpeg|webp|gif);base64,/i

export function validateProfileDraft(draft: ProfileDraft): ProfileDraft {
  const name = draft.name.trim()
  const emoji = draft.emoji?.trim()
  if (!name) throw new Error("Profile name is required.")
  if (name.length > PROFILE_NAME_MAX_LENGTH)
    throw new Error("Profile name is too long.")
  if (emoji && emoji.length > PROFILE_EMOJI_MAX_LENGTH)
    throw new Error("Profile emoji is too long.")
  if (
    draft.avatar &&
    (draft.avatar.length > PROFILE_AVATAR_MAX_LENGTH ||
      (!PROFILE_AVATAR_DATA_URL.test(draft.avatar) &&
        !draft.avatar.startsWith("https://")))
  ) {
    throw new Error("Profile avatar is invalid or too large.")
  }
  if (
    draft.hiddenNetworks?.some(
      (networkId) => !networkId || networkId.length > 64,
    )
  ) {
    throw new Error("Profile network selection is invalid.")
  }
  return {
    name,
    emoji,
    avatar: draft.avatar,
    hiddenNetworks: resolveHiddenNetworkIds(draft.hiddenNetworks),
  }
}

export const useProfilesStore = defineStore("profiles", {
  state: () => ({
    profiles: [] as Profile[],
    activeProfileId: "" as string,
  }),

  getters: {
    activeProfile: (state): Profile | undefined =>
      state.profiles.find((p) => p.id === state.activeProfileId),
  },

  actions: {
    getPlaceholderProfile(): Profile | undefined {
      return this.profiles.length === 1 && this.profiles[0].localOnly
        ? this.profiles[0]
        : undefined
    },

    materializeProfile(profile: Profile) {
      if (!profile.localOnly) return
      profile.localOnly = false
    },

    /** Create a profile from one validated draft and make it active. */
    create(draft: ProfileDraft): Profile {
      const validated = validateProfileDraft(draft)
      const name = validated.name
      const placeholder = this.getPlaceholderProfile()
      if (placeholder) {
        placeholder.name = name
        placeholder.emoji =
          validated.emoji || placeholder.emoji || DEFAULT_EMOJIS[0]
        placeholder.avatar = validated.avatar
        placeholder.hiddenNetworks = [...(validated.hiddenNetworks ?? [])]
        this.materializeProfile(placeholder)
        this.activeProfileId = placeholder.id
        this.syncProfileToCloud(placeholder)
        this.syncActiveProfileToCloud(placeholder.id)
        return placeholder
      }

      const emoji =
        validated.emoji ||
        DEFAULT_EMOJIS[this.profiles.length % DEFAULT_EMOJIS.length]
      const profile: Profile = {
        id: crypto.randomUUID(),
        name,
        emoji,
        avatar: validated.avatar,
        hiddenNetworks: [...(validated.hiddenNetworks ?? [])],
        createdAt: Date.now(),
      }
      this.profiles.push(profile)
      this.activeProfileId = profile.id
      this.syncProfileToCloud(profile)
      this.syncActiveProfileToCloud(profile.id)
      return profile
    },

    /** Backwards-compatible name-only creation used by the mobile sheet. */
    add(name: string): Profile {
      return this.create({ name })
    },

    /** Apply all editable fields as one store mutation and one cloud upsert. */
    update(profileId: string, draft: ProfileDraft): Profile | undefined {
      const profile = this.profiles.find((item) => item.id === profileId)
      if (!profile) return undefined
      const validated = validateProfileDraft(draft)

      profile.name = validated.name
      profile.emoji = validated.emoji || profile.emoji || DEFAULT_EMOJIS[0]
      profile.avatar = validated.avatar
      profile.hiddenNetworks = [...(validated.hiddenNetworks ?? [])]
      this.materializeProfile(profile)
      this.syncProfileToCloud(profile)
      return profile
    },

    /** Remove a profile; switch to another if it was active. */
    remove(profileId: string) {
      const idx = this.profiles.findIndex((p) => p.id === profileId)
      if (idx === -1) return
      this.profiles.splice(idx, 1)
      if (this.activeProfileId === profileId) {
        this.activeProfileId = this.profiles[0]?.id ?? ""
        this.syncActiveProfileToCloud(this.activeProfileId || undefined)
      }
      this.removeProfileFromCloud(profileId)
    },

    /** Rename a profile. */
    rename(profileId: string, name: string) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) {
        profile.name = name
        this.materializeProfile(profile)
        this.syncProfileToCloud(profile)
      }
    },

    setEmoji(profileId: string, emoji: string) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) {
        profile.emoji = emoji
        this.materializeProfile(profile)
        this.syncProfileToCloud(profile)
      }
    },

    /** Set or clear a profile avatar (base64 data URL). */
    setAvatar(profileId: string, avatar: string | undefined) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) {
        profile.avatar = avatar
        this.materializeProfile(profile)
        this.syncProfileToCloud(profile)
      }
    },

    /** Switch the active profile. */
    setActive(profileId: string) {
      this.activeProfileId = profileId
      this.syncActiveProfileToCloud(profileId)
    },

    /** Toggle a network's visibility for a profile. */
    toggleNetworkHidden(profileId: string, networkId: string) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (!profile) return
      profile.hiddenNetworks = resolveHiddenNetworkIds(profile.hiddenNetworks)
      const idx = profile.hiddenNetworks.indexOf(networkId)
      if (idx === -1) {
        profile.hiddenNetworks.push(networkId)
      } else {
        profile.hiddenNetworks.splice(idx, 1)
      }
      this.materializeProfile(profile)
      this.syncProfileToCloud(profile)
    },

    /** Check if a network is hidden for a profile. */
    isNetworkHidden(profileId: string, networkId: string): boolean {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (!profile) return false
      return resolveHiddenNetworkIds(profile.hiddenNetworks).includes(networkId)
    },

    /**
     * Ensure at least one profile exists.
     * Called on app start — creates "Profile 1" on first launch.
     */
    ensureDefault(): Profile {
      if (this.profiles.length === 0) {
        const profile: Profile = {
          id: crypto.randomUUID(),
          name: "Profile 1",
          emoji: DEFAULT_EMOJIS[0],
          hiddenNetworks: resolveHiddenNetworkIds(),
          createdAt: Date.now(),
          localOnly: true,
        }
        this.profiles.push(profile)
        this.activeProfileId = profile.id
        return profile
      }
      if (
        !this.activeProfileId ||
        !this.profiles.find((p) => p.id === this.activeProfileId)
      ) {
        this.activeProfileId = this.profiles[0].id
      }
      return this.profiles.find((p) => p.id === this.activeProfileId)!
    },

    replaceFromCloud(
      cloudProfiles: Array<{
        profileId: string
        name: string
        emoji: string
        avatar?: string
        hiddenNetworks?: string[]
        createdAt: number
      }>,
      activeProfileId?: string,
    ) {
      this.profiles = cloudProfiles
        .map((profile) => ({
          id: profile.profileId,
          name: profile.name,
          emoji: profile.emoji,
          avatar: profile.avatar,
          hiddenNetworks: resolveHiddenNetworkIds(profile.hiddenNetworks),
          createdAt: profile.createdAt,
          localOnly: false,
        }))
        .sort((a, b) => a.createdAt - b.createdAt)
      this.activeProfileId =
        activeProfileId && this.profiles.some((p) => p.id === activeProfileId)
          ? activeProfileId
          : (this.profiles[0]?.id ?? "")
    },

    async syncProfileToCloud(profile: Profile) {
      if (profile.localOnly) return
      enqueueProfileUpsert({
        profileId: profile.id,
        name: profile.name,
        emoji: profile.emoji,
        avatar: profile.avatar,
        hiddenNetworks: resolveHiddenNetworkIds(profile.hiddenNetworks),
        createdAt: profile.createdAt,
      })
      await flushCloudSyncQueue()
    },

    async removeProfileFromCloud(profileId: string) {
      enqueueProfileRemove(profileId)
      await flushCloudSyncQueue()
    },

    async syncActiveProfileToCloud(profileId?: string) {
      if (profileId) {
        const profile = this.profiles.find((item) => item.id === profileId)
        if (profile?.localOnly) return
      }
      await syncSettingsPatch({ activeProfileId: profileId })
    },

    async seedCloud() {
      for (const profile of this.profiles) {
        if (profile.localOnly) continue
        await this.syncProfileToCloud(profile)
      }
      if (this.activeProfileId) {
        await this.syncActiveProfileToCloud(this.activeProfileId)
      }
      await flushCloudSyncQueue()
    },

    clearLocal() {
      this.profiles = []
      this.activeProfileId = ""
    },
  },

  persist: true,
})
