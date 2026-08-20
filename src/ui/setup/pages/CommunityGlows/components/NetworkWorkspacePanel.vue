<template>
  <NetworkWebviewHost
    :network-id="params.networkId"
    :url="params.url"
    :suspended="webviewSuspended"
  />
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import type { DockviewApi, DockviewPanelApi } from 'dockview-vue'
import type { NetworkWorkspacePanelParams } from '@/lib/desktopWorkspaceLayouts'
import NetworkWebviewHost from './NetworkWebviewHost.vue'
import { workspaceWebviewsSuspendedKey } from './workspaceContext'

const props = defineProps<{
  params: NetworkWorkspacePanelParams
  api: DockviewPanelApi
  containerApi: DockviewApi
}>()

const workspaceSuspended = inject(workspaceWebviewsSuspendedKey, ref(false))
const panelVisible = ref(props.api.isVisible)
const webviewSuspended = computed(
  () => workspaceSuspended.value || !panelVisible.value,
)
const disposables: Array<{ dispose: () => void }> = []

onMounted(() => {
  panelVisible.value = props.api.isVisible
  disposables.push(
    props.api.onDidVisibilityChange((event) => {
      panelVisible.value = event.isVisible
    }),
  )
})

onUnmounted(() => {
  disposables.splice(0).forEach((disposable) => disposable.dispose())
})
</script>
