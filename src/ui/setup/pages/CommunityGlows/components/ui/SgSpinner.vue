<template>
  <span
    class="sg-spinner"
    role="status"
    :aria-label="label"
  >
    <span
      class="sg-spinner__ring"
      aria-hidden="true"
    />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Chargement' })
</script>

<style scoped>
.sg-spinner { display: inline-grid; width: var(--sg-spinner-size); height: var(--sg-spinner-size); place-items: center; }
.sg-spinner__ring { width: var(--sg-size-full); height: var(--sg-size-full); border: var(--sg-spinner-border) solid var(--sg-color-border); border-block-start-color: var(--sg-color-action); border-radius: var(--sg-radius-pill); animation: sg-spin var(--sg-spinner-duration) linear infinite; }
@keyframes sg-spin { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .sg-spinner__ring { animation: none; } }
</style>
