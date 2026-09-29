import { beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import * as VueRuntime from "vue"
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc"
import { createRenderer, nextTick, ssrContextKey } from "vue"
import { builtInSocialNetworks } from "@/config/socialNetworks"

const { profile, profilesStore, onboardingStore, setLocale } = vi.hoisted(() => {
  const profile = { id: "onboarding-profile", name: "Profil actuel", emoji: "🟦" }
  return {
    profile,
    profilesStore: {
      ensureDefault: vi.fn(() => profile),
      activeProfile: profile,
      applyOnboardingSetup: vi.fn(),
    },
    onboardingStore: { complete: vi.fn() },
    setLocale: vi.fn(),
  }
})

vi.mock("@/stores/profiles", () => ({ useProfilesStore: () => profilesStore }))
vi.mock("@/stores/onboarding", () => ({ useOnboardingStore: () => onboardingStore }))
vi.mock("@/utils/i18n", () => ({ setLocale }))
vi.mock("./NetworkGroupHeader.vue", () => ({ default: { render: () => null } }))

import OnboardingFlow from "./OnboardingFlow.vue"

// Vitest's Node loader creates SSR-only SFCs; compile the client render function
// so Vue's custom renderer can exercise the actual button handlers without a DOM.
const componentPath = fileURLToPath(new URL("./OnboardingFlow.vue", import.meta.url))
const { descriptor } = parse(readFileSync(componentPath, "utf8"), { filename: componentPath })
const bindings = compileScript(descriptor, { id: "onboarding-flow-test" }).bindings
const template = compileTemplate({
  source: descriptor.template!.content,
  filename: componentPath,
  id: "onboarding-flow-test",
  compilerOptions: { bindingMetadata: bindings },
})
const renderModule = template.code
  .replace(/import\s+\{([\s\S]*?)\}\s+from\s+["']vue["'];?/g, (_match, imports: string) => {
    const destructuring = imports.replace(/(\w+)\s+as\s+(\w+)/g, "$1: $2")
    return `const {${destructuring}} = VueRuntime;`
  })
  .replace("export function render", "function render")
const compileRender = new Function("VueRuntime", `${renderModule}; return render;`) as
  (vue: typeof VueRuntime) => (context: unknown, cache: unknown) => unknown
;(OnboardingFlow as unknown as { render: ReturnType<typeof compileRender> }).render = compileRender(VueRuntime)

type TestNode = {
  tag: string
  props: Record<string, unknown>
  children: TestNode[]
  text: string
  value?: string
  parent?: TestNode
  listeners: Record<string, (event: Event) => void>
  addEventListener: (name: string, listener: (event: Event) => void) => void
}

function createNode(tag: string): TestNode {
  const node: TestNode = {
    tag,
    props: {},
    children: [],
    text: "",
    listeners: {},
    addEventListener(name, listener) {
      node.listeners[name] = listener
    },
  }
  return node
}

const renderer = createRenderer<TestNode, TestNode>({
  createElement: (tag) => createNode(tag),
  createText: (text) => ({ ...createNode("#text"), text }),
  createComment: (text) => ({ ...createNode("#comment"), text }),
  setText: (node, text) => { node.text = text },
  setElementText: (node, text) => { node.text = text; node.children = [] },
  patchProp: (node, key, _previous, next) => { node.props[key] = next },
  insert(node, parent, anchor) {
    const oldIndex = node.parent?.children.indexOf(node) ?? -1
    if (oldIndex >= 0) node.parent!.children.splice(oldIndex, 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index >= 0) parent.children.splice(index, 0, node)
    else parent.children.push(node)
    node.parent = parent
  },
  remove(node) {
    if (!node) return
    const parent = node.parent
    if (!parent) return
    const index = parent.children.indexOf(node)
    if (index >= 0) parent.children.splice(index, 1)
  },
  parentNode: (node) => node.parent ?? null,
  nextSibling(node) {
    const parent = node.parent
    if (!parent) return null
    const index = parent.children.indexOf(node)
    return parent.children[index + 1] ?? null
  },
})

function textContent(node: TestNode): string {
  return node.text + node.children.map(textContent).join("")
}

function elements(node: TestNode): TestNode[] {
  return [node, ...node.children.flatMap(elements)]
}

function mountOnboarding() {
  const root = createNode("root")
  const app = renderer.createApp(OnboardingFlow)
  app.config.globalProperties.$t = (key: string) => key
  app.provide(ssrContextKey, { modules: new Set<string>() })
  app.component("SgIcon", { render: () => null })
  app.mount(root)
  return { root, unmount: () => app.unmount() }
}

async function clickButton(root: TestNode, label: string) {
  const button = elements(root).find((node) => node.tag === "button" && textContent(node).includes(label))
  expect(button, `button containing ${label}`).toBeDefined()
  const handler = button!.props.onClick as ((event: Event) => void) | undefined
  expect(handler).toBeTypeOf("function")
  handler!(new Event("click"))
  await nextTick()
}

describe("OnboardingFlow save paths", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("saves the default network selection when the user skips from the welcome step", async () => {
    const view = mountOnboarding()
    try {
      await clickButton(view.root, "Français")
      await clickButton(view.root, "onboarding.skip")

      expect(profilesStore.applyOnboardingSetup).toHaveBeenCalledTimes(1)
      expect(profilesStore.applyOnboardingSetup).toHaveBeenCalledWith(profile.id, {
        name: undefined,
        emoji: "🟦",
        networkIds: builtInSocialNetworks.filter((network) => network.onboarding).map((network) => network.id),
        selectedNetworkIds: builtInSocialNetworks
          .filter((network) => network.onboarding && network.defaultSelected)
          .map((network) => network.id),
      })
      expect(onboardingStore.complete).toHaveBeenCalledTimes(1)
    } finally {
      view.unmount()
    }
  })

  it("saves the edited network selection once from the final step", async () => {
    const view = mountOnboarding()
    try {
      await clickButton(view.root, "Français")
      await clickButton(view.root, "onboarding.start_button")
      await clickButton(view.root, "onboarding.next")

      const discord = elements(view.root).find((node) => node.tag === "button" && textContent(node).includes("Discord"))
      expect(discord).toBeDefined()
      ;(discord!.props.onClick as (event: Event) => void)(new Event("click"))
      await nextTick()
      const facebook = elements(view.root).find((node) => node.tag === "button" && textContent(node).includes("Facebook"))
      expect(facebook).toBeDefined()
      ;(facebook!.props.onClick as (event: Event) => void)(new Event("click"))
      await nextTick()

      await clickButton(view.root, "onboarding.next")
      await clickButton(view.root, "onboarding.finish_button")

      expect(profilesStore.applyOnboardingSetup).toHaveBeenCalledTimes(1)
      expect(profilesStore.applyOnboardingSetup).toHaveBeenCalledWith(profile.id, expect.objectContaining({
        networkIds: builtInSocialNetworks.filter((network) => network.onboarding).map((network) => network.id),
        selectedNetworkIds: expect.arrayContaining(["twitter", "instagram", "tiktok", "linkedin", "discord"]),
      }))
      const savedSelection = profilesStore.applyOnboardingSetup.mock.calls[0][1].selectedNetworkIds
      expect(savedSelection).not.toContain("facebook")
      expect(onboardingStore.complete).toHaveBeenCalledTimes(1)
    } finally {
      view.unmount()
    }
  })
})
