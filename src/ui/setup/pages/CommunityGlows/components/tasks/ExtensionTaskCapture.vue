<script setup lang="ts">
import { ref, watch } from "vue"
import { saveExtensionTask } from "@/platform/extensionState"
import { captureActiveTabUrl } from "@/platform/extensionTaskCapture"
import { openExtensionDashboard } from "@/platform/extensionNetworkLauncher"
import type { ContextualTaskInput } from "@/services/contextualTasksService"
import TaskForm from "./TaskForm.vue"
const capturedUrl = ref("")
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const formVisible = ref(false)
const emit = defineEmits<{ draftChange: [pending: boolean] }>()
watch(formVisible, value => emit("draftChange", value), { immediate: true })
const busy = ref(false)
function manual() { capturedUrl.value = ""; formVisible.value = true; message.value = null; error.value = null }
async function capture() {
  error.value = null
  message.value = null
  busy.value = true
  try {
    const result = await captureActiveTabUrl()
    formVisible.value = true
    if (!result.ok) {
      capturedUrl.value = ""
      error.value = "extension.repair.capture_error"
      return
    }
    capturedUrl.value = result.url
    message.value = result.removedSensitiveParts ? "extension.repair.cleaned" : "extension.repair.captured"
  } finally {
    busy.value = false
  }
}
async function createTask(input: ContextualTaskInput) {
  busy.value = true
  error.value = null
  try {
    await saveExtensionTask(input)
    message.value = "extension.repair.created"
    formVisible.value = false
  } catch {
    error.value = "extension.repair.storage_error"
  } finally {
    busy.value = false
  }
}
async function viewTasks() {
  const result = await openExtensionDashboard("/setup/tasks")
  if (!result.ok) error.value = "extension.launch.errors." + result.code
}
</script>
<template>
  <section class="ext-task-capture-panel">
    <div class="ext-task-capture-heading">
      <div>
        <h2>{{ $t("extension.repair.capture_title") }}</h2>
        <p>{{ $t("extension.repair.capture_description") }}</p>
      </div>
      <button
        class="ext-btn ext-btn--small ext-btn--secondary"
        type="button"
        :disabled="busy"
        @click="capture"
      >
        {{ $t("extension.repair.capture") }}
      </button>
      <button
        class="ext-btn ext-btn--small ext-btn--outline"
        type="button"
        :disabled="busy"
        @click="manual"
      >
        {{ $t("extension.repair.manual") }}
      </button>
      <button
        class="ext-btn ext-btn--small ext-btn--outline"
        type="button"
        @click="viewTasks"
      >
        {{ $t("extension.repair.view_tasks") }}
      </button>
    </div>
    <TaskForm
      v-if="formVisible"
      :initial-url="capturedUrl"
      :busy="busy"
      :submit-label="$t('extension.repair.save')"
      @submit="createTask"
      @cancel="formVisible = false"
    />
    <p
      v-if="message"
      class="ext-task-capture-message"
      role="status"
    >
      {{ $t(message) }}
    </p>
    <p
      v-if="error"
      class="ext-task-capture-error"
      role="alert"
    >
      {{ $t(error) }}
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

.ext-task-capture-error {
  color: var(--sg-color-danger);
}
</style>
