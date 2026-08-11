const DEFAULT_SITE_URL = 'https://communityglows.com'
const DEFAULT_APP_URL = 'https://github.com/dianedef/CommunityGlows/releases/latest'
const DEFAULT_EMAIL_DOMAIN = 'communityglows.com'

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export const SITE_URL = stripTrailingSlash(
  import.meta.env.PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
)

export const APP_URL = stripTrailingSlash(
  import.meta.env.PUBLIC_APP_URL ?? DEFAULT_APP_URL
)

export const EMAIL_DOMAIN = (
  import.meta.env.PUBLIC_EMAIL_DOMAIN ?? DEFAULT_EMAIL_DOMAIN
).trim()
export function siteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString()
}

export function appUrl(path = ''): string {
  if (!path || path === '/') return APP_URL
  return new URL(path.replace(/^\/+/, ''), `${APP_URL}/`).toString()
}

export function authenticatedPurchaseUrl(): string {
  return 'communityglows://app/billing'
}

export function contactEmail(localPart: string): string {
  return `${localPart}@${EMAIL_DOMAIN}`
}
