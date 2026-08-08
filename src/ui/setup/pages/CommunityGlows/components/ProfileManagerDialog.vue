<template>
  <SgDialog
    v-model="open"
    title="Gérer les profils"
    description="Configurez une fois l’identité et les réseaux disponibles pour chaque profil."
    variant="settings"
  >
    <div class="profile-manager">
      <nav
        class="profile-manager__list"
        aria-label="Profils"
      >
        <button
          v-for="profile in profilesStore.profiles"
          :key="profile.id"
          type="button"
          class="profile-manager__profile"
          :class="{
            'profile-manager__profile--selected':
              profile.id === selectedProfileId,
          }"
          :aria-pressed="profile.id === selectedProfileId"
          @click="editProfile(profile.id)"
        >
          <img
            v-if="profile.avatar"
            :src="profile.avatar"
            alt=""
            class="profile-manager__thumb"
          />
          <span
            v-else
            class="profile-manager__emoji"
          >
            {{ profile.emoji }}
          </span>
          <span>{{ profile.name }}</span>
        </button>
        <Button
          label="Nouveau profil"
          icon="pi pi-plus"
          outlined
          size="small"
          @click="startCreate"
        />
      </nav>

      <form
        class="profile-manager__form"
        @submit.prevent="saveProfile"
      >
        <h3>
          {{
            isCreating
              ? "Nouveau profil"
              : `Modifier ${draft.name || "le profil"}`
          }}
        </h3>

        <div class="profile-manager__identity">
          <div
            class="profile-manager__avatar-preview"
            aria-hidden="true"
          >
            <img
              v-if="draft.avatar"
              :src="draft.avatar"
              alt=""
            />
            <span v-else>{{ draft.emoji || DEFAULT_EMOJI }}</span>
          </div>
          <div class="profile-manager__avatar-actions">
            <Button
              label="Choisir une photo"
              icon="pi pi-camera"
              outlined
              size="small"
              :aria-describedby="errorField === 'avatar' ? 'profile-manager-error' : undefined"
              @click="avatarInput?.click()"
            />
            <Button
              v-if="draft.avatar"
              label="Retirer la photo"
              text
              size="small"
              @click="draft.avatar = undefined"
            />
            <input
              ref="avatarInput"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              class="profile-manager__file"
              @change="handleAvatarChange"
            />
          </div>
        </div>

        <label class="profile-manager__field">
          <span>Nom</span>
          <input
            ref="nameInput"
            v-model="draft.name"
            :maxlength="PROFILE_NAME_MAX_LENGTH"
            autocomplete="off"
            required
            :aria-invalid="errorField === 'name' || undefined"
            :aria-describedby="errorField === 'name' ? 'profile-manager-error' : undefined"
          />
        </label>
        <label class="profile-manager__field profile-manager__field--emoji">
          <span>Emoji de remplacement</span>
          <input
            v-model="draft.emoji"
            :maxlength="PROFILE_EMOJI_MAX_LENGTH"
            autocomplete="off"
          />
        </label>

        <fieldset class="profile-manager__networks">
          <legend>Réseaux visibles</legend>
          <label
            v-for="network in builtInSocialNetworks"
            :key="network.id"
          >
            <input
              v-model="draft.visibleNetworks"
              type="checkbox"
              :value="network.id"
            />
            <span>{{ network.label }}</span>
          </label>
        </fieldset>

        <p
          v-if="errorMessage"
          id="profile-manager-error"
          class="profile-manager__error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div class="profile-manager__actions">
          <Button
            label="Annuler"
            text
            type="button"
            @click="cancelDraft"
          />
          <Button
            :label="isCreating ? 'Créer le profil' : 'Enregistrer'"
            type="submit"
            :disabled="!draft.name.trim()"
            :loading="submitting"
          />
        </div>

        <section
          v-if="!isCreating && selectedProfile"
          class="profile-manager__danger"
        >
          <template v-if="deleteConfirmationId !== selectedProfile.id">
            <div>
              <strong>Supprimer ce profil</strong>
              <p>
                La session de {{ selectedProfile.name }} et ses connexions
                réseau seront supprimées.
              </p>
            </div>
            <Button
              label="Supprimer…"
              severity="danger"
              outlined
              :disabled="profilesStore.profiles.length <= 1"
              @click="deleteConfirmationId = selectedProfile.id"
            />
            <p
              v-if="profilesStore.profiles.length <= 1"
              class="profile-manager__last-profile"
            >
              Le dernier profil doit être conservé.
            </p>
          </template>
          <template v-else>
            <p>
              Confirmer la suppression définitive de
              <strong>{{ selectedProfile.name }}</strong>
              ?
            </p>
            <div class="profile-manager__actions">
              <Button
                label="Conserver"
                text
                @click="deleteConfirmationId = null"
              />
              <Button
                :label="`Supprimer ${selectedProfile.name}`"
                severity="danger"
                :loading="deleting"
                @click="deleteSelectedProfile"
              />
            </div>
          </template>
        </section>
      </form>
    </div>
  </SgDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue"
import { builtInSocialNetworks } from "@/config/socialNetworks"
import {
  PROFILE_AVATAR_MAX_LENGTH,
  PROFILE_EMOJI_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
  useProfilesStore,
} from "@/stores/profiles"
import SgDialog from "./ui/SgDialog.vue"
import Button from "./ui/SgButton.vue"

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>()
const profilesStore = useProfilesStore()
const DEFAULT_EMOJI = "🟦"
const SUPPORTED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
])

type EditableDraft = {
  name: string
  emoji: string
  avatar?: string
  visibleNetworks: string[]
}

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})
const selectedProfileId = ref<string | null>(null)
const isCreating = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref("")
const errorField = ref<"name" | "avatar" | null>(null)
const submitting = ref(false)
const deleting = ref(false)
const deleteConfirmationId = ref<string | null>(null)
const draft = reactive<EditableDraft>({
  name: "",
  emoji: DEFAULT_EMOJI,
  visibleNetworks: [],
})

const selectedProfile = computed(() =>
  profilesStore.profiles.find(
    (profile) => profile.id === selectedProfileId.value,
  ),
)

function visibleNetworksFor(hiddenNetworks: string[] = []) {
  return builtInSocialNetworks
    .filter((network) => !hiddenNetworks.includes(network.id))
    .map((network) => network.id)
}

function resetDraft(profileId = profilesStore.activeProfileId) {
  const profile =
    profilesStore.profiles.find((item) => item.id === profileId) ??
    profilesStore.profiles[0]
  if (!profile) return startCreate()
  selectedProfileId.value = profile.id
  isCreating.value = false
  draft.name = profile.name
  draft.emoji = profile.emoji || DEFAULT_EMOJI
  draft.avatar = profile.avatar
  draft.visibleNetworks = visibleNetworksFor(profile.hiddenNetworks)
  errorMessage.value = ""
  errorField.value = null
  deleteConfirmationId.value = null
}

function editProfile(profileId: string) {
  resetDraft(profileId)
}

function startCreate() {
  selectedProfileId.value = null
  isCreating.value = true
  draft.name = ""
  draft.emoji = DEFAULT_EMOJI
  draft.avatar = undefined
  draft.visibleNetworks = builtInSocialNetworks
    .filter((network) => network.defaultSelected)
    .map((network) => network.id)
  errorMessage.value = ""
  errorField.value = null
  deleteConfirmationId.value = null
}

function cancelDraft() {
  emit("update:modelValue", false)
}

function saveProfile() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ""
  errorField.value = null
  const name = draft.name.trim()
  if (!name) {
    errorMessage.value = "Le nom du profil est obligatoire."
    errorField.value = "name"
    submitting.value = false
    nextTick(() => nameInput.value?.focus())
    return
  }
  const visible = new Set(draft.visibleNetworks)
  const hiddenNetworks = builtInSocialNetworks
    .filter((network) => !visible.has(network.id))
    .map((network) => network.id)
  const payload = {
    name,
    emoji: draft.emoji.trim() || DEFAULT_EMOJI,
    avatar: draft.avatar,
    hiddenNetworks,
  }

  try {
    const profile = isCreating.value
      ? profilesStore.create(payload)
      : profilesStore.update(selectedProfileId.value ?? "", payload)
    if (!profile) throw new Error("Profil introuvable.")
    emit("update:modelValue", false)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Impossible d’enregistrer ce profil."
    submitting.value = false
  }
}

function handleAvatarChange(event: Event) {
  errorMessage.value = ""
  errorField.value = null
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!SUPPORTED_AVATAR_TYPES.has(file.type)) {
    errorMessage.value = "Choisissez une image PNG, JPEG, WebP ou GIF."
    errorField.value = "avatar"
    input.value = ""
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : ""
    if (!result || result.length > PROFILE_AVATAR_MAX_LENGTH) {
      errorMessage.value =
        "Cette image est trop volumineuse. Choisissez une image de moins de 300 Ko."
      errorField.value = "avatar"
    } else {
      draft.avatar = result
    }
    input.value = ""
  }
  reader.onerror = () => {
    errorMessage.value = "Impossible de lire cette image."
    errorField.value = "avatar"
    input.value = ""
  }
  reader.readAsDataURL(file)
}

async function deleteSelectedProfile() {
  const profile = selectedProfile.value
  if (!profile || profilesStore.profiles.length <= 1 || deleting.value) return
  deleting.value = true
  errorMessage.value = ""
  try {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      const { invoke } = await import("@tauri-apps/api/core")
      await invoke("delete_profile_session", { profileId: profile.id })
    }
    profilesStore.remove(profile.id)
    emit("update:modelValue", false)
  } catch {
    errorMessage.value = `La session de ${profile.name} n’a pas pu être supprimée. Le profil a été conservé.`
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    submitting.value = false
    if (isOpen) resetDraft()
  },
)
</script>

<style scoped>
.profile-manager {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: var(--sg-space-5);
  padding: var(--sg-space-5);
}
.profile-manager__list {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-2);
}
.profile-manager__profile {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  width: var(--sg-size-full);
  padding: var(--sg-space-2);
  border: 1px solid transparent;
  border-radius: var(--sg-radius-sm);
  background: transparent;
  color: var(--sg-color-text);
  text-align: left;
  cursor: pointer;
}
.profile-manager__profile:hover {
  background: var(--sg-color-surface-hover);
}
.profile-manager__profile:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}
.profile-manager__profile--selected {
  border-color: var(--sg-color-action);
  background: var(--sg-color-surface-muted);
}
.profile-manager__thumb,
.profile-manager__avatar-preview {
  width: var(--sg-avatar-size-lg);
  height: var(--sg-avatar-size-lg);
  border-radius: var(--sg-radius-pill);
  object-fit: cover;
}
.profile-manager__emoji {
  display: grid;
  width: var(--sg-avatar-size-lg);
  height: var(--sg-avatar-size-lg);
  place-items: center;
}
.profile-manager__form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-4);
  min-width: 0;
}
.profile-manager__form h3 {
  margin: 0;
}
.profile-manager__identity {
  display: flex;
  align-items: center;
  gap: var(--sg-space-3);
}
.profile-manager__avatar-preview {
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--sg-color-surface-muted);
}
.profile-manager__avatar-preview img {
  width: var(--sg-size-full);
  height: var(--sg-size-full);
  object-fit: cover;
}
.profile-manager__avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-2);
}
.profile-manager__file {
  display: none;
}
.profile-manager__field {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1);
  font-weight: 600;
}
.profile-manager__field input {
  min-height: var(--sg-control-height-sm);
  padding: var(--sg-control-padding-sm);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font: inherit;
}
.profile-manager__field--emoji {
  max-width: var(--sg-sidebar-dialog-width);
}
.profile-manager__networks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sg-space-2);
  margin: 0;
  padding: var(--sg-space-3);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
}
.profile-manager__networks legend {
  padding: 0 var(--sg-space-1);
  font-weight: 600;
}
.profile-manager__networks label {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
}
.profile-manager__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sg-space-2);
}
.profile-manager__error {
  margin: 0;
  color: var(--sg-color-danger-text);
}
.profile-manager__danger {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-3);
  margin-top: var(--sg-space-3);
  padding-top: var(--sg-space-4);
  border-top: 1px solid var(--sg-color-border);
}
.profile-manager__danger p {
  margin: var(--sg-space-1) 0 0;
  color: var(--sg-color-text-muted);
}
.profile-manager__last-profile {
  flex-basis: var(--sg-size-full);
}
</style>
