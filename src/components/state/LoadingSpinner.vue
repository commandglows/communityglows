<template>
  <div
    v-if="loading"
    class="flex items-center justify-center p-4"
    role="status"
    aria-label="Loading"
  >
    <ProgressSpinner
      class="loading-spinner__indicator"
      stroke-width="4"
      animation-duration=".8s"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()
</script>

<style scoped>
.loading-spinner__indicator {
  width: var(--sg-spinner-size);
  height: var(--sg-spinner-size);
}
</style>
