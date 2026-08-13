<script setup lang="ts">
import Button from 'primevue/button'

const props = withDefaults(
  defineProps<{
    sidebarVisible?: boolean
    rightSidebarVisible?: boolean
  }>(),
  {
    sidebarVisible: false,
    rightSidebarVisible: false,
  },
)

const emit = defineEmits<{
  (e: 'update:sidebarVisible', value: boolean): void
  (e: 'update:rightSidebarVisible', value: boolean): void
}>()

const toggleSidebar = () => {
  emit('update:sidebarVisible', !props.sidebarVisible)
}

const toggleRightSidebar = () => {
  emit('update:rightSidebarVisible', !props.rightSidebarVisible)
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <Button
        icon="pi pi-bars"
        text
        rounded
        aria-label="Toggle sidebar"
        @click="toggleSidebar"
      />
      <h1 class="app-title">CommunityGlows</h1>
    </div>

    <div class="header-right">
      <Button
        icon="pi pi-cog"
        text
        rounded
        aria-label="Open settings"
        @click="toggleRightSidebar"
      />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sg-space-0d5rem) var(--sg-space-1rem);
  background: var(--sg-color-surface-raised);
  border-bottom: 1px solid var(--sg-color-border);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1rem);
}

.app-title {
  margin: 0;
  font-size: var(--sg-font-size-1d25rem);
  font-weight: 600;
  color: var(--sg-color-text);
}
</style>
