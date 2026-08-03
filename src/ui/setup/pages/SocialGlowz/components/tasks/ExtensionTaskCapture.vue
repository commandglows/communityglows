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
  <section class="task-capture-panel">
    <div class="task-capture-heading">
      <div>
        <h2>Créer une tâche depuis cet onglet</h2>
        <p>Seule l’URL HTTPS est capturée après ton clic. Aucun contenu de page n’est lu.</p>
      </div>
      <button class="btn btn-secondary" type="button" @click="capture">
        <i class="pi pi-link" />
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

    <p v-if="message" class="task-capture-message" role="status">{{ message }}</p>
    <p v-if="error" class="task-capture-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.task-capture-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
  padding: var(--sg-crm-toolbar-padding);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--sg-crm-card-radius);
}

.task-capture-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sg-sidebar-form-gap);
}

.task-capture-heading h2,
.task-capture-heading p,
.task-capture-message,
.task-capture-error {
  margin: 0;
}

.task-capture-heading p,
.task-capture-message,
.task-capture-error {
  color: var(--text-color-secondary);
  font-size: var(--sg-crm-secondary-copy-size);
}

.task-capture-error { color: var(--red-500); }
</style>
