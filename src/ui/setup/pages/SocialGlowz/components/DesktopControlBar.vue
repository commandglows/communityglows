<template>
  <div
    class="desktop-control-bar"
    :class="`desktop-control-bar--${position}`"
    role="toolbar"
    aria-label="Contrôles des panneaux"
  >
    <SgButton
      v-if="leftHidden"
      v-sg-tooltip.right="'Ouvrir le panneau gauche'"
      icon="pi pi-bars"
      text
      aria-label="Ouvrir le panneau gauche"
      @click="$emit('open-left')"
    />
    <span v-else />

    <div class="desktop-control-bar__actions">
      <slot />
    </div>

    <SgButton
      v-if="rightHidden"
      v-sg-tooltip.left="'Ouvrir le panneau droit'"
      icon="pi pi-bars"
      text
      aria-label="Ouvrir le panneau droit"
      @click="$emit('open-right')"
    />
    <span v-else />
  </div>
</template>

<script setup lang="ts">
import type { DesktopControlBarPosition } from '@/stores/desktopControlBar'
import SgButton from './ui/SgButton.vue'

defineProps<{
  leftHidden: boolean
  rightHidden: boolean
  position: DesktopControlBarPosition
}>()

defineEmits<{
  'open-left': []
  'open-right': []
}>()
</script>

<style scoped>
.desktop-control-bar {
  position: relative;
  z-index: var(--sg-sidebar-overlay-z-index);
  display: grid;
  grid-template-columns: var(--sg-control-bar-edge-column) 1fr var(--sg-control-bar-edge-column);
  align-items: center;
  flex: 0 0 var(--sg-control-bar-height);
  min-height: var(--sg-control-bar-height);
  padding-inline: var(--sg-control-bar-padding-inline);
  border-color: var(--sg-color-border);
  background: var(--sg-color-translucent-surface);
  backdrop-filter: blur(var(--sg-control-bar-blur));
}

.desktop-control-bar--top { border-bottom: 1px solid var(--sg-color-border); }
.desktop-control-bar--bottom { border-top: 1px solid var(--sg-color-border); }
.desktop-control-bar__actions { display: flex; align-items: center; justify-content: center; gap: var(--sg-space-2); }
.desktop-control-bar > :last-child { justify-self: end; }
</style>
