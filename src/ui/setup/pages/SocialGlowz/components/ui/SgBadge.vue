<template>
  <span
    class="sg-badge"
    :class="`sg-badge--${severity}`"
  ><slot />{{ value }}</span>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ value?: string | number; severity?: 'success' | 'info' | 'warning' | 'danger' | 'secondary' }>(), { value: '', severity: 'secondary' })
</script>
<style scoped>
.sg-badge { display: inline-flex; min-width: var(--sg-badge-size); min-height: var(--sg-badge-size); align-items: center; justify-content: center; padding: var(--sg-badge-padding); border: var(--sg-badge-border) solid var(--sg-color-surface-raised); border-radius: var(--sg-radius-pill); background: var(--sg-color-action); color: var(--sg-color-text-on-action); font-size: var(--sg-badge-font-size); }
.sg-badge--success { background: var(--sg-color-success); }.sg-badge--info { background: var(--sg-color-info); }.sg-badge--warning { background: var(--sg-color-warning); }.sg-badge--danger { background: var(--sg-color-danger); }.sg-badge--secondary { background: var(--sg-color-text-muted); }
</style>
