<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ContextualTaskInput, ContextualTaskPriority, ContextualTaskStatus } from '@/services/contextualTasksService'

const props = withDefaults(defineProps<{
  initialUrl?: string
  submitLabel?: string
}>(), {
  initialUrl: '',
  submitLabel: 'Créer la tâche',
})

const emit = defineEmits<{
  submit: [input: ContextualTaskInput]
  cancel: []
}>()

const title = ref('')
const url = ref(props.initialUrl)
const note = ref('')
const tags = ref('')
const priority = ref<ContextualTaskPriority>('normal')
const status = ref<ContextualTaskStatus>('todo')
const dueDate = ref('')

watch(() => props.initialUrl, (value) => {
  if (value) url.value = value
}, { immediate: true })

const canSubmit = computed(() => title.value.trim().length > 0 && url.value.trim().length > 0)

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    title: title.value,
    url: url.value,
    note: note.value,
    tags: tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    priority: priority.value,
    status: status.value,
    dueDate: dueDate.value || undefined,
  })
}
</script>

<template>
  <form class="task-form" @submit.prevent="submit">
    <div class="task-form-grid">
      <label>
        <span>Titre</span>
        <input v-model="title" type="text" maxlength="160" required placeholder="Ex. Répondre à cette question" />
      </label>
      <label>
        <span>URL du contexte</span>
        <input v-model="url" type="url" inputmode="url" required placeholder="https://..." />
      </label>
    </div>

    <label>
      <span>Note personnelle</span>
      <textarea v-model="note" maxlength="4000" rows="3" placeholder="Ce que je veux faire ou retenir…" />
    </label>

    <div class="task-form-grid task-form-grid--details">
      <label>
        <span>Tags</span>
        <input v-model="tags" type="text" placeholder="communauté, relance" />
      </label>
      <label>
        <span>Échéance</span>
        <input v-model="dueDate" type="date" />
      </label>
      <label>
        <span>Priorité</span>
        <select v-model="priority">
          <option value="low">Basse</option>
          <option value="normal">Normale</option>
          <option value="high">Haute</option>
        </select>
      </label>
      <label>
        <span>État</span>
        <select v-model="status">
          <option value="todo">À faire</option>
          <option value="waiting">En attente</option>
          <option value="done">Terminé</option>
        </select>
      </label>
    </div>

    <div class="task-form-actions">
      <button class="btn btn-ghost" type="button" @click="emit('cancel')">Annuler</button>
      <button class="btn btn-primary" type="submit" :disabled="!canSubmit">{{ submitLabel }}</button>
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
  color: var(--text-color-secondary);
  font-size: var(--sg-crm-secondary-copy-size);
}

.task-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sg-sidebar-form-gap);
}

</style>
