<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useContextualTasksStore } from '@/stores/contextualTasks'
import { captureActiveTabUrl } from '@/platform/extensionTaskCapture'
import TaskForm from './TaskForm.vue'

const tasksStore = useContextualTasksStore()
const capturedUrl = ref('')
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const formVisible = ref(false)

onMounted(() => {
  tasksStore.initialize()
})

async function capture() {
  message.value = null
  error.value = null
  const result = await captureActiveTabUrl()
  if (!result.ok) {
    error.value = result.code === 'https_required'
      ? 'Cette page ne fournit pas une URL HTTPS utilisable.'
      : 'Impossible de lire l’URL de l’onglet actif. Tu peux la coller manuellement.'
    return
  }
  capturedUrl.value = result.url
  formVisible.value = true
  message.value = result.removedSensitiveParts
    ? 'Le lien a été nettoyé avant affichage.'
    : 'URL capturée à ta demande. La page n’a pas été lue.'
}

function createTask(input: Parameters<typeof tasksStore.create>[0]) {
  const task = tasksStore.create({ ...input, url: capturedUrl.value })
  if (!task) {
    error.value = 'Impossible de créer la tâche. Vérifie le titre et l’URL.'
    return
  }
  message.value = 'Tâche créée.'
  formVisible.value = false
}
</script>

<template>
  <section class="ext-task-capture-panel">
    <div class="ext-task-capture-heading">
      <div>
        <h2>Créer une tâche depuis cet onglet</h2>
        <p>Seule l’URL HTTPS est capturée après ton clic. Aucun contenu de page n’est lu.</p>
      </div>
      <button
        class="ext-btn ext-btn--small ext-btn--secondary"
        type="button"
        @click="capture"
      >
        <SgIcon icon="pi pi-link" />
        Utiliser l’onglet actif
      </button>
    </div>

    <TaskForm
      v-if="formVisible"
      :initial-url="capturedUrl"
      submit-label="Enregistrer la tâche"
      @submit="createTask"
      @cancel="formVisible = false"
    />

    <p
      v-if="message"
      class="ext-task-capture-message"
      role="status"
    >
      {{ message }}
    </p>
    <p
      v-if="error"
      class="ext-task-capture-error"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>

<style scoped>
.ext-task-capture-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
  padding: var(--sg-crm-toolbar-padding);
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-crm-card-radius);
}

.ext-task-capture-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sg-sidebar-form-gap);
}

.ext-task-capture-heading h2,
.ext-task-capture-heading p,
.ext-task-capture-message,
.ext-task-capture-error {
  margin: 0;
}

.ext-task-capture-heading p,
.ext-task-capture-message,
.ext-task-capture-error {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.ext-task-capture-error { color: var(--sg-color-danger); }
</style>
