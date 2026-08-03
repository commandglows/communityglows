import { builtInSocialNetworks } from '@/config/socialNetworks'

export type SocialGlowzDeepLinkAction = {
  type: 'open-network' | 'create-task'
  networkId: string
  profileId?: string
  chooseProfile: boolean
  urlOverride?: string
}

export const SOCIALGLOWZ_DEEP_LINK_EVENT = 'socialglowz:deep-link-action'
export const SOCIALGLOWZ_PROFILE_PICKED_EVENT = 'socialglowz:profile-picked'
export const SOCIALGLOWZ_SHARED_LINK_EVENT = 'socialglowz:shared-link'

const knownNetworkIds = new Set(builtInSocialNetworks.map((network) => network.id))
const sharedUrlHostsByNetwork: Record<string, string[]> = {
  twitter: ['x.com', 'twitter.com'],
  facebook: ['facebook.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
  tiktok: ['tiktok.com'],
  threads: ['threads.net'],
  discord: ['discord.com'],
  reddit: ['reddit.com'],
  snapchat: ['web.snapchat.com', 'snapchat.com', 'accounts.snapchat.com'],
  cinderreels: ['cinderreels.com'],
  quora: ['quora.com'],
  pinterest: ['pinterest.com'],
  telegram: ['web.telegram.org', 'telegram.org', 't.me'],
  nextdoor: ['nextdoor.com'],
  patreon: ['patreon.com'],
  theresanaiforthat: ['theresanaiforthat.com'],
  industrysocial: ['industrysocial.net'],
  bluesky: ['bsky.app'],
  mastodon: ['mastodon.social'],
  substack: ['substack.com'],
  'ko-fi': ['ko-fi.com'],
  buymeacoffee: ['buymeacoffee.com'],
  producthunt: ['producthunt.com'],
}

let pendingDeepLinkAction: SocialGlowzDeepLinkAction | null = null

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'y', 'on'])
const PROFILE_CHOOSER_VALUES = new Set(['choose', 'chooser', 'pick', 'picker', 'select'])

function normalizeNetworkId(rawValue: string | null): string | null {
  if (!rawValue) return null
  const networkId = rawValue.trim().toLowerCase()
  return knownNetworkIds.has(networkId) ? networkId : null
}

function isTrueQueryValue(rawValue: string | null): boolean {
  if (!rawValue) return false
  return TRUE_VALUES.has(rawValue.trim().toLowerCase())
}

function parseProfileTarget(url: URL) {
  const explicitProfileId = url.searchParams.get('profileId')?.trim()
  if (explicitProfileId) {
    return {
      chooseProfile: false,
      profileId: explicitProfileId,
    }
  }

  const profileParam = url.searchParams.get('profile')?.trim()
  if (profileParam) {
    const normalizedProfile = profileParam.toLowerCase()
    if (PROFILE_CHOOSER_VALUES.has(normalizedProfile)) {
      return { chooseProfile: true }
    }
    if (normalizedProfile !== 'current' && normalizedProfile !== 'active') {
      return {
        chooseProfile: false,
        profileId: profileParam,
      }
    }
  }

  if (isTrueQueryValue(url.searchParams.get('chooseProfile'))) {
    return { chooseProfile: true }
  }

  return { chooseProfile: false }
}

function isLauncherDeepLink(url: URL) {
  if (url.protocol !== 'socialglowz:') return false

  if (url.host === 'app' && url.pathname === '/open') {
    return true
  }

  return url.host === 'open' && (url.pathname === '' || url.pathname === '/')
}

function hostMatchesAllowlist(host: string, allowedHost: string) {
  return host === allowedHost || host.endsWith(`.${allowedHost}`)
}

export function parseSocialGlowzDeepLink(rawUrl: string): SocialGlowzDeepLinkAction | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }

  if (!isLauncherDeepLink(url)) return null

  const networkId = normalizeNetworkId(
    url.searchParams.get('network') ?? url.searchParams.get('networkId'),
  )
  if (!networkId) return null

  const profileTarget = parseProfileTarget(url)

  return {
    type: 'open-network',
    networkId,
    chooseProfile: profileTarget.chooseProfile,
    ...(profileTarget.profileId ? { profileId: profileTarget.profileId } : {}),
  }
}

export function queueSocialGlowzDeepLinkAction(action: SocialGlowzDeepLinkAction) {
  pendingDeepLinkAction = action
  window.dispatchEvent(new CustomEvent(SOCIALGLOWZ_DEEP_LINK_EVENT, { detail: action }))
}

export function consumePendingSocialGlowzDeepLinkAction() {
  const action = pendingDeepLinkAction
  pendingDeepLinkAction = null
  return action
}

export function resolveSocialGlowzSharedUrl(rawUrl: string): SocialGlowzDeepLinkAction | null {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    return null
  }

  if (parsedUrl.protocol !== 'https:') return null

  const host = parsedUrl.host.toLowerCase()
  const networkEntry = Object.entries(sharedUrlHostsByNetwork).find(([, allowedHosts]) =>
    allowedHosts.some((allowedHost) => hostMatchesAllowlist(host, allowedHost)),
  )

  if (!networkEntry) return null

  return {
    type: 'create-task',
    networkId: networkEntry[0],
    chooseProfile: false,
    urlOverride: parsedUrl.toString(),
  }
}
