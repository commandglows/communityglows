import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ContextualTask, ContextualTaskInput } from '@/stores/contextualTasks'
import type { KanbanContact } from '@/stores/kanbanContacts'

type KanbanItemDialogMode = 'choice' | 'task' | 'contact'

export const useKanbanItemDialogStore = defineStore('kanbanItemDialog', () => {
  const open = ref(false)
  const mode = ref<KanbanItemDialogMode>('choice')
  const task = ref<ContextualTask | null>(null)
  const taskInitial = ref<Partial<ContextualTaskInput> | null>(null)
  const contact = ref<KanbanContact | null>(null)
  const revision = ref(0)

  function show(nextMode: KanbanItemDialogMode) {
    mode.value = nextMode
    open.value = true
    revision.value += 1
  }

  function openChoice() {
    task.value = null
    taskInitial.value = null
    contact.value = null
    show('choice')
  }

  function createTask(initial?: Partial<ContextualTaskInput>) {
    task.value = null
    taskInitial.value = initial ?? null
    contact.value = null
    show('task')
  }

  function editTask(nextTask: ContextualTask) {
    task.value = nextTask
    taskInitial.value = null
    contact.value = null
    show('task')
  }

  function createContact() {
    task.value = null
    taskInitial.value = null
    contact.value = null
    show('contact')
  }

  function editContact(nextContact: KanbanContact) {
    task.value = null
    taskInitial.value = null
    contact.value = nextContact
    show('contact')
  }

  function close() {
    open.value = false
  }

  return {
    open,
    mode,
    task,
    taskInitial,
    contact,
    revision,
    openChoice,
    createTask,
    editTask,
    createContact,
    editContact,
    close,
  }
})
