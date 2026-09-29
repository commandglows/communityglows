import { sanitizeContextualUrl, type UrlSanitizationResult } from '@/services/contextualTasksService'
import { queryExtensionTabs } from '@/platform/webExtensionApi'

export type ExtensionTaskCaptureResult =
  | UrlSanitizationResult & { ok: true }
  | { ok: false; code: 'tabs_api_unavailable' | 'active_tab_unavailable' | Extract<UrlSanitizationResult, { ok: false }>['code'] }

export async function captureActiveTabUrl(): Promise<ExtensionTaskCaptureResult> {
  let rawUrl: string | undefined
  try {
    rawUrl = (await queryExtensionTabs({ active: true, currentWindow: true }))?.[0]?.url
  } catch (error) {
    if (error instanceof Error && error.message === 'tabs_api_unavailable') {
      return { ok: false, code: 'tabs_api_unavailable' }
    }
    return { ok: false, code: 'active_tab_unavailable' }
  }

  if (!rawUrl) return { ok: false, code: 'active_tab_unavailable' }
  const sanitized = sanitizeContextualUrl(rawUrl)
  return sanitized
}
