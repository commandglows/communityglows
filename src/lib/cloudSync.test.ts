import { describe, expect, it, vi } from "vitest";

vi.mock("@/utils/i18n", () => ({
  setLocale: vi.fn(),
}));

import {
  asCloudActiveAccounts,
  asCloudCustomLinks,
  asCloudFriendFilters,
  asCloudProfiles,
  asCloudSettings,
  asCloudSocialAccounts,
  waitForCloudQuery,
} from "@/lib/cloudSync";

describe("cloud sync runtime payload validation", () => {
  it("fails terminally when a cloud query never resolves", async () => {
    vi.useFakeTimers();
    const pending = waitForCloudQuery("profiles", new Promise<never>(() => undefined), 1000);
    const rejection = expect(pending).rejects.toThrow("profiles");

    await vi.advanceTimersByTimeAsync(1000);

    await rejection;
    vi.useRealTimers();
  });

  it("keeps only valid settings fields", () => {
    expect(
      asCloudSettings({
        theme: "dark",
        language: "fr",
        textZoom: 120,
        uiScale: 115,
        iconScale: 30,
        tapSoundVariant: "pop",
        activeProfileId: "profile-1",
        friendsFilterEnabled: true,
        grayscaleEnabled: "yes",
        onboardingCompleted: "no",
        hapticEnabled: false,
        extra: "ignored",
      }),
    ).toEqual({
      theme: "dark",
      language: "fr",
      textZoom: 120,
      uiScale: 115,
      iconScale: 30,
      tapSoundVariant: "pop",
      activeProfileId: "profile-1",
      friendsFilterEnabled: true,
      hapticEnabled: false,
    });

    expect(asCloudSettings({ textZoom: 50 })).toEqual({ textZoom: 50 });
    expect(asCloudSettings({ uiScale: 75 })).toEqual({ uiScale: 75 });
    expect(asCloudSettings({ iconScale: 15 })).toEqual({ iconScale: 15 });
    expect(asCloudSettings({ theme: "purple", textZoom: 45, uiScale: 155 })).toBeNull();
    expect(asCloudSettings(null)).toBeNull();
  });

  it("filters malformed profiles before applying cloud data", () => {
    expect(
      asCloudProfiles([
        {
          profileId: "profile-1",
          name: "Work",
          emoji: "W",
          hiddenNetworks: ["twitter", "linkedin"],
          createdAt: 123,
        },
        {
          profileId: "bad profile",
          name: "Bad",
          emoji: "B",
          createdAt: 123,
        },
        {
          profileId: "profile-2",
          name: "Invalid hidden network",
          emoji: "I",
          hiddenNetworks: ["Twitter"],
          createdAt: 123,
        },
      ]),
    ).toEqual([
      {
        profileId: "profile-1",
        name: "Work",
        emoji: "W",
        hiddenNetworks: ["twitter", "linkedin"],
        createdAt: 123,
      },
    ]);
  });

  it("filters malformed custom links", () => {
    expect(
      asCloudCustomLinks([
        {
          linkId: "custom-1",
          profileId: "profile-1",
          label: "Docs",
          url: "https://example.com",
          icon: "pi pi-link",
        },
        {
          linkId: "custom-2",
          profileId: "profile-1",
          label: "Bad",
          url: "javascript:alert(1)",
          icon: "pi pi-link",
        },
      ]),
    ).toEqual([
      {
        linkId: "custom-1",
        profileId: "profile-1",
        label: "Docs",
        url: "https://example.com",
        icon: "pi pi-link",
      },
    ]);
  });

  it("filters malformed friends filters and account payloads", () => {
    expect(
      asCloudFriendFilters([
        { networkId: "twitter", names: ["Alice", "Bob"] },
        { networkId: "Twitter", names: ["Alice"] },
        { networkId: "reddit", names: ["Alice", "alice"] },
      ]),
    ).toEqual([{ networkId: "twitter", names: ["Alice", "Bob"] }]);

    expect(
      asCloudSocialAccounts([
        { accountId: "account-1", networkId: "twitter", label: "Main", addedAt: 1 },
        { accountId: "account 2", networkId: "twitter", label: "Bad", addedAt: 1 },
      ]),
    ).toEqual([{ accountId: "account-1", networkId: "twitter", label: "Main", addedAt: 1 }]);

    expect(
      asCloudActiveAccounts([
        { networkId: "twitter", accountId: "account-1" },
        { networkId: "Twitter", accountId: "account-2" },
      ]),
    ).toEqual([{ networkId: "twitter", accountId: "account-1" }]);
  });
});
