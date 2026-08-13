<template>
  <SgDialog
    :model-value="modelValue"
    title="Image du profil"
    description="Choisissez une photo depuis votre appareil ou un emoji."
    variant="sidebar"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form
      class="avatar-dialog"
      @submit.prevent="save"
    >
      <ProfileAvatarEditor
        :avatar="draftAvatar"
        :emoji="draftEmoji"
        @change="updateDraft"
      />
      <div class="avatar-dialog__actions">
        <Button
          label="Annuler"
          text
          type="button"
          @click="emit('update:modelValue', false)"
        />
        <Button
          label="Enregistrer"
          type="submit"
        />
      </div>
    </form>
  </SgDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import SgDialog from "./ui/SgDialog.vue"
import Button from "./ui/SgButton.vue"
import ProfileAvatarEditor from "./ProfileAvatarEditor.vue"

const props = defineProps<{ modelValue: boolean; avatar?: string; emoji: string }>()
const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  save: [value: { avatar?: string; emoji: string }]
}>()
const draftAvatar = ref<string | undefined>()
const draftEmoji = ref("🟦")

function updateDraft(value: { avatar?: string; emoji: string }) {
  draftAvatar.value = value.avatar
  draftEmoji.value = value.emoji
}
function save() { emit("save", { avatar: draftAvatar.value, emoji: draftEmoji.value }) }
watch(() => props.modelValue, (open) => {
  if (!open) return
  draftAvatar.value = props.avatar
  draftEmoji.value = props.emoji || "🟦"
})
</script>

<style scoped>
.avatar-dialog { display: flex; flex-direction: column; gap: var(--sg-space-5); padding: var(--sg-space-5); }
.avatar-dialog__actions { display: flex; justify-content: flex-end; gap: var(--sg-space-2); }
</style>
