import { createApp } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from '@/utils/i18n'
import { notivue } from '@/utils/notifications'
import { sgTooltip } from './directives/tooltip'
import { getConvexClient } from '@/lib/convex'
import {
  authBootstrapError,
  initializeSessionLock,
  markAuthBootstrapError,
  setupConvexAuth
} from '@/lib/convexAuth'
import {
  parseSocialGlowzDeepLink,
  queueSocialGlowzDeepLinkAction,
} from '@/lib/socialGlowzDeepLinks'
import { startCloudSyncQueue } from '@/lib/cloudSyncQueue'

import '@/assets/base.css'
import './assets/main.css'
import './assets/generated/tokens.css'

function renderAuthBootstrapError(message: string) {
  const root = document.getElementById('app')
  if (!root) return

  const main = document.createElement('main')
  const panel = document.createElement('section')
  const title = document.createElement('h1')
  const description = document.createElement('p')
  const actions = document.createElement('div')
  const retryButton = document.createElement('button')
  const loginButton = document.createElement('button')

  main.style.cssText = 'font-family:var(--sg-font-family);min-height: var(--sg-size-100vh);display:grid;place-items:center;padding: var(--sg-space-24px);background:var(--sg-color-background);color:var(--sg-color-text);'
  panel.style.cssText = 'max-width: var(--sg-size-520px);width: var(--sg-size-100pct);background:var(--sg-color-surface-raised);border:1px solid var(--sg-color-border);border-radius: var(--sg-radius-lg);padding: var(--sg-space-24px);box-shadow: var(--sg-shadow-modal);'
  title.style.cssText = 'margin: var(--sg-space-0-0-8px);font-size: var(--sg-font-size-20px);'
  description.style.cssText = 'margin: var(--sg-space-0-0-16px);line-height: var(--sg-line-height-1d45);'
  actions.style.cssText = 'display:flex;gap: var(--sg-space-12px);flex-wrap:wrap;'
  retryButton.style.cssText = 'padding: var(--sg-space-10px-14px);border:none;border-radius: var(--sg-radius-sm);background:var(--sg-color-action);color:var(--sg-color-text-on-action);cursor:pointer;'
  loginButton.style.cssText = 'padding: var(--sg-space-10px-14px);border:1px solid var(--sg-color-border);border-radius: var(--sg-radius-sm);background:var(--sg-color-surface-raised);color:var(--sg-color-text);cursor:pointer;'

  title.textContent = 'Connexion indisponible'
  description.textContent = message
  retryButton.textContent = 'Réessayer la connexion'
  loginButton.textContent = 'Retour à login'
  retryButton.id = 'sf-auth-retry'
  loginButton.id = 'sf-auth-login'

  actions.append(retryButton, loginButton)
  panel.append(title, description, actions)
  main.append(panel)
  root.replaceChildren(main)

  retryButton.addEventListener('click', () => {
    window.location.reload()
  })
  loginButton.addEventListener('click', () => {
    window.location.hash = '#/login'
  })
}

type DeepLinkPayload = string[] | null
type AndroidOAuthPendingRequest = {
  state: string
  nonce?: string | null
  startedAtMs: number
  networkId?: string
}

declare global {
  interface Window {
    Sentry?: {
      captureMessage?: (message: string, context?: Record<string, unknown>) => void
    }
  }
}

const pendingAndroidOAuthRequests = new Map<string, AndroidOAuthPendingRequest>()

function reportAndroidOAuthRejection(reason: string) {
  window.Sentry?.captureMessage?.('android_oauth_callback_rejected', {
    level: 'warning',
    tags: {
      feature: 'android-oauth',
      reason,
    },
  })
}

function registerPendingAndroidOAuthRequest(request: AndroidOAuthPendingRequest) {
  if (!request.state || !Number.isFinite(request.startedAtMs) || request.startedAtMs <= 0) return
  pendingAndroidOAuthRequests.set(request.state, {
    state: request.state,
    nonce: request.nonce ?? null,
    startedAtMs: request.startedAtMs,
    networkId: request.networkId,
  })
}

function setupAndroidOAuthPendingRegistration() {
  window.addEventListener('socialglowz:android-oauth-request-started', (event) => {
    if (!(event instanceof CustomEvent)) return
    const detail = event.detail as Partial<AndroidOAuthPendingRequest> | null
    if (!detail || typeof detail.state !== 'string') return
    registerPendingAndroidOAuthRequest({
      state: detail.state,
      nonce: typeof detail.nonce === 'string' ? detail.nonce : null,
      startedAtMs: typeof detail.startedAtMs === 'number' ? detail.startedAtMs : Date.now(),
      networkId: typeof detail.networkId === 'string' ? detail.networkId : undefined,
    })
  })
}

async function validateAndroidOAuthDeepLink(rawUrl: string) {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return
  }

  const callbackPath = parsed.pathname
  const isKnownCallbackPath = callbackPath === '/oauth' || callbackPath === '/auth/callback'
  if (!isKnownCallbackPath) return

  const callbackState = parsed.searchParams.get('state')
  if (!callbackState) {
    reportAndroidOAuthRejection('missing-state')
    return
  }

  const pendingRequest = pendingAndroidOAuthRequests.get(callbackState)
  if (!pendingRequest) {
    reportAndroidOAuthRejection('missing-pending-request')
    console.warn('[Security] Android OAuth callback rejected: no pending request for state.')
    return
  }

  try {
    await invoke('validate_android_oauth_callback', {
      callbackUrl: rawUrl,
      expectedState: pendingRequest.state,
      expectedNonce: pendingRequest.nonce ?? null,
      startedAtMs: pendingRequest.startedAtMs,
    })
    pendingAndroidOAuthRequests.delete(callbackState)
    window.dispatchEvent(new CustomEvent('socialglowz:android-oauth-callback-validated', { detail: rawUrl }))
  } catch (error) {
    reportAndroidOAuthRejection(error instanceof Error ? error.message : 'native-validator-rejected')
    console.warn('[Security] Android OAuth callback rejected by native validator.', error)
  }
}

async function processAndroidDeepLinks(payload: DeepLinkPayload) {
  if (!Array.isArray(payload) || payload.length === 0) return
  await Promise.all(payload.map(async (url) => {
    const appDeepLinkAction = parseSocialGlowzDeepLink(url)
    if (appDeepLinkAction) {
      queueSocialGlowzDeepLinkAction(appDeepLinkAction)
      return
    }
    await validateAndroidOAuthDeepLink(url)
  }))
}

async function setupAndroidOAuthDeepLinkValidation() {
  let unlisten: UnlistenFn | null = null
  try {
    unlisten = await listen<string[]>('deep-link://new-url', async (event) => {
      await processAndroidDeepLinks(event.payload ?? null)
    })
  } catch {
    // Non-Tauri targets do not expose deep-link runtime events.
  }

  try {
    const current = await invoke<DeepLinkPayload>('plugin:deep-link|get_current')
    await processAndroidDeepLinks(current)
  } catch {
    // Deep-link plugin command unavailable on non-mobile or when capability is not enabled.
  }

  if (unlisten) {
    window.addEventListener('beforeunload', () => {
      unlisten?.()
    }, { once: true })
  }
}

// Bootstrap Convex Auth (anonymous auto-login) before mounting — skip if not configured
async function bootstrap() {
  setupAndroidOAuthPendingRegistration()
  await setupAndroidOAuthDeepLinkValidation()

  const convexUrl = import.meta.env.VITE_CONVEX_URL as string
  if (convexUrl) {
    try {
      const client = getConvexClient()
      await setupConvexAuth(client, convexUrl)
      startCloudSyncQueue()
      initializeSessionLock()
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erreur inconnue'
      markAuthBootstrapError(
        `Impossible d'initialiser l'authentification (${reason}). Vérifiez la connexion réseau puis réessayez.`
      )
    }
  }

  if (authBootstrapError.value) {
    renderAuthBootstrapError(authBootstrapError.value)
    return
  }

  const app = createApp(App)
  const pinia = createPinia()

  pinia.use(piniaPluginPersistedstate)

  app.use(notivue)
  app.use(i18n)
  app.use(router)
  app.use(pinia)

  app.directive('sg-tooltip', sgTooltip)

  app.mount('#app')
}

bootstrap()
