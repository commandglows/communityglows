<template>
  <textarea
    v-model="model"
    class="sg-textarea"
    :class="{ 'sg-textarea--auto-resize': autoResize }"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  autoResize?: boolean
}>(), {
  autoResize: false,
})

const model = defineModel<string>({ default: '' })
</script>

<style scoped>
.sg-textarea {
  width: var(--sg-size-100pct);
  min-height: var(--sg-field-min-height);
  padding: var(--sg-field-padding);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
  line-height: var(--sg-line-height-1d5);
  resize: vertical;
}

.sg-textarea--auto-resize { field-sizing: content; resize: none; }
.sg-textarea::placeholder { color: var(--sg-field-placeholder); }
.sg-textarea:hover { border-color: var(--sg-color-border-strong); }
.sg-textarea:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-textarea:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
</style>
