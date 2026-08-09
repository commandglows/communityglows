<template>
  <div class="desktop-quick-navigation">
    <ProfileSwitcher
      v-if="showProfileSelector"
      :icons-only="false"
      embedded
      control-bar
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
  getVisibleBuiltInSocialNetworks,
  type BuiltInSocialNetwork,
} from "@/config/socialNetworks"
import type { DesktopControlBarPosition } from "@/stores/desktopControlBar"
import { useProfilesStore } from "@/stores/profiles"
import { useWebviewStore } from "@/stores/webviewState"
import NetworkBrandIcon from "./NetworkBrandIcon.vue"
import ProfileSwitcher from "./ProfileSwitcher.vue"

withDefaults(defineProps<{
  position: DesktopControlBarPosition
  showProfileSelector?: boolean
}>(), {
  showProfileSelector: true,
})

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
  return getVisibleBuiltInSocialNetworks(profile.hiddenNetworks)
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
  gap: var(--sg-control-bar-navigation-gap);
  min-width: 0;
  max-width: var(--sg-size-100pct);
  --desktop-quick-navigation-icon-size: clamp(
    var(--sg-control-bar-navigation-icon-size),
    calc(var(--sg-control-bar-current-height) - var(--sg-space-2rem)),
    calc(var(--sg-control-height-sm) * 3)
  );
  --desktop-quick-navigation-brand-icon-size: calc(
    var(--desktop-quick-navigation-icon-size) - var(--sg-space-4)
  );
}

.desktop-quick-navigation__networks {
  display: flex;
  align-items: center;
  gap: var(--sg-control-bar-navigation-gap);
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
  flex: 0 0 var(--desktop-quick-navigation-icon-size);
  width: var(--desktop-quick-navigation-icon-size);
  height: var(--desktop-quick-navigation-icon-size);
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

.desktop-quick-navigation__network :deep(.network-brand-icon) {
  width: var(--desktop-quick-navigation-brand-icon-size);
  height: var(--desktop-quick-navigation-brand-icon-size);
}
</style>
