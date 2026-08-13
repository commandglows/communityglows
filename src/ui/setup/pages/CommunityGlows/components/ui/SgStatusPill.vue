<script setup lang="ts">
withDefaults(defineProps<{
  text: string
  tone?: 'default' | 'muted' | 'error'
}>(), {
  tone: 'default',
})
</script>

<template>
  <span :class="`sg-status-pill sg-status-pill--${tone}`">{{ text }}</span>
</template>

<style scoped>
.sg-status-pill {
  flex: 0 0 auto;
  padding: var(--sg-space-0d3rem-0d55rem);
  border-radius: var(--sg-radius-pill);
  background: color-mix(in srgb, var(--sg-color-action) 12%, var(--sg-color-surface-raised) 88%);
  color: var(--sg-color-action);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 700;
  white-space: nowrap;
}

.sg-status-pill--muted {
  background: color-mix(in srgb, var(--sg-color-text-muted) 16%, transparent);
  color: var(--sg-color-text-muted);
}

.sg-status-pill--error {
  background: color-mix(in srgb, var(--sg-color-danger) 8%, transparent);
  color: var(--sg-color-danger-text);
}
</style>
