<template>
  <div
    class="desktop-control-bar"
    :class="[
      `desktop-control-bar--${position}`,
      { 'desktop-control-bar--with-leading': hasLeadingContent },
    ]"
    :style="barStyle"
    role="toolbar"
    aria-label="Contrôles des panneaux"
  >
    <div class="desktop-control-bar__leading">
      <SgButton
        v-if="leftHidden"
        v-sg-tooltip.right="'Ouvrir le panneau gauche'"
        icon="pi pi-bars"
        text
        aria-label="Ouvrir le panneau gauche"
        @click="$emit('open-left')"
      />
      <span v-else />
      <slot name="after-left" />
    </div>

    <div class="desktop-control-bar__actions">
      <slot />
    </div>

    <div class="desktop-control-bar__trailing">
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

    <div
      v-if="resizable && minimumHeight > 0"
      ref="resizeHandleRef"
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
      @mousedown="onResizeMouseDown"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  hasLeadingContent?: boolean
}>(), {
  resizable: false,
  hasLeadingContent: false,
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
const resizeHandleRef = ref<HTMLDivElement | null>(null)
const pointerStartY = ref(0)
const pointerStartHeight = ref(0)
const wasDraggingWithMouse = ref(false)

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

function onGlobalPointerMove(event: PointerEvent) {
  onResizePointerMove(event)
}

function onGlobalPointerEnd(event: PointerEvent) {
  finishResize(event)
}

function onGlobalMouseMove(event: MouseEvent) {
  if (!wasDraggingWithMouse.value || activePointerId.value !== -1) return
  const direction = props.position === 'top' ? 1 : -1
  setHeight(pointerStartHeight.value + direction * (event.clientY - pointerStartY.value))
}

function onGlobalMouseEnd() {
  finishResize()
}

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

function beginResize(pointerId: number, clientY: number) {
  if (!props.resizable || minimumHeight.value <= 0) return
  if (activePointerId.value !== null) return
  activePointerId.value = pointerId
  pointerStartY.value = clientY
  pointerStartHeight.value = currentHeight.value
}

function onResizePointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.preventDefault()
  beginResize(event.pointerId, event.clientY)

  const target = event.currentTarget as HTMLElement
  try {
    target.setPointerCapture(event.pointerId)
  } catch {
    // Pointer capture can be unsupported in some embedded webviews.
  }
}

function onResizePointerMove(event: PointerEvent) {
  if (activePointerId.value !== event.pointerId) return
  const direction = props.position === 'top' ? 1 : -1
  setHeight(pointerStartHeight.value + direction * (event.clientY - pointerStartY.value))
}

function onResizeMouseDown(event: MouseEvent) {
  if (event.button !== 0 || activePointerId.value !== null) return
  event.preventDefault()
  beginResize(-1, event.clientY)
  wasDraggingWithMouse.value = true
}

function finishResize(event?: PointerEvent | MouseEvent) {
  if (activePointerId.value === null) return
  if (event && 'pointerId' in event && activePointerId.value !== event.pointerId) return

  const target = resizeHandleRef.value
  if (target) {
    try {
      if ('hasPointerCapture' in target && target.hasPointerCapture(activePointerId.value)) {
        target.releasePointerCapture(activePointerId.value)
      }
    } catch {
      // Ignore browsers where pointer capture methods are unavailable.
    }
  }

  activePointerId.value = null
  wasDraggingWithMouse.value = false
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

  document.addEventListener('pointermove', onGlobalPointerMove)
  document.addEventListener('pointerup', onGlobalPointerEnd)
  document.addEventListener('pointercancel', onGlobalPointerEnd)
  document.addEventListener('mousemove', onGlobalMouseMove)
  document.addEventListener('mouseup', onGlobalMouseEnd)
  window.addEventListener('blur', onGlobalMouseEnd)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshAvailableHeight)
  document.removeEventListener('pointermove', onGlobalPointerMove)
  document.removeEventListener('pointerup', onGlobalPointerEnd)
  document.removeEventListener('pointercancel', onGlobalPointerEnd)
  document.removeEventListener('mousemove', onGlobalMouseMove)
  document.removeEventListener('mouseup', onGlobalMouseEnd)
  window.removeEventListener('blur', onGlobalMouseEnd)
})

watch(
  () => props.resizable,
  (resizable) => {
    if (!resizable) {
      finishResize()
    }
  },
)
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

.desktop-control-bar--with-leading {
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr) var(--sg-control-bar-edge-column);
}
.desktop-control-bar--top { border-bottom: 1px solid var(--sg-color-border); }
.desktop-control-bar--bottom { border-top: 1px solid var(--sg-color-border); }
.desktop-control-bar__leading,
.desktop-control-bar__trailing {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: visible;
}
.desktop-control-bar__leading {
  gap: var(--sg-control-bar-navigation-gap);
}
.desktop-control-bar__trailing {
  justify-self: end;
}
.desktop-control-bar__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-2);
  min-width: 0;
  overflow: visible;
}
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
  background: color-mix(in srgb, var(--sg-color-surface-muted) 80%, transparent);
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
  background: color-mix(in srgb, var(--sg-color-surface-hover) 75%, transparent);
}
.desktop-control-bar__resize-handle:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}
@media (prefers-reduced-motion: reduce) {
  .desktop-control-bar__resize-handle::before { transition: var(--sg-motion-none); }
}
</style>
