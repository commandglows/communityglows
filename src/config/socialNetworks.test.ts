import { describe, expect, it } from 'vitest'

import {
  getNetworkIsolationOriginsByNetwork,
  getNetworkIsolationOrigins,
  getNetworkIsolationPolicy,
} from '@/config/socialNetworks'

describe('social network isolation policy', () => {
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

  it('includes gmail with normalized https origin', () => {
    const policy = getNetworkIsolationPolicy('gmail')
    const origins = getNetworkIsolationOrigins('gmail')

    expect(policy.authStorage).toEqual(['cookies', 'localStorage'])
    expect(policy.storageOrigins).toEqual([])
    expect(origins).toEqual(['https://mail.google.com'])
  })
})
