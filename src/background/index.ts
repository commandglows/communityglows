import {
  createExtensionTab,
  createExtensionWindow,
  extensionUrl,
} from "@/platform/webExtensionApi"
import { createNetworkTabManager } from "./networkTabGroup"
import { parseNetworkCommand } from "./networkTabMessages"

const networkTabs = createNetworkTabManager(chrome)
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "communityglows:network-tabs") return
  if (
    sender.id !== chrome.runtime.id ||
    !sender.url?.startsWith(chrome.runtime.getURL("")) ||
    !chrome.tabGroups
  )
    return
  const command = parseNetworkCommand(message.command)
  if (!command) {
    respond({ ok: false, code: "invalid" })
    return
  }
  networkTabs.execute(command).then(
    (state) => respond({ ok: true, state }),
    (error) =>
      respond({
        ok: false,
        code: [
          "invalid",
          "already_managed",
          "mixed_group",
          "active_group",
          "restore_required",
        ].includes(error?.message)
          ? error.message
          : "tab_creation_failed",
      }),
  )
  return true
})

if (
  chrome.tabGroups &&
  chrome.runtime.getManifest().permissions?.includes("tabGroups")
) {
  // Reconcile after Chrome finishes a burst of detach/attach/group events.
  let timer: ReturnType<typeof setTimeout> | undefined
  const refresh = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      void networkTabs.execute({ action: "snapshot" }).catch(() => {})
    }, 100)
  }
  chrome.tabs.onActivated.addListener(() => {
    void networkTabs
      .execute({ action: "snapshot", applyPolicy: true })
      .catch(() => {})
  })
  chrome.tabs.onUpdated.addListener(refresh)
  chrome.tabs.onMoved.addListener(refresh)
  chrome.tabs.onAttached.addListener(refresh)
  chrome.tabs.onRemoved.addListener(refresh)
  chrome.tabs.onReplaced.addListener((newId, oldId) => {
    void networkTabs
      .execute({ action: "replace", newId, oldId })
      .catch(() => {})
  })
  chrome.tabGroups.onUpdated.addListener(refresh)
  chrome.tabGroups.onMoved.addListener(refresh)
  chrome.tabGroups.onCreated.addListener(refresh)
  chrome.tabGroups.onRemoved.addListener(refresh)
}
chrome.runtime.onInstalled.addListener((details) => {
  void handleInstalled(details.reason)
})

const DASHBOARD_PATH =
  "src/ui/setup/pages/CommunityGlows/extension-dashboard.html"

async function openCommunityGlowsExperience() {
  const url = extensionUrl(DASHBOARD_PATH)
  if (!url) throw new Error("runtime_url_unavailable")

  await createExtensionWindow({ focused: true, url })
}

async function handleInstalled(
  reason: chrome.runtime.OnInstalledReason,
): Promise<void> {
  if (reason !== "install" && reason !== "update") return

  try {
    await openCommunityGlowsExperience()
  } catch (error) {
    console.error(
      `[CommunityGlows] Unable to open the extension experience (${reason}): ${error instanceof Error ? error.message : "unknown_error"}`,
    )
  }
}

// Listeners are registered synchronously. Durable state lives in extension
// storage, so a restarted Manifest V3 worker does not depend on module globals.

export {}
