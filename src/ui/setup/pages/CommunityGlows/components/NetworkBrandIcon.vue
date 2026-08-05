<template>
  <component
    :is="brandIcon"
    v-if="brandIcon"
    class="network-brand-icon"
    aria-hidden="true"
    focusable="false"
  />
  <SgIcon
    v-else
    :icon="fallbackIcon"
    class="network-brand-icon"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import SiBluesky from '~icons/simple-icons/bluesky'
import SiBuymeacoffee from '~icons/simple-icons/buymeacoffee'
import SiDiscord from '~icons/simple-icons/discord'
import SiFacebook from '~icons/simple-icons/facebook'
import SiHackernews from '~icons/simple-icons/ycombinator'
import SiIndiehackers from '~icons/simple-icons/indiehackers'
import SiInstagram from '~icons/simple-icons/instagram'
import SiKick from '~icons/simple-icons/kick'
import SiKofi from '~icons/simple-icons/kofi'
import SiLinkedin from '~icons/simple-icons/linkedin'
import SiMastodon from '~icons/simple-icons/mastodon'
import SiMedium from '~icons/simple-icons/medium'
import SiNextdoor from '~icons/simple-icons/nextdoor'
import SiPatreon from '~icons/simple-icons/patreon'
import SiPinterest from '~icons/simple-icons/pinterest'
import SiProducthunt from '~icons/simple-icons/producthunt'
import SiQuora from '~icons/simple-icons/quora'
import SiReddit from '~icons/simple-icons/reddit'
import SiSnapchat from '~icons/simple-icons/snapchat'
import SiSubstack from '~icons/simple-icons/substack'
import SiTelegram from '~icons/simple-icons/telegram'
import SiThreads from '~icons/simple-icons/threads'
import SiTiktok from '~icons/simple-icons/tiktok'
import SiX from '~icons/simple-icons/x'

const props = defineProps<{
  networkId: string
  fallbackIcon: string
}>()

const brandIcons: Record<string, Component> = {
  bluesky: SiBluesky,
  buymeacoffee: SiBuymeacoffee,
  discord: SiDiscord,
  facebook: SiFacebook,
  hackernews: SiHackernews,
  indiehackers: SiIndiehackers,
  instagram: SiInstagram,
  kick: SiKick,
  'ko-fi': SiKofi,
  linkedin: SiLinkedin,
  mastodon: SiMastodon,
  medium: SiMedium,
  nextdoor: SiNextdoor,
  patreon: SiPatreon,
  pinterest: SiPinterest,
  producthunt: SiProducthunt,
  quora: SiQuora,
  reddit: SiReddit,
  snapchat: SiSnapchat,
  substack: SiSubstack,
  telegram: SiTelegram,
  threads: SiThreads,
  tiktok: SiTiktok,
  twitter: SiX,
}

const brandIcon = computed(() => brandIcons[props.networkId])
</script>

<style scoped>
.network-brand-icon {
  width: var(--sg-sidebar-network-icon-size);
  height: var(--sg-sidebar-network-icon-size);
}
</style>
