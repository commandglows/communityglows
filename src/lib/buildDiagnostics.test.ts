import { buildDiagnosticsReport } from './buildDiagnostics'

describe('buildDiagnosticsReport', () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      __BUILD_ID__: 'test-build',
      __GIT_COMMIT__: 'test-commit',
      __BUILD_AT_PARIS__: '2026-08-03T10:00:00+02:00',
      __BUILD_AT_UTC__: '2026-08-03T08:00:00Z',
      __DISPLAY_NAME__: 'SocialGlowz',
      __VERSION__: '0.0.1',
    })
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        language: 'fr-FR',
        onLine: true,
        platform: 'test',
        userAgent: 'vitest',
      },
    })
    Object.assign(globalThis, { window: { innerWidth: 1280, innerHeight: 720 } })
    Object.assign(globalThis, {
      localStorage: { getItem: () => null },
    })
  })

  it('includes and redacts caller-provided diagnostic context', () => {
    const report = buildDiagnosticsReport({
      active_network: 'linkedin',
      target_url: 'https://example.com/private?token=secret',
    })

    expect(report).toContain('active_network: linkedin')
    expect(report).toContain('target_url: [redacted-url]')
  })
})
