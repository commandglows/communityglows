<template>
  <div class="crm-sidebar-widget">
    <div class="crm-widget-header">
      <h3>CRM</h3>
      <Button
        label="Ouvrir"
        icon="pi pi-external-link"
        text
        size="small"
        @click="openCrm"
      />
    </div>

    <CrmToolbar />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from './ui/SgButton.vue'
import CrmToolbar from './CrmToolbar.vue'

const router = useRouter()

const openCrm = () => {
  router.push('/gmail')
}
</script>

<style scoped>
.crm-sidebar-widget {
  margin-top: var(--sg-sidebar-section-spacing);
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-subsection-spacing);
}

.crm-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-sidebar-control-gap);
  padding: var(--sg-sidebar-section-padding-block) var(--sg-sidebar-section-padding-inline);
  border-radius: var(--sg-radius-sm);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.crm-widget-header h3 {
  margin: 0;
  font-size: var(--sg-sidebar-section-title-size);
  color: var(--text-color-secondary);
}

.crm-sidebar-widget :deep(.crm-toolbar) {
  padding: 0;
  border: 1px solid var(--surface-border);
  border-radius: var(--sg-radius-sm);
  background: var(--surface-ground);
}

.crm-sidebar-widget :deep(.crm-search) {
  width: var(--sg-sidebar-fill-size);
}

.crm-sidebar-widget :deep(.crm-search-field) {
  width: var(--sg-size-100pct);
}
</style>
