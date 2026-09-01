import { describe, expect, it } from 'vitest'

import {
  builtInSocialNetworks,
  getVisibleBuiltInSocialNetworks,
  getNetworkIsolationOriginsByNetwork,
  getNetworkIsolationOrigins,
  getNetworkIsolationPolicy,
  resolveHiddenNetworkIds,
} from '@/config/socialNetworks'

describe('social network visibility', () => {
  it('uses only catalogue defaults when a legacy profile has no selection', () => {
    const expectedVisibleIds = builtInSocialNetworks
      .filter(network => network.defaultSelected)
      .map(network => network.id)

    expect(getVisibleBuiltInSocialNetworks().map(network => network.id)).toEqual(
      expectedVisibleIds,
    )
  })

  it('removes hidden networks completely while preserving dense catalogue order', () => {
    expect(
      getVisibleBuiltInSocialNetworks(['facebook', 'tiktok']).map(
        network => network.id,
      ),
    ).toEqual(
      builtInSocialNetworks
        .filter(network => network.id !== 'facebook' && network.id !== 'tiktok')
        .map(network => network.id),
    )
  })

  it('preserves an explicit empty exclusion list as show everything', () => {
    expect(getVisibleBuiltInSocialNetworks([])).toHaveLength(
      builtInSocialNetworks.length,
    )
    expect(resolveHiddenNetworkIds([])).toEqual([])
  })
})

describe('social network isolation policy', () => {
  it('includes the requested community catalogue entries without duplicates', () => {
    const requested = [
      'medium', 'circle', 'stackoverflow', 'github-community', 'huzzler', 'substack',
      'youtube', 'uneed', 'indiehackers', 'devhunt', 'hackernoon', 'freelance', 'coder',
      'codeur', 'utest', 'hashnode', 'beehiiv', 'betalist', 'dribbble', 'behance',
      'malt', 'superprof', 'codepen', 'devto', 'couchsurfing',
    ]
    const requestedEntries = requested.map((id) => builtInSocialNetworks.find((network) => network.id === id))

    expect(requestedEntries.every(Boolean)).toBe(true)
    expect(new Set(builtInSocialNetworks.map((network) => network.id)).size).toBe(
      builtInSocialNetworks.length,
    )
    expect(requestedEntries.every((network) => network?.url.startsWith('https://'))).toBe(true)
  })

  it('uses global defaults for networks without overrides', () => {
    const policy = getNetworkIsolationPolicy('twitter')

    expect(policy.authStorage).toEqual(['cookies', 'localStorage'])
    expect(policy.storageOrigins).toEqual([])
    expect(policy.notCovered).toEqual([
      'sessionStorage',
      'indexedDB',
      'cacheStorage',
      'serviceWorker',
      'httpCache',
      'credentialStore',
    ])
  })

  it('declares cinderreels origin and localStorage auth isolation', () => {
    const policy = getNetworkIsolationPolicy('cinderreels')
    const origins = getNetworkIsolationOrigins('cinderreels')

    expect(policy.authStorage).toContain('localStorage')
    expect(policy.storageOrigins).toEqual(['https://cinderreels.com'])
    expect(origins).toEqual(['https://cinderreels.com'])
  })

  it('builds a compact origin map for native bottom bar sync', () => {
    expect(getNetworkIsolationOriginsByNetwork(['twitter', 'cinderreels'])).toEqual({
      twitter: ['https://x.com'],
      cinderreels: ['https://cinderreels.com'],
    })
  })

  it('includes kick with normalized https origin', () => {
    const policy = getNetworkIsolationPolicy('kick')
    const origins = getNetworkIsolationOrigins('kick')

    expect(policy.authStorage).toEqual(['cookies', 'localStorage'])
    expect(policy.storageOrigins).toEqual([])
    expect(origins).toEqual(['https://kick.com'])
  })

  it('does not expose retired Gmail as a managed social network', () => {
    expect(builtInSocialNetworks.some((network) => network.id === 'gmail')).toBe(false)
    expect(getNetworkIsolationOrigins('gmail')).toEqual([])
  })

  it('includes Luma with its official HTTPS origin', () => {
    const origins = getNetworkIsolationOrigins('luma')

    expect(origins).toEqual(['https://luma.com'])
    expect(getNetworkIsolationOriginsByNetwork(['luma'])).toEqual({
      luma: ['https://luma.com'],
    })
  })

  it('includes Couchsurfing with its canonical HTTPS origin', () => {
    const network = builtInSocialNetworks.find(({ id }) => id === 'couchsurfing')

    expect(network).toMatchObject({
      label: 'Couchsurfing',
      route: '/couchsurfing',
      url: 'https://www.couchsurfing.com/',
      onboarding: true,
      defaultSelected: false,
    })
    expect(getNetworkIsolationOrigins('couchsurfing')).toEqual([
      'https://www.couchsurfing.com',
    ])
  })
})
