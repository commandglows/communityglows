import { describe, expect, it } from 'vitest'

import {
  parseSocialGlowzDeepLink,
  resolveSocialGlowzSharedUrl,
} from './socialGlowzDeepLinks'

describe('parseSocialGlowzDeepLink', () => {
  it('parses a launcher deep link for the current profile', () => {
    expect(parseSocialGlowzDeepLink('socialglowz://app/open?network=instagram')).toEqual({
      type: 'open-network',
      networkId: 'instagram',
      chooseProfile: false,
    })
  })

  it('parses a launcher deep link that asks the user to choose a profile', () => {
    expect(parseSocialGlowzDeepLink('socialglowz://app/open?network=linkedin&profile=choose')).toEqual({
      type: 'open-network',
      networkId: 'linkedin',
      chooseProfile: true,
    })
  })

  it('accepts the compact host form and explicit profile ids', () => {
    expect(parseSocialGlowzDeepLink('socialglowz://open?network=tiktok&profileId=profile-42')).toEqual({
      type: 'open-network',
      networkId: 'tiktok',
      profileId: 'profile-42',
      chooseProfile: false,
    })
  })

  it('ignores unknown launcher targets and invalid networks', () => {
    expect(parseSocialGlowzDeepLink('socialglowz://auth-callback/oauth?state=abc')).toBeNull()
    expect(parseSocialGlowzDeepLink('socialglowz://app/open?network=unknown')).toBeNull()
    expect(parseSocialGlowzDeepLink('https://socialglowz.com/auth/callback?state=abc')).toBeNull()
  })
})

describe('resolveSocialGlowzSharedUrl', () => {
  it('maps a supported shared URL to its network session', () => {
    expect(resolveSocialGlowzSharedUrl('https://www.tiktok.com/@socialglowz/video/123')).toEqual({
      type: 'open-network',
      networkId: 'tiktok',
      chooseProfile: true,
      urlOverride: 'https://www.tiktok.com/@socialglowz/video/123',
    })
  })

  it('accepts supported aliases such as x.com and t.me', () => {
    expect(resolveSocialGlowzSharedUrl('https://x.com/socialglowz/status/1')?.networkId).toBe('twitter')
    expect(resolveSocialGlowzSharedUrl('https://t.me/socialglowz/1')?.networkId).toBe('telegram')
  })

  it('rejects unsupported or non-https shared URLs', () => {
    expect(resolveSocialGlowzSharedUrl('https://example.com/article')).toBeNull()
    expect(resolveSocialGlowzSharedUrl('http://tiktok.com/@socialglowz/video/123')).toBeNull()
  })
})
