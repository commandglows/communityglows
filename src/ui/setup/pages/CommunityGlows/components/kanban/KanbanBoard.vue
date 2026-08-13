<template>
  <div class="kanban-board">
    <div
      v-if="loading"
      class="loading-state"
    >
      <SgIcon
        icon="pi pi-spin pi-spinner"
        style="font-size: var(--sg-font-size-2rem)"
      />
      <p>Chargement du Kanban...</p>
    </div>

    <div
      v-else
      class="columns-container"
    >
      <div 
        v-for="column in store.columns" 
        :key="column.id"
        class="kanban-column"
        @dragover.prevent
        @drop="handleDrop($event, column.id)"
      >
        <div class="column-header">
          <h3>{{ $t(column.title) }}</h3>
          <span class="item-count">{{ getColumnItems(column.id).length }}</span>
        </div>

        <div class="column-content">
          <TransitionGroup
            name="list"
            tag="div"
          >
            <div
              v-for="item in getColumnItems(column.id)"
              :key="item.id"
              class="kanban-item"
              :class="[
                `type-${item.type}`,
                { 'is-dragging': isDragging(item) }
              ]"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
              @dragend="handleDragEnd"
            >
              <div class="item-header">
                <SgIcon :icon="getItemIcon(item.type)" />
                <span class="item-title">{{ item.title }}</span>
                <Button
                  icon="pi pi-times"
                  :aria-label="`Supprimer ${item.title}`"
                  text
                  rounded
                  severity="danger"
                  @click="deleteItem(item.id)"
                />
              </div>

              <p class="item-description">{{ item.description }}</p>

              <div class="item-footer">
                <span class="item-date">{{ formatDate(item.date) }}</span>
                <div class="item-labels">
                  <span 
                    v-for="label in item.labels" 
                    :key="label"
                    class="label"
                  >
                    {{ label }}
                  </span>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useKanbanStore } from '@/stores/kanban'
import { formatDate } from '../../utils/dateFormatter'
import Button from '../ui/SgButton.vue'
import type { KanbanItem, KanbanColumnId } from '@/services/kanbanService'

const store = useKanbanStore()

const loading = computed(() => store.loading)

const getColumnItems = (columnId: KanbanColumnId) => {
  return store.getColumnItems(columnId)
}

const isDragging = (item: KanbanItem) => {
  return store.draggedItem?.id === item.id
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'email':
      return 'pi pi-envelope'
    case 'task':
      return 'pi pi-check-square'
    case 'note':
      return 'pi pi-file'
    default:
      return 'pi pi-file'
  }
}

const handleDragStart = (event: DragEvent, item: KanbanItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
  }
  store.startDragging(item)
}

const handleDragEnd = () => {
  store.endDragging()
}

const handleDrop = (event: DragEvent, columnId: KanbanColumnId) => {
  const itemId = event.dataTransfer?.getData('text/plain')
  if (itemId) {
    store.moveItem(itemId, columnId)
  }
}

const deleteItem = (itemId: string) => {
  store.deleteItem(itemId)
}

onMounted(() => {
  store.initialize()
})
</script>

<style scoped>
.kanban-board {
  height: var(--sg-size-100pct);
  padding: var(--sg-space-1rem);
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: var(--sg-size-100pct);
  color: var(--sg-color-text-muted);
}

.columns-container {
  display: flex;
  gap: var(--sg-space-1rem);
  height: var(--sg-size-100pct);
  overflow-x: auto;
}

.kanban-column {
  flex: 1;
  min-width: var(--sg-size-300px);
  background: var(--sg-color-surface-muted);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-8px);
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: var(--sg-space-1rem);
  background: var(--sg-color-surface-raised);
  border-bottom: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-8px-8px-0-0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-header h3 {
  margin: 0;
  font-size: var(--sg-font-size-1d1rem);
}

.item-count {
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  padding: var(--sg-space-0d2rem-0d6rem);
  border-radius: var(--sg-radius-1rem);
  font-size: var(--sg-font-size-0d9rem);
}

.column-content {
  flex: 1;
  padding: var(--sg-space-1rem);
  overflow-y: auto;
}

.kanban-item {
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-6px);
  padding: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-0d5rem);
  cursor: move;
  box-shadow: var(--sg-shadow-control);
  transition: var(--sg-motion-all-0d3s-ease);
}

.kanban-item:hover {
  border-color: var(--sg-color-border-strong);
  background: var(--sg-color-surface-hover);
  box-shadow: var(--sg-shadow-modal);
}

.kanban-item.is-dragging {
  opacity: 0.5;
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  margin-bottom: var(--sg-space-0d5rem);
}

.item-title {
  flex: 1;
  font-weight: bold;
}

.item-description {
  margin: var(--sg-space-0d5rem-0);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--sg-space-0d5rem);
  font-size: var(--sg-font-size-0d8rem);
}

.item-date {
  color: var(--sg-color-text-muted);
}

.item-labels {
  display: flex;
  gap: var(--sg-space-0d25rem);
}

.label {
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  padding: var(--sg-space-0d2rem-0d4rem);
  border-radius: var(--sg-radius-4px);
  font-size: var(--sg-font-size-0d8rem);
}

.type-email {
  border-left: var(--sg-size-4px) solid var(--sg-color-info);
}

.type-task {
  border-left: var(--sg-size-4px) solid var(--sg-color-success);
}

.type-note {
  border-left: var(--sg-size-4px) solid var(--sg-color-warning);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: var(--sg-motion-all-0d5s-ease);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style> 
