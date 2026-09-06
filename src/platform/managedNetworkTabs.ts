import type {
  NetworkCommand,
  NetworkTabsState,
} from "@/background/networkTabGroup"
export type {
  NetworkTarget,
  NetworkTabsState,
  ManagedNetworkTab,
} from "@/background/networkTabGroup"
export const hasManagedNetworkTabs = () =>
  Boolean(
    globalThis.chrome?.runtime
      ?.getManifest?.()
      .permissions?.includes("tabGroups"),
  )
export async function managedNetworkCommand(
  command: NetworkCommand,
): Promise<NetworkTabsState> {
  const response = await chrome.runtime.sendMessage({
    type: "communityglows:network-tabs",
    command,
  })
  if (!response?.ok) throw new Error(response?.code ?? "tab_creation_failed")
  return response.state
}
