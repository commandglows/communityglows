<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SgButton from '../ui/SgButton.vue'
import SgDialog from '../ui/SgDialog.vue'
import SgIcon from '../ui/SgIcon.vue'
import TaskForm from './TaskForm.vue'
import { useContextualTasksStore, useLocalTasksStore, type ContextualTaskInput } from '@/stores/contextualTasks'
import { useKanbanContactsStore, useLocalKanbanContactsStore, type KanbanContactInput, type KanbanContactProfileLink } from '@/stores/kanbanContacts'
import { useKanbanItemDialogStore } from '@/stores/kanbanItemDialog'
import { useProfilesStore } from '@/stores/profiles'
import { builtInSocialNetworks } from '@/config/socialNetworks'

const route = useRoute()
const { t } = useI18n()
const dialog = useKanbanItemDialogStore()
const profilesStore = useProfilesStore()
const accountTasksStore = useContextualTasksStore()
const localTasksStore = useLocalTasksStore()
const accountContactsStore = useKanbanContactsStore()
const localContactsStore = useLocalKanbanContactsStore()
const name = ref('')
const url = ref('')
const avatarUrl = ref('')
const profileLinks = ref<KanbanContactProfileLink[]>([])
const note = ref('')
const nextFollowUp = ref('')
const pinned = ref(false)
const failed = ref(false)
const pendingDelete = ref<'task' | 'contact' | null>(null)
const firstChoiceButton = ref<InstanceType<typeof SgButton> | null>(null)
const taskForm = ref<InstanceType<typeof TaskForm> | null>(null)
const contactNameInput = ref<HTMLInputElement | null>(null)

const isLocalKanban = computed(() => route.path.includes('local-kanban'))
const tasksStore = computed(() => isLocalKanban.value ? localTasksStore : accountTasksStore)
const contactsStore = computed(() => isLocalKanban.value ? localContactsStore : accountContactsStore)
const model = computed({
  get: () => dialog.open,
  set: value => {
    if (!value) dialog.close()
  },
})
const title = computed(() => {
  if (dialog.mode === 'choice') return t('tasks.dialog.title')
  if (dialog.mode === 'contact') return t(dialog.contact ? 'crm.edit_contact' : 'crm.new_contact')
  return t(dialog.task ? 'tasks.dialog.edit_task' : 'tasks.new_task')
})
const description = computed(() => {
  if (dialog.mode === 'choice') return t('tasks.dialog.description')
  if (dialog.mode === 'contact') return t(dialog.contact ? 'crm.dialog.edit_contact_description' : 'crm.dialog.new_contact_description')
  return t(dialog.task ? 'tasks.dialog.edit_task_description' : 'tasks.dialog.new_task_description')
})
const taskInitial = computed<ContextualTaskInput | undefined>(() => {
  if (dialog.task) return dialog.task
  if (!dialog.taskInitial) return undefined
  return {
    title: dialog.taskInitial.title ?? '',
    url: dialog.taskInitial.url,
    note: dialog.taskInitial.note,
    tags: dialog.taskInitial.tags,
    people: dialog.taskInitial.people,
    links: dialog.taskInitial.links,
    priority: dialog.taskInitial.priority,
    status: dialog.taskInitial.status,
    dueDate: dialog.taskInitial.dueDate,
    contactIds: dialog.taskInitial.contactIds,
  }
})
const canSaveContact = computed(() => name.value.trim().length > 0)
const networkOptions = computed(() => builtInSocialNetworks)
const usedProfileNetworkIds = computed(() => new Set(profileLinks.value.map(link => link.networkId)))
const canAddProfileLink = computed(() => profileLinks.value.length < networkOptions.value.length)

watch(() => [dialog.open, dialog.mode, dialog.contact, dialog.revision] as const, () => {
  if (!dialog.open || dialog.mode !== 'contact') return
  name.value = dialog.contact?.name ?? ''
  url.value = dialog.contact?.url ?? ''
  avatarUrl.value = dialog.contact?.avatarUrl ?? ''
  profileLinks.value = dialog.contact?.profileLinks?.length
    ? dialog.contact.profileLinks.map(link => ({ ...link }))
    : dialog.contact?.url
      ? [{ id: `profile-link-${crypto.randomUUID()}`, networkId: builtInSocialNetworks[0]?.id ?? 'twitter', url: dialog.contact.url }]
      : []
  note.value = dialog.contact?.note ?? ''
  nextFollowUp.value = dialog.contact?.nextFollowUp ?? ''
  pinned.value = dialog.contact?.pinned === true
  failed.value = false
}, { immediate: true })

watch(() => [dialog.open, dialog.mode, dialog.revision] as const, async () => {
  pendingDelete.value = null
  if (!dialog.open) return
  await nextTick()
  if (dialog.mode === 'choice') {
    firstChoiceButton.value?.$el?.focus?.()
    return
  }
  if (dialog.mode === 'task') {
    taskForm.value?.focusFirstField()
    return
  }
  contactNameInput.value?.focus()
}, { flush: 'post' })

onMounted(() => {
  accountTasksStore.initialize()
  localTasksStore.initialize()
  accountContactsStore.initialize()
  localContactsStore.initialize()
})

function saveTask(input: ContextualTaskInput) {
  const result = dialog.task
    ? tasksStore.value.update(dialog.task.id, input)
    : tasksStore.value.create({
      ...input,
      profileId: isLocalKanban.value ? undefined : profilesStore.activeProfileId ?? undefined,
    })
  if (!result) return
  dialog.close()
}

function removeTask() {
  if (!dialog.task) return
  if (pendingDelete.value !== 'task') {
    pendingDelete.value = 'task'
    return
  }
  tasksStore.value.remove(dialog.task.id)
  dialog.close()
}

function saveContact() {
  const input: KanbanContactInput = {
    name: name.value,
    url: profileLinks.value[0]?.url ?? url.value,
    avatarUrl: avatarUrl.value,
    profileLinks: profileLinks.value,
    note: note.value,
    nextFollowUp: nextFollowUp.value || undefined,
    pinned: pinned.value,
  }
  failed.value = dialog.contact
    ? !contactsStore.value.update(dialog.contact.id, input)
    : !contactsStore.value.create(input)
  if (!failed.value) dialog.close()
}

function unlinkContact(contactId: string) {
  for (const task of tasksStore.value.tasks) {
    if (!task.contactIds?.includes(contactId)) continue
    tasksStore.value.update(task.id, {
      contactIds: task.contactIds.filter(id => id !== contactId),
    })
  }
}

function removeContact() {
  if (!dialog.contact) return
  if (pendingDelete.value !== 'contact') {
    pendingDelete.value = 'contact'
    return
  }
  const contactId = dialog.contact.id
  if (!contactsStore.value.remove(contactId)) {
    failed.value = true
    return
  }
  unlinkContact(contactId)
  dialog.close()
}

function addProfileLink() {
  const nextNetwork = networkOptions.value.find(network => !usedProfileNetworkIds.value.has(network.id))
  if (!nextNetwork) return
  profileLinks.value = [
    ...profileLinks.value,
    {
      id: `profile-link-${crypto.randomUUID()}`,
      networkId: nextNetwork.id,
      url: '',
    },
  ]
}

function removeProfileLink(id: string) {
  profileLinks.value = profileLinks.value.filter(link => link.id !== id)
}

function networkFor(networkId: string) {
  return networkOptions.value.find(network => network.id === networkId) ?? networkOptions.value[0]
}

function availableNetworksFor(link: KanbanContactProfileLink) {
  return networkOptions.value.filter(network => network.id === link.networkId || !usedProfileNetworkIds.value.has(network.id))
}

function selectProfileNetwork(link: KanbanContactProfileLink, networkId: string, event: MouseEvent) {
  link.networkId = networkId
  ;(event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')
}
</script>

<template>
  <SgDialog
    v-model="model"
    :title="title"
    :description="description"
    variant="post-wide"
  >
    <div class="kanban-item-dialog">
      <div
        v-if="dialog.mode === 'choice'"
        class="item-choice"
      >
        <p class="item-choice__hint">{{ $t('tasks.dialog.choice_hint') }}</p>
        <SgButton
          ref="firstChoiceButton"
          :label="$t('tasks.new_task')"
          icon="pi pi-plus"
          type="button"
          @click="dialog.createTask()"
        />
        <p>{{ $t('tasks.dialog.task_choice_hint') }}</p>
        <SgButton
          :label="$t('crm.new_contact')"
          icon="pi pi-plus"
          outlined
          type="button"
          @click="dialog.createContact()"
        />
        <p>{{ $t('crm.dialog.contact_choice_hint') }}</p>
      </div>

      <div
        v-else-if="dialog.mode === 'task'"
        class="item-form"
      >
        <TaskForm
          ref="taskForm"
          :key="`task-${dialog.revision}-${dialog.task?.id ?? 'new'}`"
          :initial-task="taskInitial"
          :contacts="contactsStore.contacts"
          :submit-label="dialog.task ? $t('crm.save') : undefined"
          @submit="saveTask"
          @cancel="dialog.close"
        />
        <section
          v-if="dialog.task"
          class="danger-zone"
          :aria-label="$t('common.danger_zone')"
        >
          <div>
            <h3>{{ $t('common.danger_zone') }}</h3>
            <p>{{ $t('tasks.dialog.danger_zone_description') }}</p>
          </div>
          <p
            v-if="pendingDelete === 'task'"
            class="delete-confirmation"
            role="alert"
          >
            {{ $t('tasks.dialog.delete_task_confirmation') }}
          </p>
          <div class="danger-zone__actions">
            <SgButton
              v-if="pendingDelete === 'task'"
              :label="$t('common.cancel')"
              text
              type="button"
              @click="pendingDelete = null"
            />
            <SgButton
              :label="pendingDelete === 'task' ? $t('tasks.dialog.confirm_delete_task') : $t('tasks.dialog.delete_task')"
              icon="pi pi-trash"
              severity="danger"
              :text="pendingDelete !== 'task'"
              type="button"
              @click="removeTask"
            />
          </div>
        </section>
      </div>

      <form
        v-else
        class="item-form"
        @submit.prevent="saveContact"
      >
        <div class="contact-fields">
          <div class="contact-avatar-field">
            <span class="contact-avatar-field__label">{{ $t('crm.avatar_url') }}</span>
            <div class="contact-avatar-field__content">
              <span
                class="contact-avatar-preview"
                aria-hidden="true"
              >
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt=""
                />
                <span v-else>{{ name.trim().slice(0, 2).toLocaleUpperCase() || '—' }}</span>
              </span>
              <label>
                <span>{{ $t('crm.avatar_url') }}</span>
                <input
                  v-model="avatarUrl"
                  type="url"
                  placeholder="https://…"
                />
              </label>
            </div>
          </div>
          <label>
            <span>{{ $t('crm.name') }}</span>
            <input
              ref="contactNameInput"
              v-model="name"
              required
              maxlength="120"
              autocomplete="off"
            />
          </label>
          <label>
            <span>{{ $t('crm.next_follow_up') }}</span>
            <input
              v-model="nextFollowUp"
              type="date"
            />
          </label>
        </div>
        <section class="contact-profile-links">
          <div class="contact-profile-links__header">
            <div>
              <h3>{{ $t('crm.profile_links') }}</h3>
              <p>{{ $t('crm.profile_links_hint') }}</p>
            </div>
            <SgButton
              :label="$t('crm.add_profile_link')"
              icon="pi pi-plus"
              outlined
              type="button"
              :disabled="!canAddProfileLink"
              @click="addProfileLink"
            />
          </div>
          <div
            v-if="profileLinks.length"
            class="contact-profile-links__list"
          >
            <div
              v-for="link in profileLinks"
              :key="link.id"
              class="contact-profile-link-row"
            >
              <span
                class="contact-profile-link-row__icon"
                :style="{ color: networkFor(link.networkId)?.color }"
                aria-hidden="true"
              >
                <SgIcon :icon="networkFor(link.networkId)?.icon" />
              </span>
              <div class="contact-network-picker">
                <span class="contact-network-picker__label">{{ $t('crm.profile_network') }}</span>
                <details>
                  <summary>
                    <SgIcon :icon="networkFor(link.networkId)?.icon" />
                    <span>{{ networkFor(link.networkId)?.label }}</span>
                  </summary>
                  <div class="contact-network-picker__menu">
                    <button
                      v-for="network in availableNetworksFor(link)"
                      :key="network.id"
                      type="button"
                      @click="selectProfileNetwork(link, network.id, $event)"
                    >
                      <SgIcon :icon="network.icon" />
                      {{ network.label }}
                    </button>
                  </div>
                </details>
              </div>
              <label>
                <span>{{ $t('crm.profile_url') }}</span>
                <input
                  v-model="link.url"
                  type="text"
                  :placeholder="$t('crm.profile_url_placeholder')"
                  @keydown.enter.stop.prevent
                />
              </label>
              <SgButton
                :label="$t('crm.remove_profile_link')"
                icon="pi pi-trash"
                text
                type="button"
                @click="removeProfileLink(link.id)"
              />
            </div>
          </div>
          <p
            v-else
            class="contact-profile-links__empty"
          >
            {{ $t('crm.no_profile_links') }}
          </p>
        </section>
        <label class="contact-pin">
          <input
            v-model="pinned"
            type="checkbox"
          />
          <span>{{ $t('crm.pin_contact') }}</span>
        </label>
        <label>
          <span>{{ $t('crm.follow_up_notes') }}</span>
          <textarea
            v-model="note"
            rows="3"
            maxlength="4000"
          />
        </label>
        <p
          v-if="failed"
          role="alert"
        >
          {{ $t('crm.save_failed') }}
        </p>
        <section
          v-if="dialog.contact"
          class="danger-zone"
          :aria-label="$t('common.danger_zone')"
        >
          <div>
            <h3>{{ $t('common.danger_zone') }}</h3>
            <p>{{ $t('crm.dialog.danger_zone_description') }}</p>
          </div>
          <p
            v-if="pendingDelete === 'contact'"
            class="delete-confirmation"
            role="alert"
          >
            {{ $t('crm.dialog.delete_contact_confirmation') }}
          </p>
          <div class="danger-zone__actions">
            <SgButton
              v-if="pendingDelete === 'contact'"
              :label="$t('common.cancel')"
              text
              type="button"
              @click="pendingDelete = null"
            />
            <SgButton
              :label="pendingDelete === 'contact' ? $t('crm.dialog.confirm_delete_contact') : $t('crm.delete_contact')"
              icon="pi pi-trash"
              severity="danger"
              :text="pendingDelete !== 'contact'"
              type="button"
              @click="removeContact"
            />
          </div>
        </section>
        <div class="dialog-actions">
          <span />
          <SgButton
            :label="$t('common.cancel')"
            text
            type="button"
            @click="dialog.close"
          />
          <SgButton
            :label="$t('crm.save')"
            type="submit"
            :disabled="!canSaveContact"
          />
        </div>
      </form>
    </div>
  </SgDialog>
</template>

<style scoped>
.kanban-item-dialog {
  display: grid;
  gap: var(--sg-space-4);
  padding: 0 var(--sg-space-5) var(--sg-space-5);
}

.item-choice {
  display: grid;
  gap: var(--sg-space-2);
}

.item-choice :deep(button) {
  inline-size: 100%;
}

.item-choice p {
  margin: 0;
  color: var(--sg-color-text-muted);
}

.item-choice__hint {
  color: var(--sg-color-text);
}

.item-form {
  display: grid;
  gap: var(--sg-space-3);
}

.danger-zone {
  display: grid;
  gap: var(--sg-space-3);
  padding: var(--sg-space-3);
  border: var(--sg-border-1px) solid var(--sg-color-danger-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-danger-alpha-04);
}

.danger-zone h3,
.danger-zone p {
  margin: 0;
}

.danger-zone h3 {
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-base);
}

.danger-zone p {
  color: var(--sg-color-text-muted);
}

.delete-confirmation {
  padding: var(--sg-space-3);
  border: var(--sg-border-1px) solid var(--sg-color-danger-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-danger-soft);
  color: var(--sg-color-danger-text);
}

.danger-zone__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--sg-space-2);
}

.danger-zone__actions :deep(.sg-button--danger.sg-button--text) {
  background: var(--sg-color-danger-alpha-04);
}

.danger-zone__actions :deep(.sg-button--danger.sg-button--text:hover) {
  background: var(--sg-color-danger-alpha-08);
}

.contact-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--sg-tasks-form-column-min-width)), 1fr));
  gap: var(--sg-space-3);
}

label {
  display: grid;
  gap: var(--sg-space-1);
  min-width: 0;
}

label span {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.contact-pin {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
}

.contact-pin input {
  width: auto;
}

input,
textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--sg-space-2);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  color: var(--sg-color-text);
  background: var(--sg-color-background);
  font: inherit;
}

input:focus-visible,
textarea:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.contact-avatar-field {
  grid-column: 1 / -1;
  display: grid;
  gap: var(--sg-space-1);
}

.contact-avatar-field__label,
.contact-profile-links h3,
.contact-profile-links p {
  margin: 0;
}

.contact-avatar-field__label {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.contact-avatar-field__content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--sg-space-3);
  align-items: center;
}

.contact-avatar-preview {
  display: grid;
  place-items: center;
  inline-size: var(--sg-size-56px);
  block-size: var(--sg-size-56px);
  overflow: hidden;
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font-weight: var(--sg-font-weight-bold);
}

.contact-avatar-preview img {
  inline-size: var(--sg-size-100pct);
  block-size: var(--sg-size-100pct);
  object-fit: cover;
}

.contact-profile-links {
  display: grid;
  gap: var(--sg-space-3);
  padding: var(--sg-space-3);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
}

.contact-profile-links__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-2);
  align-items: flex-start;
  justify-content: space-between;
}

.contact-profile-links h3 {
  font-size: var(--sg-font-size-base);
}

.contact-profile-links p {
  color: var(--sg-color-text-muted);
}

.contact-profile-links__list {
  display: grid;
  gap: var(--sg-space-2);
}

.contact-profile-link-row {
  display: grid;
  grid-template-columns: auto minmax(0, var(--sg-size-200px)) minmax(0, 1fr) auto;
  gap: var(--sg-space-2);
  align-items: end;
}

.contact-profile-link-row__icon {
  display: grid;
  place-items: center;
  inline-size: var(--sg-size-2rem);
  block-size: var(--sg-size-2rem);
  margin-block-end: var(--sg-space-2);
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-surface-muted);
}

.contact-network-picker {
  display: grid;
  gap: var(--sg-space-1);
  min-width: 0;
}

.contact-network-picker__label {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.contact-network-picker details {
  position: relative;
}

.contact-network-picker summary {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  width: 100%;
  box-sizing: border-box;
  padding: var(--sg-space-2);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  color: var(--sg-color-text);
  background: var(--sg-color-background);
  cursor: pointer;
}

.contact-network-picker summary:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.contact-network-picker__menu {
  position: absolute;
  z-index: var(--sg-layer-dropdown);
  inset-block-start: calc(100% + var(--sg-space-1));
  inset-inline: 0;
  display: grid;
  max-block-size: var(--sg-size-20rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: var(--sg-size-thin);
  padding: var(--sg-space-1);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-control);
}

.contact-network-picker__menu button {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  width: 100%;
  padding: var(--sg-button-padding);
  border: 0;
  border-radius: var(--sg-radius-sm);
  color: var(--sg-color-text);
  background: transparent;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.contact-network-picker__menu button:hover,
.contact-network-picker__menu button:focus-visible {
  background: var(--sg-color-surface-hover);
}

.dialog-actions {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: var(--sg-space-2);
  align-items: center;
}
</style>
