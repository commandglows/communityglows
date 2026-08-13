<template>
  <div
    class="crm-sidebar-widget"
    :class="{ 'is-compact': isFiltersCompact }"
  >
    <CrmToolbar />
  </div>
</template>

<script setup lang="ts">
import CrmToolbar from './CrmToolbar.vue'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import { useMediaQuery } from '@/composables/useMediaQuery'

const isFiltersCompact = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.filtersCompact}px)`)
</script>

<style scoped>
.crm-sidebar-widget {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-subsection-spacing);
  width: var(--sg-sidebar-fill-size);
  min-width: 0;
}

.crm-sidebar-widget :deep(.crm-toolbar) {
  padding: 0;
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
}

.crm-sidebar-widget :deep(.crm-search) {
  width: var(--sg-sidebar-fill-size);
}

.crm-sidebar-widget :deep(.crm-search-field) {
  width: var(--sg-sidebar-fill-size);
}

.crm-sidebar-widget :deep(.dashboard-filters) {
  width: var(--sg-sidebar-fill-size);
}

.crm-sidebar-widget.is-compact :deep(.crm-toolbar) {
  padding: var(--sg-space-0d5rem);
}
</style>
