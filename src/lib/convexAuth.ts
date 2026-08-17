/**
 * Convex Auth client for Vue (ported from @convex-dev/auth/react internals).
 *
 * Manages JWT + refresh token in localStorage,
 * wires into ConvexClient.setAuth() for automatic token refresh,
 * and exposes signIn / signOut helpers.
 */
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { ref } from "vue";
import { recordDiagnosticEvent } from "@/lib/buildDiagnostics";

const JWT_KEY = "__convexAuthJWT";
const REFRESH_TOKEN_KEY = "__convexAuthRefreshToken";
const LEGACY_JWT_KEYS = ["sf_jwt", "__convexAuthJWT"];
const LEGACY_REFRESH_KEYS = ["sf_refresh", "__convexAuthRefreshToken"];
const SESSION_LAST_ACTIVITY_KEY = "communityglows_session_last_activity_at";
const SESSION_PIN_HASH_KEY = "communityglows_session_pin_hash";
const SESSION_PIN_SALT_KEY = "communityglows_session_pin_salt";
const DEFAULT_SESSION_LOCK_IDLE_MS = 15 * 60 * 1000;
const AUTH_CONFIRMATION_TIMEOUT_MS = 12_000;
const AUTH_ACTION_TIMEOUT_MS = 15_000;
const AUTH_RETRY_BACKOFF_MS = [500, 2_000] as const;
const AUTH_RETRY_JITTER_MS = 100;

function storageKey(key: string, namespace: string) {
  return `${key}_${namespace.replace(/[^a-zA-Z0-9]/g, "")}`;
}

// --------------- Reactive state (module-level singletons) ---------------

export const isAuthenticated = ref(false);
export const isAuthLoading = ref(true);
export const isConvexConfigured = ref(false);
export const authBootstrapError = ref<string | null>(null);
export const isSessionLocked = ref(false);

interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface AuthResult {
  tokens?: AuthTokens;
}

type ConvexActionRef = Parameters<ConvexHttpClient["action"]>[0];

let _client: ConvexClient | null = null;
let _namespace = "";
let _currentToken: string | null = null;
let _sessionLockIdleMs = DEFAULT_SESSION_LOCK_IDLE_MS;
let _sessionLockTick: number | null = null;
let _sessionListenersInstalled = false;

const AUTH_SIGN_IN = "auth:signIn" as unknown as ConvexActionRef;
const AUTH_SIGN_OUT = "auth:signOut" as unknown as ConvexActionRef;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function getHttpClient() {
  if (!_namespace) {
    throw new Error(
      "Account sync is unavailable — this build was not configured with a Convex backend.",
    );
  }
  return new ConvexHttpClient(_namespace);
}

function isNetworkAuthError(error: unknown) {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;
  return /network|fetch|cors|connection|socket|timed? ?out/i.test(error.message);
}

function authFailureStatus(error: unknown) {
  if (isNetworkAuthError(error)) return "network-error";
  return error instanceof Error ? "action-error" : `non-error-${typeof error}`;
}

async function callRealtimeAuthAction(
  action: ConvexActionRef,
  args: Record<string, unknown>,
  stage: "password-sign-in" | "sign-out",
) {
  if (!_client) {
    throw new Error("Le service de connexion n’est pas initialisé.");
  }
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    recordDiagnosticEvent({ area: "cloud-auth", stage, status: "realtime-start" });
    const result = await Promise.race([
      _client.action(action, args as never),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          recordDiagnosticEvent({ area: "cloud-auth", stage, status: "realtime-timeout" });
          reject(new Error("La connexion au serveur a expiré. Vérifiez votre réseau puis réessayez."));
        }, AUTH_ACTION_TIMEOUT_MS);
      }),
    ]);
    recordDiagnosticEvent({ area: "cloud-auth", stage, status: "realtime-success" });
    return result;
  } catch (error) {
    if (!timedOut) {
      recordDiagnosticEvent({
        area: "cloud-auth",
        stage,
        status: `realtime-${authFailureStatus(error)}`,
      });
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function callUnauthenticatedAuthActionWithRetry(
  action: ConvexActionRef,
  args: Record<string, unknown>,
) {
  let lastError: unknown;
  let retry = 0;
  while (retry < AUTH_RETRY_BACKOFF_MS.length) {
    try {
      recordDiagnosticEvent({ area: "cloud-auth", stage: "token-refresh", status: "http-start" });
      const result = await getHttpClient().action(action, args as never);
      recordDiagnosticEvent({ area: "cloud-auth", stage: "token-refresh", status: "http-success" });
      return result;
    } catch (error) {
      lastError = error;
      recordDiagnosticEvent({
        area: "cloud-auth",
        stage: "token-refresh",
        status: `http-${authFailureStatus(error)}`,
      });
      if (!isNetworkAuthError(error)) throw error;
      const waitMs = AUTH_RETRY_BACKOFF_MS[retry] + AUTH_RETRY_JITTER_MS * Math.random();
      retry += 1;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

function detachClientAuth() {
  _client?.setAuth(async () => null, (authenticated) => {
    isAuthenticated.value = authenticated;
  });
}

function configureClientAuth(options?: { waitForConfirmation?: boolean }) {
  if (!_client) {
    return Promise.reject(new Error("Le service de connexion n’est pas initialisé."));
  }

  let tokenWasProvided = false;
  let settled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const confirmation = new Promise<void>((resolve, reject) => {
    if (options?.waitForConfirmation) {
      timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        clearTokens();
        detachClientAuth();
        recordDiagnosticEvent({ area: "cloud-auth", stage: "session-confirmation", status: "timeout" });
        reject(new Error("La confirmation de la session cloud a expiré. Réessayez."));
      }, AUTH_CONFIRMATION_TIMEOUT_MS);
    }

    _client?.setAuth(
      async ({ forceRefreshToken }) => {
        if (forceRefreshToken) {
          const refreshToken = localStorage.getItem(
            storageKey(REFRESH_TOKEN_KEY, _namespace),
          );
          if (!refreshToken) {
            clearTokens();
            return null;
          }
          try {
            const result = (await callUnauthenticatedAuthActionWithRetry(AUTH_SIGN_IN, {
              refreshToken,
            })) as AuthResult | null;
            if (result?.tokens) {
              persistTokens(result.tokens);
              tokenWasProvided = true;
              return result.tokens.token;
            }
          } catch {
            // Refresh failed — session expired.
          }
          clearTokens();
          return null;
        }
        tokenWasProvided = Boolean(_currentToken);
        return _currentToken;
      },
      (authenticated) => {
        isAuthenticated.value = authenticated;
        recordDiagnosticEvent({
          area: "cloud-auth",
          stage: "session-confirmation",
          status: authenticated ? "confirmed" : "signed-out",
        });

        if (!options?.waitForConfirmation || settled) return;
        if (authenticated) {
          settled = true;
          if (timeoutId) clearTimeout(timeoutId);
          touchSessionActivity();
          resolve();
        } else if (tokenWasProvided) {
          settled = true;
          if (timeoutId) clearTimeout(timeoutId);
          clearTokens();
          detachClientAuth();
          reject(new Error("La session cloud n’a pas pu être confirmée. Réessayez."));
        }
      },
    );

    if (!options?.waitForConfirmation) {
      settled = true;
      resolve();
    }
  });

  return confirmation;
}

// --------------- Bootstrap ---------------

/**
 * Call once at app startup (before mounting Vue).
 * - Restores a previous session from localStorage
 * - Does not auto-create an anonymous session when no token exists
 */
export async function setupConvexAuth(client: ConvexClient, convexUrl: string) {
  _client = client;
  _namespace = convexUrl;
  isConvexConfigured.value = true;
  authBootstrapError.value = null;
  isAuthLoading.value = true;
  purgeLegacyTokenKeys();

  const jwtK = storageKey(JWT_KEY, _namespace);
  const refreshK = storageKey(REFRESH_TOKEN_KEY, _namespace);

  // Try to restore from storage
  const storedToken = localStorage.getItem(jwtK);
  const storedRefreshToken = localStorage.getItem(refreshK);
  if (storedToken && storedRefreshToken) {
    _currentToken = storedToken;
    isAuthenticated.value = false;
    await configureClientAuth({ waitForConfirmation: true });
    touchSessionActivity();
    isAuthLoading.value = false;
    return;
  }

  // No existing session → explicit non-auth state (no anonymous auto-login)
  clearTokens();
  await configureClientAuth();
  isAuthLoading.value = false;
}

// --------------- Actions ---------------

/**
 * Sign in with a provider.
 *
 * @example signIn("anonymous")
 * @example signIn("password", { email, password, flow: "signUp" })
 */
export async function signIn(
  provider: string,
  params?: Record<string, string>,
) {
  if (!_client) {
    throw new Error(
      "Account sync is unavailable — this build was not configured with a Convex backend.",
    );
  }

  let result: AuthResult | null;
  try {
    result = (await callRealtimeAuthAction(AUTH_SIGN_IN, {
      provider,
      params: params ?? {},
    }, "password-sign-in")) as AuthResult | null;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw Object.assign(new Error("La connexion au cloud a échoué. Réessayez."), { cause: error });
  }

  if (result?.tokens) {
    persistTokens(result.tokens);
    isAuthenticated.value = false;
    recordDiagnosticEvent({ area: "cloud-auth", stage: "password-sign-in", status: "tokens-received" });
    await configureClientAuth({ waitForConfirmation: true });
  } else {
    recordDiagnosticEvent({ area: "cloud-auth", stage: "password-sign-in", status: "no-tokens" });
    throw new Error("La connexion n’a pas renvoyé de session valide. Réessayez.");
  }

  return result;
}

export async function signOut() {
  if (!_client) return;
  try {
    await callRealtimeAuthAction(AUTH_SIGN_OUT, {}, "sign-out");
  } catch (e) {
    console.warn("[ConvexAuth] Sign-out failed (already signed out?)", e);
  }
  clearTokens();
}

// --------------- Helpers ---------------

function persistTokens(tokens: { token: string; refreshToken: string }) {
  _currentToken = tokens.token;
  localStorage.setItem(storageKey(JWT_KEY, _namespace), tokens.token);
  localStorage.setItem(
    storageKey(REFRESH_TOKEN_KEY, _namespace),
    tokens.refreshToken,
  );
  touchSessionActivity();
}

function clearTokens() {
  _currentToken = null;
  if (canUseStorage()) {
    localStorage.removeItem(storageKey(JWT_KEY, _namespace));
    localStorage.removeItem(storageKey(REFRESH_TOKEN_KEY, _namespace));
  }
  clearSessionPin();
  isAuthenticated.value = false;
  isSessionLocked.value = false;
  clearSessionActivity();
}

function purgeLegacyTokenKeys() {
  if (!canUseStorage()) return;
  for (const key of LEGACY_JWT_KEYS) localStorage.removeItem(key);
  for (const key of LEGACY_REFRESH_KEYS) localStorage.removeItem(key);
}

function clearSessionActivity() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
}

function touchSessionActivity() {
  if (!canUseStorage()) return;
  localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
  isSessionLocked.value = false;
}

function readSessionActivity() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function evaluateSessionLock() {
  if (!isAuthenticated.value) {
    isSessionLocked.value = false;
    return;
  }
  const now = Date.now();
  const lastActivity = readSessionActivity() ?? now;
  if (!readSessionActivity()) {
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));
  }
  isSessionLocked.value = now - lastActivity >= _sessionLockIdleMs;
}

function installSessionLockListeners() {
  if (_sessionListenersInstalled || typeof window === "undefined") return;
  _sessionListenersInstalled = true;

  const onActivity = () => {
    if (!isAuthenticated.value) return;
    touchSessionActivity();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      if (isAuthenticated.value) {
        localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
      }
      return;
    }
    evaluateSessionLock();
  };

  window.addEventListener("pointerdown", onActivity, { passive: true });
  window.addEventListener("keydown", onActivity, { passive: true });
  window.addEventListener("touchstart", onActivity, { passive: true });
  window.addEventListener("focus", evaluateSessionLock);
  document.addEventListener("visibilitychange", onVisibility);
}

export function initializeSessionLock(options?: { idleTimeoutMs?: number }) {
  if (typeof options?.idleTimeoutMs === "number" && options.idleTimeoutMs >= 60_000) {
    _sessionLockIdleMs = options.idleTimeoutMs;
  }
  installSessionLockListeners();
  evaluateSessionLock();

  if (_sessionLockTick !== null || typeof window === "undefined") return;
  _sessionLockTick = window.setInterval(() => {
    evaluateSessionLock();
  }, 30_000);
}

export function unlockSession() {
  if (!isAuthenticated.value) return;
  touchSessionActivity();
}

export function hasSessionPin() {
  if (!canUseSessionStorage()) return false;
  return !!sessionStorage.getItem(SESSION_PIN_HASH_KEY);
}

export async function setSessionPin(pin: string) {
  const normalized = normalizePin(pin);
  const salt = randomSessionSalt();
  const hash = await hashSessionPin(normalized, salt);
  if (!canUseSessionStorage()) {
    throw new Error("Le verrouillage local n'est pas disponible sur cet appareil.");
  }
  sessionStorage.setItem(SESSION_PIN_SALT_KEY, salt);
  sessionStorage.setItem(SESSION_PIN_HASH_KEY, hash);
  unlockSession();
}

export async function unlockSessionWithPin(pin: string) {
  const normalized = normalizePin(pin);
  if (!canUseSessionStorage()) return false;
  const salt = sessionStorage.getItem(SESSION_PIN_SALT_KEY);
  const expectedHash = sessionStorage.getItem(SESSION_PIN_HASH_KEY);
  if (!salt || !expectedHash) return false;
  const actualHash = await hashSessionPin(normalized, salt);
  if (actualHash !== expectedHash) return false;
  unlockSession();
  return true;
}

export function clearSessionPin() {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(SESSION_PIN_HASH_KEY);
  sessionStorage.removeItem(SESSION_PIN_SALT_KEY);
}

function normalizePin(pin: string) {
  const normalized = pin.trim();
  if (!/^\d{4,8}$/.test(normalized)) {
    throw new Error("Le code PIN doit contenir 4 à 8 chiffres.");
  }
  return normalized;
}

function randomSessionSalt() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byteToHex).join("");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function hashSessionPin(pin: string, salt: string) {
  const material = `${salt}:${pin}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(material),
    );
    return Array.from(new Uint8Array(digest), byteToHex).join("");
  }
  let hash = 5381;
  for (let i = 0; i < material.length; i += 1) {
    hash = (hash * 33) ^ material.charCodeAt(i);
  }
  return String(hash >>> 0);
}

function byteToHex(byte: number) {
  const hex = byte.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export function markAuthBootstrapError(message: string) {
  authBootstrapError.value = message;
  isAuthLoading.value = false;
}
