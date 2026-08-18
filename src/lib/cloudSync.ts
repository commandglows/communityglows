import { getConvexClient } from "@/lib/convex";
import { isAuthenticated } from "@/lib/convexAuth";
import { syncSettingsPatch } from "@/lib/cloudSettings";
import {
  clearCloudSyncQueue,
  flushCloudSyncQueue,
  hasPendingCloudSync,
} from "@/lib/cloudSyncQueue";
import { api } from "../../convex/_generated/api";
import { useAccountsStore } from "@/stores/accounts";
import { useProfilesStore } from "@/stores/profiles";
import { useCustomLinksStore } from "@/stores/customLinks";
import { useFriendsFilterStore } from "@/stores/friendsFilter";
import { useThemeStore } from "@/stores/theme";
import { useOnboardingStore } from "@/stores/onboarding";
import { useShortcutsStore } from "@/stores/shortcuts";
import { useContextualTasksStore } from "@/stores/contextualTasks";
import { useKanbanStore } from "@/stores/kanban";
import { setLocale } from "@/utils/i18n";
import type { AppShortcut } from "@/stores/shortcuts";
import {
  advancePostAuthSyncStage,
  beginPostAuthSyncFeedback,
  queuePostAuthReadyNotice,
  resetPostAuthSyncFeedback,
  showPostAuthReadyFeedback,
} from "@/lib/postAuthSyncFeedback";
import type { ThemeMode } from "@/utils/themeAuto";
import { normalizeTapSoundVariant } from "@/ui/setup/pages/CommunityGlows/utils/tapSound";
import {
  canReuseLocalCloudState,
  isCloudSnapshotEmpty,
  shouldKeepLocalWhenCloudEmpty,
  type CloudSnapshotShape,
} from "@/lib/cloudSyncDecisions";
import type { CloudSettingsPatch } from "@/lib/cloudSettings";
import { recordDiagnosticEvent } from "@/lib/buildDiagnostics";

type CloudSnapshot = CloudSnapshotShape & {
  settings: CloudSettings | null;
  profiles: CloudProfile[];
  customLinks: CloudCustomLink[];
  friendsFilters: CloudFriendFilter[];
  socialAccounts: CloudSocialAccount[];
  activeAccounts: CloudActiveAccount[];
  workspaceState: { contextualTasksJson?: string; kanbanStateJson?: string } | null;
};

type CloudSettings = Pick<
  CloudSettingsPatch,
  | "theme"
  | "language"
  | "grayscaleEnabled"
  | "textZoom"
  | "uiScale"
  | "hapticEnabled"
  | "tapSoundEnabled"
  | "tapSoundVariant"
  | "activeProfileId"
  | "onboardingCompleted"
  | "friendsFilterEnabled"
  | "keyboardShortcuts"
>;

type CloudProfile = {
  profileId: string;
  name: string;
  emoji: string;
  avatar?: string;
  hiddenNetworks?: string[];
  createdAt: number;
};

type CloudCustomLink = {
  linkId: string;
  profileId: string;
  label: string;
  url: string;
  icon: string;
};

type CloudFriendFilter = {
  networkId: string;
  names: string[];
};

type CloudSocialAccount = {
  accountId: string;
  networkId: string;
  label: string;
  addedAt: number;
};

type CloudActiveAccount = {
  networkId: string;
  accountId: string;
};

const ID_PATTERN = /^[a-zA-Z0-9:_-]+$/;
const NETWORK_ID_PATTERN = /^[a-z0-9-]+$/;
const LANGUAGE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const IMAGE_DATA_URL_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;
const ID_MAX = 128;
const NETWORK_ID_MAX = 32;
const LABEL_MAX = 80;
const PROFILE_NAME_MAX = 64;
const EMOJI_MAX = 16;
const AVATAR_MAX = 300_000;
const CUSTOM_LINK_URL_MAX = 2048;
const CUSTOM_LINK_ICON_MAX = 64;
const HIDDEN_NETWORKS_MAX = 32;
const FRIEND_NAME_MAX = 80;
const FRIEND_NAMES_MAX = 200;
const TEXT_ZOOM_MIN = 50;
const TEXT_ZOOM_MAX = 200;
const UI_SCALE_MIN = 75;
const UI_SCALE_MAX = 150;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTrimmedBoundedString(value: unknown, max: number): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= max
    && value.trim() === value;
}

function isEntityId(value: unknown): value is string {
  return isTrimmedBoundedString(value, ID_MAX) && ID_PATTERN.test(value);
}

function isNetworkId(value: unknown): value is string {
  return isTrimmedBoundedString(value, NETWORK_ID_MAX) && NETWORK_ID_PATTERN.test(value);
}

function isHttpUrl(value: unknown): value is string {
  if (
    !isTrimmedBoundedString(value, CUSTOM_LINK_URL_MAX)
    || value.includes("\n")
    || value.includes("\r")
  ) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isAvatar(value: unknown): value is string | undefined {
  if (value === undefined) return true;
  if (!isTrimmedBoundedString(value, AVATAR_MAX)) return false;
  if (value.startsWith("data:")) return IMAGE_DATA_URL_PATTERN.test(value);
  return isHttpUrl(value);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "auto";
}

function isTapSoundVariant(value: unknown): value is NonNullable<CloudSettings["tapSoundVariant"]> {
  return value === "classic" || value === "soft" || value === "pop";
}

function isTextZoom(value: unknown): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= TEXT_ZOOM_MIN
    && value <= TEXT_ZOOM_MAX;
}

function isUiScale(value: unknown): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= UI_SCALE_MIN
    && value <= UI_SCALE_MAX;
}

function asStringArray(
  value: unknown,
  itemGuard: (item: unknown) => item is string,
  max: number,
) {
  if (!Array.isArray(value) || value.length > max) return null;
  const next: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!itemGuard(item) || typeof item !== "string") return null;
    const normalized = item.toLowerCase();
    if (seen.has(normalized)) return null;
    seen.add(normalized);
    next.push(item);
  }

  return next;
}

export function asCloudSettings(value: unknown): CloudSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  const settings: CloudSettings = {};

  if (isThemeMode(value.theme)) settings.theme = value.theme;
  if (typeof value.language === "string" && LANGUAGE_PATTERN.test(value.language)) {
    settings.language = value.language;
  }
  if (typeof value.grayscaleEnabled === "boolean") settings.grayscaleEnabled = value.grayscaleEnabled;
  if (isTextZoom(value.textZoom)) settings.textZoom = value.textZoom;
  if (isUiScale(value.uiScale)) settings.uiScale = value.uiScale;
  if (typeof value.hapticEnabled === "boolean") settings.hapticEnabled = value.hapticEnabled;
  if (typeof value.tapSoundEnabled === "boolean") settings.tapSoundEnabled = value.tapSoundEnabled;
  if (isTapSoundVariant(value.tapSoundVariant)) settings.tapSoundVariant = value.tapSoundVariant;
  if (isEntityId(value.activeProfileId)) settings.activeProfileId = value.activeProfileId;
  if (Object.prototype.hasOwnProperty.call(value, "keyboardShortcuts")) {
    const keyboardShortcuts = value.keyboardShortcuts;
    if (Array.isArray(keyboardShortcuts)) {
      settings.keyboardShortcuts = keyboardShortcuts as AppShortcut[];
    }
  }
  if (typeof value.onboardingCompleted === "boolean") {
    settings.onboardingCompleted = value.onboardingCompleted;
  }
  if (typeof value.friendsFilterEnabled === "boolean") {
    settings.friendsFilterEnabled = value.friendsFilterEnabled;
  }

  return Object.keys(settings).length > 0 ? settings : null;
}

function asCloudProfile(value: unknown): CloudProfile | null {
  if (!isRecord(value)) return null;
  if (
    !isEntityId(value.profileId)
    || !isTrimmedBoundedString(value.name, PROFILE_NAME_MAX)
    || !isTrimmedBoundedString(value.emoji, EMOJI_MAX)
    || !isAvatar(value.avatar)
    || typeof value.createdAt !== "number"
    || !Number.isFinite(value.createdAt)
  ) {
    return null;
  }

  const hiddenNetworks = value.hiddenNetworks === undefined
    ? undefined
    : asStringArray(value.hiddenNetworks, isNetworkId, HIDDEN_NETWORKS_MAX);
  if (hiddenNetworks === null) return null;

  return {
    profileId: value.profileId,
    name: value.name,
    emoji: value.emoji,
    avatar: typeof value.avatar === "string" ? value.avatar : undefined,
    hiddenNetworks,
    createdAt: value.createdAt,
  };
}

export function asCloudProfiles(value: unknown): CloudProfile[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const profile = asCloudProfile(item);
    return profile ? [profile] : [];
  });
}

function asCloudCustomLink(value: unknown): CloudCustomLink | null {
  if (!isRecord(value)) return null;
  if (
    !isEntityId(value.linkId)
    || !isEntityId(value.profileId)
    || !isTrimmedBoundedString(value.label, LABEL_MAX)
    || !isHttpUrl(value.url)
    || !isTrimmedBoundedString(value.icon, CUSTOM_LINK_ICON_MAX)
  ) {
    return null;
  }

  return {
    linkId: value.linkId,
    profileId: value.profileId,
    label: value.label,
    url: value.url,
    icon: value.icon,
  };
}

export function asCloudCustomLinks(value: unknown): CloudCustomLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const link = asCloudCustomLink(item);
    return link ? [link] : [];
  });
}

function asCloudFriendFilter(value: unknown): CloudFriendFilter | null {
  if (!isRecord(value) || !isNetworkId(value.networkId)) return null;
  const names = asStringArray(
    value.names,
    (item) => isTrimmedBoundedString(item, FRIEND_NAME_MAX),
    FRIEND_NAMES_MAX,
  );
  if (!names) return null;
  return {
    networkId: value.networkId,
    names,
  };
}

export function asCloudFriendFilters(value: unknown): CloudFriendFilter[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const filter = asCloudFriendFilter(item);
    return filter ? [filter] : [];
  });
}

function asCloudSocialAccount(value: unknown): CloudSocialAccount | null {
  if (!isRecord(value)) return null;
  if (
    !isEntityId(value.accountId)
    || !isNetworkId(value.networkId)
    || !isTrimmedBoundedString(value.label, LABEL_MAX)
    || typeof value.addedAt !== "number"
    || !Number.isFinite(value.addedAt)
  ) {
    return null;
  }

  return {
    accountId: value.accountId,
    networkId: value.networkId,
    label: value.label,
    addedAt: value.addedAt,
  };
}

export function asCloudSocialAccounts(value: unknown): CloudSocialAccount[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const account = asCloudSocialAccount(item);
    return account ? [account] : [];
  });
}

function asCloudActiveAccount(value: unknown): CloudActiveAccount | null {
  if (!isRecord(value)) return null;
  if (!isNetworkId(value.networkId) || !isEntityId(value.accountId)) return null;
  return {
    networkId: value.networkId,
    accountId: value.accountId,
  };
}

export function asCloudActiveAccounts(value: unknown): CloudActiveAccount[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const account = asCloudActiveAccount(item);
    return account ? [account] : [];
  });
}

let hydratedUserId: string | null = null;
let hydratePromise: Promise<void> | null = null;
const REOPEN_SETTINGS_AFTER_AUTH_KEY = "communityglows_reopen_settings_after_auth";
const CLOUD_SYNC_USER_ID_KEY = "communityglows_cloud_sync_user_id";
const AUTH_RELOAD_DELAY_MS = 3000;
const CLOUD_QUERY_TIMEOUT_MS = 15_000;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getRememberedCloudUserId() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(CLOUD_SYNC_USER_ID_KEY);
}

function rememberCloudUserId(userId: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(CLOUD_SYNC_USER_ID_KEY, userId);
}

function clearRememberedCloudUserId() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CLOUD_SYNC_USER_ID_KEY);
}

export async function waitForCloudQuery<T>(
  stage: string,
  queryPromise: Promise<T>,
  timeoutMs = CLOUD_QUERY_TIMEOUT_MS,
): Promise<T> {
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  recordDiagnosticEvent({ area: "cloud-sync", stage: `query-${stage}`, status: "start" });
  try {
    const result = await Promise.race([
      queryPromise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          recordDiagnosticEvent({ area: "cloud-sync", stage: `query-${stage}`, status: "timeout" });
          reject(new Error(`Le chargement cloud a expiré (${stage}). Réessayez.`));
        }, timeoutMs);
      }),
    ]);
    recordDiagnosticEvent({ area: "cloud-sync", stage: `query-${stage}`, status: "success" });
    return result;
  } catch (error) {
    if (!timedOut) {
      recordDiagnosticEvent({ area: "cloud-sync", stage: `query-${stage}`, status: "error" });
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchCloudSnapshot(client: ReturnType<typeof getConvexClient>): Promise<CloudSnapshot> {
  const [
    settings,
    profiles,
    customLinks,
    friendsFilters,
    socialAccounts,
    activeAccounts,
    workspaceState,
  ] = await Promise.all([
    waitForCloudQuery("settings", client.query(api.settings.get, {})),
    waitForCloudQuery("profiles", client.query(api.profiles.list, {})),
    waitForCloudQuery("custom-links", client.query(api.customLinks.list, {})),
    waitForCloudQuery("friends-filters", client.query(api.friendsFilters.list, {})),
    waitForCloudQuery("social-accounts", client.query(api.socialAccounts.list, {})),
    waitForCloudQuery("active-accounts", client.query(api.socialAccounts.listActive, {})),
    waitForCloudQuery("workspace", client.query(api.workspaceState.get, {})),
  ]);

  return {
    settings: asCloudSettings(settings),
    profiles: asCloudProfiles(profiles),
    customLinks: asCloudCustomLinks(customLinks),
    friendsFilters: asCloudFriendFilters(friendsFilters),
    socialAccounts: asCloudSocialAccounts(socialAccounts),
    activeAccounts: asCloudActiveAccounts(activeAccounts),
    workspaceState: workspaceState && typeof workspaceState === "object"
      ? {
          contextualTasksJson: typeof workspaceState.contextualTasksJson === "string"
            ? workspaceState.contextualTasksJson
            : undefined,
          kanbanStateJson: typeof workspaceState.kanbanStateJson === "string"
            ? workspaceState.kanbanStateJson
            : undefined,
        }
      : null,
  };
}

function applyCloudSettings(settings: CloudSettings | null) {
  const themeStore = useThemeStore();
  const profilesStore = useProfilesStore();
  const friendsStore = useFriendsFilterStore();
  const onboardingStore = useOnboardingStore();
  const shortcutsStore = useShortcutsStore();

  if (!settings) return false;

  themeStore.applyCloudPreferences(settings);

  if (typeof settings.language === "string") {
    setLocale(settings.language, false);
  }

  if (typeof settings.activeProfileId === "string") {
    profilesStore.activeProfileId = settings.activeProfileId;
  }

  if (Object.prototype.hasOwnProperty.call(settings, "keyboardShortcuts")) {
    shortcutsStore.setFromCloud(settings.keyboardShortcuts);
  }

  if (typeof settings.friendsFilterEnabled === "boolean") {
    friendsStore.enabled = settings.friendsFilterEnabled;
  }

  if (typeof settings.onboardingCompleted === "boolean") {
    onboardingStore.completed = settings.onboardingCompleted;
  }

  return true;
}

function clearCloudBackedLocalState() {
  const profilesStore = useProfilesStore();
  const accountsStore = useAccountsStore();
  const tasksStore = useContextualTasksStore();
  const kanbanStore = useKanbanStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const themeStore = useThemeStore();
  const onboardingStore = useOnboardingStore();

  profilesStore.clearLocal();
  accountsStore.clearLocal();
  customLinksStore.clearLocal();
  friendsStore.clearLocal();
  tasksStore.clearLocal();
  kanbanStore.clearLocal();
  themeStore.resetLocalPreferences();
  onboardingStore.completed = false;

  localStorage.removeItem("user-locale");
  localStorage.removeItem("theme");
  localStorage.removeItem("grayscale");
  localStorage.removeItem("communityglows_haptic");
  localStorage.removeItem("communityglows_tap_sound");
  localStorage.removeItem("communityglows_tap_sound_variant");
  localStorage.removeItem("communityglows_text_zoom");
  localStorage.removeItem("communityglows_ui_scale");
  localStorage.removeItem("communityglows_keyboard_shortcuts");
  clearCloudSyncQueue();
}

function applyCloudSnapshot(snapshot: CloudSnapshot) {
  const profilesStore = useProfilesStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const accountsStore = useAccountsStore();
  const tasksStore = useContextualTasksStore();
  const kanbanStore = useKanbanStore();

  const settings = asCloudSettings(snapshot.settings);
  applyCloudSettings(settings);
  profilesStore.replaceFromCloud(snapshot.profiles, settings?.activeProfileId);
  customLinksStore.replaceFromCloud(snapshot.customLinks);
  friendsStore.replaceFromCloud(
    snapshot.friendsFilters,
    settings?.friendsFilterEnabled ?? false,
  );
  accountsStore.replaceFromCloud(snapshot.socialAccounts, snapshot.activeAccounts);
  tasksStore.replaceFromCloud(snapshot.workspaceState?.contextualTasksJson);
  kanbanStore.replaceFromCloud(snapshot.workspaceState?.kanbanStateJson);
}

async function seedCloudFromLocalIfEmpty(snapshot: CloudSnapshot) {
  const profilesStore = useProfilesStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const accountsStore = useAccountsStore();
  const themeStore = useThemeStore();
  const onboardingStore = useOnboardingStore();
  const shortcutsStore = useShortcutsStore();
  const tasksStore = useContextualTasksStore();
  const kanbanStore = useKanbanStore();

  if (!snapshot.settings) {
    await syncSettingsPatch({
      theme: themeStore.themeMode as ThemeMode,
      language: localStorage.getItem("user-locale") ?? "fr",
      grayscaleEnabled: themeStore.grayscaleEnabled,
      textZoom: Number(localStorage.getItem("communityglows_text_zoom") ?? "100"),
      uiScale: Number(localStorage.getItem("communityglows_ui_scale") ?? "100"),
      hapticEnabled: localStorage.getItem("communityglows_haptic") !== "false",
      tapSoundEnabled: localStorage.getItem("communityglows_tap_sound") === "true",
      tapSoundVariant: normalizeTapSoundVariant(localStorage.getItem("communityglows_tap_sound_variant")),
      activeProfileId: profilesStore.activeProfileId || undefined,
      keyboardShortcuts: shortcutsStore.serializeForSync(),
      onboardingCompleted: onboardingStore.completed,
      friendsFilterEnabled: friendsStore.enabled,
    });
  }

  if (snapshot.profiles.length === 0 && profilesStore.profiles.length > 0) {
    await profilesStore.seedCloud();
  }

  if (snapshot.customLinks.length === 0 && Object.keys(customLinksStore.links).length > 0) {
    await customLinksStore.seedCloud();
  }

  if (snapshot.friendsFilters.length === 0 && Object.keys(friendsStore.friends).length > 0) {
    await friendsStore.seedCloud();
  }

  if (snapshot.socialAccounts.length === 0 && accountsStore.accounts.length > 0) {
    await accountsStore.seedCloud();
  }

  if (!snapshot.workspaceState) {
    tasksStore.initialize();
    kanbanStore.initialize();
    await Promise.all([tasksStore.syncToCloud(), kanbanStore.syncToCloud()]);
  }
}

export async function hydrateCloudState(options?: {
  allowLocalSeedIfEmpty?: boolean;
}) {
  if (!isAuthenticated.value) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const client = getConvexClient();
    const user = await waitForCloudQuery("current-user", client.query(api.users.getMe, {}));
    if (!user?._id) {
      recordDiagnosticEvent({
        area: "cloud-sync",
        stage: "authenticated-user",
        status: "missing",
      });
      throw new Error("La session cloud n’est pas disponible. Reconnectez-vous puis réessayez.");
    }
    recordDiagnosticEvent({
      area: "cloud-sync",
      stage: "authenticated-user",
      status: "confirmed",
    });
    if (hydratedUserId === user._id) return;

    const rememberedUserId = getRememberedCloudUserId();
    const isAnonymousUser = user.isAnonymous === true;
    const canReuseLocalState = canReuseLocalCloudState({
      isAnonymousUser,
      rememberedUserId,
      currentUserId: user._id,
    });

    if (!canReuseLocalState) {
      clearCloudSyncQueue();
    }

    let snapshot = await fetchCloudSnapshot(client);

    await advancePostAuthSyncStage("dataReceived");

    const shouldKeepLocalIfCloudEmpty = shouldKeepLocalWhenCloudEmpty({
      canReuseLocalState,
      allowLocalSeedIfEmpty: options?.allowLocalSeedIfEmpty,
    });

    if (isCloudSnapshotEmpty(snapshot) && shouldKeepLocalIfCloudEmpty) {
      if (canReuseLocalState && hasPendingCloudSync()) {
        await flushCloudSyncQueue();
        snapshot = await fetchCloudSnapshot(client);
      }

      if (isCloudSnapshotEmpty(snapshot)) {
        await seedCloudFromLocalIfEmpty(snapshot);
      } else {
        clearCloudSyncQueue();
        applyCloudSnapshot(snapshot);
      }
    } else {
      // Cloud wins whenever it already has data. Dropping the local durable queue
      // here prevents stale pre-auth/Profile 1 writes from being replayed back
      // into Convex just before hydration.
      clearCloudSyncQueue();
      if (!canReuseLocalState) {
        clearCloudBackedLocalState();
      }
      applyCloudSnapshot(snapshot);
    }
    await advancePostAuthSyncStage("dataApplied");

    hydratedUserId = user._id;
    rememberCloudUserId(user._id);
    recordDiagnosticEvent({ area: "cloud-sync", stage: "snapshot", status: "applied" });
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

export function resetCloudSyncState() {
  hydratedUserId = null;
  hydratePromise = null;
  resetPostAuthSyncFeedback();
}

export function resetSyncedLocalState() {
  clearCloudBackedLocalState();

  localStorage.removeItem("communityglows_email");
  localStorage.removeItem("sf_jwt");
  localStorage.removeItem("sf_refresh");
  localStorage.removeItem("__convexAuthJWT");
  localStorage.removeItem("__convexAuthRefreshToken");
  clearRememberedCloudUserId();
}

export function consumeReopenSettingsAfterAuth() {
  const shouldReopen = localStorage.getItem(REOPEN_SETTINGS_AFTER_AUTH_KEY) === "1";
  if (shouldReopen) {
    localStorage.removeItem(REOPEN_SETTINGS_AFTER_AUTH_KEY);
  }
  return shouldReopen;
}

export async function finalizePasswordSignIn(options?: {
  email?: string;
  flow?: "signIn" | "signUp";
  reload?: boolean;
  reopenSettings?: boolean;
}) {
  beginPostAuthSyncFeedback();

  if (options?.email) {
    localStorage.setItem("communityglows_email", options.email);
  }

  try {
    await hydrateCloudState({
      allowLocalSeedIfEmpty: options?.flow === "signUp",
    });

    if (options?.reload ?? true) {
      if (options?.reopenSettings) {
        localStorage.setItem(REOPEN_SETTINGS_AFTER_AUTH_KEY, "1");
      }
      await advancePostAuthSyncStage("restarting");
      queuePostAuthReadyNotice();
      window.setTimeout(() => {
        window.location.reload();
      }, AUTH_RELOAD_DELAY_MS);
      return;
    }

    showPostAuthReadyFeedback();
  } catch (error) {
    resetPostAuthSyncFeedback();
    throw error;
  }
}
