import { normalizeHttpsUrl } from "./extensionNetworkLauncher"
import {
  ContextualTasksService,
  type ContextualTaskInput,
} from "@/services/contextualTasksService"
import type { Profile } from "@/stores/profiles"
import type { CustomLink } from "@/stores/customLinks"
import { builtInSocialNetworks, resolveHiddenNetworkIds } from "@/config/socialNetworks"

const LOCK = "communityglows-extension-state-v1"
export const EXTENSION_STATE_CHANGED = "communityglows:extension-state-changed"

function readRecord(key: string): Record<string, unknown> {
  const raw = localStorage.getItem(key)
  if (!raw) return {}
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid_state")
  return value as Record<string, unknown>
}

function readProfiles() {
  const value = readRecord("profiles")
  const profiles = value.profiles ?? []
  if (
    !Array.isArray(profiles) ||
    !profiles.every(
      (p) => p && typeof p.id === "string" && typeof p.name === "string",
    )
  ) {
    throw new Error("invalid_state")
  }
  return {
    value,
    profiles: profiles as Profile[],
    activeProfileId:
      typeof value.activeProfileId === "string" ? value.activeProfileId : "",
  }
}

function readLinks() {
  const value = readRecord("customLinks")
  const links = value.links ?? {}
  if (!links || typeof links !== "object" || Array.isArray(links))
    throw new Error("invalid_state")
  for (const list of Object.values(links)) {
    if (
      !Array.isArray(list) ||
      !list.every(
        (l) =>
          l &&
          typeof l.id === "string" &&
          typeof l.label === "string" &&
          typeof l.url === "string",
      )
    ) {
      throw new Error("invalid_state")
    }
  }
  return { value, links: links as Record<string, CustomLink[]> }
}

function tasksService() {
  const service = new ContextualTasksService()
  service.loadState()
  return service
}

// Every extension document shares this origin lock. Re-read inside the lock;
// a cached Pinia snapshot cannot be used as the basis of a concurrent write.
export async function mutateExtensionState<T>(mutation: () => T): Promise<T> {
  if (!navigator.locks) throw new Error("storage_lock_unavailable")
  return navigator.locks.request(LOCK, () => {
    const result = mutation()
    window.dispatchEvent(new Event(EXTENSION_STATE_CHANGED))
    return result
  })
}

export async function initializeExtensionState() {
  await mutateExtensionState(() => {
    const state = readProfiles()
    if (!state.profiles.length) {
      const profile = {
        id: crypto.randomUUID(),
        name: "Profile 1",
        emoji: "🟦",
        createdAt: Date.now(),
        localOnly: true,
      }
      localStorage.setItem(
        "profiles",
        JSON.stringify({
          ...state.value,
          profiles: [profile],
          activeProfileId: profile.id,
        }),
      )
    } else if (!state.profiles.some((p) => p.id === state.activeProfileId)) {
      localStorage.setItem(
        "profiles",
        JSON.stringify({
          ...state.value,
          activeProfileId: state.profiles[0].id,
        }),
      )
    }
    new ContextualTasksService().migrateLegacyKanbanState()
  })
}

export function readExtensionState() {
  const { profiles, activeProfileId } = readProfiles()
  return {
    profiles,
    activeProfileId,
    links: readLinks().links,
    tasks: tasksService().getTasks(),
  }
}

export function selectExtensionProfile(profileId: string) {
  return mutateExtensionState(() => {
    const state = readProfiles()
    if (!state.profiles.some((p) => p.id === profileId))
      throw new Error("profile_not_found")
    localStorage.setItem(
      "profiles",
      JSON.stringify({ ...state.value, activeProfileId: profileId }),
    )
  })
}

export function setExtensionNetworksHidden(profileId: string, networkIds: readonly string[], hidden: boolean) {
  return mutateExtensionState(() => {
    const state = readProfiles()
    const profile = state.profiles.find(p => p.id === profileId)
    if (!profile) throw new Error("profile_not_found")
    const knownIds = new Set(builtInSocialNetworks.map(network => network.id))
    if (networkIds.some(id => !knownIds.has(id))) throw new Error("invalid_network")
    const next = new Set(resolveHiddenNetworkIds(profile.hiddenNetworks))
    for (const id of networkIds) {
      if (hidden) next.add(id)
      else next.delete(id)
    }
    localStorage.setItem("profiles", JSON.stringify({
      ...state.value,
      profiles: state.profiles.map(p => p.id === profileId ? { ...p, hiddenNetworks: [...next] } : p),
    }))
  })
}

export function saveExtensionLink(
  profileId: string,
  label: string,
  url: string,
  linkId?: string,
) {
  return mutateExtensionState(() => {
    if (!readProfiles().profiles.some((p) => p.id === profileId))
      throw new Error("profile_not_found")
    const validated = normalizeHttpsUrl(url)
    if (!validated.ok) throw new Error(validated.code)
    const name = label.trim()
    if (!name || name.length > 160) throw new Error("invalid_label")
    const state = readLinks()
    const list = state.links[profileId] ?? []
    if (linkId && !list.some((l) => l.id === linkId))
      throw new Error("link_not_found")
    const link = {
      id: linkId ?? `custom-${crypto.randomUUID()}`,
      label: name,
      url: validated.url,
      icon: list.find((l) => l.id === linkId)?.icon ?? "pi pi-link",
    }
    const next = linkId
      ? list.map((l) => (l.id === linkId ? link : l))
      : [...list, link]
    localStorage.setItem(
      "customLinks",
      JSON.stringify({
        ...state.value,
        links: { ...state.links, [profileId]: next },
      }),
    )
  })
}

export function removeExtensionLink(profileId: string, linkId: string) {
  return mutateExtensionState(() => {
    const state = readLinks()
    localStorage.setItem(
      "customLinks",
      JSON.stringify({
        ...state.value,
        links: {
          ...state.links,
          [profileId]: (state.links[profileId] ?? []).filter(
            (l) => l.id !== linkId,
          ),
        },
      }),
    )
  })
}

export function saveExtensionTask(input: ContextualTaskInput, id?: string) {
  return mutateExtensionState(() => {
    const service = tasksService()
    return id ? service.update(id, input) : service.add(input)
  })
}

export function removeExtensionTask(id: string) {
  return mutateExtensionState(() => tasksService().remove(id))
}
