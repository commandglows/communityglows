import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => {
  return {
    action: vi.fn(),
    setAuth: vi.fn(),
    tokenCallback: null as null | ((args: { forceRefreshToken: boolean }) => Promise<string | null>),
    onAuthStateChange: null as null | ((authenticated: boolean) => void),
  };
});

vi.mock("convex/browser", () => {
  class MockConvexClient {
    setAuth(
      tokenCallback: (args: { forceRefreshToken: boolean }) => Promise<string | null>,
      onAuthStateChange: (authenticated: boolean) => void,
    ) {
      mockState.tokenCallback = tokenCallback;
      mockState.onAuthStateChange = onAuthStateChange;
    }
  }

  class MockConvexHttpClient {
    constructor(_url: string) {}

    action = mockState.action;
    setAuth = mockState.setAuth;
  }

  return {
    ConvexClient: MockConvexClient,
    ConvexHttpClient: MockConvexHttpClient,
  };
});

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string) {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.map.set(key, value);
  }

  removeItem(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

const CONVEX_URL = "https://demo.convex.cloud";
const NAMESPACE = CONVEX_URL.replace(/[^a-zA-Z0-9]/g, "");
const JWT_STORAGE_KEY = `__convexAuthJWT_${NAMESPACE}`;
const REFRESH_STORAGE_KEY = `__convexAuthRefreshToken_${NAMESPACE}`;
const LEGACY_JWT_KEY = "sf_jwt";
const LEGACY_REFRESH_KEY = "sf_refresh";
const LEGACY_GLOBAL_JWT_KEY = "__convexAuthJWT";
const LEGACY_GLOBAL_REFRESH_KEY = "__convexAuthRefreshToken";

async function loadAuthModule() {
  vi.resetModules();
  return import("@/lib/convexAuth");
}

function createMockClient() {
  return {
    setAuth: (
      tokenCallback: (args: { forceRefreshToken: boolean }) => Promise<string | null>,
      onAuthStateChange: (authenticated: boolean) => void,
    ) => {
      mockState.tokenCallback = tokenCallback;
      mockState.onAuthStateChange = onAuthStateChange;
    },
  };
}

async function confirmRestoredSession(setupPromise: Promise<void>) {
  await vi.waitFor(() => expect(mockState.tokenCallback).not.toBeNull());
  await mockState.tokenCallback?.({ forceRefreshToken: false });
  mockState.onAuthStateChange?.(true);
  await setupPromise;
}

beforeEach(() => {
  mockState.action.mockReset();
  mockState.setAuth.mockReset();
  mockState.tokenCallback = null;
  mockState.onAuthStateChange = null;

  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
});

describe("convexAuth client boundaries", () => {
  it("restores a session only when both namespaced JWT and refresh token exist", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-1");
    localStorage.setItem(REFRESH_STORAGE_KEY, "refresh-1");
    const { setupConvexAuth, isAuthenticated, isAuthLoading } = await loadAuthModule();

    await confirmRestoredSession(setupConvexAuth(createMockClient() as never, CONVEX_URL));

    expect(isAuthenticated.value).toBe(true);
    expect(isAuthLoading.value).toBe(false);
    expect(mockState.action).not.toHaveBeenCalled();
  });

  it("does not restore a token-only session and clears stale JWT storage", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-without-refresh");
    const { setupConvexAuth, isAuthenticated, isAuthLoading } = await loadAuthModule();

    await setupConvexAuth(createMockClient() as never, CONVEX_URL);

    expect(isAuthenticated.value).toBe(false);
    expect(isAuthLoading.value).toBe(false);
    expect(localStorage.getItem(JWT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it("purges legacy global/localStorage auth keys during setup", async () => {
    localStorage.setItem(LEGACY_JWT_KEY, "legacy-jwt");
    localStorage.setItem(LEGACY_REFRESH_KEY, "legacy-refresh");
    localStorage.setItem(LEGACY_GLOBAL_JWT_KEY, "legacy-global-jwt");
    localStorage.setItem(LEGACY_GLOBAL_REFRESH_KEY, "legacy-global-refresh");

    const { setupConvexAuth } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);

    expect(localStorage.getItem(LEGACY_JWT_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_GLOBAL_JWT_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_GLOBAL_REFRESH_KEY)).toBeNull();
  });

  it("waits for Convex to confirm a fresh sign-in before exposing authentication", async () => {
    mockState.action.mockResolvedValue({
      tokens: {
        token: "jwt-2",
        refreshToken: "refresh-2",
      },
    });

    const { setupConvexAuth, signIn, isAuthenticated } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);
    const signInPromise = signIn("password", { email: "user@test.com", password: "secret" });
    await vi.waitFor(() => expect(localStorage.getItem(JWT_STORAGE_KEY)).toBe("jwt-2"));

    expect(isAuthenticated.value).toBe(false);
    expect(mockState.tokenCallback).not.toBeNull();
    await expect(mockState.tokenCallback?.({ forceRefreshToken: false })).resolves.toBe("jwt-2");
    mockState.onAuthStateChange?.(true);
    await signInPromise;

    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBe("refresh-2");
    expect(isAuthenticated.value).toBe(true);
    expect(mockState.action).toHaveBeenCalledWith("auth:signIn", {
      provider: "password",
      params: { email: "user@test.com", password: "secret" },
    });
  });

  it("offers a restored JWT to Convex on the first auth callback", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-restored");
    localStorage.setItem(REFRESH_STORAGE_KEY, "refresh-restored");
    const { setupConvexAuth } = await loadAuthModule();

    const setupPromise = setupConvexAuth(createMockClient() as never, CONVEX_URL);
    await vi.waitFor(() => expect(mockState.tokenCallback).not.toBeNull());
    await expect(mockState.tokenCallback?.({ forceRefreshToken: false })).resolves.toBe("jwt-restored");
    mockState.onAuthStateChange?.(true);
    await setupPromise;
  });

  it("rejects a password sign-in response without session tokens", async () => {
    mockState.action.mockResolvedValue({});
    const { setupConvexAuth, signIn, isAuthenticated } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);

    await expect(
      signIn("password", { email: "user@test.com", password: "secret" }),
    ).rejects.toThrow("session valide");
    expect(isAuthenticated.value).toBe(false);
  });

  it("clears tokens when refresh is requested without a refresh token", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-3");
    const { setupConvexAuth, isAuthenticated } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);

    localStorage.removeItem(REFRESH_STORAGE_KEY);
    const refreshed = await mockState.tokenCallback?.({ forceRefreshToken: true });

    expect(refreshed).toBeNull();
    expect(isAuthenticated.value).toBe(false);
    expect(localStorage.getItem(JWT_STORAGE_KEY)).toBeNull();
  });

  it("clears tokens on sign out even if server sign-out fails", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-4");
    localStorage.setItem(REFRESH_STORAGE_KEY, "refresh-4");
    mockState.action.mockRejectedValue(new Error("sign out failed"));

    const { setupConvexAuth, signOut, isAuthenticated } = await loadAuthModule();
    await confirmRestoredSession(setupConvexAuth(createMockClient() as never, CONVEX_URL));
    await signOut();

    expect(localStorage.getItem(JWT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
    expect(isAuthenticated.value).toBe(false);
    expect(mockState.setAuth).toHaveBeenCalledWith("jwt-4");
  });
});
