<template>
  <div class="kanban-sidebar">
    <div class="kanban-header">
      <h3>Kanban</h3>
      <span class="item-count">{{ totalItems }}</span>
    </div>

    <div class="kanban-sections">
      <div 
        v-for="column in store.columns" 
        :key="column.id"
        class="kanban-section"
        @dragover.prevent
        @drop="handleDrop($event, column.id)"
      >
        <div class="section-header">
          <span class="section-title">{{ $t(column.title) }}</span>
          <span class="section-count">{{ getColumnItems(column.id).length }}</span>
        </div>

        <div class="section-content">
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
                  size="small"
                  severity="danger"
                  @click="deleteItem(item.id)"
                />
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
import Button from '../ui/SgButton.vue'
import type { KanbanItem, KanbanColumnId } from '@/services/kanbanService'

const store = useKanbanStore()

onMounted(() => {
  store.initialize()
})

const totalItems = computed(() => {
  return store.columns.reduce((total, column) => total + column.items.length, 0)
})

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
</script>

<style scoped>
.kanban-sidebar {
  height: var(--sg-size-100pct);
  display: flex;
  flex-direction: column;
  background: var(--sg-color-surface-muted);
}

.kanban-header {
  padding: var(--sg-space-1rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sg-color-border);
}

.kanban-header h3 {
  margin: 0;
  font-size: var(--sg-font-size-1d1rem);
}

.item-count {
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  padding: var(--sg-space-0d2rem-0d6rem);
  border-radius: var(--sg-radius-1rem);
  font-size: var(--sg-font-size-0d8rem);
}

.kanban-sections {
  flex: 1;
  overflow-y: auto;
  padding: var(--sg-space-0d5rem);
}

.kanban-section {
  margin-bottom: var(--sg-space-1rem);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sg-space-0d5rem);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-6px);
  margin-bottom: var(--sg-space-0d5rem);
}

.section-title {
  font-weight: bold;
  font-size: var(--sg-font-size-0d9rem);
}

.section-count {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
  padding: var(--sg-space-0d1rem-0d4rem);
  border-radius: var(--sg-radius-0d5rem);
  font-size: var(--sg-font-size-0d8rem);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d5rem);
}

.kanban-item {
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-4px);
  padding: var(--sg-space-0d5rem);
  cursor: move;
  box-shadow: var(--sg-shadow-control);
  transition: var(--sg-motion-all-0d2s-ease);
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
}

.item-title {
  flex: 1;
  font-size: var(--sg-font-size-0d9rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-email {
  border-left-color: var(--sg-color-info);
}

.type-task {
  border-left-color: var(--sg-color-success);
}

.type-note {
  border-left-color: var(--sg-color-warning);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: var(--sg-motion-all-0d3s-ease);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-active {
  position: absolute;
}
</style> 
