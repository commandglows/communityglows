<template>
  <div
    class="desktop-control-bar"
    :class="`desktop-control-bar--${position}`"
    :style="barStyle"
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

    <div
      v-if="resizable && minimumHeight > 0"
      class="desktop-control-bar__resize-handle"
      :class="`desktop-control-bar__resize-handle--${position}`"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Redimensionner la barre de navigation"
      :aria-valuemin="minimumHeight"
      :aria-valuemax="maximumHeight"
      :aria-valuenow="currentHeight"
      :aria-valuetext="`${Math.round(currentHeight)} pixels`"
      tabindex="0"
      @pointerdown="onResizePointerDown"
      @pointermove="onResizePointerMove"
      @pointerup="finishResize"
      @pointercancel="finishResize"
      @lostpointercapture="finishResize"
      @keydown="onResizeKeydown"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  DESKTOP_CONTROL_BAR_MAX_HEIGHT_RATIO,
  type DesktopControlBarPosition,
  useDesktopControlBarStore,
} from '@/stores/desktopControlBar'
import SgButton from './ui/SgButton.vue'

const props = withDefaults(defineProps<{
  leftHidden: boolean
  rightHidden: boolean
  position: DesktopControlBarPosition
  resizable?: boolean
}>(), {
  resizable: false,
})

defineEmits<{
  'open-left': []
  'open-right': []
}>()

const CONTROL_BAR_HEIGHT_TOKEN = '--sg-control-bar-height'
const controlBarStore = useDesktopControlBarStore()
const minimumHeight = ref(0)
const viewportHeight = ref(0)
const activePointerId = ref<number | null>(null)
const pointerStartY = ref(0)
const pointerStartHeight = ref(0)

const maximumHeight = computed(() =>
  Math.max(
    minimumHeight.value,
    viewportHeight.value * DESKTOP_CONTROL_BAR_MAX_HEIGHT_RATIO,
  ),
)
const currentHeight = computed(() =>
  controlBarStore.resolvedHeight(minimumHeight.value, viewportHeight.value),
)
const barStyle = computed(() => {
  if (!props.resizable || minimumHeight.value <= 0) return undefined
  return {
    '--sg-control-bar-current-height': `${currentHeight.value}px`,
  }
})

function resolveControlBarHeight() {
  if (typeof window === 'undefined') return 0
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(CONTROL_BAR_HEIGHT_TOKEN)
    .trim()
  if (!value) return 0

  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  if (value.endsWith('rem')) {
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    )
    return Number.isFinite(rootFontSize) ? parsed * rootFontSize : 0
  }
  return parsed
}

function refreshAvailableHeight() {
  minimumHeight.value = resolveControlBarHeight()
  viewportHeight.value = window.innerHeight
}

function setHeight(value: number) {
  controlBarStore.setHeight(
    value,
    minimumHeight.value,
    viewportHeight.value,
  )
}

function resizeBy(delta: number) {
  const direction = props.position === 'top' ? 1 : -1
  setHeight(currentHeight.value + direction * delta)
}

function onResizePointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  activePointerId.value = event.pointerId
  pointerStartY.value = event.clientY
  pointerStartHeight.value = currentHeight.value
}

function onResizePointerMove(event: PointerEvent) {
  if (activePointerId.value !== event.pointerId) return
  const direction = props.position === 'top' ? 1 : -1
  setHeight(pointerStartHeight.value + direction * (event.clientY - pointerStartY.value))
}

function finishResize(event?: PointerEvent) {
  if (event && activePointerId.value !== event.pointerId) return
  activePointerId.value = null
}

function onResizeKeydown(event: KeyboardEvent) {
  const range = Math.max(0, maximumHeight.value - minimumHeight.value)
  const step = Math.max(1, Math.round(range / 20))
  const pageStep = step * 4

  if (event.key === 'Home') {
    event.preventDefault()
    setHeight(minimumHeight.value)
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    setHeight(maximumHeight.value)
    return
  }

  const amount = event.key === 'PageUp' || event.key === 'PageDown' ? pageStep : step
  if (event.key === 'ArrowDown' || event.key === 'PageDown') {
    event.preventDefault()
    resizeBy(amount)
  }
  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault()
    resizeBy(-amount)
  }
}

onMounted(() => {
  refreshAvailableHeight()
  window.addEventListener('resize', refreshAvailableHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshAvailableHeight)
})
</script>

<style scoped>
.desktop-control-bar {
  position: relative;
  z-index: var(--sg-sidebar-overlay-z-index);
  display: grid;
  grid-template-columns: var(--sg-control-bar-edge-column) 1fr var(--sg-control-bar-edge-column);
  align-items: center;
  flex: 0 0 var(--sg-control-bar-current-height, var(--sg-control-bar-height));
  min-height: var(--sg-control-bar-current-height, var(--sg-control-bar-height));
  height: var(--sg-control-bar-current-height, var(--sg-control-bar-height));
  padding-inline: var(--sg-control-bar-padding-inline);
  border-color: var(--sg-color-border);
  background: var(--sg-color-translucent-surface);
  backdrop-filter: blur(var(--sg-control-bar-blur));
}

.desktop-control-bar--top { border-bottom: 1px solid var(--sg-color-border); }
.desktop-control-bar--bottom { border-top: 1px solid var(--sg-color-border); }
.desktop-control-bar__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-2);
  min-width: 0;
  overflow: hidden;
}
.desktop-control-bar > :last-child { justify-self: end; }
.desktop-control-bar__resize-handle {
  position: absolute;
  z-index: var(--sg-sidebar-overlay-z-index);
  left: 0;
  width: var(--sg-size-100pct);
  height: var(--sg-control-bar-handle-hit-area);
  padding: 0;
  border: 0;
  background: var(--sg-color-transparent);
  cursor: ns-resize;
  touch-action: none;
}
.desktop-control-bar__resize-handle::before {
  position: absolute;
  top: var(--sg-position-center);
  width: var(--sg-size-100pct);
  height: var(--sg-control-bar-handle-thickness);
  background: var(--sg-color-transparent);
  content: '';
  transform: translateY(var(--sg-position-center-transform));
  transition: var(--sg-sidebar-gutter-transition);
}
.desktop-control-bar__resize-handle--top {
  bottom: var(--sg-control-bar-handle-offset);
}
.desktop-control-bar__resize-handle--bottom {
  top: var(--sg-control-bar-handle-offset);
}
.desktop-control-bar__resize-handle:hover::before,
.desktop-control-bar__resize-handle:focus-visible::before {
  background: var(--sg-color-text-on-action);
}
.desktop-control-bar__resize-handle:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}
@media (prefers-reduced-motion: reduce) {
  .desktop-control-bar__resize-handle::before { transition: var(--sg-motion-none); }
}
</style>
