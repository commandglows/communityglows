import {
  managedNetworkCommand,
  hasManagedNetworkTabs,
  type NetworkTarget,
} from "./managedNetworkTabs"
import { supportsSidePanel } from "@/platform/capabilities"
import {
  createExtensionTab,
  currentExtensionWindowId,
  extensionUrl,
  openExtensionSidePanel as openSidePanelApi,
} from "@/platform/webExtensionApi"

const FORBIDDEN_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "file:",
  "chrome:",
  "chrome-extension:",
  "moz-extension:",
])

export type UrlValidationErrorCode =
  | "empty"
  | "invalid"
  | "forbidden_protocol"
  | "https_required"
  | "credentials_not_allowed"

export type UrlValidationSuccess = {
  ok: true
  url: string
  host: string
}

export type UrlValidationFailure = {
  ok: false
  code: UrlValidationErrorCode
}

export type UrlValidationResult = UrlValidationSuccess | UrlValidationFailure

export type ExtensionLaunchErrorCode =
  | UrlValidationErrorCode
  | "tabs_api_unavailable"
  | "tab_creation_failed"
  | "runtime_url_unavailable"
  | "side_panel_unavailable"
  | "side_panel_failed"
  | "restore_required"

export type ExtensionLaunchResult =
  { ok: true } | { ok: false; code: ExtensionLaunchErrorCode }

function parseCandidateUrl(rawInput: string): URL | null {
  const trimmed = rawInput.trim()
  if (!trimmed) return null
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    return new URL(candidate)
  } catch {
    return null
  }
}

export function normalizeHttpsUrl(rawInput: string): UrlValidationResult {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return { ok: false, code: "empty" }
  }

  const parsed = parseCandidateUrl(trimmed)
  if (!parsed) {
    return { ok: false, code: "invalid" }
  }

  if (FORBIDDEN_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, code: "forbidden_protocol" }
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, code: "https_required" }
  }

  if (parsed.username || parsed.password) {
    return { ok: false, code: "credentials_not_allowed" }
  }

  return {
    ok: true,
    url: parsed.toString(),
    host: parsed.host,
  }
}

async function openInNewTab(url: string): Promise<ExtensionLaunchResult> {
  try {
    await createExtensionTab({ url })
    return { ok: true }
  } catch (error) {
    if (error instanceof Error && error.message === "tabs_api_unavailable") {
      return { ok: false, code: "tabs_api_unavailable" }
    }
    return { ok: false, code: "tab_creation_failed" }
  }
}

export async function launchExternalUrl(
  rawInput: string,
): Promise<ExtensionLaunchResult> {
  const normalized = normalizeHttpsUrl(rawInput)
  if (!normalized.ok) {
    return { ok: false, code: normalized.code }
  }

  return openInNewTab(normalized.url)
}

export async function launchManagedNetwork(
  rawInput: string,
  target?: Omit<NetworkTarget, "url">,
): Promise<ExtensionLaunchResult> {
  const normalized = normalizeHttpsUrl(rawInput)
  if (!normalized.ok) return normalized
  // Only the Chrome manifest opts into managed grouping. Other targets keep their launcher.
  if (!hasManagedNetworkTabs()) return launchExternalUrl(rawInput)
  try {
    const windowId = await currentExtensionWindowId()
    await managedNetworkCommand({
      action: "open",
      target: {
        ...(target ?? {
          profileId: "default",
          networkId: normalized.url,
          groupKey: "other",
          groupTitle: "CommunityGlows",
          label: normalized.host,
        }),
        url: normalized.url,
      },
      windowId,
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      code:
        error instanceof Error && error.message === "restore_required"
          ? "restore_required"
          : "tab_creation_failed",
    }
  }
}

export async function openExtensionDashboard(
  route = "/setup/CommunityGlows",
): Promise<ExtensionLaunchResult> {
  const runtimeUrl = extensionUrl(`src/ui/setup/index.html#${route}`)
  if (!runtimeUrl) {
    return { ok: false, code: "runtime_url_unavailable" }
  }
  return openInNewTab(runtimeUrl)
}

export async function openExtensionSidePanel(): Promise<ExtensionLaunchResult> {
  if (!supportsSidePanel()) {
    return { ok: false, code: "side_panel_unavailable" }
  }

  try {
    const windowId = await currentExtensionWindowId()
    await openSidePanelApi(windowId)
    return { ok: true }
  } catch {
    return { ok: false, code: "side_panel_failed" }
  }
}
