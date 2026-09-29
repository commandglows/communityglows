<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ContextualTaskInput, ContextualTaskPriority, ContextualTaskStatus } from '@/services/contextualTasksService'
import SgButton from '../ui/SgButton.vue'
import type { KanbanContact } from '@/stores/kanbanContacts'

const props = withDefaults(defineProps<{
  initialTask?: ContextualTaskInput
  busy?: boolean
  initialUrl?: string
  submitLabel?: string
  contacts?: KanbanContact[]
  compact?: boolean
}>(), {
  initialUrl: '',
  initialTask: undefined,
  submitLabel: undefined,
  busy: false,
  contacts: () => [],
  compact: false,
})

const { t } = useI18n()

const emit = defineEmits<{
  submit: [input: ContextualTaskInput]
  cancel: []
}>()

const titleInput = ref<HTMLInputElement | null>(null)
const title = ref(props.initialTask?.title ?? '')
const url = ref(props.initialTask?.url ?? props.initialUrl)
const note = ref(props.initialTask?.note ?? '')
const tags = ref(props.initialTask?.tags?.join(', ') ?? '')
const people = ref(props.initialTask?.people?.map(p => p.name).join(', ') ?? '')
const links = ref(props.initialTask?.links?.join('\n') ?? '')
const priority = ref<ContextualTaskPriority>(props.initialTask?.priority ?? 'normal')
const status = ref<ContextualTaskStatus>(props.initialTask?.status ?? 'todo')
const dueDate = ref(props.initialTask?.dueDate ?? '')
const contactIds = ref<string[]>([...(props.initialTask?.contactIds ?? [])])

watch(() => props.initialUrl, (value) => {
  url.value = value
})

const canSubmit = computed(() => title.value.trim().length > 0)
const resolvedSubmitLabel = computed(() => props.submitLabel ?? t('tasks.form.create'))

function submit() {
  if (!canSubmit.value || props.busy) return
  emit('submit', {
    title: title.value,
    url: url.value,
    note: note.value,
    tags: tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    people: people.value.split(',').map((name) => ({ name })).filter((person) => person.name.trim()),
    links: links.value.split('\n').map((link) => link.trim()).filter(Boolean),
    priority: priority.value,
    status: status.value,
    dueDate: dueDate.value || undefined,
    contactIds: [...contactIds.value],
  })
}

function focusFirstField() {
  titleInput.value?.focus()
}

defineExpose({ focusFirstField })
</script>

<template>
  <form
    class="task-form"
    :class="{ 'task-form--compact': compact }"
    @submit.prevent="submit"
  >
    <div class="task-form-grid">
      <label>
        <span>{{ $t('tasks.form.title') }}</span>
        <input
          ref="titleInput"
          v-model="title"
          type="text"
          maxlength="160"
          required
          :placeholder="$t('tasks.form.title_placeholder')"
        />
      </label>
      <label>
        <span>{{ $t('tasks.form.context_url') }}</span>
        <input
          v-model="url"
          type="url"
          inputmode="url"
          :placeholder="$t('tasks.form.context_url_placeholder')"
        />
      </label>
    </div>

    <label>
      <span>{{ $t('tasks.form.note') }}</span>
      <textarea
        v-model="note"
        maxlength="4000"
        :rows="compact ? 2 : 3"
        :placeholder="$t('tasks.form.note_placeholder')"
      />
    </label>

    <div class="task-form-grid">
      <label>
        <span>{{ $t('tasks.form.people') }}</span>
        <input
          v-model="people"
          type="text"
          placeholder="Alex, Morgan"
        />
      </label>
      <label>
        <span>{{ $t('tasks.form.links') }}</span>
        <textarea
          v-model="links"
          :rows="compact ? 1 : 2"
          :placeholder="$t('tasks.form.links_placeholder')"
        />
      </label>
    </div>

    <fieldset v-if="contacts.length" class="task-contacts">
      <legend>{{ $t('crm.linked_contacts') }}</legend>
      <label v-for="contact in contacts" :key="contact.id" class="task-contact-choice">
        <input v-model="contactIds" type="checkbox" :value="contact.id" />
        <span>{{ contact.name }}</span>
      </label>
    </fieldset>
    <p v-else>{{ $t('crm.create_contact_hint') }}</p>

    <div class="task-form-grid task-form-grid--details">
      <label>
        <span>{{ $t('tasks.form.tags') }}</span>
        <input
          v-model="tags"
          type="text"
          :placeholder="$t('tasks.form.tags_placeholder')"
        />
      </label>
      <label>
        <span>{{ $t('tasks.form.due_date') }}</span>
        <input
          v-model="dueDate"
          type="date"
        />
      </label>
      <label>
        <span>{{ $t('tasks.form.priority') }}</span>
        <select v-model="priority">
          <option value="low">{{ $t('tasks.priority.low') }}</option>
          <option value="normal">{{ $t('tasks.priority.normal') }}</option>
          <option value="high">{{ $t('tasks.priority.high') }}</option>
        </select>
      </label>
      <label>
        <span>{{ $t('tasks.form.status') }}</span>
        <select v-model="status">
          <option value="todo">{{ $t('kanban.todo') }}</option>
          <option value="waiting">{{ $t('kanban.waiting') }}</option>
          <option value="done">{{ $t('kanban.done') }}</option>
        </select>
      </label>
    </div>

    <div class="task-form-actions">
      <SgButton
        :label="$t('common.cancel')"
        text
        :disabled="busy"
        type="button"
        @click="emit('cancel')"
      />
      <SgButton
        :label="resolvedSubmitLabel"
        type="submit"
        :disabled="!canSubmit || busy"
      />
    </div>
  </form>
</template>

<style scoped>
.task-contacts { border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); padding: var(--sg-space-3); }
.task-form .task-contact-choice { display: flex; align-items: center; gap: var(--sg-space-2); }
.task-form .task-contact-choice input { width: auto; }
.task-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
}

.task-form--compact {
  gap: var(--sg-space-0d375rem);
}

.task-form--compact .task-form-grid {
  gap: var(--sg-space-0d375rem);
}

.task-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--sg-tasks-form-column-min-width)), 1fr));
  gap: var(--sg-sidebar-form-gap);
}

.task-form-grid--details {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--sg-tasks-form-column-min-width)), 1fr));
}

.task-form label {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--sg-sidebar-subsection-spacing);
}

.task-form label span {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.task-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sg-sidebar-form-gap);
}

</style>
