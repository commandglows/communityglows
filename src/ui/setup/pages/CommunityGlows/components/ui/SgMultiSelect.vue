<template>
  <select
    v-bind="$attrs"
    v-model="model"
    multiple
    class="sg-multiselect"
  >
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps<{ options: Array<{ label: string; value: string }> }>()
const model = defineModel<string[]>({ default: () => [] })
</script>

<style scoped>
.sg-multiselect { min-height: var(--sg-field-min-height); padding: var(--sg-field-padding); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-raised); color: var(--sg-color-text); font: inherit; }
.sg-multiselect:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-multiselect:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
</style>
