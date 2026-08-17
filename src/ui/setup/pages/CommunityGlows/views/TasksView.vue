<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import { useRoute } from 'vue-router'
import { useContextualTasksStore, type ContextualTask, type ContextualTaskInput, type ContextualTaskStatus } from '@/stores/contextualTasks'
import { sanitizeContextualUrl } from '@/services/contextualTasksService'
import { useProfilesStore } from '@/stores/profiles'
import { useWebviewStore } from '@/stores/webviewState'
import TaskForm from '../components/tasks/TaskForm.vue'
import TaskBoard from '../components/tasks/TaskBoard.vue'
import SgButton from '../components/ui/SgButton.vue'
import SectionEyebrow from '../components/ui/SectionEyebrow.vue'

const route = useRoute()
const { t } = useI18n()
const tasksStore = useContextualTasksStore()
const profilesStore = useProfilesStore()
const webviewStore = useWebviewStore()
const showForm = ref(false)
const notice = ref<string | null>(null)
const isTasksCompact = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.tasksCompact}px)`)

const initialUrl = computed(() => typeof route.query.url === 'string' ? route.query.url : '')
const tasksByStatus = computed<Record<ContextualTaskStatus, ContextualTask[]>>(() => ({
  todo: tasksStore.getByStatus('todo'),
  waiting: tasksStore.getByStatus('waiting'),
  done: tasksStore.getByStatus('done'),
}))

function createTask(input: ContextualTaskInput) {
  const result = tasksStore.create({ ...input, profileId: profilesStore.activeProfileId ?? undefined })
  if (!result) {
    notice.value = tasksStore.error === 'https_required'
      ? t('tasks.notices.https_required')
      : t('tasks.notices.create_failed')
    return
  }
  notice.value = t('tasks.notices.created')
  showForm.value = false
}

function moveTask(taskId: string, status: ContextualTaskStatus) {
  tasksStore.move(taskId, status)
}

function removeTask(taskId: string) {
  tasksStore.remove(taskId)
  notice.value = t('tasks.notices.deleted')
}

function openTask(task: ContextualTask) {
  if (!task.url) return
  if (task.networkId && webviewStore.usesWebview(task.networkId)) {
    webviewStore.selectNetwork(task.networkId, task.url)
    return
  }
  window.open(task.url, '_blank', 'noopener,noreferrer')
}

function validateInitialUrl() {
  if (!initialUrl.value) return
  const result = sanitizeContextualUrl(initialUrl.value)
  if (result.ok) {
    showForm.value = true
    return
  }
  notice.value = t('tasks.notices.shared_link_invalid')
}

onMounted(() => {
  tasksStore.initialize()
  validateInitialUrl()
})
</script>

<template>
  <main
    class="tasks-view"
    :class="{ 'is-compact': isTasksCompact }"
  >
    <header class="tasks-header">
      <div>
        <SectionEyebrow>{{ $t('tasks.eyebrow') }}</SectionEyebrow>
        <h1>{{ $t('tasks.title') }}</h1>
        <p class="tasks-description">{{ $t('tasks.description') }}</p>
      </div>
      <SgButton
        :label="$t('tasks.new_task')"
        icon="pi pi-plus"
        type="button"
        @click="showForm = !showForm"
      />
    </header>

    <p
      v-if="notice"
      class="tasks-notice"
      role="status"
    >
      {{ notice }}
    </p>

    <section
      v-if="showForm"
      class="tasks-form-panel"
    >
      <TaskForm
        :initial-url="initialUrl"
        @submit="createTask"
        @cancel="showForm = false"
      />
    </section>

    <TaskBoard
      :tasks-by-status="tasksByStatus"
      :stage-labels="tasksStore.stageLabels"
      @move="moveTask"
      @open="openTask"
      @remove="removeTask"
      @rename-stage="tasksStore.renameStage"
    />
  </main>
</template>

<style scoped>
.tasks-view {
  display: flex;
  flex-direction: column;
  gap: var(--sg-crm-section-spacing);
  height: var(--sg-sidebar-fill-size);
  padding: var(--sg-crm-content-padding);
  overflow: hidden;
}

.tasks-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sg-crm-section-spacing);
}

.tasks-header h1,
.tasks-description {
  margin: 0;
}

.tasks-header h1 {
  font-size: var(--sg-tasks-title-size);
}

.tasks-description {
  max-width: var(--sg-tasks-description-max-width);
  color: var(--sg-color-text-muted);
}

.tasks-notice {
  margin: 0;
  padding: var(--sg-crm-toolbar-padding);
  color: var(--sg-color-text-muted);
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-crm-card-radius);
}

.tasks-form-panel {
  padding: var(--sg-crm-toolbar-padding);
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-crm-card-radius);
}

.tasks-view.is-compact {
  height: auto;
  min-height: var(--sg-app-viewport-height);
  overflow: auto;
}

.tasks-view.is-compact .tasks-header {
  flex-direction: column;
}
</style>
