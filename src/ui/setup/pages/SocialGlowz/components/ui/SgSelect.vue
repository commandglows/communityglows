<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      v-bind="$attrs"
      class="sg-select__trigger"
      :aria-label="ariaLabel || ($attrs['aria-label'] as string)"
      :disabled="disabled"
    >
      <SelectValue :placeholder="placeholder">
        <span
          v-if="selectedOption"
          class="sg-select__value"
        >
          <i
            v-if="selectedOption.icon"
            :class="selectedOption.icon"
            aria-hidden="true"
          />
          {{ selectedOption.label }}
        </span>
      </SelectValue>
      <SelectIcon aria-hidden="true">
        <i class="pi pi-chevron-down" />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="sg-select__content"
        position="popper"
        :side-offset="4"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="sg-select__item"
          >
            <SelectItemText>
              <span class="sg-select__value">
                <i
                  v-if="option.icon"
                  :class="option.icon"
                  aria-hidden="true"
                />
                {{ option.label }}
              </span>
            </SelectItemText>
            <SelectItemIndicator class="sg-select__indicator">
              <i
                class="pi pi-check"
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
import { computed } from 'vue'
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

defineOptions({ inheritAttrs: false })

export interface SgSelectOption {
  value: string
  label: string
  icon?: string
}

const props = withDefaults(defineProps<{
  options: SgSelectOption[]
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  placeholder: '',
  ariaLabel: '',
  disabled: false,
})

const model = defineModel<string>({ default: '' })
const selectedOption = computed(() => props.options.find(option => option.value === model.value))
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

.sg-select__trigger:hover { border-color: var(--sg-color-border-strong); }
.sg-select__trigger:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-select__trigger[data-disabled] { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
.sg-select__value { display: inline-flex; align-items: center; gap: var(--sg-space-2); }
.sg-select__content { z-index: calc(var(--sg-layer-modal) + 2); max-height: var(--sg-select-content-max-height); overflow: hidden; border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-raised); box-shadow: var(--sg-shadow-control); color: var(--sg-color-text); }
.sg-select__item { position: relative; display: flex; align-items: center; padding: var(--sg-select-item-padding); padding-right: var(--sg-space-6); cursor: pointer; user-select: none; }
.sg-select__item[data-highlighted] { outline: none; background: var(--sg-color-surface-hover); }
.sg-select__indicator { position: absolute; right: var(--sg-space-2); }
</style>
