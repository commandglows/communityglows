import { isExtension, isTauri } from '@/platform/capabilities'

/** UI installation witness only. Never used by billing, auth or portable backups. */
export const ONBOARDING_INSTALLATION_KEY = 'communityglows_onboarding_installation_v1'
export type OnboardingLifecycleScope = { installation: string; build: string }

export function currentOnboardingBuild(): string {
  return `${typeof __VERSION__ === 'string' ? __VERSION__ : 'development'}:${typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'development'}`
}

export async function recordExtensionOnboardingInstallation(): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDING_INSTALLATION_KEY]: crypto.randomUUID() })
}

export async function resolveOnboardingLifecycleScope(): Promise<OnboardingLifecycleScope> {
  let installation: string
  if (isTauri() && /windows/i.test(navigator.userAgent) && !import.meta.env.DEV) {
    // NSIS and MSI write this witness after a successful installation, even of the same build.
    const { invoke } = await import('@tauri-apps/api/core')
    installation = await invoke<string>('get_onboarding_installation_generation')
    if (!/^[a-f0-9]{64}$/.test(installation)) throw new Error('onboarding_installation_unavailable')
  } else if (isExtension()) {
    const stored = await chrome.storage.local.get(ONBOARDING_INSTALLATION_KEY)
    installation = typeof stored[ONBOARDING_INSTALLATION_KEY] === 'string' ? stored[ONBOARDING_INSTALLATION_KEY] : ''
    if (!installation) {
      installation = crypto.randomUUID()
      await chrome.storage.local.set({ [ONBOARDING_INSTALLATION_KEY]: installation })
    }
  } else {
    // Explicit development fallback: tauri:dev is not installed by NSIS/MSI.
    // Origin-local continuity for web/dev and other native targets. This is not a
    // claim that their package manager exposes a same-version reinstall event.
    installation = localStorage.getItem(ONBOARDING_INSTALLATION_KEY) ?? ''
    if (!installation) {
      installation = crypto.randomUUID()
      localStorage.setItem(ONBOARDING_INSTALLATION_KEY, installation)
    }
  }
  return { installation, build: currentOnboardingBuild() }
}
