<template>
  <div
    class="avatar-editor"
    :class="{ 'avatar-editor--compact': compact }"
  >
    <div class="avatar-editor__preview" aria-hidden="true">
      <img v-if="draftAvatar" :src="draftAvatar" alt="" />
      <span v-else>{{ draftEmoji || DEFAULT_EMOJI }}</span>
    </div>

    <div class="avatar-editor__content">
      <div class="avatar-editor__actions">
        <Button label="Choisir une photo" icon="pi pi-camera" outlined size="small" @click="fileInput?.click()" />
        <Button v-if="draftAvatar" label="Retirer la photo" text size="small" @click="removePhoto" />
        <input
          ref="fileInput"
          class="avatar-editor__file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="handleFileChange"
        />
      </div>

      <fieldset class="avatar-editor__emojis">
        <legend>Choisir un emoji</legend>
        <button
          v-for="emoji in EMOJIS"
          :key="emoji"
          type="button"
          class="avatar-editor__emoji"
          :class="{ 'avatar-editor__emoji--selected': !draftAvatar && draftEmoji === emoji }"
          :aria-label="`Utiliser l’emoji ${emoji}`"
          :aria-pressed="String(!draftAvatar && draftEmoji === emoji)"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </fieldset>

      <p v-if="errorMessage" class="avatar-editor__error" role="alert">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { PROFILE_AVATAR_MAX_LENGTH } from "@/stores/profiles"
import Button from "./ui/SgButton.vue"

const props = withDefaults(
  defineProps<{ avatar?: string; emoji: string; compact?: boolean }>(),
  { compact: false },
)
const emit = defineEmits<{ change: [value: { avatar?: string; emoji: string }] }>()

const DEFAULT_EMOJI = "🟦"
const EMOJIS = ["🟦", "🟥", "🟩", "🟨", "🟪", "🟧", "⬛", "🔵", "😀", "🙂", "😎", "✨", "🌟", "🚀", "🎨", "💼"]
const SUPPORTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const draftAvatar = ref<string | undefined>()
const draftEmoji = ref(DEFAULT_EMOJI)
const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref("")

function syncDraft() {
  draftAvatar.value = props.avatar
  draftEmoji.value = props.emoji || DEFAULT_EMOJI
  errorMessage.value = ""
}

function notifyChange() {
  emit("change", { avatar: draftAvatar.value, emoji: draftEmoji.value || DEFAULT_EMOJI })
}

function selectEmoji(emoji: string) {
  draftEmoji.value = emoji
  draftAvatar.value = undefined
  notifyChange()
}

function removePhoto() {
  draftAvatar.value = undefined
  notifyChange()
}

function handleFileChange(event: Event) {
  errorMessage.value = ""
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!SUPPORTED_TYPES.has(file.type)) {
    errorMessage.value = "Choisissez une image PNG, JPEG, WebP ou GIF."
    input.value = ""
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : ""
    if (!result || result.length > PROFILE_AVATAR_MAX_LENGTH) {
      errorMessage.value = "Cette image est trop volumineuse. Choisissez une image de moins de 300 Ko."
    } else {
      draftAvatar.value = result
      notifyChange()
    }
    input.value = ""
  }
  reader.onerror = () => {
    errorMessage.value = "Impossible de lire cette image."
    input.value = ""
  }
  reader.readAsDataURL(file)
}

watch(() => [props.avatar, props.emoji], syncDraft, { immediate: true })
</script>

<style scoped>
.avatar-editor { display: flex; flex-wrap: wrap; gap: var(--sg-space-4); align-items: start; }
.avatar-editor__preview { display: grid; place-items: center; width: var(--sg-avatar-size-lg); height: var(--sg-avatar-size-lg); overflow: hidden; border-radius: var(--sg-radius-pill); background: var(--sg-color-surface-muted); }
.avatar-editor__preview img { width: var(--sg-size-full); height: var(--sg-size-full); object-fit: cover; }
.avatar-editor__content { display: flex; min-width: min(var(--sg-sidebar-dialog-width), var(--sg-size-full)); flex: 1; flex-direction: column; gap: var(--sg-space-3); }
.avatar-editor__actions { display: flex; flex-wrap: wrap; gap: var(--sg-space-2); }
.avatar-editor__file { display: none; }
.avatar-editor__emojis { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--sg-control-height-sm), 1fr)); gap: var(--sg-space-1); margin: 0; padding: var(--sg-space-2); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); }
.avatar-editor__emojis legend { padding: 0 var(--sg-space-1); color: var(--sg-color-text-muted); }
.avatar-editor__emoji { min-width: var(--sg-control-height-sm); min-height: var(--sg-control-height-sm); border: 1px solid transparent; border-radius: var(--sg-radius-sm); background: transparent; cursor: pointer; }
.avatar-editor__emoji:hover { background: var(--sg-color-surface-hover); }
.avatar-editor__emoji--selected { border-color: var(--sg-color-action); background: var(--sg-color-surface-muted); }
.avatar-editor__emoji:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.avatar-editor__error { margin: 0; color: var(--sg-color-danger-text); }
.avatar-editor--compact { gap: var(--sg-space-2); }
.avatar-editor--compact .avatar-editor__content { min-width: 0; gap: var(--sg-space-2); }
.avatar-editor--compact .avatar-editor__emojis { padding: var(--sg-space-1); }
</style>
