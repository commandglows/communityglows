<template>
  <div
    class="create-post"
    :class="networkClass"
  >
    <div class="post-composer">
      <SocialAvatar 
        :user="currentUser"
        size="normal"
      />
      <div class="composer-input">
        <Button 
          class="start-post"
          text
          @click="showDialog = true"
        >
          <span>{{ resolvedPlaceholder }}</span>
        </Button>
        <div class="post-types">
          <slot name="post-types">
            <Button
              v-for="type in postTypes"
              :key="type.id"
              :icon="type.icon"
              :label="type.label"
              text
              class="flex-1"
              @click="handleTypeClick(type)"
            />
          </slot>
        </div>
      </div>
    </div>

    <SgDialog
      v-model="showDialog"
      :title="resolvedDialogTitle"
      variant="post"
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <SocialAvatar 
            :user="currentUser"
            size="normal"
          />
          <div class="post-settings">
            <h4>{{ currentUser.name }}</h4>
            <SgSelect
              v-model="privacy"
              :options="privacyOptions"
              :placeholder="$t('post.privacy_placeholder')"
              :aria-label="$t('post.privacy_placeholder')"
              class="privacy-dropdown"
            />
          </div>
        </div>
        
        <div class="post-editor">
          <SgTextarea
            v-model="postContent"
            :placeholder="resolvedEditorPlaceholder"
            :aria-label="resolvedEditorPlaceholder"
            :auto-resize="true"
            rows="5"
            class="w-full"
          />

          <div
            v-if="selectedFiles.length"
            class="selected-files"
          >
            <div
              v-for="(file, index) in selectedFiles" 
              :key="index" 
              class="file-preview"
            >
              <img
                v-if="file.type.startsWith('image/')" 
                :src="file.preview" 
                :alt="file.file.name"
              />
              <video
                v-else-if="file.type.startsWith('video/')"
                controls
              >
                <source
                  :src="file.preview"
                  :type="file.type"
                >
              </video>
              <div class="file-overlay">
                <Button 
                  icon="pi pi-times" 
                  :aria-label="`Retirer ${file.file.name}`"
                  severity="danger"
                  text
                  rounded
                  @click="removeFile(index)"
                />
              </div>
            </div>
          </div>

          <div class="add-to-post">
            <h5>{{ $t('post.add_to_post_title') }}</h5>
            <div class="post-tools">
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*,video/*"
                class="hidden-upload"
                :aria-label="$t('post.add_to_post_title')"
                @change="onFileSelect"
              />
              <Button
                v-for="tool in postTools"
                :key="tool.id"
                :icon="tool.icon"
                :severity="tool.severity"
                :aria-label="tool.label"
                text
                rounded
                @click="handleToolClick(tool)"
              />
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <Button 
            :label="resolvedSubmitLabel"
            :disabled="!canSubmit"
            :class="submitButtonClass"
            @click="submitPost"
          />
        </div>
      </div>
    </SgDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../ui/SgButton.vue'
import SgDialog from '../ui/SgDialog.vue'
import SgTextarea from '../ui/SgTextarea.vue'
import SgSelect from '../ui/SgSelect.vue'
import SocialAvatar from './SocialAvatar.vue'
import { reserveFilesWithinLimit } from './fileSelection'

const { t } = useI18n()

interface Props {
  currentUser: {
    name: string
    avatar: string
  }
  network?: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
  placeholder?: string
  editorPlaceholder?: string
  dialogTitle?: string
  submitLabel?: string
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  network: 'facebook',
  placeholder: undefined,
  editorPlaceholder: undefined,
  dialogTitle: undefined,
  submitLabel: undefined,
  maxFiles: 4
})

const resolvedPlaceholder = computed(() => props.placeholder ?? t('post.composer_placeholder'))
const resolvedEditorPlaceholder = computed(() => props.editorPlaceholder ?? t('post.editor_placeholder'))
const resolvedDialogTitle = computed(() => props.dialogTitle ?? t('post.dialog_title'))
const resolvedSubmitLabel = computed(() => props.submitLabel ?? t('common.publish'))

const emit = defineEmits<{
  'submit': [{
    content: string,
    privacy: string,
    files: File[]
  }]
}>()

const showDialog = ref(false)
const postContent = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<Array<{ file: File, preview: string, type: string }>>([])
const pendingFileReads = ref(0)
const fileSelectionGeneration = ref(0)
const privacy = ref('public')

const networkClass = computed(() => `network-${props.network}`)

const submitButtonClass = computed(() => ({
  'w-full': true,
  [`p-button-${props.network}`]: true
}))

const canSubmit = computed(() => {
  return postContent.value.trim().length > 0 || selectedFiles.value.length > 0
})

const postTypes = computed(() => [
  { id: 'photo', icon: 'pi pi-image', label: t('post.photo_video_type') },
  { id: 'feeling', icon: 'pi pi-smile', label: 'Humeur/Activité' },
  { id: 'event', icon: 'pi pi-calendar', label: t('common.event') }
])

const postTools: Array<{
  id: string
  icon: string
  label: string
  severity: 'success' | 'info' | 'warning' | 'help' | 'danger'
}> = [
  { id: 'media', icon: 'pi pi-image', label: 'Ajouter une photo ou une vidéo', severity: 'success' },
  { id: 'tag', icon: 'pi pi-user', label: 'Identifier une personne', severity: 'info' },
  { id: 'feeling', icon: 'pi pi-smile', label: 'Ajouter une humeur', severity: 'warning' },
  { id: 'location', icon: 'pi pi-map-marker', label: 'Ajouter un lieu', severity: 'help' },
  { id: 'poll', icon: 'pi pi-chart-bar', label: 'Créer un sondage', severity: 'danger' }
]

const privacyOptions = computed(() => [
  { value: 'public', label: 'Public', icon: 'pi pi-globe' },
  { value: 'friends', label: t('common.friends'), icon: 'pi pi-users' },
  { value: 'private', label: 'Moi uniquement', icon: 'pi pi-lock' }
])

const handleTypeClick = async (type: typeof postTypes.value[0]) => {
  showDialog.value = true
  if (type.id === 'photo') {
    await nextTick()
    fileInput.value?.click()
  }
}

const handleToolClick = (tool: typeof postTools[0]) => {
  if (tool.id === 'media') {
    fileInput.value?.click()
  }
  // Implémenter les autres actions d'outils
}

const MAX_FILE_SIZE = 10_000_000

const onFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).filter(file => file.size <= MAX_FILE_SIZE)
  const reservedFiles = reserveFilesWithinLimit(
    selectedFiles.value.length + pendingFileReads.value,
    props.maxFiles,
    files,
  )
  const generation = fileSelectionGeneration.value
  pendingFileReads.value += reservedFiles.length
  
  for (const file of reservedFiles) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (generation !== fileSelectionGeneration.value) return
      pendingFileReads.value -= 1
      if (selectedFiles.value.length >= props.maxFiles) return
      selectedFiles.value.push({
        file,
        preview: e.target?.result as string,
        type: file.type
      })
    }
    reader.onerror = () => {
      if (generation === fileSelectionGeneration.value) pendingFileReads.value -= 1
    }
    reader.onabort = reader.onerror
    reader.readAsDataURL(file)
  }
  input.value = ''
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const submitPost = () => {
  emit('submit', {
    content: postContent.value,
    privacy: privacy.value,
    files: selectedFiles.value.map(f => f.file)
  })
  
  // Réinitialiser le formulaire
  postContent.value = ''
  fileSelectionGeneration.value += 1
  pendingFileReads.value = 0
  selectedFiles.value = []
  showDialog.value = false
}
</script>

<style scoped>
.create-post {
  background: var(--surface-card);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.post-composer {
  display: flex;
  gap: var(--sg-space-1rem);
}

.composer-input {
  flex: 1;
}

.start-post {
  width: var(--sg-size-100pct);
  justify-content: flex-start;
  margin-bottom: var(--sg-space-0d5rem);
  background: var(--surface-ground);
  border-radius: var(--sg-radius-2rem);
  color: var(--text-color-secondary);
}

.post-types {
  display: flex;
  gap: var(--sg-space-0d5rem);
  border-top: 1px solid var(--surface-border);
  padding-top: var(--sg-space-1rem);
}

.dialog-content {
  padding: var(--sg-space-1rem);
}

.dialog-header {
  display: flex;
  gap: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.post-settings {
  flex: 1;
}

.post-settings h4 {
  margin: var(--sg-space-0-0-0d5rem);
}

.privacy-dropdown {
  width: var(--sg-size-200px);
}

.post-editor {
  margin-bottom: var(--sg-space-1rem);
}

:deep(.sg-textarea) {
  field-sizing: content;
}

.selected-files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--sg-space-0d5rem);
  margin: var(--sg-space-1rem-0);
}

.file-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--sg-radius-8px);
  overflow: hidden;
}

.file-preview img,
.file-preview video {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
  object-fit: cover;
}

.file-overlay {
  position: absolute;
  top: var(--sg-position-0d5rem);
  right: var(--sg-position-0d5rem);
}

.add-to-post {
  background: var(--surface-ground);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
  margin-top: var(--sg-space-1rem);
}

.add-to-post h5 {
  margin: var(--sg-space-0-0-0d5rem);
  color: var(--text-color-secondary);
}

.post-tools {
  display: flex;
  gap: var(--sg-space-0d5rem);
}

.hidden-upload {
  display: none;
}

/* Styles spécifiques aux réseaux */
.network-facebook :deep(.sg-button-facebook) {
  background: var(--sg-color-facebook);
}

.network-twitter :deep(.sg-button-twitter) {
  background: var(--sg-color-twitter);
}

.network-linkedin :deep(.sg-button-linkedin) {
  background: var(--sg-color-linkedin);
}

.network-instagram :deep(.sg-button-instagram) {
  background: linear-gradient(45deg, var(--sg-color-instagram-orange) 0%, var(--sg-color-instagram-coral) 25%, var(--sg-color-instagram-red) 50%, var(--sg-color-instagram-rose) 75%, var(--sg-color-instagram-magenta) 100%);
}
</style> 
