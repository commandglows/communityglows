<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="sg-dialog__overlay" />
      <DialogContent
        class="sg-dialog__content"
        :class="`sg-dialog__content--${variant}`"
        v-bind="description ? {} : { 'aria-describedby': undefined }"
        @close-auto-focus="restoreFocus"
      >
        <header class="sg-dialog__header">
          <DialogTitle class="sg-dialog__title">{{ title }}</DialogTitle>
          <DialogClose
            class="sg-dialog__close"
            aria-label="Fermer"
          >
            <i
              class="pi pi-times"
              aria-hidden="true"
            />
          </DialogClose>
        </header>
        <DialogDescription
          v-if="description"
          class="sg-dialog__description"
        >
          {{ description }}
        </DialogDescription>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  variant?: 'default' | 'settings' | 'nudge' | 'sidebar' | 'friends' | 'post' | 'post-wide'
}>(), {
  description: '',
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const lastFocusedElement = ref<HTMLElement | null>(null)
const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

watch(open, (isOpen) => {
  if (isOpen && document.activeElement instanceof HTMLElement) {
    lastFocusedElement.value = document.activeElement
  }
})

function restoreFocus(event: Event) {
  if (!lastFocusedElement.value?.isConnected) return
  event.preventDefault()
  lastFocusedElement.value.focus()
}
</script>

<style scoped>
.sg-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--sg-layer-modal);
  background: var(--sg-color-overlay);
}

.sg-dialog__content {
  position: fixed;
  z-index: calc(var(--sg-layer-modal) + 1);
  top: var(--sg-position-center);
  left: var(--sg-position-center);
  width: min(var(--sg-dialog-width), calc(100vw - var(--sg-space-6)));
  max-height: min(var(--sg-dialog-max-height), calc(100vh - var(--sg-space-6)));
  overflow: auto;
  transform: translate(var(--sg-position-center-transform), var(--sg-position-center-transform));
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-modal);
  color: var(--sg-color-text);
}

.sg-dialog__content--settings { width: min(50vw, var(--sg-dialog-width)); }
.sg-dialog__content--nudge { width: min(var(--sg-nudge-dialog-width), calc(100vw - var(--sg-space-6))); }
.sg-dialog__content--sidebar { width: var(--sg-sidebar-dialog-width); max-width: var(--sg-sidebar-dialog-max-width); }
.sg-dialog__content--friends { width: var(--sg-friends-dialog-width); max-width: var(--sg-sidebar-dialog-max-width); }
.sg-dialog__content--post { width: min(var(--sg-dialog-post-width), calc(100vw - var(--sg-space-6))); }
.sg-dialog__content--post-wide { width: min(var(--sg-dialog-post-wide-width), calc(100vw - var(--sg-space-6))); }

@media (max-width: 960px) { .sg-dialog__content--settings { width: min(75vw, var(--sg-dialog-width)); } }
@media (max-width: 641px) { .sg-dialog__content--settings { width: min(90vw, var(--sg-dialog-width)); } }

.sg-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-3);
  padding: var(--sg-space-5) var(--sg-space-5) var(--sg-space-3);
}

.sg-dialog__title { margin: 0; font-size: var(--sg-font-size-lg); }
.sg-dialog__description { margin: 0; padding: 0 var(--sg-space-5); color: var(--sg-color-text-muted); }
.sg-dialog__close { border: 0; border-radius: var(--sg-radius-sm); background: transparent; color: var(--sg-color-text-muted); cursor: pointer; }
.sg-dialog__close:hover { background: var(--sg-color-surface-hover); color: var(--sg-color-text); }
.sg-dialog__close:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
</style>
