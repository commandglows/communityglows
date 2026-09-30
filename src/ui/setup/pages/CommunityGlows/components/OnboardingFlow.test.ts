import { beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import * as VueRuntime from "vue"
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc"
import { createRenderer, nextTick, ssrContextKey } from "vue"
import { builtInSocialNetworks } from "@/config/socialNetworks"

const { profile, profilesStore, onboardingStore, setLocale, router } = vi.hoisted(() => {
  const profile = { id: "onboarding-profile", name: "Profil actuel", emoji: "🟦", hiddenNetworks: [] as string[] }
  return {
    profile,
    profilesStore: {
      ensureDefault: vi.fn(() => profile),
      activeProfile: profile,
      update: vi.fn(),
    },
    onboardingStore: {
      complete: vi.fn(), finishSetup: vi.fn(), selectLanguage: vi.fn(),
      languageSelected: false, setupCompleted: false, accountConfirmed: false,
      scopeReady: true, localOnly: false, confirmedAccountId: null,
      confirmAccount: vi.fn(),
    },
    setLocale: vi.fn(),
    router: { push: vi.fn().mockResolvedValue(undefined) },
  }
})

vi.mock("@/stores/profiles", () => ({ useProfilesStore: () => profilesStore }))
vi.mock("@/stores/onboarding", () => ({ useOnboardingStore: () => onboardingStore }))
vi.mock("@/utils/i18n", () => ({ setLocale }))
vi.mock("./NetworkGroupHeader.vue", () => ({ default: { render: () => null } }))
vi.mock("vue-router", () => ({ useRouter: () => router }))
vi.mock("vue-i18n", async () => {
  const { ref } = await import("vue")
  return { useI18n: () => ({ locale: ref("fr") }) }
})
vi.mock("@/composables/useBillingAccess", () => ({
  useBillingAccess: () => ({ status: { value: "trial_active" }, canAccessProtected: { value: true } }),
  canAcknowledgeBillingAccess: () => true,
}))
vi.mock("@/lib/convexAuth", () => ({ isAuthLoading: { value: false } }))
vi.mock("@/lib/cloudSync", () => ({ currentCloudAccount: { value: null } }))
vi.mock("./BillingAccessPanel.vue", () => ({ default: { render: () => null } }))
vi.mock("../views/LoginView.vue", async () => {
  const { h } = await import("vue")
  return { default: {
    emits: ["local-selected"],
    setup(_props: unknown, { emit }: { emit: (event: "local-selected") => void }) {
      return () => h("button", { onClick: () => emit("local-selected") }, "local-selection")
    },
  } }
})

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
  await handler!(new Event("click"))
  await nextTick()
}

describe("OnboardingFlow save paths", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profile.hiddenNetworks = builtInSocialNetworks
      .filter((network) => network.onboarding && !network.defaultSelected)
      .map((network) => network.id)
    onboardingStore.accountConfirmed = false
    onboardingStore.localOnly = false
    onboardingStore.confirmAccount.mockImplementation(() => {
      onboardingStore.accountConfirmed = true
      onboardingStore.localOnly = true
    })
  })

  it("preserves the existing profile when skipping setup and requires an explicit account choice", async () => {
    const view = mountOnboarding()
    try {
      await clickButton(view.root, "Français")
      await clickButton(view.root, "onboarding.skip")

      expect(profilesStore.update).not.toHaveBeenCalled()
      expect(onboardingStore.finishSetup).toHaveBeenCalledTimes(1)
      expect(onboardingStore.complete).not.toHaveBeenCalled()
      await clickButton(view.root, "local-selection")
      await clickButton(view.root, "onboarding.finish_local")
      expect(router.push).toHaveBeenCalledWith("/local-kanban")
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
      await clickButton(view.root, "onboarding.next")

      expect(profilesStore.update).toHaveBeenCalledTimes(1)
      expect(profilesStore.update).toHaveBeenCalledWith(profile.id, expect.objectContaining({
        name: profile.name,
        emoji: profile.emoji,
        hiddenNetworks: expect.arrayContaining(["facebook"]),
      }))
      const hiddenNetworks = profilesStore.update.mock.calls[0][1].hiddenNetworks
      expect(hiddenNetworks).not.toContain("discord")
      expect(onboardingStore.complete).not.toHaveBeenCalled()
      await clickButton(view.root, "local-selection")
      await clickButton(view.root, "onboarding.finish_local")
      expect(onboardingStore.complete).toHaveBeenCalledTimes(1)
    } finally {
      view.unmount()
    }
  })
})
