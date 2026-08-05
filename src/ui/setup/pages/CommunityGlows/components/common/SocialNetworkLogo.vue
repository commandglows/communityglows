<template>
  <NetworkLogo 
    :domain="getDomain(network)"
    :size="size"
    :class="[`network-logo-${network}`, className]"
  />
</template>

<script setup lang="ts">
import NetworkLogo from './NetworkLogo.vue'

interface Props {
  network: 'facebook' | 'twitter' | 'linkedin' | 'reddit' | 'instagram' | 'discord'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  className: ''
})

const getDomain = (network: string): string => {
  const domains = {
    facebook: 'facebook.com',
    twitter: 'twitter.com',
    linkedin: 'linkedin.com',
    reddit: 'reddit.com',
    instagram: 'instagram.com',
    discord: 'discord.com'
  }
  return domains[network as keyof typeof domains]
}
</script>

<style scoped>
.network-logo-facebook {
  --logo-color: var(--sg-color-facebook);
}

.network-logo-twitter {
  --logo-color: var(--sg-color-twitter);
}

.network-logo-linkedin {
  --logo-color: var(--sg-color-linkedin);
}

.network-logo-reddit {
  --logo-color: var(--sg-color-reddit);
}

.network-logo-instagram {
  --logo-color: var(--sg-color-instagram-red);
}

.network-logo-discord {
  --logo-color: var(--sg-color-discord);
}
</style> 
