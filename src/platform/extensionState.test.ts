import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import {
  initializeExtensionState,
  readExtensionState,
  saveExtensionLink,
  saveExtensionTask,
  removeExtensionTask,
  setExtensionNetworksHidden,
} from "./extensionState"
import { ContextualTasksService } from "@/services/contextualTasksService"

describe("extension persistence", () => {
  let values: Map<string, string>
  beforeEach(() => {
    values = new Map()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
    let queue = Promise.resolve()
    vi.stubGlobal("navigator", {
      locks: {
        request: (_: string, action: () => unknown) => {
          const next = queue.then(action)
          queue = next.then(
            () => undefined,
            () => undefined,
          )
          return next
        },
      },
    })
    vi.stubGlobal("window", new EventTarget())
  })
  afterEach(() => vi.unstubAllGlobals())
  it("preserves concurrent category choices and unrelated profile fields", async () => {
    localStorage.setItem('profiles', JSON.stringify({
      activeProfileId: 'work', extra: 'preserved', profiles: [
        { id: 'work', name: 'Work', emoji: '🟦', hiddenNetworks: ['dex', 'clay', 'reddit'] },
        { id: 'personal', name: 'Personal', hiddenNetworks: ['twitter'] },
      ],
    }))
    await Promise.all([
      setExtensionNetworksHidden('work', ['dex', 'clay'], false),
      setExtensionNetworksHidden('work', ['twitter'], true),
    ])
    const state = JSON.parse(localStorage.getItem('profiles')!)
    expect(state.extra).toBe('preserved')
    expect(state.profiles[0].hiddenNetworks).toEqual(['reddit', 'twitter'])
    expect(state.profiles[0].emoji).toBe('🟦')
    expect(state.profiles[1].hiddenNetworks).toEqual(['twitter'])
  })
  it("serializes concurrent writers and preserves existing profile metadata", async () => {
    await Promise.all([initializeExtensionState(), initializeExtensionState()])
    const profile = readExtensionState().activeProfileId
    expect(readExtensionState().profiles).toHaveLength(1)
    await Promise.all([
      saveExtensionLink(profile, "A", "https://example.com/a"),
      saveExtensionLink(profile, "B", "https://example.com/b"),
    ])
    expect(readExtensionState().links[profile].map((l) => l.label)).toEqual([
      "A",
      "B",
    ])
    await Promise.all([
      saveExtensionTask({ title: "A" }),
      saveExtensionTask({ title: "B" }),
    ])
    expect(readExtensionState().tasks.map((t) => t.title)).toEqual(["A", "B"])
  })
  it("does not publish failed task additions, updates or deletions", () => {
    const service = new ContextualTasksService()
    const original = service.add({ title: "Keep me" })
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    expect(() => service.add({ title: "Phantom" })).toThrow()
    expect(() => service.update(original.id, { title: "Lost" })).toThrow()
    expect(() => service.remove(original.id)).toThrow()
    expect(service.getTasks()).toEqual([original])
  })
  it("retains the edited URL and supports clearing it", async () => {
    const task = await saveExtensionTask({
      title: "Edited",
      url: "https://example.com/edited",
    })
    expect(readExtensionState().tasks[0].url).toBe("https://example.com/edited")
    await saveExtensionTask({ title: "Edited", url: "" }, task.id)
    expect(readExtensionState().tasks[0].url).toBeUndefined()
    await removeExtensionTask(task.id)
    expect(readExtensionState().tasks).toEqual([])
  })
  it("does not discard invalid stored tasks during a write", async () => {
    values.set('contextual-tasks-v1', JSON.stringify([{ unexpected: true }]))
    await expect(saveExtensionTask({ title: 'New task' })).rejects.toThrow('invalid_tasks_state')
    expect(values.get('contextual-tasks-v1')).toBe(JSON.stringify([{ unexpected: true }]))
  })
  it("does not overwrite malformed persisted state", async () => {
    values.set("profiles", "{bad")
    await expect(initializeExtensionState()).rejects.toThrow()
    expect(values.get("profiles")).toBe("{bad")
  })
})
