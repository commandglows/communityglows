<template>
  <div class="desktop-quick-navigation">
    <ProfileSwitcher
      :icons-only="false"
      embedded
      :menu-direction="position === 'bottom' ? 'up' : 'down'"
      @manage-profiles="emit('manage-profiles')"
      @open-settings="emit('open-settings')"
    />

    <div
      class="desktop-quick-navigation__networks"
      role="group"
      aria-label="Réseaux visibles"
    >
      <button
        v-for="network in visibleNetworks"
        :key="network.id"
        class="desktop-quick-navigation__network"
        :class="{ active: webviewStore.activeNetworkId === network.id }"
        :style="{ background: network.tileColor ?? network.color }"
        type="button"
        :aria-label="`Ouvrir ${network.label}`"
        :aria-pressed="webviewStore.activeNetworkId === network.id"
        @click="navigateToNetwork(network)"
      >
        <NetworkBrandIcon
          :network-id="network.id"
          :fallback-icon="network.icon"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import {
  builtInSocialNetworks,
  type BuiltInSocialNetwork,
} from "@/config/socialNetworks"
import type { DesktopControlBarPosition } from "@/stores/desktopControlBar"
import { useProfilesStore } from "@/stores/profiles"
import { useWebviewStore } from "@/stores/webviewState"
import NetworkBrandIcon from "./NetworkBrandIcon.vue"
import ProfileSwitcher from "./ProfileSwitcher.vue"

defineProps<{
  position: DesktopControlBarPosition
}>()

const emit = defineEmits<{
  "manage-profiles": []
  "open-settings": []
}>()

const router = useRouter()
const profilesStore = useProfilesStore()
const webviewStore = useWebviewStore()

const visibleNetworks = computed(() => {
  const profile = profilesStore.activeProfile
  if (!profile) return []
  const hiddenNetworkIds = new Set(profile.hiddenNetworks ?? [])
  return builtInSocialNetworks.filter(
    (network) => !hiddenNetworkIds.has(network.id),
  )
})

function navigateToNetwork(network: BuiltInSocialNetwork) {
  const profileId = profilesStore.activeProfileId
  if (
    !profileId ||
    profilesStore.isNetworkHidden(profileId, network.id)
  ) {
    return
  }
  if (webviewStore.usesWebview(network.id)) {
    webviewStore.selectNetwork(network.id)
    return
  }
  webviewStore.clearNetwork()
  router.push(network.route)
}
</script>

<style scoped>
.desktop-quick-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-2);
  min-width: 0;
  max-width: var(--sg-size-100pct);
}

.desktop-quick-navigation__networks {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1);
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.desktop-quick-navigation__networks::-webkit-scrollbar {
  display: none;
}

.desktop-quick-navigation__network {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 var(--sg-control-height-sm);
  width: var(--sg-control-height-sm);
  height: var(--sg-control-height-sm);
  padding: 0;
  border: var(--sg-border-1px) solid transparent;
  border-radius: var(--sg-radius-pill);
  color: var(--sg-color-text-on-action);
  cursor: pointer;
  transition: var(--sg-motion-transform-0d2s), var(--sg-motion-borderneg-color-0d15s);
}

.desktop-quick-navigation__network:hover {
  transform: scale(1.05);
}

.desktop-quick-navigation__network.active {
  border-color: var(--sg-color-text);
}

.desktop-quick-navigation__network:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}
</style>
