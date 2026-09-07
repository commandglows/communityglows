export const NETWORK_TABS_KEY = "communityglows.network-tabs.v2"
export type NetworkTarget = {
  profileId: string
  networkId: string
  groupKey: string
  groupTitle: string
  label: string
  url: string
}
export type ManagedNetworkTab = NetworkTarget & {
  tabId: number | null
  windowId: number
  groupId: number
  index: number
  active: boolean
  closed: boolean
  recovery?: boolean
  pendingGroup?: boolean
  pendingTitle?: boolean
}
export type ManagedGroup = {
  id: number
  windowId: number
  title: string
  collapsed: boolean
  mixed: boolean
  active: boolean
  index: number
}
export type NetworkTabsState = {
  entries: ManagedNetworkTab[]
  groups: ManagedGroup[]
  homeWindowId?: number
}
export type NetworkCommand =
  | { action: "snapshot"; applyPolicy?: boolean }
  | { action: "replace"; oldId: number; newId: number }
  | {
      action: "open"
      target: NetworkTarget
      windowId: number
      reopen?: boolean
    }
  | { action: "adopt"; target: NetworkTarget; windowId: number }
  | { action: "gather"; windowId: number; tabId?: number }
  | { action: "rename"; groupId: number; title: string }
  | { action: "collapse"; groupId: number; collapsed: boolean }

/** Ownership uses session-scoped Chrome IDs, never URL matching or tab positions. */
export function createNetworkTabManager(api: typeof chrome) {
  let queue: Promise<unknown> = Promise.resolve()
  let cached: NetworkTabsState | undefined
  async function read() {
    if (!cached) {
      cached = (await api.storage.session.get(NETWORK_TABS_KEY))[
        NETWORK_TABS_KEY
      ]
      if (!cached) {
        const saved = (await api.storage.local.get(NETWORK_TABS_KEY))[
          NETWORK_TABS_KEY
        ] as NetworkTabsState | undefined
        cached = {
          entries: (saved?.entries ?? []).map((entry) => ({
            ...entry,
            tabId: null,
            groupId: -1,
            active: false,
            closed: true,
            recovery: entry.recovery || !entry.closed,
            pendingGroup: false,
            pendingTitle: false,
          })),
          groups: [],
        }
      }
    }
    return cached!
  }
  async function save(state: NetworkTabsState) {
    const previous = (await api.storage.session.get(NETWORK_TABS_KEY))[
      NETWORK_TABS_KEY
    ]
    if (JSON.stringify(previous) !== JSON.stringify(state)) {
      await api.storage.session.set({ [NETWORK_TABS_KEY]: state })
      // Durable identities have no authority over tab IDs in a later browser session.
      await api.storage.local.set({
        [NETWORK_TABS_KEY]: {
          entries: state.entries.map((entry) => ({
            ...entry,
            tabId: null,
            windowId: -1,
            groupId: -1,
          })),
          groups: [],
        },
      })
    }
  }
  async function reconcile(state: NetworkTabsState) {
    const tabs = await api.tabs.query({})
    const groups = await api.tabGroups.query({})
    for (const entry of state.entries) {
      const tab = tabs.find((tab) => tab.id === entry.tabId)
      if (!tab) {
        entry.tabId = null
        entry.closed = true
        entry.active = false
        continue
      }
      Object.assign(entry, {
        windowId: tab.windowId,
        groupId: tab.groupId,
        index: tab.index,
        active: tab.active,
        closed: false,
      })
      const group = groups.find((group) => group.id === tab.groupId)
      if (group && !entry.pendingTitle) entry.groupTitle = group.title ?? ""
    }
    const owned = new Set(
      state.entries.flatMap((entry) =>
        entry.tabId === null ? [] : [entry.tabId],
      ),
    )
    state.groups = groups
      .filter((group) =>
        state.entries.some(
          (entry) => !entry.closed && entry.groupId === group.id,
        ),
      )
      .map((group) => {
        const members = tabs.filter((tab) => tab.groupId === group.id)
        return {
          id: group.id,
          windowId: group.windowId,
          title: group.title ?? "",
          collapsed: group.collapsed,
          mixed: members.some((tab) => !owned.has(tab.id!)),
          active: members.some((tab) => tab.active),
          index: Math.min(...members.map((tab) => tab.index)),
        }
      })
      .sort((a, b) => a.windowId - b.windowId || a.index - b.index)
    return tabs
  }
  async function collapseInactive(state: NetworkTabsState) {
    for (const group of state.groups) {
      // Mixed groups belong to Chrome's user too. Never hide their personal tabs.
      if (group.mixed) continue
      const current = await api.tabGroups.get(group.id)
      const members = await api.tabs.query({ groupId: group.id })
      if (
        members.some(
          (tab) => !state.entries.some((entry) => entry.tabId === tab.id),
        )
      )
        continue
      const collapsed = !members.some((tab) => tab.active)
      if (current.collapsed !== collapsed)
        await api.tabGroups.update(group.id, { collapsed })
    }
  }
  async function groupEntry(state: NetworkTabsState, entry: ManagedNetworkTab) {
    let existing = state.entries.find(
      (other) =>
        other !== entry &&
        !other.closed &&
        other.profileId === entry.profileId &&
        other.groupKey === entry.groupKey &&
        other.windowId === entry.windowId &&
        state.groups.some(
          (group) => group.id === other.groupId && !group.mixed,
        ),
    )
    if (existing) {
      const members = await api.tabs.query({ groupId: existing.groupId })
      if (
        members.some(
          (tab) => !state.entries.some((item) => item.tabId === tab.id),
        )
      )
        existing = undefined
    }
    const groupId = await api.tabs.group({
      tabIds: [entry.tabId!],
      ...(existing
        ? { groupId: existing.groupId }
        : { createProperties: { windowId: entry.windowId } }),
    })
    entry.groupId = groupId
    entry.pendingGroup = false
    entry.pendingTitle = !existing
    await save(state)
    if (!existing)
      await api.tabGroups.update(groupId, {
        title: entry.groupTitle,
        color: "cyan",
      })
    entry.pendingTitle = false
  }
  async function run(command: NetworkCommand) {
    const state = await read()
    try {
      if (command.action === "replace") {
        const entry = state.entries.find(
          (entry) => entry.tabId === command.oldId,
        )
        if (entry) entry.tabId = command.newId
      }
      const tabs = await reconcile(state)
      if (command.action === "open" || command.action === "adopt") {
        const target = command.target
        let entry = state.entries.find(
          (entry) =>
            entry.profileId === target.profileId &&
            entry.networkId === target.networkId,
        )
        if (command.action === "adopt") {
          const tab = tabs.find(
            (tab) => tab.windowId === command.windowId && tab.active,
          )
          if (!tab?.id || !tab.url?.startsWith("https:"))
            throw new Error("invalid")
          const adoptedUrl = new URL(tab.url)
          if (adoptedUrl.username || adoptedUrl.password)
            throw new Error("invalid")
          const owner = state.entries.find((item) => item.tabId === tab.id)
          if (owner && owner !== entry) throw new Error("already_managed")
          if (entry && !entry.closed && entry.tabId !== tab.id)
            throw new Error("already_managed")
          entry ??= {
            ...target,
            tabId: null,
            windowId: command.windowId,
            groupId: -1,
            index: 0,
            active: false,
            closed: true,
          }
          if (!state.entries.includes(entry)) state.entries.push(entry)
          Object.assign(entry, {
            tabId: tab.id,
            windowId: tab.windowId,
            groupId: tab.groupId,
            closed: false,
            url: tab.url,
            recovery: false,
            pendingGroup: tab.groupId === -1 && !tab.pinned,
          })
          await save(state)
          if (entry.pendingGroup) await groupEntry(state, entry)
        } else {
          if (entry?.recovery && !command.reopen)
            throw new Error("restore_required")
          if (!entry || entry.closed) {
            const tab = await api.tabs.create({
              windowId: command.windowId,
              url: target.url,
              active: false,
            })
            if (tab.id === undefined) throw new Error("tab_creation_failed")
            if (!entry) {
              entry = {
                ...target,
                tabId: tab.id,
                windowId: tab.windowId,
                groupId: -1,
                index: tab.index,
                active: false,
                closed: false,
                pendingGroup: true,
              }
              state.entries.push(entry)
            } else
              Object.assign(entry, {
                ...target,
                tabId: tab.id,
                windowId: tab.windowId,
                groupId: -1,
                closed: false,
                recovery: false,
                pendingGroup: true,
              })
            await save(state)
          }
          if (entry.pendingGroup) await groupEntry(state, entry)
          if (entry.pendingTitle) {
            await api.tabGroups.update(entry.groupId, {
              title: entry.groupTitle,
              color: "cyan",
            })
            entry.pendingTitle = false
          }
          // No URL update: clicking a network never reloads its current page.
          const live = await api.tabs.get(entry.tabId!)
          if (live.groupId !== -1)
            await api.tabGroups.update(live.groupId, { collapsed: false })
          await api.tabs.update(live.id!, { active: true })
          await api.windows.update(live.windowId, { focused: true })
        }
        state.homeWindowId ??= command.windowId
      } else if (command.action === "gather") {
        const moving = state.entries.filter(
          (entry) =>
            !entry.closed &&
            (command.tabId === undefined || entry.tabId === command.tabId),
        )
        if (command.tabId !== undefined && !moving.length)
          throw new Error("invalid")
        for (const entry of moving) {
          if (entry.windowId === command.windowId) continue
          const group = state.groups.find((group) => group.id === entry.groupId)
          const groupMembers = group
            ? await api.tabs.query({ groupId: group.id })
            : []
          const exclusivelyOwned = groupMembers.every((tab) =>
            state.entries.some((item) => item.tabId === tab.id),
          )
          if (
            command.tabId === undefined &&
            group &&
            !group.mixed &&
            exclusivelyOwned
          ) {
            await api.tabGroups.move(group.id, {
              windowId: command.windowId,
              index: -1,
            })
            await reconcile(state)
            continue
          }
          await api.tabs.move(entry.tabId!, {
            windowId: command.windowId,
            index: -1,
          })
          await reconcile(state)
          const tab = await api.tabs.get(entry.tabId!)
          if (!tab.pinned) await groupEntry(state, entry)
          await reconcile(state)
        }
        state.homeWindowId = command.windowId
      } else if (command.action === "rename" || command.action === "collapse") {
        const group = state.groups.find((group) => group.id === command.groupId)
        if (!group || group.mixed) throw new Error("mixed_group")
        const members = await api.tabs.query({ groupId: group.id })
        if (
          members.some(
            (tab) => !state.entries.some((entry) => entry.tabId === tab.id),
          )
        )
          throw new Error("mixed_group")
        if (command.action === "rename") {
          await api.tabGroups.update(group.id, { title: command.title })
        } else {
          const live = await api.tabs.query({ groupId: group.id })
          if (command.collapsed && live.some((tab) => tab.active))
            throw new Error("active_group")
          await api.tabGroups.update(group.id, { collapsed: command.collapsed })
        }
      }
      await reconcile(state)
      if (
        command.action === "open" ||
        command.action === "adopt" ||
        command.action === "gather" ||
        (command.action === "snapshot" && command.applyPolicy)
      )
        await collapseInactive(state)
      await reconcile(state)
      await save(state)
      return structuredClone(state)
    } catch (error) {
      await reconcile(state)
        .then(() => save(state))
        .catch(() => {})
      throw error
    }
  }
  return {
    execute(command: NetworkCommand) {
      const next = queue.then(() => run(command))
      queue = next.catch(() => {})
      return next
    },
  }
}
