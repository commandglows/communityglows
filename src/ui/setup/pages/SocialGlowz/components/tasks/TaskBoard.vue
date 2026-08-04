<script setup lang="ts">
import type { ContextualTask, ContextualTaskStatus } from '@/services/contextualTasksService'

defineProps<{
  tasksByStatus: Record<ContextualTaskStatus, ContextualTask[]>
}>()

const emit = defineEmits<{
  move: [taskId: string, status: ContextualTaskStatus]
  open: [task: ContextualTask]
  remove: [taskId: string]
}>()

const columns: Array<{ id: ContextualTaskStatus; label: string }> = [
  { id: 'todo', label: 'À faire' },
  { id: 'waiting', label: 'En attente' },
  { id: 'done', label: 'Terminé' },
]

function handleDrop(event: DragEvent, status: ContextualTaskStatus) {
  const taskId = event.dataTransfer?.getData('text/plain')
  if (taskId) emit('move', taskId, status)
}
</script>

<template>
  <div class="task-board">
    <section
      v-for="column in columns"
      :key="column.id"
      class="task-column"
      @dragover.prevent
      @drop="handleDrop($event, column.id)"
    >
      <header class="task-column-header">
        <h3>{{ column.label }}</h3>
        <span class="task-count">{{ tasksByStatus[column.id].length }}</span>
      </header>

      <div class="task-column-content">
        <article
          v-for="task in tasksByStatus[column.id]"
          :key="task.id"
          class="task-card"
          draggable="true"
          @dragstart="(event) => event.dataTransfer?.setData('text/plain', task.id)"
        >
          <div class="task-card-header">
            <span
              class="task-priority"
              :class="`task-priority--${task.priority}`"
            >{{ task.priority }}</span>
            <button
              class="task-icon-button"
              type="button"
              aria-label="Supprimer la tâche"
              @click="emit('remove', task.id)"
            >
              <SgIcon icon="pi pi-trash" />
            </button>
          </div>
          <h4>{{ task.title }}</h4>
          <p v-if="task.note">{{ task.note }}</p>
          <div class="task-card-meta">
            <span>{{ task.host }}</span>
            <span v-if="task.dueDate">{{ task.dueDate }}</span>
          </div>
          <div
            v-if="task.tags.length"
            class="task-tags"
          >
            <span
              v-for="tag in task.tags"
              :key="tag"
            >#{{ tag }}</span>
          </div>
          <button
            class="btn btn-outline btn-sm task-open-button"
            type="button"
            @click="emit('open', task)"
          >
            Ouvrir le contexte
          </button>
        </article>

        <p
          v-if="!tasksByStatus[column.id].length"
          class="task-column-empty"
        >
          Aucune tâche
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.task-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--sg-tasks-form-column-min-width), 1fr));
  gap: var(--sg-crm-section-spacing);
  min-height: 0;
  overflow: auto;
}

.task-column {
  min-width: 0;
  min-height: var(--sg-tasks-column-min-height);
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-crm-card-radius);
  display: flex;
  flex-direction: column;
}

.task-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sg-crm-toolbar-padding);
  background: var(--sg-color-surface-raised);
  border-bottom: 1px solid var(--sg-color-border);
}

.task-column-header h3 {
  margin: 0;
  font-size: var(--sg-crm-heading-size);
}

.task-count,
.task-tags span {
  color: var(--sg-color-action);
  font-size: var(--sg-crm-secondary-copy-size);
}

.task-column-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--sg-sidebar-subsection-spacing);
  padding: var(--sg-crm-toolbar-padding);
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-subsection-spacing);
  padding: var(--sg-crm-toolbar-padding);
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-crm-card-radius);
}

.task-card-header,
.task-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-sidebar-subsection-spacing);
}

.task-card h4,
.task-card p {
  margin: 0;
}

.task-card p,
.task-card-meta {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.task-priority {
  font-size: var(--sg-crm-secondary-copy-size);
  text-transform: capitalize;
}

.task-priority--high { color: var(--red-500); }
.task-priority--normal { color: var(--sg-color-action); }
.task-priority--low { color: var(--sg-color-text-muted); }

.task-icon-button {
  border: 0;
  background: transparent;
  color: var(--sg-color-text-muted);
  cursor: pointer;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-sidebar-subsection-spacing);
}

.task-open-button {
  align-self: flex-start;
}

.task-column-empty {
  color: var(--sg-color-text-muted);
  text-align: center;
}

</style>
