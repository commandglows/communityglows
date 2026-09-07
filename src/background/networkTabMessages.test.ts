import { describe, expect, it } from 'vitest'
import { parseNetworkCommand } from './networkTabMessages'

const valid = { action: 'open', windowId: 1, target: { profileId: 'p', networkId: 'n', groupKey: 'g', groupTitle: 'Group', label: 'Network', url: 'https://example.com' } }

describe('network tab message boundary', () => {
  it('normalizes HTTPS targets and requires explicit boolean recovery consent', () => {
    expect(parseNetworkCommand(valid)).toMatchObject({ action: 'open', reopen: false, target: { url: 'https://example.com/' } })
    expect(parseNetworkCommand({ ...valid, reopen: 'true' })).toMatchObject({ reopen: false })
    expect(parseNetworkCommand({ ...valid, reopen: true })).toMatchObject({ reopen: true })
  })
  it.each(['http://example.com', 'javascript:alert(1)', 'https://user:pass@example.com', 'file:///tmp/a', 'not a URL'])('rejects unsafe target %s', url => {
    expect(parseNetworkCommand({ ...valid, target: { ...valid.target, url } })).toBeNull()
  })
  it.each([null, {}, { ...valid, windowId: -1 }, { ...valid, windowId: 1.5 }, { ...valid, target: { ...valid.target, profileId: '' } }, { action: 'replace', oldId: 1, newId: 2 }, { action: 'rename', groupId: 1, title: 'x'.repeat(65) }])('rejects malformed or internal-only commands %#', input => {
    expect(parseNetworkCommand(input)).toBeNull()
  })
  it('does not permit a message snapshot to force the internal group policy', () => {
    expect(parseNetworkCommand({ action: 'snapshot', applyPolicy: true })).toEqual({ action: 'snapshot' })
  })
  it('accepts Chrome groups with an empty observed name', () => {
    expect(parseNetworkCommand({ ...valid, target: { ...valid.target, groupTitle: '' } })).toMatchObject({ target: { groupTitle: '' } })
  })
  it('parses group operations and explicit single-tab gather', () => {
    expect(parseNetworkCommand({ action: 'rename', groupId: 2, title: ' New ' })).toEqual({ action: 'rename', groupId: 2, title: 'New' })
    expect(parseNetworkCommand({ action: 'collapse', groupId: 2, collapsed: false })).toEqual({ action: 'collapse', groupId: 2, collapsed: false })
    expect(parseNetworkCommand({ action: 'gather', windowId: 3, tabId: 4 })).toEqual({ action: 'gather', windowId: 3, tabId: 4 })
    expect(parseNetworkCommand({ action: 'gather', windowId: 3, tabId: -1 })).toBeNull()
  })
})
