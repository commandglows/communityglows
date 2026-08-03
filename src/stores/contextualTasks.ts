import { defineStore } from 'pinia'
import {
  ContextualTasksService,
  type ContextualTask,
  type ContextualTaskInput,
  type ContextualTaskStatus,
} from '@/services/contextualTasksService'

export const useContextualTasksStore = defineStore('contextualTasks', {
  state: () => ({
    service: new ContextualTasksService(),
    tasks: [] as ContextualTask[],
    initialized: false,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    total: (state) => state.tasks.length,
    getByStatus: (state) => (status: ContextualTaskStatus) =>
      state.tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)),
  },

  actions: {
    initialize() {
      if (this.initialized) return
      this.loading = true
      try {
        this.service.migrateLegacyKanbanState()
        this.service.loadState()
        this.tasks = this.service.getTasks()
        this.error = null
      } catch {
        this.error = 'invalid_tasks_state'
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    create(input: ContextualTaskInput) {
      try {
        const task = this.service.add(input)
        this.tasks = this.service.getTasks()
        this.error = null
        return task
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'task_create_failed'
        return null
      }
    },

    update(id: string, input: Partial<ContextualTaskInput>) {
      try {
        this.service.update(id, input)
        this.tasks = this.service.getTasks()
        this.error = null
        return true
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'task_update_failed'
        return false
      }
    },

    move(id: string, status: ContextualTaskStatus) {
      return this.update(id, { status })
    },

    remove(id: string) {
      this.service.remove(id)
      this.tasks = this.service.getTasks()
    },

    clearError() {
      this.error = null
    },
  },
})

export type { ContextualTask, ContextualTaskInput, ContextualTaskStatus }
