<template>
  <ContextMenuRoot :press-open-delay="500" @update:open="onMenuOpen">
    <ContextMenuTrigger as-child @pointerdown="startMousePress" @pointerup="cancelMousePress"
      @pointercancel="cancelMousePress" @pointermove="moveMousePress" @click.capture="consumeLongClick"><slot /></ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="mobile-network-menu" :collision-padding="8"
        @pointerdown.capture="awaitingNewPress = false" @keydown.capture="awaitingNewPress = false"
        @pointerup.capture="guardOpeningRelease" @click.capture="guardOpeningRelease">
        <ContextMenuItem @select="$emit('edit')"><SgIcon icon="pi pi-sliders-h" />{{ $t(editing ? 'sidebar.finish_editing_networks' : 'sidebar.edit_displayed_networks') }}</ContextMenuItem>
        <ContextMenuItem @select="$emit('expand')"><SgIcon icon="pi pi-chevron-down" />{{ $t('sidebar.expand_all') }}</ContextMenuItem>
        <ContextMenuItem @select="$emit('collapse')"><SgIcon icon="pi pi-chevron-up" />{{ $t('sidebar.collapse_all') }}</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger><SgIcon icon="pi pi-palette" />{{ $t('theme.menu_label') }}<SgIcon icon="pi pi-chevron-right" /></ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent class="mobile-network-menu" :collision-padding="8">
              <ContextMenuRadioGroup :model-value="theme.themeMode">
                <ContextMenuRadioItem v-for="mode in (['light', 'dark', 'auto'] as const)" :key="mode" :value="mode"
                  @select="theme.setThemeMode(mode, { allowPrompt: false })">
                  {{ $t(`theme.${mode}`) }}
                  <ContextMenuItemIndicator class="mobile-network-menu-check"><SgIcon icon="pi pi-check" /></ContextMenuItemIndicator>
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuSeparator class="mobile-theme-separator" />
              <ContextMenuRadioGroup :model-value="theme.palette" @update:model-value="theme.setPalette(normalizePalette($event))">
                <ContextMenuRadioItem v-for="palette in THEME_PALETTES" :key="palette.id" :value="palette.id"
                  class="mobile-theme-preview" :style="paletteTokens(palette.id, theme.isDarkMode)">
                  <span class="mobile-theme-dot" aria-hidden="true" />
                  {{ $t(`theme.palettes.${palette.id}`) }}
                  <ContextMenuItemIndicator class="mobile-network-menu-check"><SgIcon icon="pi pi-check" /></ContextMenuItemIndicator>
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
<script setup lang="ts">
import { ContextMenuRoot, ContextMenuTrigger, ContextMenuPortal, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuItemIndicator } from 'reka-ui'
import { useThemeStore } from '@/stores/theme'
import { ContextMenuSeparator } from 'reka-ui'
import { THEME_PALETTES, normalizePalette, paletteTokens } from '@/utils/themePalette'
import SgIcon from './ui/SgIcon.vue'
import { onBeforeUnmount } from 'vue'
defineProps<{ editing: boolean }>()
const emit = defineEmits<{ open: [value: boolean]; edit: []; expand: []; collapse: [] }>()
const theme = useThemeStore()
let awaitingNewPress = false
function onMenuOpen(open: boolean) {
  awaitingNewPress = open
  emit('open', open)
}
function guardOpeningRelease(event: Event) {
  if (!awaitingNewPress) return
  event.preventDefault()
  event.stopPropagation()
}
let pressTimer: ReturnType<typeof setTimeout> | undefined
let origin = { x: 0, y: 0 }
let suppressClick = false
function cancelMousePress() {
  clearTimeout(pressTimer)
  pressTimer = undefined
}
function startMousePress(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0) return
  cancelMousePress()
  suppressClick = false
  origin = { x: event.clientX, y: event.clientY }
  const target = event.target as HTMLElement
  pressTimer = setTimeout(() => {
    suppressClick = true
    target.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: origin.x, clientY: origin.y, button: 2,
    }))
  }, 500)
}
function moveMousePress(event: PointerEvent) {
  if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) cancelMousePress()
}
function consumeLongClick(event: MouseEvent) {
  if (!suppressClick) return
  suppressClick = false
  event.preventDefault()
  event.stopPropagation()
}
onBeforeUnmount(cancelMousePress)
</script>
<style>
.mobile-network-menu { z-index: var(--sg-layer-modal); max-width: calc(100vw - 16px); padding: var(--sg-space-1); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-raised); color: var(--sg-color-text); box-shadow: var(--sg-shadow-control); }
.mobile-network-menu [role^="menuitem"] { display: flex; align-items: center; gap: var(--sg-space-2); min-height: 44px; padding: var(--sg-button-padding); border-radius: var(--sg-radius-sm); }
.mobile-network-menu [data-highlighted] { background: var(--sg-color-surface-hover); outline: none; }
.mobile-network-menu-check { display: inline-flex; align-items: center; justify-content: center; margin-left: auto; line-height: 1; }
.mobile-network-menu-check .sg-icon { display: block; width: 1em; height: 1em; }
.mobile-theme-preview { background: var(--sg-color-surface-muted); color: var(--sg-color-text); }
.mobile-network-menu .mobile-theme-preview[data-highlighted] { background: var(--sg-color-surface-hover); box-shadow: inset 0 0 0 1px var(--sg-color-action); }
.mobile-theme-dot { width: 1em; height: 1em; flex: 0 0 1em; border-radius: var(--sg-radius-pill); background: var(--sg-color-action); }
.mobile-theme-separator { height: 1px; margin-block: var(--sg-space-1); background: var(--sg-color-border); }
.mobile-network-menu { max-height: var(--reka-context-menu-content-available-height, calc(100dvh - 16px)); overflow-y: auto; }
</style>
