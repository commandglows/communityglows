<template>
  <div class="palette-picker" role="group" :aria-label="$t('theme.palette_label')">
    <button v-for="palette in THEME_PALETTES" :key="palette.id" type="button"
      class="palette-picker__choice" :aria-pressed="theme.palette === palette.id"
      :title="$t(`theme.palettes.${palette.id}`)" @click="theme.setPalette(palette.id)">
      <span class="palette-picker__sample" :style="sampleStyle(palette.id)" aria-hidden="true">
        <span v-if="theme.palette === palette.id" class="palette-picker__check">✓</span>
      </span>
      <span>{{ $t(`theme.palettes.${palette.id}`) }}</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { THEME_PALETTES, paletteTokens, type ThemePalette } from '@/utils/themePalette'
const theme = useThemeStore()
function sampleStyle(id: ThemePalette) {
  const t = paletteTokens(id, theme.isDarkMode)
  return { background: `conic-gradient(${t['--sg-color-action']} 0deg 180deg, ${t['--sg-color-surface-hover']} 180deg 270deg, ${t['--sg-color-surface-raised']} 270deg)` }
}
</script>
<style scoped>
.palette-picker { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sg-space-2); margin-block: var(--sg-space-3); }
.palette-picker__choice { display: flex; flex-direction: column; align-items: center; gap: var(--sg-space-1); min-width: 0; padding: var(--sg-space-2); border: 1px solid transparent; border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-muted); color: var(--sg-color-text); font: inherit; cursor: pointer; }
.palette-picker__choice[aria-pressed="true"] { border-color: var(--sg-color-action); }
.palette-picker__choice:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.palette-picker__sample { position: relative; display: block; width: 100%; max-width: 3rem; aspect-ratio: 1; border-radius: var(--sg-radius-pill); }
.palette-picker__check { position: absolute; right: 0; top: 0; border-radius: var(--sg-radius-pill); background: var(--sg-color-action); color: var(--sg-color-text-on-action); padding-inline: var(--sg-space-1); }
</style>
