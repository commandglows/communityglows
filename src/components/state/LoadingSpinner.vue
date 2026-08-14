<template>
  <div
    v-if="loading"
    class="flex items-center justify-center p-4"
    role="status"
    :aria-label="label"
  >
    <ProgressSpinner
      class="loading-spinner__indicator"
      stroke-width="4"
      animation-duration="var(--sg-spinner-duration)"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean
  label?: string
}>(), { label: 'Chargement' })
</script>

<style scoped>
.loading-spinner__indicator {
  width: var(--sg-spinner-size);
  height: var(--sg-spinner-size);
}
</style>
