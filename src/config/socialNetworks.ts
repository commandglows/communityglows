export type BuiltInSocialNetwork = {
  id: string
  label: string
  route: `/${string}`
  url: string
  icon: string
  color: string
  tileColor?: string
  customIcon?: 'threads' | 'snapchat' | 'nextdoor'
  onboarding: boolean
  defaultSelected: boolean
}

type SocialNetworkTheme = {
  color: string
  tileColor?: string
}

type SocialNetworkThemeMap = Record<string, SocialNetworkTheme>

const SOCIAL_NETWORK_THEME_PRESETS: SocialNetworkThemeMap = {
  twitter: { color: 'var(--sg-color-twitter)' },
  facebook: { color: 'var(--sg-color-facebook)' },
  instagram: {
    color: 'var(--sg-color-instagram-red)',
    tileColor: 'linear-gradient(135deg, var(--sg-color-instagram-orange), var(--sg-color-instagram-coral), var(--sg-color-instagram-red), var(--sg-color-instagram-rose), var(--sg-color-instagram-magenta))',
  },
  linkedin: { color: 'var(--sg-color-linkedin)' },
  discord: { color: 'var(--sg-color-discord)' },
  reddit: { color: 'var(--sg-color-reddit)' },
}

const getNetworkTheme = (networkId: string, fallback: SocialNetworkTheme): SocialNetworkTheme => {
  const override = SOCIAL_NETWORK_THEME_PRESETS[networkId]
  return {
    color: override?.color ?? fallback.color,
    tileColor: override?.tileColor ?? fallback.tileColor,
  }
}

export const builtInSocialNetworks: BuiltInSocialNetwork[] = [
  // These fallback literals are network-owned data-brand metadata, not product palette roles.
  // Canonical product tokens override the networks represented by SOCIAL_NETWORK_THEME_PRESETS.
  {
    id: 'twitter',
    label: 'Twitter / X',
    route: '/twitter',
    url: 'https://x.com',
    icon: 'pi pi-twitter',
    ...getNetworkTheme('twitter', { color: '#1DA1F2', tileColor: '#000000' }),
    onboarding: true,
    defaultSelected: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    route: '/facebook',
    url: 'https://facebook.com',
    icon: 'pi pi-facebook',
    ...getNetworkTheme('facebook', { color: '#1877F2' }),
    onboarding: true,
    defaultSelected: true,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    route: '/instagram',
    url: 'https://instagram.com',
    icon: 'pi pi-instagram',
    ...getNetworkTheme('instagram', { color: '#E4405F' }),
    onboarding: true,
    defaultSelected: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    route: '/linkedin',
    url: 'https://linkedin.com',
    icon: 'pi pi-linkedin',
    ...getNetworkTheme('linkedin', { color: '#0A66C2' }),
    onboarding: true,
    defaultSelected: true,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    route: '/tiktok',
    url: 'https://tiktok.com',
    icon: 'pi pi-tiktok',
    color: '#000000',
    tileColor: '#010101',
    onboarding: true,
    defaultSelected: true,
  },
  {
    id: 'threads',
    label: 'Threads',
    route: '/threads',
    url: 'https://threads.net',
    icon: 'pi pi-at',
    customIcon: 'threads',
    color: '#000000',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'discord',
    label: 'Discord',
    route: '/discord',
    url: 'https://discord.com/app',
    icon: 'pi pi-discord',
    ...getNetworkTheme('discord', { color: '#5865F2' }),
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    route: '/reddit',
    url: 'https://reddit.com',
    icon: 'pi pi-reddit',
    ...getNetworkTheme('reddit', { color: '#FF4500' }),
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    route: '/snapchat',
    url: 'https://web.snapchat.com',
    icon: 'pi pi-camera',
    customIcon: 'snapchat',
    color: '#FFFC00',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'cinderreels',
    label: 'CinderReels',
    route: '/cinderreels',
    url: 'https://cinderreels.com/',
    icon: 'pi pi-camera',
    // CommunityGlows-owned presentation fallback; no official brand-color source is recorded.
    color: '#E11D48',
    tileColor: '#E11D48',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'quora',
    label: 'Quora',
    route: '/quora',
    url: 'https://www.quora.com',
    icon: 'pi pi-question-circle',
    color: '#B92B27',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    route: '/pinterest',
    url: 'https://www.pinterest.com',
    icon: 'pi pi-pinterest',
    color: '#BD081C',
    tileColor: '#E60023',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    route: '/telegram',
    url: 'https://web.telegram.org',
    icon: 'pi pi-telegram',
    color: '#26A5E4',
    tileColor: '#0088cc',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'nextdoor',
    label: 'Nextdoor',
    route: '/nextdoor',
    url: 'https://nextdoor.com',
    icon: 'pi pi-map-marker',
    customIcon: 'nextdoor',
    color: '#8ED500',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'couchsurfing',
    label: 'Couchsurfing',
    route: '/couchsurfing',
    url: 'https://www.couchsurfing.com/',
    icon: 'pi pi-users',
    color: '#ED6504',
    tileColor: '#ED6504',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'patreon',
    label: 'Patreon',
    route: '/patreon',
    url: 'https://www.patreon.com',
    icon: 'pi pi-heart',
    color: '#FF424D',
    tileColor: '#FF424D',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'theresanaiforthat',
    label: "There's An AI For That",
    route: '/theresanaiforthat',
    url: 'https://theresanaiforthat.com',
    icon: 'pi pi-sparkles',
    // CommunityGlows-owned presentation fallback; no official brand-color source is recorded.
    color: '#111827',
    tileColor: '#111827',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'industrysocial',
    label: 'Industry Social',
    route: '/industrysocial',
    url: 'https://industrysocial.net',
    icon: 'pi pi-building',
    // CommunityGlows-owned presentation fallback; no official brand-color source is recorded.
    color: '#2563EB',
    tileColor: '#2563EB',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    route: '/bluesky',
    url: 'https://bsky.app',
    icon: 'pi pi-comments',
    color: '#1185FE',
    tileColor: '#1185FE',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'mastodon',
    label: 'Mastodon',
    route: '/mastodon',
    url: 'https://mastodon.social',
    icon: 'pi pi-globe',
    color: '#6364FF',
    tileColor: '#6364FF',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'substack',
    label: 'Substack',
    route: '/substack',
    url: 'https://substack.com',
    icon: 'pi pi-envelope',
    color: '#FF6719',
    tileColor: '#FF6719',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'ko-fi',
    label: 'Ko-fi',
    route: '/ko-fi',
    url: 'https://ko-fi.com',
    icon: 'pi pi-heart',
    color: '#29ABE0',
    tileColor: '#29ABE0',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'buymeacoffee',
    label: 'Buy Me a Coffee',
    route: '/buymeacoffee',
    url: 'https://www.buymeacoffee.com',
    icon: 'pi pi-heart',
    color: '#FFDD00',
    tileColor: '#FFDD00',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'producthunt',
    label: 'Product Hunt',
    route: '/producthunt',
    url: 'https://www.producthunt.com',
    icon: 'pi pi-megaphone',
    color: '#DA552F',
    tileColor: '#DA552F',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'indiehackers',
    label: 'Indie Hackers',
    route: '/indiehackers',
    url: 'https://www.indiehackers.com',
    icon: 'pi pi-users',
    color: '#0E2439',
    tileColor: '#0E2439',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'hackernews',
    label: 'Hacker News / Show HN',
    route: '/hackernews',
    url: 'https://news.ycombinator.com/show',
    icon: 'pi pi-bolt',
    color: '#FF6600',
    tileColor: '#FF6600',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'folloverse',
    label: 'Folloverse',
    route: '/folloverse',
    url: 'https://folloverse.com/?ref=betalist',
    icon: 'pi pi-users',
    // CommunityGlows-owned presentation fallback; no official brand-color source is recorded.
    color: '#7C3AED',
    tileColor: '#7C3AED',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'industrysocial-waitlist',
    label: 'Industry Social Waitlist',
    route: '/industrysocial-waitlist',
    url: 'https://industrysocial.net/waitlist',
    icon: 'pi pi-bookmark',
    // CommunityGlows-owned presentation fallback for the Industry Social waitlist entry.
    color: '#1D4ED8',
    tileColor: '#1D4ED8',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'koru',
    label: 'Koru',
    route: '/koru',
    url: 'https://koru.now',
    icon: 'pi pi-link',
    // CommunityGlows-owned presentation fallback; no official brand-color source is recorded.
    color: '#16A34A',
    tileColor: '#16A34A',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'kick',
    label: 'Kick',
    route: '/kick',
    url: 'https://kick.com',
    icon: 'pi pi-play',
    color: '#53FC18',
    tileColor: '#53FC18',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'medium',
    label: 'Medium',
    route: '/medium',
    url: 'https://medium.com',
    icon: 'pi pi-bookmark',
    color: '#000000',
    tileColor: '#000000',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'luma',
    label: 'Luma',
    route: '/luma',
    url: 'https://luma.com',
    icon: 'pi pi-calendar',
    // CommunityGlows-owned presentation fallback; no official brand-color source is recorded.
    color: '#7C3AED',
    tileColor: '#7C3AED',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'circle',
    label: 'Circle Discover',
    route: '/circle',
    url: 'https://discover.circle.so/',
    icon: 'pi pi-users',
    color: '#7C3AED',
    tileColor: '#7C3AED',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'stackoverflow',
    label: 'Stack Overflow',
    route: '/stackoverflow',
    url: 'https://stackoverflow.com/questions',
    icon: 'pi pi-question-circle',
    color: '#F48024',
    tileColor: '#F48024',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'github-community',
    label: 'GitHub Discussions',
    route: '/github-community',
    url: 'https://github.com/orgs/community/discussions/',
    icon: 'pi pi-github',
    color: '#24292F',
    tileColor: '#24292F',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'huzzler',
    label: 'Huzzler',
    route: '/huzzler',
    url: 'https://huzzler.so',
    icon: 'pi pi-users',
    color: '#2563EB',
    tileColor: '#2563EB',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    route: '/youtube',
    url: 'https://www.youtube.com/',
    icon: 'pi pi-youtube',
    color: '#FF0000',
    tileColor: '#FF0000',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'uneed',
    label: 'Uneed',
    route: '/uneed',
    url: 'https://www.uneed.best/',
    icon: 'pi pi-lightbulb',
    color: '#111827',
    tileColor: '#111827',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'devhunt',
    label: 'DevHunt',
    route: '/devhunt',
    url: 'https://devhunt.org',
    icon: 'pi pi-code',
    color: '#111827',
    tileColor: '#111827',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'hackernoon',
    label: 'HackerNoon',
    route: '/hackernoon',
    url: 'https://hackernoon.com',
    icon: 'pi pi-book',
    color: '#00FF00',
    tileColor: '#00FF00',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'freelance',
    label: 'Freelance.com',
    route: '/freelance',
    url: 'https://www.freelance.com',
    icon: 'pi pi-briefcase',
    color: '#2F80ED',
    tileColor: '#2F80ED',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'coder',
    label: 'Coder Community',
    route: '/coder',
    url: 'https://coder.com/community',
    icon: 'pi pi-code',
    color: '#101828',
    tileColor: '#101828',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'codeur',
    label: 'Codeur.com',
    route: '/codeur',
    url: 'https://www.codeur.com',
    icon: 'pi pi-briefcase',
    color: '#1D4ED8',
    tileColor: '#1D4ED8',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'utest',
    label: 'uTest',
    route: '/utest',
    url: 'https://www.utest.com',
    icon: 'pi pi-check-circle',
    color: '#00A651',
    tileColor: '#00A651',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'hashnode',
    label: 'Hashnode',
    route: '/hashnode',
    url: 'https://hashnode.com/',
    icon: 'pi pi-pencil',
    color: '#2962FF',
    tileColor: '#2962FF',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'beehiiv',
    label: 'beehiiv',
    route: '/beehiiv',
    url: 'https://www.beehiiv.com',
    icon: 'pi pi-envelope',
    color: '#F6C344',
    tileColor: '#F6C344',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'betalist',
    label: 'BetaList',
    route: '/betalist',
    url: 'https://betalist.com',
    icon: 'pi pi-star',
    color: '#1F2937',
    tileColor: '#1F2937',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'dribbble',
    label: 'Dribbble',
    route: '/dribbble',
    url: 'https://dribbble.com',
    icon: 'pi pi-palette',
    color: '#EA4C89',
    tileColor: '#EA4C89',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'behance',
    label: 'Behance',
    route: '/behance',
    url: 'https://www.behance.net',
    icon: 'pi pi-images',
    color: '#1769FF',
    tileColor: '#1769FF',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'malt',
    label: 'Malt',
    route: '/malt',
    url: 'https://www.malt.fr',
    icon: 'pi pi-briefcase',
    color: '#FC5757',
    tileColor: '#FC5757',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'superprof',
    label: 'Superprof',
    route: '/superprof',
    url: 'https://www.superprof.fr',
    icon: 'pi pi-graduation-cap',
    color: '#00AEEF',
    tileColor: '#00AEEF',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'codepen',
    label: 'CodePen Trending',
    route: '/codepen',
    url: 'https://codepen.io/trending',
    icon: 'pi pi-code',
    color: '#000000',
    tileColor: '#000000',
    onboarding: true,
    defaultSelected: false,
  },
  {
    id: 'devto',
    label: 'DEV Community',
    route: '/devto',
    url: 'https://dev.to/',
    icon: 'pi pi-comments',
    color: '#0A0A0A',
    tileColor: '#0A0A0A',
    onboarding: true,
    defaultSelected: false,
  },
]

export const socialNetworkThemeMap: SocialNetworkThemeMap = builtInSocialNetworks.reduce(
  (acc, network) => {
    acc[network.id] = {
      color: network.color,
      ...(network.tileColor !== undefined ? { tileColor: network.tileColor } : {}),
    }
    return acc
  },
  {} as SocialNetworkThemeMap,
)

export const getSocialNetworkColor = (networkId: string): string =>
  socialNetworkThemeMap[networkId]?.color ?? 'var(--sg-color-text)'

/**
 * Resolve a profile's persisted exclusions.
 *
 * Older/local placeholder profiles may not have a visibility preference yet.
 * In that case the catalogue's default selection is authoritative. An explicit
 * empty array is preserved because it means the user chose to show everything.
 */
export function resolveHiddenNetworkIds(
  hiddenNetworkIds?: readonly string[],
): string[] {
  if (hiddenNetworkIds !== undefined) {
    return [...new Set(hiddenNetworkIds)]
  }

  return builtInSocialNetworks
    .filter((network) => !network.defaultSelected)
    .map((network) => network.id)
}

export function getVisibleBuiltInSocialNetworks(
  hiddenNetworkIds?: readonly string[],
): BuiltInSocialNetwork[] {
  const hiddenIds = new Set(resolveHiddenNetworkIds(hiddenNetworkIds))
  return builtInSocialNetworks.filter((network) => !hiddenIds.has(network.id))
}

const NETWORK_ISOLATION_NOT_COVERED = [
  'sessionStorage',
  'indexedDB',
  'cacheStorage',
  'serviceWorker',
  'httpCache',
  'credentialStore',
] as const

const NETWORK_ISOLATION_AUTH_STORAGE = ['cookies', 'localStorage'] as const

export type NetworkIsolationNotCovered = (typeof NETWORK_ISOLATION_NOT_COVERED)[number]
export type NetworkIsolationAuthStorage = (typeof NETWORK_ISOLATION_AUTH_STORAGE)[number]

export type NetworkIsolationPolicy = {
  authStorage: readonly NetworkIsolationAuthStorage[]
  storageOrigins: readonly string[]
  notCovered: readonly NetworkIsolationNotCovered[]
  notes?: string
}

type NetworkIsolationPolicyOverride = {
  authStorage?: readonly NetworkIsolationAuthStorage[]
  storageOrigins?: readonly string[]
  notCovered?: readonly NetworkIsolationNotCovered[]
  notes?: string
}

const NETWORK_ISOLATION_DEFAULT: NetworkIsolationPolicy = {
  authStorage: NETWORK_ISOLATION_AUTH_STORAGE,
  storageOrigins: [],
  notCovered: NETWORK_ISOLATION_NOT_COVERED,
}

const NETWORK_ISOLATION_OVERRIDES: Readonly<Record<string, NetworkIsolationPolicyOverride>> = {
  cinderreels: {
    authStorage: ['cookies', 'localStorage'],
    storageOrigins: ['https://cinderreels.com'],
  },
  kick: {
    authStorage: ['cookies', 'localStorage'],
  },
}

function normalizeHttpsOrigin(raw: string): string | null {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return null
    const host = parsed.hostname.toLowerCase()
    if (!host) return null
    const isDefaultPort = !parsed.port || parsed.port === '443'
    return isDefaultPort ? `https://${host}` : `https://${host}:${parsed.port}`
  } catch {
    return null
  }
}

function uniqueOrigins(origins: readonly string[]): string[] {
  const deduped = new Set<string>()
  for (const origin of origins) {
    const normalized = normalizeHttpsOrigin(origin)
    if (normalized) deduped.add(normalized)
  }
  return Array.from(deduped)
}

export function getNetworkIsolationPolicy(networkId: string): NetworkIsolationPolicy {
  const override = NETWORK_ISOLATION_OVERRIDES[networkId]
  return {
    authStorage: override?.authStorage ?? NETWORK_ISOLATION_DEFAULT.authStorage,
    storageOrigins: uniqueOrigins(override?.storageOrigins ?? NETWORK_ISOLATION_DEFAULT.storageOrigins),
    notCovered: override?.notCovered ?? NETWORK_ISOLATION_DEFAULT.notCovered,
    notes: override?.notes,
  }
}

export function getNetworkIsolationOrigins(networkId: string): string[] {
  const networkUrl = builtInSocialNetworks.find((network) => network.id === networkId)?.url
  const baseOrigins = networkUrl ? [networkUrl] : []
  const policy = getNetworkIsolationPolicy(networkId)
  return uniqueOrigins([...baseOrigins, ...policy.storageOrigins])
}

export function getNetworkIsolationOriginsByNetwork(
  networkIds: readonly string[],
): Record<string, string[]> {
  return networkIds.reduce<Record<string, string[]>>((originsByNetwork, networkId) => {
    const origins = getNetworkIsolationOrigins(networkId)
    if (origins.length > 0) {
      originsByNetwork[networkId] = origins
    }
    return originsByNetwork
  }, {})
}
