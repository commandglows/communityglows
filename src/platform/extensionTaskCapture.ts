import { sanitizeContextualUrl, type UrlSanitizationResult } from '@/services/contextualTasksService'

export type ExtensionTaskCaptureResult =
  | UrlSanitizationResult & { ok: true }
  | { ok: false; code: 'tabs_api_unavailable' | 'active_tab_unavailable' | UrlSanitizationResult['code'] }

type BrowserTabsApi = {
  query?: (queryInfo: { active: boolean; currentWindow?: boolean; lastFocusedWindow?: boolean }) => Promise<Array<{ url?: string }>>
}

function queryChromeActiveTab(): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const chromeApi = globalThis.chrome
    if (!chromeApi?.tabs?.query) {
      reject(new Error('tabs_api_unavailable'))
      return
    }
    chromeApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const runtimeError = chromeApi.runtime?.lastError
      if (runtimeError) {
        reject(new Error(runtimeError.message))
        return
      }
      resolve(tabs?.[0]?.url)
    })
  })
}

export async function captureActiveTabUrl(): Promise<ExtensionTaskCaptureResult> {
  let rawUrl: string | undefined
  try {
    if (globalThis.chrome?.tabs?.query) {
      rawUrl = await queryChromeActiveTab()
    } else {
      const browserApi = (globalThis as { browser?: { tabs?: BrowserTabsApi } }).browser
      if (!browserApi?.tabs?.query) return { ok: false, code: 'tabs_api_unavailable' }
      rawUrl = (await browserApi.tabs.query({ active: true, currentWindow: true }))?.[0]?.url
    }
  } catch {
    return { ok: false, code: 'active_tab_unavailable' }
  }

  if (!rawUrl) return { ok: false, code: 'active_tab_unavailable' }
  const sanitized = sanitizeContextualUrl(rawUrl)
  return sanitized.ok ? sanitized : sanitized
}
