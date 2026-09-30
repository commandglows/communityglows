<script setup lang="ts">
import { ContextMenuSub, ContextMenuSubTrigger, ContextMenuPortal, ContextMenuSubContent, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuItemIndicator, ContextMenuSeparator } from 'reka-ui'
import { useThemeStore } from '@/stores/theme'
import { THEME_PALETTES, paletteTokens, normalizePalette } from '@/utils/themePalette'
import SgIcon from './ui/SgIcon.vue'
const themeStore = useThemeStore()
</script>
<template>          <ContextMenuSub>
            <ContextMenuSubTrigger class="sidebar-network-context-menu__item">
              <SgIcon icon="pi pi-palette" aria-hidden="true" />
              {{ $t('theme.menu_label') }}
              <SgIcon icon="pi pi-chevron-right" class="sidebar-theme-trailing" aria-hidden="true" />
            </ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent class="sidebar-network-context-menu" :side-offset="4" :collision-padding="8">
                <ContextMenuRadioGroup :model-value="themeStore.themeMode">
                  <ContextMenuRadioItem v-for="mode in (['light', 'dark', 'auto'] as const)" :key="mode" :value="mode"
                    class="sidebar-network-context-menu__item" @select="themeStore.setThemeMode(mode, { allowPrompt: false })">
                    {{ $t(`theme.${mode}`) }}
                    <span class="sidebar-theme-trailing sidebar-theme-check"><ContextMenuItemIndicator><SgIcon icon="pi pi-check" aria-hidden="true" /></ContextMenuItemIndicator></span>
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
                <ContextMenuSeparator class="theme-mode-separator" />
                <ContextMenuRadioGroup :model-value="themeStore.palette" @update:model-value="themeStore.setPalette(normalizePalette($event))">
                  <ContextMenuRadioItem v-for="palette in THEME_PALETTES" :key="palette.id"
                    :value="palette.id" class="sidebar-network-context-menu__item sidebar-theme-preview"
                    :style="paletteTokens(palette.id, themeStore.isDarkMode)">
                    <span class="sidebar-theme-swatch" :style="{ background: paletteTokens(palette.id, themeStore.isDarkMode)['--sg-color-action'] }" aria-hidden="true" />
                    {{ $t(`theme.palettes.${palette.id}`) }}
                    <span class="sidebar-theme-trailing sidebar-theme-check">
                      <ContextMenuItemIndicator><SgIcon icon="pi pi-check" aria-hidden="true" /></ContextMenuItemIndicator>
                    </span>
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
</template>


<style scoped>
:global(.sidebar-network-context-menu) {
  z-index: var(--sg-layer-modal);
  max-width: calc(100vw - var(--sg-space-4));
  max-height: calc(var(--sg-size-100vh) - var(--sg-space-4));
  overflow-y: auto;
  padding: var(--sg-space-1);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  box-shadow: var(--sg-shadow-control);
}

:global(.sidebar-network-context-menu__item) {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d4rem);
  padding: var(--sg-button-padding);
  border-radius: var(--sg-radius-sm);
  cursor: pointer;
}

:global(.sidebar-network-context-menu__item > .sg-icon) {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
}

:global(.sidebar-network-context-menu__item[data-highlighted]) {
  outline: none;
  background: var(--sg-color-surface-hover);
}

:global(.sidebar-theme-trailing) { margin-left: auto; }
:global(.theme-mode-separator) { height: 1px; margin-block: var(--sg-space-1); background: var(--sg-color-border); }
:global(.sidebar-theme-preview) { background: var(--sg-color-surface-muted); color: var(--sg-color-text); }
:global(.sidebar-theme-preview[data-highlighted]) { background: var(--sg-color-surface-hover); box-shadow: inset 0 0 0 1px var(--sg-color-action); }
:global(.sidebar-theme-check) { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 1em; width: 1em; height: 1em; line-height: 1; }
:global(.sidebar-theme-check > span) { display: inline-flex; align-items: center; justify-content: center; }
:global(.sidebar-theme-check .sg-icon) { display: block; width: 1em; height: 1em; }
:global(.sidebar-theme-swatch) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  border-radius: var(--sg-radius-pill);
  border: 1px solid var(--sg-color-border);
}


</style>
