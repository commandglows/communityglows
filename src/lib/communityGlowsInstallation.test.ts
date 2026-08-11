import { describe, expect, it } from 'vitest'
import {
  communityGlowsInstallationStorageKey,
  getCommunityGlowsInstallationHash,
} from './communityGlowsInstallation'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('CommunityGlows entitlement installation signal', () => {
  it('persists a random installation id but returns only a pseudonymized hash', async () => {
    const storage = memoryStorage()
    const first = await getCommunityGlowsInstallationHash(storage, crypto)
    const raw = storage.getItem(communityGlowsInstallationStorageKey)
    const second = await getCommunityGlowsInstallationHash(storage, crypto)

    expect(raw).toBeTruthy()
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(first).toBe(second)
    expect(first).not.toContain(raw!)
  })

  it('produces a different signal for a different installation', async () => {
    const first = await getCommunityGlowsInstallationHash(memoryStorage(), crypto)
    const second = await getCommunityGlowsInstallationHash(memoryStorage(), crypto)
    expect(first).not.toBe(second)
  })
})
