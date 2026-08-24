import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from '@vue/compiler-sfc'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'

const componentPath = new URL('./BitwardenExtensionSettings.vue', import.meta.url)

function componentSource(): string {
  return readFileSync(componentPath, 'utf8')
}

describe('Windows Bitwarden Settings flow', () => {
  it('keeps the guided actions inside the native local installation boundary', () => {
    const source = componentSource()
    const parsed = parse(source, { filename: 'BitwardenExtensionSettings.vue' })

    expect(parsed.errors).toEqual([])
    expect(source).toContain("invoke('open_bitwarden_download_page')")
    expect(source).toContain("invokeStatus('import_bitwarden_extension'")
    expect(source).toContain('expectedSha256: expectedSha256.value')
    expect(source).toContain('!hasValidSha256')
    expect(source).toContain("invokeStatus('disable_bitwarden_extension')")
    expect(source).toContain("invoke('restart_communityglows')")
    expect(source).toContain("extensions: ['zip']")
    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('upload')
  })

  it('shows explicit local-only, restart, recovery, and managed states', () => {
    const template = parse(componentSource()).descriptor.template?.content ?? ''

    expect(template).toContain("status.source === 'environment'")
    expect(template).toContain('status.restartRequired')
    expect(template).toContain('role="alert"')
    expect(template).toContain(':aria-busy="busy"')
    expect(fr.bitwarden_settings.local_only).toContain('jamais envoyée')
    expect(en.bitwarden_settings.local_only).toContain('never uploaded')
    expect(fr.bitwarden_settings.checksum_help).toContain('refusé')
    expect(en.bitwarden_settings.checksum_help).toContain('rejected')
  })

  it('keeps every Bitwarden Settings key aligned in English and French', () => {
    expect(Object.keys(en.bitwarden_settings).sort())
      .toEqual(Object.keys(fr.bitwarden_settings).sort())
  })
})
