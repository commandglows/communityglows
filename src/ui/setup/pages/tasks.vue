<script setup lang="ts">
import { computed, ref, onMounted, onScopeDispose } from "vue"
import { useThemeStore } from "@/stores/theme"
import { useExtensionState } from "@/composables/useExtensionState"
import {
  saveExtensionTask,
  removeExtensionTask,
} from "@/platform/extensionState"
import { launchExternalUrl } from "@/platform/extensionNetworkLauncher"
import type {
  ContextualTask,
  ContextualTaskInput,
} from "@/services/contextualTasksService"
import ExtensionNativeGuide from './CommunityGlows/components/ExtensionNativeGuide.vue'
import TaskForm from "./CommunityGlows/components/tasks/TaskForm.vue"
const { state, loading, error: storageError } = useExtensionState()
const editing = ref<ContextualTask>()
const showForm = ref(false)
const busy = ref(false)
const error = ref(false)
const saved = ref(false)
const themeStore = useThemeStore()
function syncTheme(event?: StorageEvent) {
  if (event && event.key !== 'theme' && event.key !== 'grayscale') return
  try { themeStore.initTheme() } catch { error.value = true }
}
onMounted(() => { syncTheme(); window.addEventListener('storage', syncTheme) })
onScopeDispose(() => window.removeEventListener('storage', syncTheme))
const tasks = computed(() =>
  [...state.value.tasks].sort((a, b) => a.order - b.order),
)
async function save(input: ContextualTaskInput) {
  busy.value = true
  error.value = false
  saved.value = false
  try {
    await saveExtensionTask(input, editing.value?.id)
    showForm.value = false
    editing.value = undefined
    saved.value = true
  } catch {
    error.value = true
  } finally {
    busy.value = false
  }
}
async function remove(id: string) {
  busy.value = true
  error.value = false
  saved.value = false
  try {
    await removeExtensionTask(id)
    saved.value = true
  } catch {
    error.value = true
  } finally {
    busy.value = false
  }
}
async function open(url: string) {
  const result = await launchExternalUrl(url)
  if (!result.ok) error.value = true
}
function newTask() { editing.value = undefined; showForm.value = true; saved.value = false }
function edit(task: ContextualTask) {
  editing.value = task
  showForm.value = true
  saved.value = false
}
</script>
<template>
  <section class="ext-parity-root">
    <header class="ext-parity-header">
      <h1>{{ $t("extension.repair.view_tasks") }}</h1>
      <p>{{ $t("extension.repair.tasks_local") }}</p>
    </header>
    <RouterLink to="/setup/CommunityGlows">
      {{ $t("extension.actions.open_dashboard") }}
    </RouterLink>
    <p
      v-if="error || storageError"
      role="alert"
    >
      {{ $t("extension.repair.storage_error") }}
    </p>
    <p
      v-if="saved"
      role="status"
    >
      {{ $t("extension.repair.saved") }}
    </p>
    <button
      v-if="!showForm"
      type="button"
      class="ext-btn ext-btn--primary"
      :disabled="loading || storageError"
      @click="newTask"
    >
      {{ $t("extension.repair.new_task") }}
    </button>
    <TaskForm
      v-if="showForm"
      :key="editing?.id ?? 'new'"
      :initial-task="editing"
      :busy="busy"
      :submit-label="$t('extension.repair.save')"
      @submit="save"
      @cancel="showForm = false"
    />
    <p v-if="!loading && !tasks.length">
      {{ $t("extension.repair.no_tasks") }}
    </p>
    <ul class="ext-link-list">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="ext-task-card"
      >
        <h2>{{ task.title }}</h2>
        <p>
          {{ $t("extension.repair.status_" + task.status) }} ·
          {{ $t("tasks.priority." + task.priority) }}
        </p>
        <p v-if="task.note">{{ task.note }}</p>
        <p v-if="task.dueDate">{{ task.dueDate }}</p>
        <div class="ext-actions">
          <button
            v-if="task.url"
            type="button"
            class="ext-btn ext-btn--outline"
            @click="open(task.url)"
          >
            {{ $t("common.open") }}
          </button>
          <button
            type="button"
            class="ext-btn ext-btn--outline"
            :disabled="busy || storageError"
            @click="edit(task)"
          >
            {{ $t("extension.repair.edit") }}
          </button>
          <button
            type="button"
            class="ext-btn ext-btn--outline"
            :disabled="busy || storageError"
            @click="remove(task.id)"
          >
            {{ $t("extension.repair.delete") }}
          </button>
        </div>
      </li>
    </ul>
    <ExtensionNativeGuide />
  </section>
</template>
<style scoped>
.ext-task-card {
  padding: var(--sg-space-1rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  overflow-wrap: anywhere;
}
.ext-task-card h2 {
  font-size: var(--sg-font-size-1d25rem);
}
</style>
