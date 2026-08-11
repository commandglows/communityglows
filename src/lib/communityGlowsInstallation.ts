const INSTALLATION_STORAGE_KEY = 'communityglows_entitlement_installation_v1'
const INSTALLATION_HASH_SCOPE = 'communityglows:entitlement-installation:v1'

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createRandomInstallationId(cryptoApi: Crypto): string {
  if (typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  const random = new Uint8Array(32)
  cryptoApi.getRandomValues(random)
  return bytesToHex(random)
}

/**
 * Persists only a random app-scoped identifier locally and sends a one-way
 * product-scoped signal to the entitlement bridge. No hardware identifier is
 * read or exposed.
 */
export async function getCommunityGlowsInstallationHash(
  storage: Storage = localStorage,
  cryptoApi: Crypto = crypto,
): Promise<string> {
  let installationId = storage.getItem(INSTALLATION_STORAGE_KEY)?.trim()
  if (!installationId) {
    installationId = createRandomInstallationId(cryptoApi)
    storage.setItem(INSTALLATION_STORAGE_KEY, installationId)
  }

  const digest = await cryptoApi.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${INSTALLATION_HASH_SCOPE}:${installationId}`),
  )
  return bytesToHex(new Uint8Array(digest))
}

export const communityGlowsInstallationStorageKey = INSTALLATION_STORAGE_KEY
