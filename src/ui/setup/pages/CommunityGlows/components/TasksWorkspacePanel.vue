<template>
  <TasksView />
</template>

<script setup lang="ts">
import type { DockviewApi, DockviewPanelApi } from 'dockview-vue'
import type { TasksWorkspacePanelParams } from '@/lib/desktopWorkspaceLayouts'
import TasksView from '../views/TasksView.vue'

defineProps<{
  params: {
    params: TasksWorkspacePanelParams
    api: DockviewPanelApi
    containerApi: DockviewApi
    tabLocation?: unknown
  }
}>()
</script>
