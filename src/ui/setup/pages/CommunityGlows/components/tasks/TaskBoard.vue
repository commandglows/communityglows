<script setup lang="ts">
import { navigateHierarchy } from '../../utils/keyboardHierarchy'
import type { ContextualTask, ContextualTaskStatus } from '@/services/contextualTasksService'
import SgButton from '../ui/SgButton.vue'
import type { KanbanContact } from '@/stores/kanbanContacts'

defineProps<{
  tasksByStatus: Record<ContextualTaskStatus, ContextualTask[]>
  stageLabels: Record<ContextualTaskStatus, string>
  contacts?: KanbanContact[]
}>()

const emit = defineEmits<{
  move: [taskId: string, status: ContextualTaskStatus]
  open: [task: ContextualTask]
  remove: [taskId: string]
  edit: [task: ContextualTask]
  'rename-stage': [status: ContextualTaskStatus, label: string]
}>()

const columns: Array<{ id: ContextualTaskStatus; labelKey: string }> = [
  { id: 'todo', labelKey: 'kanban.todo' },
  { id: 'waiting', labelKey: 'kanban.waiting' },
  { id: 'done', labelKey: 'kanban.done' },
]

function handleDrop(event: DragEvent, status: ContextualTaskStatus) {
  const taskId = event.dataTransfer?.getData('text/plain')
  if (taskId) emit('move', taskId, status)
}
</script>

<template>
  <div class="task-board" data-keyboard-node="board" tabindex="0" role="group" aria-label="Kanban" @keydown="navigateHierarchy">
    <section
      v-for="column in columns"
      :key="column.id"
      class="task-column"
      :data-keyboard-node="`column:${column.id}`"
      :aria-label="stageLabels[column.id]"
      tabindex="-1"
      role="group"
      @dragover.prevent
      @drop="handleDrop($event, column.id)"
    >
      <header class="task-column-header">
        <input
          :value="stageLabels[column.id]"
          :aria-label="$t('tasks.board.stage_name', { stage: $t(column.labelKey) })"
          @change="emit('rename-stage', column.id, ($event.target as HTMLInputElement).value)"
        >
        <span class="task-count">{{ tasksByStatus[column.id].length }}</span>
      </header>

      <div class="task-column-content">
        <article
          v-for="task in tasksByStatus[column.id]"
          :key="task.id"
          class="task-card"
          :data-keyboard-node="`card:${task.id}`"
          :aria-label="task.title"
          tabindex="-1"
          role="group"
          draggable="true"
          @dragstart="(event) => event.dataTransfer?.setData('text/plain', task.id)"
        >
          <div class="task-card-header">
            <span
              class="task-priority"
              :class="`task-priority--${task.priority}`"
            >{{ $t(`tasks.priority.${task.priority}`) }}</span>
            <button
              class="task-icon-button"
              type="button"
              :aria-label="$t('tasks.board.delete')"
              @click="emit('remove', task.id)"
            >
              <SgIcon icon="pi pi-trash" />
            </button>
          </div>
          <h4>{{ task.title }}</h4>
          <div v-if="task.contactIds?.length" class="task-tags">
            <span v-for="contact in (contacts ?? []).filter(c => task.contactIds?.includes(c.id))" :key="contact.id">{{ contact.name }}</span>
          </div>
          <SgButton :label="$t('crm.edit_card')" text @click="emit('edit', task)" />
          <p v-if="task.note">{{ task.note }}</p>
          <div class="task-card-meta">
            <span v-if="task.host">{{ task.host }}</span>
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
          <p
            v-if="task.people?.length"
            class="task-people"
          >
            {{ task.people.map((person) => person.name).join(', ') }}
          </p>
          <p
            v-if="task.links?.length"
            class="task-links"
          >
            {{ $t('tasks.board.links_count', { count: task.links.length }) }}
          </p>
          <SgButton
            v-if="task.url"
            :label="$t('tasks.board.open_context')"
            outlined
            size="small"
            class="task-open-button"
            type="button"
            @click="emit('open', task)"
          />
        </article>

        <p
          v-if="!tasksByStatus[column.id].length"
          class="task-column-empty"
        >
          {{ $t('tasks.board.empty') }}
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
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-crm-card-radius);
  display: flex;
  flex-direction: column;
}

.task-column-header {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  justify-content: space-between;
  padding: var(--sg-crm-toolbar-padding);
  background: var(--sg-color-surface-raised);
  border-bottom: 1px solid var(--sg-color-border);
}

.task-column-header h3 {
  margin: 0;
  font-size: var(--sg-crm-heading-size);
}

.task-column-header input {
  flex: 1;
  width: 0;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--sg-color-text);
  font: inherit;
  font-weight: 600;
}

.task-column-header input:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.task-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  min-width: var(--sg-badge-size);
  min-height: var(--sg-badge-size);
  padding: var(--sg-badge-padding);
  border-radius: var(--sg-sidebar-kanban-count-radius);
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-action);
  font-size: var(--sg-badge-font-size);
  font-weight: var(--sg-font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: normal;
}

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
  box-shadow: var(--sg-shadow-control);
  transition: var(--sg-motion-colors);
}

.task-card:hover {
  border-color: var(--sg-color-border-strong);
  background: var(--sg-color-surface-hover);
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

.task-people,
.task-links {
  margin: 0;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.task-priority {
  font-size: var(--sg-crm-secondary-copy-size);
  text-transform: capitalize;
}

.task-priority--high { color: var(--sg-color-danger); }
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
