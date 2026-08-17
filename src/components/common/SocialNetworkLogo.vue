<template>
  <div
    class="social-network-logo"
    :class="[size, network]"
    :style="{ color }"
  >
    <i :class="getIconClass"></i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getSocialNetworkColor } from '../../config/socialNetworks'

const props = defineProps<{
  network:
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'tiktok'
    | 'threads'
    | 'discord'
    | 'reddit'
  size?: 'small' | 'medium' | 'large'
}>()

const getIconClass = computed(() => {
  switch (props.network) {
    case 'twitter':
      return 'pi pi-twitter'
    case 'facebook':
      return 'pi pi-facebook'
    case 'instagram':
      return 'pi pi-instagram'
    case 'linkedin':
      return 'pi pi-linkedin'
    case 'tiktok':
      return 'pi pi-tiktok'
    case 'threads':
      return 'pi pi-at'
    case 'discord':
      return 'pi pi-discord'
    case 'reddit':
      return 'pi pi-reddit'
    default:
      return 'pi pi-question'
  }
})

const color = computed(() => getSocialNetworkColor(props.network))
</script>

<style scoped>
.social-network-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-surface-raised);
}

.social-network-logo.small {
  width: var(--sg-size-2rem);
  height: var(--sg-size-2rem);
  font-size: var(--sg-font-size-1rem);
}

.social-network-logo.medium {
  width: var(--sg-size-3rem);
  height: var(--sg-size-3rem);
  font-size: var(--sg-font-size-1d5rem);
}

.social-network-logo.large {
  width: var(--sg-size-4rem);
  height: var(--sg-size-4rem);
  font-size: var(--sg-font-size-2rem);
}
</style>

