<template>
  <input
    v-model="model"
    class="sg-input"
  />
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>

<style scoped>
.sg-input {
  min-height: var(--sg-field-min-height);
  padding: var(--sg-field-padding);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
}

.sg-input::placeholder { color: var(--sg-field-placeholder); }
.sg-input:hover { border-color: var(--sg-color-border-strong); }
.sg-input:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-input:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
</style>
