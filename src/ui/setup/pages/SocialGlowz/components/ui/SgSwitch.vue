<template>
  <SwitchRoot
    :checked="modelValue"
    :disabled="disabled"
    class="sg-switch"
    :aria-label="label"
    @update:checked="emit('update:modelValue', $event)"
  >
    <SwitchThumb class="sg-switch__thumb" />
  </SwitchRoot>
</template>

<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

withDefaults(defineProps<{
  modelValue: boolean
  label: string
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.sg-switch { width: var(--sg-switch-width); height: var(--sg-switch-height); padding: var(--sg-switch-padding); border: 1px solid var(--sg-color-border-strong); border-radius: var(--sg-radius-pill); background: var(--sg-color-surface-muted); cursor: pointer; transition: var(--sg-motion-colors); }
.sg-switch[data-state='checked'] { border-color: var(--sg-color-action); background: var(--sg-color-action); }
.sg-switch:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
.sg-switch:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-switch__thumb { display: block; width: var(--sg-switch-thumb-size); height: var(--sg-switch-thumb-size); border-radius: var(--sg-radius-pill); background: var(--sg-color-text-on-action); box-shadow: var(--sg-shadow-control); transform: translateX(0); transition: var(--sg-motion-transform); }
.sg-switch[data-state='checked'] .sg-switch__thumb { transform: translateX(var(--sg-switch-thumb-translate)); }
</style>
