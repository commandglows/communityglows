import { defineStore } from "pinia"
import { builtInSocialNetworks } from "@/config/socialNetworks"

export const WEBVIEW_URLS: Record<string, string> =
  builtInSocialNetworks.reduce(
    (acc, network) => {
      acc[network.id] = network.url
      return acc
    },
    {} as Record<string, string>,
  )

export const useWebviewStore = defineStore("webview", {
  state: () => ({
    activeNetworkId: null as string | null,
    activeInstanceId: null as string | null,
    /** Set only for custom links — overrides WEBVIEW_URLS lookup */
    activeCustomUrl: null as string | null,
    /** Set for one-off entries such as shared URLs inside a known network session. */
    activeUrlOverride: null as string | null,
    /** Increments for every explicit selection, including repeated targets. */
    selectionRevision: 0,
  }),

  getters: {
    activeUrl: (state): string | null => {
      if (!state.activeNetworkId) return null
      return (
        state.activeUrlOverride ??
        state.activeCustomUrl ??
        WEBVIEW_URLS[state.activeNetworkId] ??
        null
      )
    },
    usesWebview: () => (networkId: string) =>
      networkId in WEBVIEW_URLS || networkId.startsWith("custom-"),
  },

  actions: {
    selectNetwork(
      networkId: string,
      urlOverride?: string,
      instanceId?: string,
    ) {
      this.activeNetworkId = networkId
      this.activeInstanceId = instanceId ?? null
      this.activeCustomUrl = null
      this.activeUrlOverride = urlOverride ?? null
      this.selectionRevision += 1
    },
    selectCustom(linkId: string, url: string, instanceId?: string) {
      this.activeNetworkId = linkId
      this.activeInstanceId = instanceId ?? null
      this.activeCustomUrl = url
      this.activeUrlOverride = null
      this.selectionRevision += 1
    },
    clearNetwork() {
      this.activeNetworkId = null
      this.activeInstanceId = null
      this.activeCustomUrl = null
      this.activeUrlOverride = null
    },
  },
})
