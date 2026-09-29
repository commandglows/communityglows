import { createApp, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n, setLocale } from '@/utils/i18n'
import { useOnboardingStore } from '@/stores/onboarding'
import { notivue } from '@/utils/notifications'
import { sgTooltip } from './directives/tooltip'
import { getConvexClient } from '@/lib/convex'
import {
  isAuthLoading,
  initializeSessionLock,
  markAuthBootstrapError,
  setupConvexAuth,
} from '@/lib/convexAuth'
import {
  parseCommunityGlowsDeepLink,
  queueCommunityGlowsDeepLinkAction,
} from '@/lib/communityGlowsDeepLinks'
import { startCloudSyncQueue } from '@/lib/cloudSyncQueue'

import '@/assets/base.css'
import './assets/main.css'
import './assets/generated/tokens.css'
import 'dockview-vue/dist/styles/dockview.css'

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
      captureMessage?: (
        message: string,
        context?: Record<string, unknown>,
      ) => void
    }
  }
}

const pendingAndroidOAuthRequests = new Map<
  string,
  AndroidOAuthPendingRequest
>()

function reportAndroidOAuthRejection(reason: string) {
  window.Sentry?.captureMessage?.('android_oauth_callback_rejected', {
    level: 'warning',
    tags: {
      feature: 'android-oauth',
      reason,
    },
  })
}

function registerPendingAndroidOAuthRequest(
  request: AndroidOAuthPendingRequest,
) {
  if (
    !request.state ||
    !Number.isFinite(request.startedAtMs) ||
    request.startedAtMs <= 0
  )
    return
  pendingAndroidOAuthRequests.set(request.state, {
    state: request.state,
    nonce: request.nonce ?? null,
    startedAtMs: request.startedAtMs,
    networkId: request.networkId,
  })
}

function setupAndroidOAuthPendingRegistration() {
  window.addEventListener(
    'communityglows:android-oauth-request-started',
    (event) => {
      if (!(event instanceof CustomEvent)) return
      const detail = event.detail as Partial<AndroidOAuthPendingRequest> | null
      if (!detail || typeof detail.state !== 'string') return
      registerPendingAndroidOAuthRequest({
        state: detail.state,
        nonce: typeof detail.nonce === 'string' ? detail.nonce : null,
        startedAtMs:
          typeof detail.startedAtMs === 'number'
            ? detail.startedAtMs
            : Date.now(),
        networkId:
          typeof detail.networkId === 'string' ? detail.networkId : undefined,
      })
    },
  )
}

async function validateAndroidOAuthDeepLink(rawUrl: string) {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return
  }

  const callbackPath = parsed.pathname
  const isKnownCallbackPath =
    callbackPath === '/oauth' || callbackPath === '/auth/callback'
  if (!isKnownCallbackPath) return

  const callbackState = parsed.searchParams.get('state')
  if (!callbackState) {
    reportAndroidOAuthRejection('missing-state')
    return
  }

  const pendingRequest = pendingAndroidOAuthRequests.get(callbackState)
  if (!pendingRequest) {
    reportAndroidOAuthRejection('missing-pending-request')
    console.warn(
      '[Security] Android OAuth callback rejected: no pending request for state.',
    )
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
    window.dispatchEvent(
      new CustomEvent('communityglows:android-oauth-callback-validated', {
        detail: rawUrl,
      }),
    )
  } catch (error) {
    reportAndroidOAuthRejection(
      error instanceof Error ? error.message : 'native-validator-rejected',
    )
    console.warn(
      '[Security] Android OAuth callback rejected by native validator.',
      error,
    )
  }
}

async function processAndroidDeepLinks(payload: DeepLinkPayload) {
  if (!Array.isArray(payload) || payload.length === 0) return
  await Promise.all(
    payload.map(async (url) => {
      const appDeepLinkAction = parseCommunityGlowsDeepLink(url)
      if (appDeepLinkAction) {
        queueCommunityGlowsDeepLinkAction(appDeepLinkAction)
        return
      }
      await validateAndroidOAuthDeepLink(url)
    }),
  )
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
    const current = await invoke<DeepLinkPayload>(
      'plugin:deep-link|get_current',
    )
    await processAndroidDeepLinks(current)
  } catch {
    // Deep-link plugin command unavailable on non-mobile or when capability is not enabled.
  }

  if (unlisten) {
    window.addEventListener(
      'beforeunload',
      () => {
        unlisten?.()
      },
      { once: true },
    )
  }
}

async function restoreAuthentication() {
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
        `Impossible d'initialiser l'authentification (${reason}). Vérifiez la connexion réseau puis réessayez.`,
      )
    }
  } else {
    isAuthLoading.value = false
  }
}

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  pinia.use(piniaPluginPersistedstate)

  app.use(notivue)
  app.use(i18n)
  app.use(pinia)
  app.use(router)

  app.directive('sg-tooltip', sgTooltip)

  const onboardingStore = useOnboardingStore(pinia)
  await onboardingStore.resolveScope()
  app.mount('#app')

  // An old cloud/local completed flag cannot restore a session before language choice.
  if (onboardingStore.selectedLanguage && !['fr', 'en'].includes(localStorage.getItem('user-locale') ?? '')) {
    setLocale(onboardingStore.selectedLanguage, false)
  }
  let authenticationStarted = false
  watch(() => onboardingStore.languageSelected && onboardingStore.scopeReady, (selected) => {
    if (!selected || authenticationStarted) return
    authenticationStarted = true
    setupAndroidOAuthPendingRegistration()
    void setupAndroidOAuthDeepLinkValidation()
    void restoreAuthentication()
  }, { immediate: true })
}

void bootstrap()
