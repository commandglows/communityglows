<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SgIcon from './ui/SgIcon.vue'
const props = defineProps<{ networkName?: string; networkUrl?: string | null; navigationGuide?: boolean; sectionTitle?: string; centralized?: boolean }>()
const emit = defineEmits<{ navigate: [event: MouseEvent] }>()
const { locale } = useI18n()
const downloadUrl = computed(() => `https://communityglows.com/${locale.value === 'fr' ? 'fr/' : ''}download`)
const safeNetworkUrl = computed(() => {
  try {
    const url = new URL(props.networkUrl ?? '')
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch { return undefined }
})
</script>
<template>
  <section class="native-workspace-card">
    <div class="native-workspace-card__preview" aria-hidden="true">
      <div class="native-workspace-card__pane"><SgIcon icon="pi pi-th-large" /><span>Bento</span></div>
      <div class="native-workspace-card__pane"><SgIcon icon="pi pi-users" /></div>
      <div class="native-workspace-card__pane"><SgIcon icon="pi pi-comments" /></div>
    </div>
    <template v-if="navigationGuide">
      <span class="native-workspace-card__eyebrow">CommunityGlows</span>
      <h2>{{ sectionTitle }}</h2>
      <p>{{ $t(centralized ? 'right_panel_guide.planned' : 'right_panel_guide.choose') }}</p>
      <h3>{{ $t('right_panel_guide.left_title') }}</h3>
      <p>{{ $t('right_panel_guide.left_description') }}</p>
      <h3>{{ $t('right_panel_guide.right_title') }}</h3>
      <p>{{ $t('right_panel_guide.right_description') }}</p>
    </template>
    <template v-else>
<span class="native-workspace-card__eyebrow">{{ $t('native_workspace.eyebrow') }}</span>
    <h2>{{ networkName ? $t('native_workspace.network_title', { network: networkName }) : $t('native_workspace.title') }}</h2>
    <p v-if="networkName">{{ $t('native_workspace.unavailable') }}</p>
    <p>{{ $t('native_workspace.description') }}</p>
    <div class="native-workspace-card__benefits">
      <span><SgIcon icon="pi pi-th-large" />{{ $t('native_workspace.bento') }}</span>
      <span><SgIcon icon="pi pi-users" />{{ $t('native_workspace.profiles') }}</span>
    </div>
    <a class="native-workspace-card__primary" :href="downloadUrl" target="_blank" rel="noopener noreferrer" @click="emit('navigate', $event)">
      <SgIcon icon="pi pi-download" />{{ $t('native_workspace.download') }}
    </a>
    <a class="native-workspace-card__secondary native-workspace-card__android" :href="downloadUrl" target="_blank" rel="noopener noreferrer" @click="emit('navigate', $event)">
      <SgIcon icon="pi pi-mobile" />
      <span>{{ $t('native_workspace.android') }}</span>
    </a>
    <a v-if="safeNetworkUrl" class="native-workspace-card__secondary" :href="safeNetworkUrl" target="_blank" rel="noopener noreferrer">
      {{ $t('native_workspace.open_network', { network: networkName }) }}<SgIcon icon="pi pi-external-link" />
    </a>
    </template>
    <slot />
  </section>
</template>
<style scoped>
.native-workspace-card { width: 100%; max-width: 36rem; box-sizing: border-box; display: grid; gap: var(--sg-space-3); padding: clamp(1rem, 4vw, 2rem); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-lg); background: var(--sg-color-surface-raised); color: var(--sg-color-text); box-shadow: var(--sg-shadow-control); text-align: start; overflow-wrap: anywhere; }
.native-workspace-card h2 { margin: 0; font-size: clamp(1.2rem, 2vw, 1.6rem); line-height: 1.25; }
.native-workspace-card h3 { margin: 0; font-size: inherit; }
.native-workspace-card p { margin: 0; color: var(--sg-color-text-muted); line-height: 1.6; }
.native-workspace-card__eyebrow { color: var(--sg-color-action); font-weight: 600; }
.native-workspace-card__preview { display: grid; grid-template-columns: 1.4fr 1fr; grid-template-rows: repeat(2, 2.5rem); gap: var(--sg-space-2); max-width: 16rem; width: 100%; margin: 0 auto var(--sg-space-2); }
.native-workspace-card__pane { display: flex; align-items: center; justify-content: center; gap: var(--sg-space-2); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-muted); color: var(--sg-color-action); }
.native-workspace-card__pane:first-child { grid-row: span 2; background: var(--sg-color-surface-hover); }
.native-workspace-card__benefits { display: flex; flex-wrap: wrap; gap: var(--sg-space-3); font-size: .875rem; }
.native-workspace-card__benefits span, .native-workspace-card a { display: inline-flex; align-items: center; justify-content: center; gap: var(--sg-space-2); }
.native-workspace-card a { min-height: 44px; padding: var(--sg-space-2); border-radius: var(--sg-radius-sm); text-align: center; text-decoration: none; }
.native-workspace-card__primary { background: var(--sg-color-action); color: var(--sg-color-text-on-action); font-weight: 600; }
.native-workspace-card__primary:hover { background: var(--sg-color-action-hover); }
.native-workspace-card__secondary { color: var(--sg-color-action); }
.native-workspace-card__android { border: 1px solid var(--sg-color-border); }
.native-workspace-card__secondary:hover { background: var(--sg-color-surface-hover); }
.native-workspace-card a:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.native-workspace-card small { color: var(--sg-color-text-muted); line-height: 1.5; }
</style>
