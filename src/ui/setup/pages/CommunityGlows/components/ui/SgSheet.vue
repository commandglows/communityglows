<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="modelValue"
        class="sg-sheet__overlay"
        @click.self="close"
      >
        <section
          ref="sheetRef"
          class="sg-sheet"
          :style="sheetStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @keydown="onKeydown"
        >
          <div
            class="sg-sheet__drag-zone"
            @pointerdown="onDragStart"
            @pointermove="onDragMove"
            @pointerup="finishDrag"
            @pointercancel="finishDrag"
          >
            <div class="sg-sheet__handle" />
            <header class="sg-sheet__header">
              <div>
                <h2
                  :id="titleId"
                  class="sg-sheet__title"
                >
                  {{ title }}
                </h2>
                <p
                  v-if="description"
                  :id="descriptionId"
                  class="sg-sheet__description"
                >
                  {{ description }}
                </p>
              </div>
              <button
                type="button"
                class="sg-sheet__close"
                aria-label="Fermer"
                @click="close"
              >
                <SgIcon icon="pi pi-times" />
              </button>
            </header>
          </div>
          <div class="sg-sheet__content">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import SgIcon from './SgIcon.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
}>(), { description: '' })

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const sheetRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const isDragging = ref(false)
const pointerId = ref<number | null>(null)
const dragStartY = ref(0)
const dragStartTime = ref(0)
const lastFocused = ref<HTMLElement | null>(null)
const instanceId = `sg-sheet-${Math.random().toString(36).slice(2)}`
const titleId = `${instanceId}-title`
const descriptionId = `${instanceId}-description`

const sheetStyle = computed(() => ({
  '--sheet-drag-offset': `${dragOffset.value}px`,
  transition: isDragging.value ? 'none' : 'var(--sg-mobile-sheet-drag-motion)',
}))

const focusableSelector = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const items = Array.from(sheetRef.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
  if (!items.length) {
    event.preventDefault()
    sheetRef.value?.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function shouldIgnoreDrag(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'button, a, input, textarea, select, label, [role="button"], [data-no-sheet-drag]',
  ))
}

function onDragStart(event: PointerEvent) {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || shouldIgnoreDrag(event.target)) return
  isDragging.value = true
  pointerId.value = event.pointerId
  dragStartY.value = event.clientY
  dragStartTime.value = event.timeStamp || performance.now()
  dragOffset.value = 0
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

function onDragMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== pointerId.value) return
  dragOffset.value = Math.max(0, event.clientY - dragStartY.value)
  if (dragOffset.value > 0) event.preventDefault()
}

function finishDrag(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== pointerId.value) return
  const height = sheetRef.value?.offsetHeight ?? window.innerHeight * 0.5
  const threshold = Math.min(140, Math.max(72, height * 0.2))
  const elapsed = Math.max(1, (event.timeStamp || performance.now()) - dragStartTime.value)
  const dismiss = dragOffset.value >= threshold || dragOffset.value / elapsed >= 0.6
  isDragging.value = false
  pointerId.value = null
  dragOffset.value = 0
  if (dismiss) close()
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    lastFocused.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    const first = sheetRef.value?.querySelector<HTMLElement>(focusableSelector)
    ;(first ?? sheetRef.value)?.focus()
    return
  }
  if (lastFocused.value?.isConnected) lastFocused.value.focus()
})

onBeforeUnmount(() => {
  if (lastFocused.value?.isConnected) lastFocused.value.focus()
})
</script>

<style scoped>
.sg-sheet__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--sg-layer-1000);
  display: flex;
  align-items: flex-end;
  background: var(--sg-color-scrim-45);
}
.sg-sheet {
  display: flex;
  flex-direction: column;
  width: var(--sg-size-100pct);
  max-height: var(--sg-size-85vh);
  overflow: hidden;
  padding-bottom: var(--sg-space-env-safeneg-areaneg-insetneg-bottom-16px);
  border-radius: var(--sg-radius-20px-20px-0-0);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  transform: translateY(var(--sheet-drag-offset, 0px));
}
.sg-sheet:focus { outline: none; }
.sg-sheet__drag-zone { flex-shrink: 0; touch-action: none; user-select: none; }
.sg-sheet__handle {
  width: var(--sg-size-2d5rem);
  height: var(--sg-size-4px);
  margin: var(--sg-space-0d75rem-auto-0);
  border-radius: var(--sg-radius-2px);
  background: var(--sg-color-border);
}
.sg-sheet__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sg-space-3);
  padding: var(--sg-space-0d75rem-1d25rem-0d5rem);
}
.sg-sheet__title { margin: 0; color: var(--sg-color-text); font-size: var(--sg-font-size-1rem); }
.sg-sheet__description { margin: var(--sg-space-1) 0 0; color: var(--sg-color-text-muted); }
.sg-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sg-size-2rem);
  height: var(--sg-size-2rem);
  flex-shrink: 0;
  border: 0;
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  cursor: pointer;
}
.sg-sheet__close:hover { background: var(--sg-color-surface-hover); color: var(--sg-color-text); }
.sg-sheet__close:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-sheet__content {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: var(--sg-size-thin);
  scrollbar-color: var(--sg-scrollbar-thumb) transparent;
  scrollbar-gutter: stable;
}
.sg-sheet__content::-webkit-scrollbar {
  width: var(--sg-scrollbar-width);
  -webkit-appearance: none;
}
.sg-sheet__content::-webkit-scrollbar-track { background: transparent; }
.sg-sheet__content::-webkit-scrollbar-thumb {
  border-radius: var(--sg-scrollbar-radius);
  background: var(--sg-scrollbar-thumb);
}
.sg-sheet__content::-webkit-scrollbar-thumb:hover { background: var(--sg-scrollbar-thumb-hover); }

.sheet-enter-active,
.sheet-leave-active { transition: var(--sg-motion-opacity-0d25s-ease); }
.sheet-enter-active .sg-sheet,
.sheet-leave-active .sg-sheet { transition: var(--sg-motion-transform-0d25s-ease); }
.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.sheet-enter-from .sg-sheet,
.sheet-leave-to .sg-sheet { transform: translateY(calc(100% + var(--sheet-drag-offset, 0px))); }

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .sg-sheet,
  .sheet-leave-active .sg-sheet { transition: var(--sg-motion-none); }
}
</style>
