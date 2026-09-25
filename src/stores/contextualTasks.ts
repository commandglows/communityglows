import { defineStore } from 'pinia'
import {
  ContextualTasksService,
  type ContextualTask,
  type ContextualTaskInput,
  type ContextualTaskStatus,
} from '@/services/contextualTasksService'
import { enqueueContextualTasksSnapshot, flushCloudSyncQueue } from '@/lib/cloudSyncQueue'

const createTasksStore = (id: string, localOnly = false) => defineStore(id, {
  state: () => ({
    service: new ContextualTasksService(localOnly ? 'communityglows.guest-tasks.v1' : undefined),
    tasks: [] as ContextualTask[],
    initialized: false,
    loading: false,
    error: null as string | null,
    stageLabels: {
      todo: 'À faire',
      waiting: 'En attente',
      done: 'Terminé',
    } as Record<ContextualTaskStatus, string>,
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
        this.loadStageLabels()
        this.error = null
      } catch {
        this.error = 'invalid_tasks_state'
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    replaceFromCloud(serialized: string | undefined) {
      if (serialized === undefined) return
      try {
        this.service.replaceState(JSON.parse(serialized))
        this.tasks = this.service.getTasks()
        this.error = null
        this.initialized = true
      } catch {
        this.error = 'invalid_tasks_state'
      }
    },

    importLocalTasks(tasks: ContextualTask[]) {
      if (localOnly) return false
      const known = new Set(this.tasks.map(task => task.id))
      this.replaceFromCloud(JSON.stringify([...this.tasks, ...tasks.filter(task => !known.has(task.id)).map(task => ({ ...task, profileId: undefined }))]))
      if (this.error) return false
      void this.syncToCloud()
      return true
    },
    syncToCloud() {
      if (localOnly) return Promise.resolve()
      enqueueContextualTasksSnapshot(this.service.serializeState())
      return flushCloudSyncQueue()
    },

    create(input: ContextualTaskInput) {
      try {
        const task = this.service.add(input)
        this.tasks = this.service.getTasks()
        this.error = null
        void this.syncToCloud()
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
        void this.syncToCloud()
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
      void this.syncToCloud()
    },

    clearError() {
      this.error = null
    },

    renameStage(status: ContextualTaskStatus, label: string) {
      const nextLabel = label.trim().slice(0, 40)
      if (!nextLabel) return
      this.stageLabels[status] = nextLabel
      localStorage.setItem(localOnly ? 'communityglows.guest-task-labels.v1' : 'contextual-task-stage-labels-v1', JSON.stringify(this.stageLabels))
    },

    loadStageLabels() {
      try {
        const raw = localStorage.getItem(localOnly ? 'communityglows.guest-task-labels.v1' : 'contextual-task-stage-labels-v1')
        if (!raw) return
        const parsed: unknown = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return
        for (const status of ['todo', 'waiting', 'done'] as ContextualTaskStatus[]) {
          const label = (parsed as Record<string, unknown>)[status]
          if (typeof label === 'string' && label.trim()) this.stageLabels[status] = label.trim().slice(0, 40)
        }
      } catch {
        // Keep the default labels when local preferences are malformed.
      }
    },

    clearLocal() {
      this.service.replaceState([])
      this.tasks = []
      this.initialized = false
    },
  },
})

export const useContextualTasksStore = createTasksStore('contextualTasks')
export const useLocalTasksStore = createTasksStore('localTasks', true)

export type { ContextualTask, ContextualTaskInput, ContextualTaskStatus }
