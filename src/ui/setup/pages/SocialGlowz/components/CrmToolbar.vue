<template>
  <div class="crm-toolbar">
    <div class="crm-search">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText
          placeholder="Rechercher dans le CRM..."
          class="search-input"
        />
      </span>
    </div>
    <DashboardFilters :current-network="crmContext" />
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import DashboardFilters from './DashboardFilters.vue'
import type { MenuItem } from '../types'

const crmContext: MenuItem = {
  id: 0,
  label: 'CRM',
  icon: 'pi pi-briefcase',
  route: '/crm'
}
</script>

<style scoped>
.crm-toolbar {
  display: flex;
  align-items: center;
  gap: var(--sg-crm-toolbar-gap);
  flex-wrap: wrap;
  padding: var(--sg-crm-toolbar-padding);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.crm-search {
  flex: 1 1 var(--sg-crm-search-basis);
  min-width: var(--sg-crm-search-min-width);
}

.crm-search :deep(.p-input-icon-left),
.crm-search :deep(.p-inputtext) {
  width: var(--sg-sidebar-fill-size);
}

.crm-search :deep(.p-inputtext) {
  padding-left: var(--sg-crm-search-input-padding-inline-start);
}

.crm-search :deep(.p-input-icon-left i) {
  left: var(--sg-crm-search-icon-inset);
}

.crm-toolbar :deep(.dashboard-filters) {
  flex: 1 1 var(--sg-crm-filters-basis);
}
</style>
