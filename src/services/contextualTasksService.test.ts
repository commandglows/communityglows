import {
  ContextualTasksService,
  createContextualTask,
  sanitizeContextualUrl,
} from './contextualTasksService'

describe('contextual task URL contract', () => {
  it('normalizes https URLs and removes fragments and sensitive query parameters', () => {
    expect(sanitizeContextualUrl('https://x.com/post/1?keep=yes&token=secret#reply')).toEqual({
      ok: true,
      url: 'https://x.com/post/1?keep=yes',
      host: 'x.com',
      removedSensitiveParts: true,
    })
  })

  it('rejects non-https URLs and credentials', () => {
    expect(sanitizeContextualUrl('http://example.com')).toEqual({ ok: false, code: 'https_required' })
    expect(sanitizeContextualUrl('https://user:pass@example.com')).toEqual({
      ok: false,
      code: 'credentials_not_allowed',
    })
  })

  it('creates a bounded task with network derived from the host', () => {
    const task = createContextualTask({
      title: ' Répondre à la question ',
      url: 'https://www.linkedin.com/posts/example-1',
      note: 'Contexte saisi par moi',
      tags: ['#important', 'important', 'community'],
      priority: 'high',
    })
    expect(task.title).toBe('Répondre à la question')
    expect(task.networkId).toBe('linkedin')
    expect(task.tags).toEqual(['important', 'community'])
    expect(task.status).toBe('todo')
  })

  it('supports standalone tasks with optional people and safe links', () => {
    const task = createContextualTask({
      title: 'PrÃ©parer la modÃ©ration',
      people: [{ name: 'Alex' }, { name: 'Alex' }, { name: 'Morgan' }],
      links: ['https://example.com/brief#private', 'https://example.com/brief#private'],
    })

    expect(task.url).toBeUndefined()
    expect(task.people).toEqual([{ name: 'Alex' }, { name: 'Morgan' }])
    expect(task.links).toEqual(['https://example.com/brief'])
  })
})

describe('ContextualTasksService', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    })
  })

  it('persists, updates, moves and removes tasks', () => {
    const service = new ContextualTasksService()
    const task = service.add({ title: 'Relancer', url: 'https://instagram.com/p/1' })
    service.move(task.id, 'waiting')
    expect(service.getTasks()[0]?.status).toBe('waiting')
    service.update(task.id, { note: 'Après vérification' })
    expect(service.getTasks()[0]?.note).toBe('Après vérification')
    expect(storage.has('contextual-tasks-v1')).toBe(true)
    service.remove(task.id)
    expect(service.getTasks()).toHaveLength(0)
  })

  it('hydrates legacy tasks with empty people and links', () => {
    storage.set('contextual-tasks-v1', JSON.stringify([createContextualTask({ title: 'Ancienne tÃ¢che', url: 'https://x.com/post/1' })]))
    const service = new ContextualTasksService()
    service.loadState()
    expect(service.getTasks()[0]).toMatchObject({ people: [], links: [] })
  })

  it('migrates only legacy task items that already contain a safe URL', () => {
    storage.set('kanban-state', JSON.stringify([
      ['todo', { items: [
        { type: 'task', title: 'Avec lien', description: 'Note', labels: ['community'], originalData: { url: 'https://x.com/post/1' }, columnId: 'todo' },
        { type: 'task', title: 'Sans lien', description: 'Reste dans le Kanban', labels: [], columnId: 'todo' },
      ] }],
    ]))
    const service = new ContextualTasksService()
    expect(service.migrateLegacyKanbanState()).toBe(1)
    service.loadState()
    expect(service.getTasks()[0]?.title).toBe('Avec lien')
    expect(service.getTasks()[0]?.networkId).toBe('twitter')
  })
})
