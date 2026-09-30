import { beforeEach, describe, expect, it, vi } from "vitest"
import { createPinia, setActivePinia } from "pinia"

const { syncProfile, syncActive, removeDesktopProfile } = vi.hoisted(() => ({
  syncProfile: vi.fn(),
  syncActive: vi.fn(),
  removeDesktopProfile: vi.fn(),
}))

vi.mock("@/lib/cloudSyncQueue", () => ({
  enqueueProfileRemove: vi.fn(),
  enqueueProfileUpsert: syncProfile,
  flushCloudSyncQueue: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/cloudSettings", () => ({
  syncSettingsPatch: syncActive,
}))

vi.mock("@/stores/desktopWorkspaces", () => ({
  useDesktopWorkspacesStore: () => ({ removeProfile: removeDesktopProfile }),
}))

import { useProfilesStore } from "./profiles"
import { builtInSocialNetworks } from "@/config/socialNetworks"

describe("profiles store atomic drafts", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it("updates an entire category once without changing another profile or unrelated visibility", () => {
    const store = useProfilesStore()
    const first = store.create({ name: 'Work', hiddenNetworks: ['dex', 'clay', 'bento', 'reddit'] })
    const second = store.create({ name: 'Personal', hiddenNetworks: ['clarkup'] })
    vi.clearAllMocks()
    store.setNetworksHidden(first.id, ['breakcold', 'clarkup', 'clay', 'dex'], false)
    expect(store.profiles.find(p => p.id === first.id)?.hiddenNetworks).toEqual(['bento', 'reddit'])
    expect(store.profiles.find(p => p.id === second.id)?.hiddenNetworks).toEqual(['clarkup'])
    expect(syncProfile).toHaveBeenCalledTimes(1)
    store.setNetworksHidden(first.id, ['breakcold', 'clarkup', 'clay', 'dex'], true)
    expect(store.profiles.find(p => p.id === first.id)?.hiddenNetworks).toEqual(['bento', 'reddit', 'breakcold', 'clarkup', 'clay', 'dex'])
    expect(syncProfile).toHaveBeenCalledTimes(2)
  })

  it("applies onboarding details and network selection in one cloud upsert", () => {
    const store = useProfilesStore()
    const profile = store.create({
      name: "Travail",
      hiddenNetworks: ["reddit", "bento", "unrelated-network"],
    })
    vi.clearAllMocks()

    store.applyOnboardingSetup(profile.id, {
      name: "Personnel",
      emoji: "🟣",
      networkIds: ["twitter", "facebook", "instagram"],
      selectedNetworkIds: ["twitter", "instagram"],
    })

    expect(profile.name).toBe("Personnel")
    expect(profile.emoji).toBe("🟣")
    expect(profile.hiddenNetworks).toEqual([
      "reddit",
      "bento",
      "unrelated-network",
      "facebook",
    ])
    expect(syncProfile).toHaveBeenCalledTimes(1)
    expect(syncProfile).toHaveBeenCalledWith(expect.objectContaining({
      profileId: profile.id,
      hiddenNetworks: ["reddit", "bento", "unrelated-network", "facebook"],
    }))
  })

  it("creates exactly one complete profile from one draft", () => {
    const store = useProfilesStore()
    const profile = store.create({
      name: "  Diane  ",
      emoji: "🟪",
      avatar: "data:image/png;base64,AA==",
      hiddenNetworks: ["reddit"],
    })

    expect(store.profiles).toHaveLength(1)
    expect(profile).toMatchObject({
      name: "Diane",
      emoji: "🟪",
      avatar: "data:image/png;base64,AA==",
      hiddenNetworks: ["reddit"],
    })
    expect(store.activeProfileId).toBe(profile.id)
    expect(syncProfile).toHaveBeenCalledTimes(1)
  })

  it("updates all editable fields with one cloud upsert", () => {
    const store = useProfilesStore()
    const profile = store.create({ name: "Initial" })
    vi.clearAllMocks()

    store.update(profile.id, {
      name: "Travail",
      emoji: "🟦",
      avatar: undefined,
      hiddenNetworks: ["tiktok", "discord"],
    })

    expect(store.profiles).toHaveLength(1)
    expect(store.profiles[0]).toMatchObject({
      name: "Travail",
      emoji: "🟦",
      hiddenNetworks: ["tiktok", "discord"],
    })
    expect(syncProfile).toHaveBeenCalledTimes(1)
  })

  it("keeps add as a single name-only compatibility operation", () => {
    const store = useProfilesStore()
    store.add("Personnel")

    expect(store.profiles).toHaveLength(1)
    expect(store.profiles[0].name).toBe("Personnel")
    expect(store.profiles[0].hiddenNetworks).toEqual(
      builtInSocialNetworks
        .filter((network) => !network.defaultSelected)
        .map((network) => network.id),
    )
  })

  it("starts a legacy profile visibility toggle from catalogue defaults", () => {
    const store = useProfilesStore()
    const optionalNetwork = builtInSocialNetworks.find(
      (network) => !network.defaultSelected,
    )!
    store.profiles = [{
      id: "legacy-profile",
      name: "Legacy",
      emoji: "🟦",
      createdAt: 1,
    }]
    store.activeProfileId = "legacy-profile"

    expect(store.isNetworkHidden("legacy-profile", optionalNetwork.id)).toBe(true)

    store.toggleNetworkHidden("legacy-profile", optionalNetwork.id)

    expect(store.isNetworkHidden("legacy-profile", optionalNetwork.id)).toBe(false)
  })

  it("rejects an invalid draft before mutating local or cloud state", () => {
    const store = useProfilesStore()

    expect(() =>
      store.create({
        name: "Profil invalide",
        avatar: "data:image/svg+xml;base64,PHN2Zz4=",
      }),
    ).toThrow("Profile avatar is invalid or too large.")

    expect(store.profiles).toHaveLength(0)
    expect(syncProfile).not.toHaveBeenCalled()
    expect(syncActive).not.toHaveBeenCalled()
  })

  it("removes the profile scenes before deleting the profile", () => {
    const store = useProfilesStore()
    const first = store.create({ name: "Travail" })
    store.create({ name: "Personnel" })
    vi.clearAllMocks()

    store.remove(first.id)

    expect(removeDesktopProfile).toHaveBeenCalledWith(first.id)
    expect(store.profiles.some((profile) => profile.id === first.id)).toBe(false)
  })

  it("materializes the initial placeholder without creating a duplicate", () => {
    const store = useProfilesStore()
    const placeholder = store.ensureDefault()

    const profile = store.create({
      name: "Travail",
      hiddenNetworks: ["reddit"],
    })

    expect(profile.id).toBe(placeholder.id)
    expect(store.profiles).toHaveLength(1)
    expect(store.profiles[0]).toMatchObject({
      name: "Travail",
      hiddenNetworks: ["reddit"],
      localOnly: false,
    })
    expect(syncProfile).toHaveBeenCalledTimes(1)
  })
})
