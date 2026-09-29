import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
vi.mock('@/lib/cloudSyncQueue', () => ({ enqueueContextualTasksSnapshot: vi.fn(), flushCloudSyncQueue: vi.fn(async () => {}) }))
import { enqueueContextualTasksSnapshot } from '@/lib/cloudSyncQueue'
import { useContextualTasksStore, useLocalTasksStore } from './contextualTasks'

describe('isolated guest Kanban', () => {
  beforeEach(() => {
    const values = new Map<string,string>()
    vi.stubGlobal('localStorage', { getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => values.set(key,value), removeItem: (key:string) => values.delete(key) })
    setActivePinia(createPinia());vi.clearAllMocks()
  })
  it('persists guest tasks without cloud writes and never reads account tasks', () => {
    const account = useContextualTasksStore();account.initialize();account.create({title:'Private account task',url:''})
    vi.clearAllMocks()
    const guest=useLocalTasksStore();guest.initialize();expect(guest.tasks).toEqual([])
    const task=guest.create({title:'Guest task',url:''})!
    guest.move(task.id,'waiting');guest.renameStage('todo','Guest inbox')
    expect(enqueueContextualTasksSnapshot).not.toHaveBeenCalled()
    account.clearLocal();setActivePinia(createPinia())
    const restored=useLocalTasksStore();restored.initialize()
    expect(restored.tasks[0].title).toBe('Guest task');expect(restored.tasks[0].status).toBe('waiting')
    expect(restored.stageLabels.todo).toBe('Guest inbox')
  })
  it('copies once, retains both existing account tasks and guest originals', () => {
    const guest=useLocalTasksStore();guest.initialize();guest.create({title:'Guest',url:''})
    const account=useContextualTasksStore();account.initialize();account.create({title:'Account',url:''})
    account.importLocalTasks(guest.tasks);account.importLocalTasks(guest.tasks)
    expect(account.tasks.map(task=>task.title)).toEqual(['Account','Guest'])
    account.clearLocal();expect(guest.tasks.map(task=>task.title)).toEqual(['Guest'])
  })
})
