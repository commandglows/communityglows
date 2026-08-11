import { describe, expect, it } from 'vitest'

import {
  parseCommunityGlowsDeepLink,
  resolveCommunityGlowsSharedUrl,
} from './communityGlowsDeepLinks'

describe('parseCommunityGlowsDeepLink', () => {
  it('routes the public purchase CTA into the authenticated billing surface', () => {
    expect(parseCommunityGlowsDeepLink('communityglows://app/billing')).toEqual({
      type: 'open-billing',
    })
  })
  it('parses a launcher deep link for the current profile', () => {
    expect(parseCommunityGlowsDeepLink('communityglows://app/open?network=instagram')).toEqual({
      type: 'open-network',
      networkId: 'instagram',
      chooseProfile: false,
    })
  })

  it('parses a launcher deep link that asks the user to choose a profile', () => {
    expect(parseCommunityGlowsDeepLink('communityglows://app/open?network=linkedin&profile=choose')).toEqual({
      type: 'open-network',
      networkId: 'linkedin',
      chooseProfile: true,
    })
  })

  it('accepts the compact host form and explicit profile ids', () => {
    expect(parseCommunityGlowsDeepLink('communityglows://open?network=tiktok&profileId=profile-42')).toEqual({
      type: 'open-network',
      networkId: 'tiktok',
      profileId: 'profile-42',
      chooseProfile: false,
    })
  })

  it('ignores unknown launcher targets and invalid networks', () => {
    expect(parseCommunityGlowsDeepLink('communityglows://auth-callback/oauth?state=abc')).toBeNull()
    expect(parseCommunityGlowsDeepLink('communityglows://app/open?network=unknown')).toBeNull()
    expect(parseCommunityGlowsDeepLink('https://communityglows.com/auth/callback?state=abc')).toBeNull()
  })
})

describe('resolveCommunityGlowsSharedUrl', () => {
  it('maps a supported shared URL to its network session', () => {
    expect(resolveCommunityGlowsSharedUrl('https://www.tiktok.com/@communityglows/video/123')).toEqual({
      type: 'create-task',
      networkId: 'tiktok',
      chooseProfile: false,
      urlOverride: 'https://www.tiktok.com/@communityglows/video/123',
    })
  })

  it('accepts supported aliases such as x.com and t.me', () => {
    expect(resolveCommunityGlowsSharedUrl('https://x.com/communityglows/status/1')?.networkId).toBe('twitter')
    expect(resolveCommunityGlowsSharedUrl('https://t.me/communityglows/1')?.networkId).toBe('telegram')
  })

  it('rejects unsupported or non-https shared URLs', () => {
    expect(resolveCommunityGlowsSharedUrl('https://example.com/article')).toBeNull()
    expect(resolveCommunityGlowsSharedUrl('http://tiktok.com/@communityglows/video/123')).toBeNull()
  })
})
