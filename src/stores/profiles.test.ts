import { beforeEach, describe, expect, it, vi } from "vitest"
import { createPinia, setActivePinia } from "pinia"

const { syncProfile, syncActive } = vi.hoisted(() => ({
  syncProfile: vi.fn(),
  syncActive: vi.fn(),
}))

vi.mock("@/lib/cloudSyncQueue", () => ({
  enqueueProfileRemove: vi.fn(),
  enqueueProfileUpsert: syncProfile,
  flushCloudSyncQueue: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/cloudSettings", () => ({
  syncSettingsPatch: syncActive,
}))

import { useProfilesStore } from "./profiles"

describe("profiles store atomic drafts", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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
