export type ContextualTaskStatus = 'todo' | 'waiting' | 'done'
export type ContextualTaskPriority = 'low' | 'normal' | 'high'

export interface ContextualTask {
  id: string
  title: string
  note: string
  tags: string[]
  url: string
  host: string
  networkId?: string
  profileId?: string
  status: ContextualTaskStatus
  priority: ContextualTaskPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  order: number
}

export type ContextualTaskInput = Pick<ContextualTask, 'title' | 'url'> & Partial<
  Pick<ContextualTask, 'note' | 'tags' | 'networkId' | 'profileId' | 'status' | 'priority' | 'dueDate'>
>

export type UrlSanitizationResult = {
  ok: true
  url: string
  host: string
  removedSensitiveParts: boolean
} | {
  ok: false
  code: 'empty' | 'invalid' | 'https_required' | 'credentials_not_allowed'
}

export const CONTEXTUAL_TASKS_STORAGE_KEY = 'contextual-tasks-v1'
const MAX_TITLE_LENGTH = 160
const MAX_NOTE_LENGTH = 4000
const MAX_TAG_LENGTH = 40
const MAX_TAGS = 20
const MAX_URL_LENGTH = 2048
const SENSITIVE_PARAMETER = /^(?:token|access_token|auth|code|state|session|key|secret|password|sig|signature)$/i

const networkHosts: Record<string, string[]> = {
  twitter: ['x.com', 'twitter.com'],
  facebook: ['facebook.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
  tiktok: ['tiktok.com'],
  threads: ['threads.net'],
  discord: ['discord.com'],
  reddit: ['reddit.com'],
  telegram: ['telegram.org', 't.me'],
  bluesky: ['bsky.app'],
  mastodon: ['mastodon.social'],
  pinterest: ['pinterest.com'],
  substack: ['substack.com'],
}

function hostMatches(host: string, allowedHost: string) {
  return host === allowedHost || host.endsWith(`.${allowedHost}`)
}

export function inferNetworkId(host: string): string | undefined {
  const normalizedHost = host.toLowerCase()
  return Object.entries(networkHosts).find(([, hosts]) => hosts.some((candidate) => hostMatches(normalizedHost, candidate)))?.[0]
}

function parseHttpsUrl(rawInput: string): URL | null {
  const trimmed = rawInput.trim()
  if (!trimmed) return null
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(candidate)
  } catch {
    return null
  }
}

export function sanitizeContextualUrl(rawInput: string): UrlSanitizationResult {
  const trimmed = rawInput.trim()
  if (!trimmed) return { ok: false, code: 'empty' }
  if (trimmed.length > MAX_URL_LENGTH) return { ok: false, code: 'invalid' }

  const parsed = parseHttpsUrl(trimmed)
  if (!parsed) return { ok: false, code: 'invalid' }
  if (parsed.protocol !== 'https:') return { ok: false, code: 'https_required' }
  if (parsed.username || parsed.password) return { ok: false, code: 'credentials_not_allowed' }

  let removedSensitiveParts = parsed.hash.length > 0
  parsed.hash = ''
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (!SENSITIVE_PARAMETER.test(key)) continue
    parsed.searchParams.delete(key)
    removedSensitiveParts = true
  }

  return {
    ok: true,
    url: parsed.toString(),
    host: parsed.host,
    removedSensitiveParts,
  }
}

function normalizeTags(tags: string[] | undefined): string[] {
  const normalized: string[] = []
  for (const tag of tags ?? []) {
    const value = tag.trim().replace(/^#/, '').slice(0, MAX_TAG_LENGTH)
    if (!value || normalized.some((existing) => existing.toLowerCase() === value.toLowerCase())) continue
    normalized.push(value)
    if (normalized.length >= MAX_TAGS) break
  }
  return normalized
}

function createId() {
  return `task-${typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}

function now() {
  return new Date().toISOString()
}

export function createContextualTask(input: ContextualTaskInput, order = 0): ContextualTask {
  const title = input.title.trim().slice(0, MAX_TITLE_LENGTH)
  if (!title) throw new Error('title_required')

  const sanitized = sanitizeContextualUrl(input.url)
  if (!sanitized.ok) throw new Error(sanitized.code)

  const timestamp = now()
  return {
    id: createId(),
    title,
    note: (input.note ?? '').trim().slice(0, MAX_NOTE_LENGTH),
    tags: normalizeTags(input.tags),
    url: sanitized.url,
    host: sanitized.host,
    networkId: input.networkId ?? inferNetworkId(sanitized.host),
    profileId: input.profileId,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'normal',
    dueDate: input.dueDate,
    createdAt: timestamp,
    updatedAt: timestamp,
    order,
  }
}

function canUseStorage() {
  return typeof localStorage !== 'undefined'
}

export class ContextualTasksService {
  private tasks: ContextualTask[] = []

  getTasks() {
    return [...this.tasks]
  }

  serializeState() {
    return JSON.stringify(this.tasks)
  }

  replaceState(value: unknown) {
    if (!Array.isArray(value)) throw new Error('invalid_tasks_state')
    this.tasks = value.filter((task): task is ContextualTask => this.isTask(task))
    this.saveState()
  }

  loadState() {
    if (!canUseStorage()) return
    const raw = localStorage.getItem(CONTEXTUAL_TASKS_STORAGE_KEY)
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('invalid_tasks_state')
    this.tasks = parsed.filter((task): task is ContextualTask => this.isTask(task))
  }

  migrateLegacyKanbanState() {
    if (!canUseStorage() || localStorage.getItem(CONTEXTUAL_TASKS_STORAGE_KEY)) return 0
    const raw = localStorage.getItem('kanban-state')
    if (!raw) return 0
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return 0
    }
    if (!Array.isArray(parsed)) return 0

    const migrated: ContextualTask[] = []
    for (const entry of parsed) {
      const items = Array.isArray(entry) && entry[1] && typeof entry[1] === 'object' && Array.isArray(entry[1].items)
        ? entry[1].items
        : []
      for (const item of items) {
        if (!item || typeof item !== 'object' || item.type !== 'task') continue
        const legacy = item as { title?: unknown; description?: unknown; labels?: unknown[]; url?: unknown; originalData?: unknown; columnId?: unknown }
        const original = legacy.originalData && typeof legacy.originalData === 'object' ? legacy.originalData as { url?: unknown } : undefined
        const candidateUrl = typeof legacy.url === 'string' ? legacy.url : original?.url
        if (typeof candidateUrl !== 'string') continue
        try {
          migrated.push(createContextualTask({
            title: typeof legacy.title === 'string' ? legacy.title : 'Tâche importée',
            url: candidateUrl,
            note: typeof legacy.description === 'string' ? legacy.description : '',
            tags: Array.isArray(legacy.labels) ? legacy.labels.filter((label): label is string => typeof label === 'string') : [],
            status: legacy.columnId === 'waiting' ? 'waiting' : legacy.columnId === 'archived' ? 'done' : 'todo',
          }, migrated.length))
        } catch {
          // An old item without a safe URL stays in the legacy Kanban unchanged.
        }
      }
    }
    if (migrated.length) localStorage.setItem(CONTEXTUAL_TASKS_STORAGE_KEY, JSON.stringify(migrated))
    return migrated.length
  }

  saveState() {
    if (!canUseStorage()) return
    localStorage.setItem(CONTEXTUAL_TASKS_STORAGE_KEY, JSON.stringify(this.tasks))
  }

  add(input: ContextualTaskInput) {
    const order = this.tasks.filter((task) => task.status === (input.status ?? 'todo')).length
    const task = createContextualTask(input, order)
    this.tasks.push(task)
    this.saveState()
    return task
  }

  update(id: string, input: Partial<ContextualTaskInput>) {
    const current = this.tasks.find((task) => task.id === id)
    if (!current) throw new Error('task_not_found')
    if (input.title !== undefined && !input.title.trim()) throw new Error('title_required')
    const nextUrl = input.url === undefined ? { ok: true as const, url: current.url, host: current.host, removedSensitiveParts: false } : sanitizeContextualUrl(input.url)
    if (!nextUrl.ok) throw new Error(nextUrl.code)
    Object.assign(current, {
      ...input,
      title: input.title === undefined ? current.title : input.title.trim().slice(0, MAX_TITLE_LENGTH),
      note: input.note === undefined ? current.note : input.note.trim().slice(0, MAX_NOTE_LENGTH),
      tags: input.tags === undefined ? current.tags : normalizeTags(input.tags),
      url: nextUrl.url,
      host: nextUrl.host,
      networkId: input.networkId ?? (input.url === undefined ? current.networkId : inferNetworkId(nextUrl.host)),
      updatedAt: now(),
    })
    this.saveState()
    return current
  }

  move(id: string, status: ContextualTaskStatus) {
    return this.update(id, { status })
  }

  remove(id: string) {
    this.tasks = this.tasks.filter((task) => task.id !== id)
    this.saveState()
  }

  private isTask(value: unknown): value is ContextualTask {
    if (!value || typeof value !== 'object') return false
    const task = value as Partial<ContextualTask>
    return typeof task.id === 'string'
      && typeof task.title === 'string'
      && typeof task.url === 'string'
      && typeof task.host === 'string'
      && typeof task.note === 'string'
      && Array.isArray(task.tags)
      && (task.status === 'todo' || task.status === 'waiting' || task.status === 'done')
      && (task.priority === 'low' || task.priority === 'normal' || task.priority === 'high')
      && typeof task.createdAt === 'string'
      && typeof task.updatedAt === 'string'
  }
}
