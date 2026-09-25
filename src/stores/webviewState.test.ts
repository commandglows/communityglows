import { beforeEach, describe, expect, it } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { WEBVIEW_URLS, useWebviewStore } from "./webviewState"

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("webview selection state", () => {
  it("starts without a phantom network or URL", () => {
    const store = useWebviewStore()

    expect(store.activeNetworkId).toBeNull()
    expect(store.activeUrl).toBeNull()
  })

  it("switches built-in networks without retaining the previous URL override", () => {
    const store = useWebviewStore()
    const [firstNetworkId, secondNetworkId] = Object.keys(WEBVIEW_URLS)

    expect(firstNetworkId).toBeTruthy()
    expect(secondNetworkId).toBeTruthy()

    store.selectNetwork(firstNetworkId, "https://example.com/shared-entry")
    expect(store.activeUrl).toBe("https://example.com/shared-entry")

    store.selectNetwork(secondNetworkId)
    expect(store.activeNetworkId).toBe(secondNetworkId)
    expect(store.activeUrl).toBe(WEBVIEW_URLS[secondNetworkId])
    expect(store.activeUrlOverride).toBeNull()
    expect(store.activeCustomUrl).toBeNull()
  })

  it("switches from a custom link to a built-in network without leaking its URL", () => {
    const store = useWebviewStore()
    const networkId = Object.keys(WEBVIEW_URLS)[0]

    store.selectCustom("custom-example", "https://community.example")
    expect(store.activeUrl).toBe("https://community.example")

    store.selectNetwork(networkId)
    expect(store.activeNetworkId).toBe(networkId)
    expect(store.activeUrl).toBe(WEBVIEW_URLS[networkId])
    expect(store.activeCustomUrl).toBeNull()
  })

  it("switches from a built-in override to a custom link without leaking the override", () => {
    const store = useWebviewStore()
    const networkId = Object.keys(WEBVIEW_URLS)[0]

    store.selectNetwork(networkId, "https://example.com/deep-link")
    store.selectCustom("custom-example", "https://community.example")

    expect(store.activeNetworkId).toBe("custom-example")
    expect(store.activeUrl).toBe("https://community.example")
    expect(store.activeUrlOverride).toBeNull()
  })

  it("clears every URL source when the active tab closes and reopens cleanly", () => {
    const store = useWebviewStore()
    const networkId = Object.keys(WEBVIEW_URLS)[0]

    store.selectCustom("custom-example", "https://community.example")
    store.clearNetwork()

    expect(store.activeNetworkId).toBeNull()
    expect(store.activeUrl).toBeNull()
    expect(store.activeCustomUrl).toBeNull()
    expect(store.activeUrlOverride).toBeNull()

    store.selectNetwork(networkId)
    expect(store.activeNetworkId).toBe(networkId)
    expect(store.activeUrl).toBe(WEBVIEW_URLS[networkId])
  })

  it("does not invent a URL for an unknown network selection", () => {
    const store = useWebviewStore()

    store.selectNetwork("unknown-network")

    expect(store.activeNetworkId).toBe("unknown-network")
    expect(store.activeUrl).toBeNull()
    expect(store.usesWebview("unknown-network")).toBe(false)
  })

  it("emits a new selection command when the same target is clicked again", () => {
    const store = useWebviewStore()

    store.selectNetwork("tasks")
    const firstRevision = store.selectionRevision
    store.selectNetwork("tasks")

    expect(firstRevision).toBeGreaterThan(0)
    expect(store.selectionRevision).toBe(firstRevision + 1)
    expect(store.activeNetworkId).toBe("tasks")
    expect(store.activeUrl).toBeNull()
  })
})

it("selects independent tab instances without changing the network account identity", () => {
  const store = useWebviewStore()
  store.selectNetwork("twitter", undefined, "copy-1")
  expect(store.activeNetworkId).toBe("twitter")
  expect(store.activeInstanceId).toBe("copy-1")
  expect(store.activeUrl).toBe(WEBVIEW_URLS.twitter)
  store.selectNetwork("twitter", undefined, "copy-2")
  expect(store.activeInstanceId).toBe("copy-2")
  store.selectNetwork("twitter")
  expect(store.activeInstanceId).toBeNull()
  store.selectCustom("custom-test", "https://example.com", "copy-3")
  expect(store.activeInstanceId).toBe("copy-3")
  store.clearNetwork()
  expect(store.activeInstanceId).toBeNull()
})
