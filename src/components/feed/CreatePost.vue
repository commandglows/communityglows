<template>
  <div class="create-post">
    <div class="post-header">
      <SocialAvatar 
        :user="currentUser"
        size="normal"
        shape="circle"
        class="mr-2"
      />
      <div class="post-input">
        <label
          for="post-content"
          class="sr-only"
        >Compose your post</label>
        <Textarea
          id="post-content"
          v-model="content"
          :placeholder="placeholder"
          :auto-resize="true"
          rows="3"
          class="w-full"
          aria-label="Compose your post"
        />
      </div>
    </div>

    <div
      v-if="selectedImage"
      class="image-preview"
    >
      <img
        :src="selectedImage"
        alt="Preview"
        class="preview-image"
      />
      <Button
        icon="pi pi-times"
        text
        rounded
        class="remove-image"
        aria-label="Remove image"
        @click="removeImage"
      />
    </div>

    <div class="post-actions">
      <div class="left-actions">
        <FileUpload
          mode="basic"
          :auto="true"
          accept="image/*"
          :max-file-size="5000000"
          choose-label=""
          class="image-upload"
          @select="onImageSelect"
        >
          <template #chooseicon>
            <i class="pi pi-image"></i>
          </template>
        </FileUpload>
      </div>

      <Button
        label="Publier"
        :disabled="!content.trim()"
        @click="createPost"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUser } from '@/composables/useAuth'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import SocialAvatar from './SocialAvatar.vue'

const props = defineProps<{
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'create', data: { content: string, image?: string }): void
}>()

const { user } = useUser()
const currentUser = computed(() => ({
  username: user.value?.name ?? 'User',
  avatar: user.value?.avatarUrl ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
}))

const content = ref('')
const selectedImage = ref<string | null>(null)

const onImageSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        selectedImage.value = result
      }
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  selectedImage.value = null
}

const createPost = () => {
  if (content.value.trim()) {
    emit('create', {
      content: content.value,
      image: selectedImage.value || undefined
    })
    content.value = ''
    selectedImage.value = null
  }
}
</script>

<style scoped>
.create-post {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.post-header {
  display: flex;
  margin-bottom: var(--sg-space-1rem);
}

.post-input {
  flex: 1;
}

.image-preview {
  position: relative;
  margin-bottom: var(--sg-space-1rem);
}

.preview-image {
  width: var(--sg-size-100pct);
  max-height: var(--sg-size-300px);
  object-fit: cover;
  border-radius: var(--sg-radius-8px);
}

.remove-image {
  position: absolute;
  top: var(--sg-space-0d5rem);
  right: var(--sg-space-0d5rem);
  background: var(--sg-color-overlay) !important;
  color: var(--sg-color-text-on-action) !important;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--sg-space-1rem);
  border-top: var(--sg-border-1px) solid var(--sg-color-border);
}

.left-actions {
  display: flex;
  gap: var(--sg-space-0d5rem);
}

:deep(.image-upload) {
  .p-button {
    width: var(--sg-size-2d5rem) !important;
    padding: var(--sg-space-0d5rem) !important;
  }
}
</style> 
