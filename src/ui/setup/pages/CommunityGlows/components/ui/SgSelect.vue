<template>
  <SelectRoot
    v-model="model"
    v-model:open="open"
  >
    <SelectTrigger
      v-bind="safeAttrs"
      :class="triggerClasses"
      :aria-label="ariaLabel || (attrs['aria-label'] as string)"
      :disabled="disabled"
      @mouseenter="openFromHover"
      @mouseleave="scheduleHoverClose"
    >
      <SelectValue :placeholder="placeholder">
        <span
          v-if="selectedOption"
          class="sg-select__value"
        >
          <SgIcon
            v-if="selectedOption?.icon"
            :icon="selectedOption.icon"
            aria-hidden="true"
          />
          {{ selectedOption.label }}
        </span>
      </SelectValue>
      <SelectIcon aria-hidden="true">
        <SgIcon icon="pi pi-chevron-down" />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="sg-select__content"
        position="popper"
        :side-offset="4"
        @mouseenter="cancelHoverClose"
        @mouseleave="scheduleHoverClose"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="sg-select__item"
          >
            <SelectItemText class="sg-select__item-text">
              <span class="sg-select__value">
                <SgIcon
                  v-if="option.icon"
                  :icon="option.icon"
                  aria-hidden="true"
                />
                {{ option.label }}
              </span>
            </SelectItemText>
            <SelectItemIndicator class="sg-select__indicator">
              <SgIcon
                icon="pi pi-check"
                aria-hidden="true"
              />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, useAttrs } from 'vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import SgIcon from './SgIcon.vue'
import { componentClasses, forwardedComponentAttrs } from './componentAttrs'

defineOptions({ inheritAttrs: false })

export interface SgSelectOption {
  value: string
  label: string
  icon?: string
}

const props = withDefaults(
  defineProps<{
    options: SgSelectOption[]
    placeholder?: string
    ariaLabel?: string
    disabled?: boolean
    openOnHover?: boolean
  }>(),
  {
    placeholder: '',
    ariaLabel: '',
    disabled: false,
    openOnHover: false,
  },
)

const model = defineModel<string>({ default: '' })
const open = ref(false)
const attrs = useAttrs()
const safeAttrs = computed(() => forwardedComponentAttrs(attrs))
const triggerClasses = computed(() =>
  componentClasses('sg-select__trigger', attrs),
)
const selectedOption = computed(() =>
  props.options.find((option) => option.value === model.value),
)

const HOVER_CLOSE_DELAY_MS = 120
let hoverCloseTimer: number | undefined

function cancelHoverClose() {
  window.clearTimeout(hoverCloseTimer)
  hoverCloseTimer = undefined
}

function openFromHover() {
  if (!props.openOnHover || props.disabled) return
  cancelHoverClose()
  open.value = true
}

function scheduleHoverClose() {
  if (!props.openOnHover) return
  cancelHoverClose()
  hoverCloseTimer = window.setTimeout(() => {
    open.value = false
    hoverCloseTimer = undefined
  }, HOVER_CLOSE_DELAY_MS)
}

onUnmounted(cancelHoverClose)
</script>

<style scoped>
.sg-select__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-2);
  min-height: var(--sg-field-min-height);
  padding: var(--sg-field-padding);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
  cursor: pointer;
}

.sg-select__trigger:hover {
  border-color: var(--sg-color-border-strong);
}
.sg-select__trigger:focus-visible {
  position: relative;
  z-index: 1;
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}
.sg-select__trigger[data-disabled] {
  cursor: not-allowed;
  opacity: var(--sg-opacity-disabled);
}
.sg-select__value {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--sg-space-2);
}
:global(.sg-select__content) {
  box-sizing: border-box;
  width: var(--reka-select-trigger-width);
  min-width: var(--reka-select-trigger-width);
  max-width: var(--reka-select-trigger-width);
  z-index: calc(var(--sg-layer-modal) + 2);
  max-height: var(--sg-select-content-max-height);
  overflow: hidden;
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-control);
  color: var(--sg-color-text);
}
:global(.sg-select__item) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--sg-select-item-padding);
  padding-right: var(--sg-space-6);
  cursor: pointer;
  user-select: none;
}
:global(.sg-select__item[data-highlighted]) {
  outline: none;
  background: var(--sg-color-surface-hover);
}
:global(.sg-select__item-text) {
  min-width: 0;
  white-space: normal;
}
:global(.sg-select__indicator) {
  position: absolute;
  right: var(--sg-space-2);
}
</style>
