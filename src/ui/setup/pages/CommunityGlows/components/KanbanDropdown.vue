<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContextualTasksStore, useLocalTasksStore } from '@/stores/contextualTasks'
import { useKanbanContactsStore, useLocalKanbanContactsStore } from '@/stores/kanbanContacts'
import SidebarNavButton from './SidebarNavButton.vue'
import SidebarDropdownPanel from './SidebarDropdownPanel.vue'
import SgIcon from './ui/SgIcon.vue'
defineProps<{ compact?: boolean; active?: boolean }>()
export type KanbanDropdownTarget = { action?: 'task' | 'contact'; taskId?: string; contactId?: string }
const emit = defineEmits<{ open: [target?: KanbanDropdownTarget] }>()
const route = useRoute()
const localTasks = useLocalTasksStore()
const accountTasks = useContextualTasksStore()
const localContacts = useLocalKanbanContactsStore()
const accountContacts = useKanbanContactsStore()
const isLocalKanban = computed(() => route.path === '/local-kanban')
const tasksStore = computed(() => isLocalKanban.value ? localTasks : accountTasks)
const contactsStore = computed(() => isLocalKanban.value ? localContacts : accountContacts)
const upcomingTasks = computed(() => tasksStore.value.tasks
  .filter(task => task.status !== 'done' && task.dueDate)
  .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  .slice(0, 3))
const pinnedContacts = computed(() => contactsStore.value.contacts
  .filter(contact => contact.pinned)
  .sort((a, b) => (a.nextFollowUp ?? '9999-12-31').localeCompare(b.nextFollowUp ?? '9999-12-31'))
  .slice(0, 3))
const root = ref<HTMLElement | null>(null)
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
function close() { clearTimeout(timer); open.value = false }
function enter(event: PointerEvent) { if (event.pointerType === 'mouse') { clearTimeout(timer); open.value = true } }
function leave() { timer = setTimeout(() => { if (!root.value?.contains(document.activeElement)) close() }, 120) }
function choose(target?: KanbanDropdownTarget) { close(); emit('open', target) }
function outside(event: PointerEvent) { if (!root.value?.contains(event.target as Node)) close() }
function contactInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toLocaleUpperCase())
    .join('')
}
async function focusItem(direction: number) {
  open.value = true
  await nextTick()
  const items = [...root.value!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
  const index = items.indexOf(document.activeElement as HTMLButtonElement)
  items[index < 0 ? direction > 0 ? 0 : items.length - 1 : (index + direction + items.length) % items.length]?.focus()
}
function escape() { close(); root.value?.querySelector<HTMLButtonElement>('button')?.focus() }
onMounted(() => {
  localTasks.initialize()
  accountTasks.initialize()
  localContacts.initialize()
  accountContacts.initialize()
  document.addEventListener('pointerdown', outside)
})
onUnmounted(() => { close(); document.removeEventListener('pointerdown', outside) })
</script>

<template>
  <div ref="root" class="kanban-dropdown" :class="{ 'is-open': open }" @pointerenter="enter" @pointerleave="leave" @keydown.esc.stop.prevent="escape" @keydown.down.prevent="focusItem(1)" @keydown.up.prevent="focusItem(-1)" @focusout="!root?.contains($event.relatedTarget as Node) && close()">
    <SidebarNavButton label="Kanban" :compact="compact" :active="active" :aria-expanded="open" aria-haspopup="menu" @click="choose()">
      <template #icon><SgIcon icon="pi pi-check-square" /></template>
    </SidebarNavButton>
    <SidebarDropdownPanel v-if="open" role="menu" aria-label="Kanban">
      <div v-if="upcomingTasks.length || pinnedContacts.length" class="kanban-dropdown__overview" :aria-label="$t('tasks.upcoming')">
        <p v-if="upcomingTasks.length" class="kanban-dropdown__label">{{ $t('tasks.upcoming') }}</p>
        <button v-for="task in upcomingTasks" :key="task.id" type="button" role="menuitem" @click="choose({ taskId: task.id })"><SgIcon icon="pi pi-calendar" /><span class="kanban-dropdown__item-label">{{ task.title }}</span><time :datetime="task.dueDate">{{ task.dueDate }}</time></button>
        <p v-if="pinnedContacts.length" class="kanban-dropdown__label">{{ $t('crm.pinned_contacts') }}</p>
        <button v-for="contact in pinnedContacts" :key="contact.id" type="button" role="menuitem" @click="choose({ contactId: contact.id })">
          <span class="kanban-dropdown__avatar" aria-hidden="true">
            <img
              v-if="contact.avatarUrl"
              :src="contact.avatarUrl"
              alt=""
            />
            <span v-else>{{ contactInitials(contact.name) }}</span>
          </span>
          <span class="kanban-dropdown__item-label">{{ contact.name }}</span>
          <time v-if="contact.nextFollowUp" :datetime="contact.nextFollowUp">{{ contact.nextFollowUp }}</time>
        </button>
      </div>
      <button type="button" role="menuitem" @click="choose({ action: 'task' })"><SgIcon icon="pi pi-plus" />{{ $t('tasks.new_task') }}</button>
      <button type="button" role="menuitem" @click="choose({ action: 'contact' })"><SgIcon icon="pi pi-users" />{{ $t('crm.new_contact') }}</button>
    </SidebarDropdownPanel>
  </div>
</template>

<style scoped>
.kanban-dropdown { position: relative; z-index: var(--sg-layer-dropdown); }
.kanban-dropdown :deep(.sidebar-nav-button .sg-button) { color: var(--sg-color-text); }
.is-open :deep(.sidebar-nav-button .sg-button) { background: var(--sg-color-surface-hover); }
[role='menuitem'] { display: flex; align-items: center; gap: var(--sg-space-2); width: var(--sg-sidebar-fill-size); border: 0; padding: var(--sg-space-0d6rem-0d75rem); background: transparent; color: var(--sg-color-text); font: inherit; text-align: start; cursor: pointer; transition: var(--sg-motion-colors); }
[role='menuitem']:hover, [role='menuitem']:focus-visible { background: var(--sg-color-surface-hover); }
.kanban-dropdown__overview { border-bottom: var(--sg-border-1px) solid var(--sg-color-border); padding-block: var(--sg-space-1); }
.kanban-dropdown__label { margin: var(--sg-space-1) var(--sg-space-0d75rem); color: var(--sg-color-text-muted); font-size: var(--sg-font-size-0d85rem); font-weight: var(--sg-font-weight-bold); }
.kanban-dropdown__avatar { display: grid; place-items: center; flex: 0 0 auto; inline-size: var(--sg-size-2rem); block-size: var(--sg-size-2rem); overflow: hidden; border-radius: var(--sg-radius-50pct); background: var(--sg-color-surface-muted); color: var(--sg-color-text); font-size: var(--sg-font-size-0d85rem); font-weight: var(--sg-font-weight-bold); }
.kanban-dropdown__avatar img { inline-size: var(--sg-size-100pct); block-size: var(--sg-size-100pct); object-fit: cover; }
.kanban-dropdown__item-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
time { color: var(--sg-color-text-muted); font-size: var(--sg-font-size-0d85rem); }
@media (prefers-reduced-motion: reduce) { [role='menuitem'] { transition: none; } }
</style>

