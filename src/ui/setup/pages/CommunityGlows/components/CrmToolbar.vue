<template>
  <div class="crm-toolbar">
    <div class="crm-search">
      <label class="crm-search-field">
        <SgIcon icon="pi pi-search" />
        <input
          type="search"
          aria-label="Rechercher dans le CRM"
          placeholder="Rechercher dans le CRM..."
          class="search-input"
        />
      </label>
    </div>
    <DashboardFilters :current-network="crmContext" />
  </div>
</template>

<script setup lang="ts">
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
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
}

.crm-search {
  flex: 0 1 clamp(12rem, 45%, var(--sg-crm-search-basis));
  min-width: var(--sg-crm-search-min-width);
  max-width: var(--sg-size-100pct);
}

.crm-search-field {
  position: relative;
  display: block;
  width: var(--sg-sidebar-fill-size);
}

.search-input {
  box-sizing: border-box;
  width: var(--sg-sidebar-fill-size);
  min-width: 0;
  padding:
    var(--sg-settings-control-padding-block)
    var(--sg-settings-control-padding-inline)
    var(--sg-settings-control-padding-block)
    var(--sg-crm-search-input-padding-inline-start);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-settings-control-radius);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
}

.search-input:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.crm-search-field i {
  position: absolute;
  top: 50%;
  left: var(--sg-crm-search-icon-inset);
  transform: translateY(-50%);
  color: var(--sg-color-text-muted);
  pointer-events: none;
}

.crm-toolbar :deep(.dashboard-filters) {
  flex: 1 1 min(100%, var(--sg-crm-filters-basis));
  min-width: min(20rem, 100%);
  max-width: var(--sg-size-100pct);
}

@media (max-width: 1180px) {
  .crm-toolbar {
    padding: var(--sg-space-0d75rem);
    gap: var(--sg-space-0d75rem);
  }

  .crm-search {
    flex: 1 1 100%;
  }

  .crm-toolbar :deep(.dashboard-filters) {
    flex-basis: 100%;
  }
}
</style>
