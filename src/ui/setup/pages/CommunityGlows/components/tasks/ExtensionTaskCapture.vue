<script setup lang="ts">
import { ref, watch } from "vue"
import { saveExtensionTask } from "@/platform/extensionState"
import { captureActiveTabUrl } from "@/platform/extensionTaskCapture"
import type { ContextualTaskInput } from "@/services/contextualTasksService"
import TaskForm from "./TaskForm.vue"
import { useKanbanContactsStore, useLocalKanbanContactsStore } from "@/stores/kanbanContacts"
import { isAuthenticated } from "@/lib/convexAuth"
import { prefersLocalKanban } from "@/lib/localKanbanPreference"
import type { KanbanContact } from "@/services/kanbanContactsService"
const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const capturedUrl = ref("")
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const formVisible = ref(false)
const mode = ref<"choice" | "task" | "contact">("choice")
const preferredCreateMode = ref<"task" | "contact">(readPreferredCreateMode())
const createMenuOpen = ref(false)
const contactName = ref("")
const contactUrl = ref("")
const contactNote = ref("")
const attachTask = ref(false)
const attachedTaskTitle = ref("")
const attachedTaskUrl = ref("")
const savedContact = ref<KanbanContact | null>(null)
const contactsStore = useKanbanContactsStore()
const localContactsStore = useLocalKanbanContactsStore()
const emit = defineEmits<{ draftChange: [pending: boolean] }>()
watch(formVisible, value => emit("draftChange", value), { immediate: true })
const busy = ref(false)
const CREATE_MODE_KEY = "communityglows.extension-popup-create-mode"
function readPreferredCreateMode(): "task" | "contact" {
  try { return localStorage.getItem("communityglows.extension-popup-create-mode") === "contact" ? "contact" : "task" }
  catch { return "task" }
}
function selectCreateMode(next: "task" | "contact") {
  preferredCreateMode.value = next
  createMenuOpen.value = false
  try { localStorage.setItem(CREATE_MODE_KEY, next) } catch { /* Popup preference is optional. */ }
}
function closeCreateMenuOnFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  const currentTarget = event.currentTarget
  if (!(currentTarget instanceof HTMLElement) || !(nextTarget instanceof Node) || !currentTarget.contains(nextTarget)) createMenuOpen.value = false
}
function startContact() { mode.value = "contact"; formVisible.value = true; message.value = null; error.value = null; savedContact.value = null }
async function startTask() {
  error.value = null
  message.value = null
  busy.value = true
  try {
    const result = await captureActiveTabUrl()
    capturedUrl.value = result.ok ? result.url : ""
    mode.value = "task"
    formVisible.value = true
    if (result.ok && result.removedSensitiveParts) message.value = "extension.repair.cleaned"
  } finally {
    busy.value = false
  }
}
function startPreferredCreation() {
  if (preferredCreateMode.value === "contact") startContact()
  else void startTask()
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
async function createContact(input?: ContextualTaskInput) {
  busy.value = true
  error.value = null
  try {
    const store = prefersLocalKanban() || !isAuthenticated.value ? localContactsStore : contactsStore
    if (!savedContact.value) {
      const contact = store.create({ name: contactName.value, url: contactUrl.value, note: contactNote.value })
      if (!contact) throw new Error("contact_create_failed")
      savedContact.value = contact
    }
    if (attachTask.value && input) {
      await saveExtensionTask({ ...input, people: [{ name: savedContact.value.name }], contactIds: [savedContact.value.id] })
      message.value = "extension.repair.contact_and_task_created"
    } else {
      message.value = "extension.repair.contact_created"
    }
    formVisible.value = false
  } catch {
    error.value = savedContact.value ? "extension.repair.contact_saved_task_error" : "extension.repair.storage_error"
  } finally { busy.value = false }
}
</script>
<template>
  <section
    class="ext-task-capture-panel"
    :class="{
      'ext-task-capture-panel--compact': props.compact,
      'ext-task-capture-panel--form-open': props.compact && formVisible,
    }"
  >
    <div class="ext-task-capture-heading">
      <div v-if="formVisible">
        <h2>{{ $t(mode === 'contact' && formVisible ? 'extension.repair.new_contact' : 'extension.repair.capture_title') }}</h2>
        <p v-if="!props.compact">{{ $t("extension.repair.capture_description") }}</p>
      </div>
      <template v-if="!formVisible">
      <div class="ext-create-action" @mouseenter="createMenuOpen = true" @mouseleave="createMenuOpen = false" @focusin="createMenuOpen = true" @focusout="closeCreateMenuOnFocusOut">
        <button class="ext-btn ext-btn--secondary" type="button" :disabled="busy" aria-haspopup="menu" :aria-expanded="createMenuOpen" @click="startPreferredCreation">
          {{ $t('extension.repair.create') }} {{ $t(preferredCreateMode === 'task' ? 'extension.repair.task_indefinite' : 'extension.repair.contact_indefinite') }}
        </button>
        <div v-if="createMenuOpen" class="ext-create-menu" role="menu" @keydown.escape="createMenuOpen = false">
          <button type="button" role="menuitem" @click="selectCreateMode(preferredCreateMode === 'task' ? 'contact' : 'task')">
            {{ $t(preferredCreateMode === 'task' ? 'extension.repair.contact_indefinite' : 'extension.repair.task_indefinite') }}
          </button>
        </div>
      </div>
      </template>
    </div>
    <TaskForm
      v-if="formVisible && mode === 'task'"
      :initial-url="capturedUrl"
      :busy="busy"
      :compact="props.compact"
      :submit-label="$t('extension.repair.save')"
      @submit="createTask"
      @cancel="formVisible = false"
    />
    <div v-if="formVisible && mode === 'contact'" class="ext-contact-form">
      <label><span>{{ $t('extension.repair.contact_name') }}</span><input v-model="contactName" required maxlength="120" autofocus /></label>
      <label><span>{{ $t('extension.repair.contact_url') }}</span><input v-model="contactUrl" type="url" inputmode="url" /></label>
      <label><span>{{ $t('extension.repair.contact_note') }}</span><textarea v-model="contactNote" rows="2" maxlength="4000" /></label>
      <label class="ext-contact-toggle"><input v-model="attachTask" type="checkbox" /> <span>{{ $t('extension.repair.attach_task') }}</span></label>
      <template v-if="attachTask">
        <label><span>{{ $t('extension.repair.task_title') }}</span><input v-model="attachedTaskTitle" required maxlength="160" /></label>
        <label><span>{{ $t('tasks.form.context_url') }}</span><input v-model="attachedTaskUrl" type="url" inputmode="url" /></label>
      </template>
      <div class="ext-contact-actions"><button class="ext-btn ext-btn--outline" type="button" :disabled="busy" @click="formVisible = false">{{ $t('common.cancel') }}</button><button class="ext-btn ext-btn--primary" type="button" :disabled="busy || !contactName.trim() || (attachTask && !attachedTaskTitle.trim())" @click="createContact(attachTask ? { title: attachedTaskTitle, url: attachedTaskUrl, status: 'todo', priority: 'normal', people: [], links: [], tags: [], contactIds: [] } : undefined)">{{ attachTask ? $t('extension.repair.save_contact_task') : $t('extension.repair.save_contact') }}</button></div>
    </div>
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
.ext-contact-form { display: grid; gap: var(--sg-space-0d5rem); }
.ext-contact-form > label:not(.ext-contact-toggle) { display: grid; gap: var(--sg-space-0d25rem); }
.ext-contact-form label span { color: var(--sg-color-text-muted); font-size: var(--sg-crm-secondary-copy-size); }
.ext-contact-form input:not([type=checkbox]), .ext-contact-form textarea { width: 100%; min-width: 0; }
.ext-contact-toggle { display: flex; align-items: center; gap: var(--sg-space-0d5rem); }
.ext-contact-actions { display: flex; justify-content: flex-end; gap: var(--sg-space-0d5rem); }
.ext-task-capture-panel--compact .ext-task-capture-heading { justify-content: flex-start; align-items: center; }
.ext-task-capture-panel--compact .ext-task-capture-heading > div { flex: 1 0 100%; }
.ext-task-capture-panel--compact:not(.ext-task-capture-panel--form-open) { gap: 0; padding: 0; background: transparent; border: 0; }
.ext-task-capture-panel--compact:not(.ext-task-capture-panel--form-open) .ext-task-capture-heading { flex-wrap: nowrap; }
.ext-create-action { position: relative; display: inline-flex; flex: 0 0 auto; min-width: 0; }
.ext-create-action > button:first-child { flex: 1; }
.ext-create-menu { position: absolute; z-index: 20; inset-block-end: calc(100% + 4px); inset-inline: 0; width: 100%; min-width: 0; box-sizing: border-box; display: grid; padding: 4px; background: var(--sg-color-surface-raised); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); box-shadow: var(--sg-shadow-md); }
.ext-create-menu button { padding: 8px 10px; border: 0; text-align: end; background: transparent; color: var(--sg-color-text); cursor: pointer; }
.ext-create-menu button:hover, .ext-create-menu button[aria-current="true"] { background: var(--sg-color-surface-muted); }
.ext-task-capture-panel--form-open { flex: 1 1 100%; min-width: 0; }
</style>
