import type { NetworkCommand, NetworkTarget } from "./networkTabGroup"

export function parseNetworkCommand(value: unknown): NetworkCommand | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>
  const integer = (v: unknown): v is number =>
    Number.isInteger(v) && Number(v) >= 0
  const text = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0 && v.length <= 2048
  if (item.action === "snapshot") return { action: "snapshot" }
  if (
    item.action === "gather" &&
    integer(item.windowId) &&
    (item.tabId === undefined || integer(item.tabId))
  )
    return {
      action: "gather",
      windowId: item.windowId,
      tabId: item.tabId as number | undefined,
    }
  if (
    item.action === "rename" &&
    integer(item.groupId) &&
    text(item.title) &&
    item.title.length <= 64
  )
    return { action: "rename", groupId: item.groupId, title: item.title.trim() }
  if (
    item.action === "collapse" &&
    integer(item.groupId) &&
    typeof item.collapsed === "boolean"
  )
    return {
      action: "collapse",
      groupId: item.groupId,
      collapsed: item.collapsed,
    }
  if (
    (item.action !== "open" && item.action !== "adopt") ||
    !integer(item.windowId) ||
    !item.target ||
    typeof item.target !== "object"
  )
    return null
  const target = item.target as NetworkTarget
  if (
    ![
      target.profileId,
      target.networkId,
      target.groupKey,
      target.label,
      target.url,
    ].every(text) || typeof target.groupTitle !== "string" || target.groupTitle.length > 2048
  )
    return null
  try {
    const url = new URL(target.url)
    if (url.protocol !== "https:" || url.username || url.password) return null
    return {
      action: item.action,
      windowId: item.windowId,
      ...(item.action === "open" ? { reopen: item.reopen === true } : {}),
      target: {
        profileId: target.profileId,
        networkId: target.networkId,
        groupKey: target.groupKey,
        groupTitle: target.groupTitle.slice(0, 64),
        label: target.label.slice(0, 160),
        url: url.href,
      },
    }
  } catch {
    return null
  }
}
