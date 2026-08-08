import { useProfilesStore } from '@/stores/profiles'
import { useAccountsStore } from '@/stores/accounts'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useThemeStore } from '@/stores/theme'
import { useCustomLinksStore } from '@/stores/customLinks'
import { useOnboardingStore } from '@/stores/onboarding'
import { isAuthenticated } from '@/lib/convexAuth'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { setLocale } from '@/utils/i18n'
import type { ThemeMode } from '@/utils/themeAuto'
import { normalizeTapSoundVariant } from '../utils/tapSound'
import { isAndroidTauri as detectAndroidTauri, isTauri as detectTauri } from '@/platform/capabilities'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import {
  BACKUP_DATA_VERSION,
  collectPortableLocalStorage,
  restorePortableLocalStorage,
} from './backupData'

const isTauri = detectTauri()
const isAndroidTauri = detectAndroidTauri

/** Gather all persisted store + localStorage data into a single JSON string. */
async function collectStoreData(): Promise<string> {
  const profiles = useProfilesStore()
  const accounts = useAccountsStore()
  const friends = useFriendsFilterStore()
  const theme = useThemeStore()
  const customLinks = useCustomLinksStore()
  const onboarding = useOnboardingStore()
  let androidCookieSnapshot = ''
  let androidLocalStorageSnapshot = ''
  let desktopCookieSnapshot = ''

  if (isAndroidTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<{ cookiesJson?: string; localStorageJson?: string }>(
        'plugin:android-webview|export_cookies_for_backup',
        {},
      )
      androidCookieSnapshot = result.cookiesJson ?? ''
      androidLocalStorageSnapshot = result.localStorageJson ?? ''
    } catch (error) {
      console.warn('[backup] Failed to export Android session snapshot', error)
    }
  }

  if (isTauri() && !isAndroidTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const targets = profiles.profiles.flatMap(profile => builtInSocialNetworks.map(network => ({
        profileId: profile.id,
        networkId: network.id,
        url: network.url,
      })))
      desktopCookieSnapshot = await invoke<string>('export_desktop_cookies', { targets })
    } catch (error) {
      console.warn('[backup] Failed to export Desktop session snapshot', error)
    }
  }

  const data = {
    dataVersion: BACKUP_DATA_VERSION,
    profiles: {
      profiles: profiles.profiles,
      activeProfileId: profiles.activeProfileId,
    },
    accounts: {
      accounts: accounts.accounts,
      activeAccountId: accounts.activeAccountId,
    },
    friendsFilter: {
      friends: friends.friends,
      enabled: friends.enabled,
    },
    theme: {
      themeMode: theme.themeMode,
      isDarkMode: theme.isDarkMode,
      grayscaleEnabled: theme.grayscaleEnabled,
    },
    customLinks: {
      links: customLinks.links,
    },
    onboarding: {
      completed: onboarding.completed,
    },
    localStorage: collectPortableLocalStorage(localStorage),
    android: {
      cookieSnapshot: androidCookieSnapshot,
      localStorageSnapshot: androidLocalStorageSnapshot,
    },
    desktop: {
      cookieSnapshot: desktopCookieSnapshot,
    },
  }
  return JSON.stringify(data)
}

/** Apply restored data to all stores + localStorage. */
async function applyStoreData(json: string) {
  const data = JSON.parse(json)

  if (data.profiles) {
    const store = useProfilesStore()
    store.$patch({
      profiles: data.profiles.profiles ?? [],
      activeProfileId: data.profiles.activeProfileId ?? '',
    })
  }

  if (data.accounts) {
    const store = useAccountsStore()
    store.$patch({
      accounts: data.accounts.accounts ?? [],
      activeAccountId: data.accounts.activeAccountId ?? {},
    })
  }

  if (data.friendsFilter) {
    const store = useFriendsFilterStore()
    store.friends = data.friendsFilter.friends ?? {}
    store.enabled = data.friendsFilter.enabled ?? {}
  }

  if (data.theme) {
    const store = useThemeStore()
    store.$patch({
      themeMode: data.theme.themeMode ?? ((data.theme.isDarkMode ?? false) ? 'dark' : 'light'),
      isDarkMode: data.theme.isDarkMode ?? false,
      grayscaleEnabled: data.theme.grayscaleEnabled ?? false,
    })
    store.applyTheme()
    store.applyGrayscale()
    store.persistResolvedTheme()
    if (store.themeMode === 'auto') {
      void store.refreshAutoTheme({ allowPrompt: false })
    } else {
      store.stopAutoThemeSync()
    }
  }

  if (data.customLinks) {
    const store = useCustomLinksStore()
    store.links = data.customLinks.links ?? {}
  }

  if (data.onboarding) {
    const store = useOnboardingStore()
    store.$patch({
      completed: data.onboarding.completed ?? false,
    })
  }

  if (data.localStorage) {
    restorePortableLocalStorage(data.localStorage, localStorage)
    if (typeof data.localStorage['user-locale'] === 'string') {
      setLocale(data.localStorage['user-locale'])
    }
  }

  if (
    isAndroidTauri()
    && (
      data.android?.cookieSnapshot
      || data.android?.localStorageSnapshot
      || data.desktop?.cookieSnapshot
    )
  ) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('plugin:android-webview|import_cookies_from_backup', {
        cookiesJson: data.android?.cookieSnapshot || data.desktop?.cookieSnapshot || '',
        localStorageJson: data.android?.localStorageSnapshot ?? '',
      })
    } catch (error) {
      console.warn('[backup] Failed to import Android session snapshot', error)
    }
  }
}

async function syncRestoredDataToCloud() {
  if (!isAuthenticated.value) return

  const profiles = useProfilesStore()
  const accounts = useAccountsStore()
  const friends = useFriendsFilterStore()
  const theme = useThemeStore()
  const customLinks = useCustomLinksStore()
  const onboarding = useOnboardingStore()

  await syncSettingsPatch({
    theme: theme.themeMode as ThemeMode,
    language: localStorage.getItem('user-locale') ?? 'fr',
    grayscaleEnabled: theme.grayscaleEnabled,
    textZoom: Number(localStorage.getItem('communityglows_text_zoom') ?? '100'),
    hapticEnabled: localStorage.getItem('communityglows_haptic') !== 'false',
    tapSoundEnabled: localStorage.getItem('communityglows_tap_sound') === 'true',
    tapSoundVariant: normalizeTapSoundVariant(localStorage.getItem('communityglows_tap_sound_variant')),
    activeProfileId: profiles.activeProfileId || undefined,
    onboardingCompleted: onboarding.completed,
    friendsFilterEnabled: friends.enabled,
  })

  await Promise.all([
    profiles.seedCloud(),
    accounts.seedCloud(),
    customLinks.seedCloud(),
    friends.seedCloud(),
  ])
}

/** Convert a base64 string to Uint8Array. */
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Convert Uint8Array to base64 string. */
function bytesToB64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function useBackup() {
  async function exportBackup(password: string): Promise<string> {
    if (!isTauri) throw new Error('Export is only available in the desktop/mobile app')

    const { invoke } = await import('@tauri-apps/api/core')
    const storeData = await collectStoreData()
    const isAndroid = isAndroidTauri()

    // Rust creates the encrypted blob and returns base64
    const b64: string = await invoke('create_backup', { storeData, password })

    if (isAndroid) {
      // Save to Downloads/CommunityGlows/ via Kotlin MediaStore
      const fileName = `communityglows-backup-${Date.now()}.sfbak`
      const result = await invoke<{ path: string }>(
        'plugin:android-webview|save_backup_to_downloads',
        { base64Data: b64, fileName },
      )
      return result.path
    }

    // Desktop: show native save dialog
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const { save } = await import('@tauri-apps/plugin-dialog')
    const fileName = `communityglows-backup-${Date.now()}.sfbak`
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'CommunityGlows Backup', extensions: ['sfbak'] }],
    })
    if (!filePath) throw new Error('No file selected')
    await writeFile(filePath, b64ToBytes(b64))
    return String(filePath)
  }

  async function importBackup(password: string): Promise<void> {
    if (!isTauri) throw new Error('Import is only available in the desktop/mobile app')

    const { invoke } = await import('@tauri-apps/api/core')
    const isAndroid = isAndroidTauri()

    let encryptedB64 = ''

    if (isAndroid) {
      // Let Android's system document picker read a .sfbak from any accessible location.
      const result = await invoke<{ base64: string }>(
        'plugin:android-webview|load_backup_from_downloads',
        {},
      )
      encryptedB64 = result.base64
    } else {
      // Desktop: native open dialog
      const { readFile } = await import('@tauri-apps/plugin-fs')
      const { open } = await import('@tauri-apps/plugin-dialog')
      const filePath = await open({
        filters: [{ name: 'CommunityGlows Backup', extensions: ['sfbak'] }],
      })
      if (!filePath) throw new Error('No file selected')
      const bytes = await readFile(filePath)
      encryptedB64 = bytesToB64(bytes)
    }

    const restoredData = await invoke<string>('restore_backup', {
      encryptedB64,
      password,
    })

    await applyStoreData(restoredData)
    await syncRestoredDataToCloud()
  }

  return { exportBackup, importBackup, isTauri }
}
