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
  border-radius: var(--border-radius);
}

.crm-search {
  flex: 1 1 var(--sg-crm-search-basis);
  min-width: var(--sg-crm-search-min-width);
}

.crm-search-field { position: relative; display: block; width: var(--sg-sidebar-fill-size); }
.search-input { box-sizing: border-box; width: var(--sg-sidebar-fill-size); padding: var(--sg-settings-control-padding-block) var(--sg-settings-control-padding-inline) var(--sg-settings-control-padding-block) var(--sg-crm-search-input-padding-inline-start); border: 1px solid var(--sg-color-border); border-radius: var(--sg-settings-control-radius); background: var(--sg-color-surface-raised); color: var(--sg-color-text); font: inherit; }
.search-input:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.crm-search-field i { position: absolute; top: 50%; left: var(--sg-crm-search-icon-inset); transform: translateY(-50%); color: var(--sg-color-text-muted); pointer-events: none; }

.crm-toolbar :deep(.dashboard-filters) {
  flex: 1 1 var(--sg-crm-filters-basis);
}
</style>
