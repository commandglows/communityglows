<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import { useRoute, useRouter } from 'vue-router'
import { useLocalTasksStore, useContextualTasksStore, type ContextualTask, type ContextualTaskStatus } from '@/stores/contextualTasks'
import { sanitizeContextualUrl } from '@/services/contextualTasksService'
import { useWebviewStore } from '@/stores/webviewState'
import TaskBoard from '../components/tasks/TaskBoard.vue'
import SgButton from '../components/ui/SgButton.vue'
import SectionEyebrow from '../components/ui/SectionEyebrow.vue'
import KanbanContacts from '../components/tasks/KanbanContacts.vue'
import { useKanbanContactsStore, useLocalKanbanContactsStore, type KanbanContact } from '@/stores/kanbanContacts'
import { useKanbanItemDialogStore } from '@/stores/kanbanItemDialog'

const route = useRoute()
const router = useRouter()
const contactsPanel = ref<InstanceType<typeof KanbanContacts> | null>(null)
const { t } = useI18n()
const props = defineProps<{ localOnly?: boolean }>()
const localTasks = useLocalTasksStore()
const tasksStore = props.localOnly ? localTasks : useContextualTasksStore()
const localContacts = useLocalKanbanContactsStore()
const contactsStore = props.localOnly ? localContacts : useKanbanContactsStore()
const itemDialog = useKanbanItemDialogStore()
const showContacts = ref(true)
const contactFilter = ref<string | null>(null)
const search = ref('')
const filteredContact = computed(() => contactsStore.contacts.find(c => c.id === contactFilter.value))
const webviewStore = useWebviewStore()
const notice = ref<string | null>(null)
const isTasksCompact = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.tasksCompact}px)`)

const initialUrl = computed(() => typeof route.query.url === 'string' ? route.query.url : '')
const normalizedSearch = computed(() => search.value.trim().toLocaleLowerCase())
const tasksByStatus = computed<Record<ContextualTaskStatus, ContextualTask[]>>(() => ({
  todo: tasksStore.getByStatus('todo').filter(matchesContact).filter(matchesSearch),
  waiting: tasksStore.getByStatus('waiting').filter(matchesContact).filter(matchesSearch),
  done: tasksStore.getByStatus('done').filter(matchesContact).filter(matchesSearch),
}))

function matchesContact(task: ContextualTask) { return !contactFilter.value || !!task.contactIds?.includes(contactFilter.value) }
function matchesSearch(task: ContextualTask) {
  if (!normalizedSearch.value) return true
  const linkedContacts = (task.contactIds ?? [])
    .map(id => contactsStore.contacts.find(contact => contact.id === id)?.name ?? '')
  return [task.title, task.note, task.dueDate, ...task.tags, ...task.people.map(person => person.name), ...linkedContacts]
    .join(' ')
    .toLocaleLowerCase()
    .includes(normalizedSearch.value)
}
watch(() => route.query.create, async action => {
  if (action !== 'task' && action !== 'contact') return
  if (action === 'task') createTask()
  else createContact()
  const query = { ...route.query }
  delete query.create
  await router.replace({ query })
}, { immediate: true, flush: 'post' })
watch(() => [route.query.task, route.query.contact], async ([taskId, contactId]) => {
  if (typeof taskId === 'string') {
    const task = tasksStore.tasks.find(candidate => candidate.id === taskId)
    if (task) editTask(task)
  }
  if (typeof contactId === 'string') {
    showContacts.value = true
    await nextTick()
    await contactsPanel.value?.focus(contactId)
  }
  if (typeof taskId !== 'string' && typeof contactId !== 'string') return
  const query = { ...route.query }
  delete query.task
  delete query.contact
  await router.replace({ query })
}, { flush: 'post' })
function editTask(task: ContextualTask) { itemDialog.editTask(task) }
function createTask() { itemDialog.createTask(contactFilter.value ? { title: '', contactIds: [contactFilter.value] } : undefined) }
function createTaskForContact(contact: KanbanContact) { itemDialog.createTask({ title: '', contactIds: [contact.id], people: [{ name: contact.name }] }) }
function createContact() { showContacts.value = true; itemDialog.createContact() }
function saveContact(id: string | null, input: Pick<KanbanContact, 'name' | 'note' | 'url' | 'avatarUrl' | 'profileLinks' | 'nextFollowUp' | 'pinned'>) {
  return !!(id ? contactsStore.update(id, input) : contactsStore.create(input))
}
function filterContact(id: string) { contactFilter.value = id; showContacts.value = false }
function clearContactFilter() {
  contactFilter.value = null
  showContacts.value = true
}
function editContact(contact: KanbanContact) { itemDialog.editContact(contact) }
function toggleContactPin(contact: KanbanContact) { saveContact(contact.id, { ...contact, pinned: !contact.pinned }) }
function openContactProfile(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
function moveTask(taskId: string, status: ContextualTaskStatus) {
  tasksStore.move(taskId, status)
}

function removeTask(taskId: string) {
  tasksStore.remove(taskId)
  notice.value = t('tasks.notices.deleted')
}

function openTask(task: ContextualTask) {
  if (!task.url) return
  if (!props.localOnly && task.networkId && webviewStore.usesWebview(task.networkId)) {
    webviewStore.selectNetwork(task.networkId, task.url)
    return
  }
  window.open(task.url, '_blank', 'noopener,noreferrer')
}

function copyLocalTasks() {
  if (!contactsStore.importLocalContacts(localContacts.contacts)) {
    notice.value = t('crm.save_failed')
    return
  }
  notice.value = tasksStore.importLocalTasks(localTasks.tasks)
    ? t('login_value.copied') : t('tasks.notices.create_failed')
}

function validateInitialUrl() {
  if (!initialUrl.value) return
  const result = sanitizeContextualUrl(initialUrl.value)
  if (result.ok) {
    itemDialog.createTask({ url: initialUrl.value })
    return
  }
  notice.value = t('tasks.notices.shared_link_invalid')
}

onMounted(() => {
  tasksStore.initialize()
  localTasks.initialize()
  contactsStore.initialize()
  localContacts.initialize()
  validateInitialUrl()
})
</script>

<template>
  <main
    class="tasks-view"
    :class="{ 'is-compact': isTasksCompact }"
  >
    <section
      v-if="localOnly"
      class="local-tasks-notice"
    >
      <strong>{{ $t('login_value.local_title') }}</strong>
      <p>{{ $t('login_value.local_warning') }}</p>
      <p>{{ $t('login_value.local_retained') }}</p>
      <RouterLink to="/login">{{ $t('login_value.account_cta') }}</RouterLink>
    </section>
    <section
      v-else-if="localTasks.tasks.some(task => !tasksStore.tasks.some(saved => saved.id === task.id)) || localContacts.contacts.some(contact => !contactsStore.contacts.some(saved => saved.id === contact.id))"
      class="local-tasks-notice"
    >
      <p>{{ $t('login_value.import_hint') }}</p>
      <SgButton
        :label="$t('login_value.import_cta')"
        @click="copyLocalTasks"
      />
      <RouterLink to="/local-kanban">{{ $t('login_value.local_title') }}</RouterLink>
    </section>
    <header class="tasks-header">
      <div>
        <SectionEyebrow>{{ $t('tasks.eyebrow') }}</SectionEyebrow>
        <h1>{{ $t('tasks.title') }}</h1>
        <p class="tasks-description">{{ $t('tasks.description') }}</p>
      </div>
      <div class="tasks-toolbar-actions">
        <SgButton
          :label="$t('crm.new_contact')"
          icon="pi pi-plus"
          type="button"
          @click="createContact()"
        />
        <SgButton
          :label="$t('tasks.new_task')"
          icon="pi pi-plus"
          type="button"
          @click="createTask()"
        />
      </div>
    </header>

    <p
      v-if="contactsStore.error === 'invalid_contacts_state'"
      role="alert"
    >
      {{ $t('crm.load_failed') }}
    </p>
    <label class="tasks-search">
      <span>{{ $t('tasks.search_all') }}</span>
      <input
        v-model="search"
        type="search"
      />
    </label>
    <KanbanContacts
      v-if="showContacts"
      ref="contactsPanel"
      :search="search"
      :contacts="contactsStore.contacts"
      @edit="editContact"
      @filter="filterContact"
      @create-task="createTaskForContact"
      @open-profile="openContactProfile"
      @toggle-pin="toggleContactPin"
    />
    <div
      v-if="contactFilter"
      class="tasks-toolbar-actions"
    >
      <span>{{ $t('crm.cards_for', { name: filteredContact?.name ?? '' }) }}</span>
      <SgButton
        :label="$t('crm.show_all')"
        text
        @click="clearContactFilter"
      />
    </div>

    <p
      v-if="notice"
      class="tasks-notice"
      role="status"
    >
      {{ notice }}
    </p>

    <TaskBoard
      :tasks-by-status="tasksByStatus"
      :stage-labels="tasksStore.stageLabels"
      :contacts="contactsStore.contacts"
      @move="moveTask"
      @open="openTask"
      @remove="removeTask"
      @rename-stage="tasksStore.renameStage"
      @edit="editTask"
    />
  </main>
</template>

<style scoped>
.local-tasks-notice { padding: var(--sg-space-3); border: var(--sg-border-1px) solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-raised); color: var(--sg-color-text); }
.local-tasks-notice p { margin-block: var(--sg-space-2); }
.local-tasks-notice a { color: var(--sg-color-action); }
.tasks-view {
  display: flex;
  flex-direction: column;
  gap: var(--sg-crm-section-spacing);
  height: var(--sg-sidebar-fill-size);
  padding: var(--sg-crm-content-padding);
  overflow: auto;
}

.tasks-view > * { flex-shrink: 0; }
.tasks-toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sg-space-2); }
.tasks-toolbar-actions :deep(button) { white-space: nowrap; }

.tasks-search {
  display: grid;
  gap: var(--sg-space-1);
}

.tasks-search input {
  inline-size: 100%;
  min-inline-size: 0;
  box-sizing: border-box;
  padding: var(--sg-space-2);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  color: var(--sg-color-text);
  background: var(--sg-color-background);
  font: inherit;
}

.tasks-search input:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.tasks-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sg-crm-section-spacing);
}

.tasks-header > :first-child,
.tasks-header > .tasks-toolbar-actions {
  flex: 1 1 0;
  min-inline-size: 0;
}

.tasks-header > .tasks-toolbar-actions {
  flex-direction: column;
  align-items: stretch;
}

.tasks-header > .tasks-toolbar-actions :deep(button) {
  inline-size: 100%;
}

.tasks-header h1,
.tasks-description {
  margin: 0;
}

.tasks-header h1 {
  font-size: var(--sg-tasks-title-size);
}

.tasks-description {
  max-width: var(--sg-tasks-description-max-width);
  color: var(--sg-color-text-muted);
}

.tasks-notice {
  margin: 0;
  padding: var(--sg-crm-toolbar-padding);
  color: var(--sg-color-text-muted);
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-crm-card-radius);
}

.tasks-view.is-compact {
  height: auto;
  min-height: var(--sg-app-viewport-height);
  overflow: auto;
}

.tasks-view.is-compact .tasks-header {
  flex-direction: column;
}

.tasks-view.is-compact .tasks-header > .tasks-toolbar-actions {
  inline-size: 100%;
}
</style>
