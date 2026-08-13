<template>
  <Sidebar
    v-model:visible="visible"
    :base-z-index="1000"
    class="app-sidebar"
  >
    <div class="sidebar-content">
      <slot></slot>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from 'primevue/sidebar'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>

<style scoped>
.app-sidebar {
  width: var(--sg-size-300px);
  height: var(--sg-size-100vh);
  padding: 0;
}

.sidebar-content {
  height: var(--sg-size-full);
  padding: var(--sg-space-1rem);
}

:deep(.p-sidebar) {
  background: var(--sg-color-surface-raised);
  border-right: 1px solid var(--sg-color-border);
}
</style> 
