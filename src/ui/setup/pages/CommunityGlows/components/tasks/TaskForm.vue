<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ContextualTaskInput, ContextualTaskPriority, ContextualTaskStatus } from '@/services/contextualTasksService'
import SgButton from '../ui/SgButton.vue'

const props = withDefaults(defineProps<{
  initialUrl?: string
  submitLabel?: string
}>(), {
  initialUrl: '',
})

const { t } = useI18n()

const emit = defineEmits<{
  submit: [input: ContextualTaskInput]
  cancel: []
}>()

const title = ref('')
const url = ref(props.initialUrl)
const note = ref('')
const tags = ref('')
const people = ref('')
const links = ref('')
const priority = ref<ContextualTaskPriority>('normal')
const status = ref<ContextualTaskStatus>('todo')
const dueDate = ref('')

watch(() => props.initialUrl, (value) => {
  if (value) url.value = value
}, { immediate: true })

const canSubmit = computed(() => title.value.trim().length > 0)
const resolvedSubmitLabel = computed(() => props.submitLabel ?? t('tasks.form.create'))

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    title: title.value,
    url: url.value || undefined,
    note: note.value,
    tags: tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    people: people.value.split(',').map((name) => ({ name })).filter((person) => person.name.trim()),
    links: links.value.split('\n').map((link) => link.trim()).filter(Boolean),
    priority: priority.value,
    status: status.value,
    dueDate: dueDate.value || undefined,
  })
}
</script>

<template>
  <form
    class="task-form"
    @submit.prevent="submit"
  >
    <div class="task-form-grid">
      <label>
        <span>{{ $t('tasks.form.title') }}</span>
        <input
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
        rows="3"
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
          rows="2"
          :placeholder="$t('tasks.form.links_placeholder')"
        />
      </label>
    </div>

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
        type="button"
        @click="emit('cancel')"
      />
      <SgButton
        :label="resolvedSubmitLabel"
        type="submit"
        :disabled="!canSubmit"
      />
    </div>
  </form>
</template>

<style scoped>
.task-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
}

.task-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--sg-tasks-form-column-min-width), 1fr));
  gap: var(--sg-sidebar-form-gap);
}

.task-form-grid--details {
  grid-template-columns: repeat(auto-fit, minmax(var(--sg-tasks-form-column-min-width), 1fr));
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
