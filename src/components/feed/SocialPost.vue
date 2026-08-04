<template>
  <div class="social-post">
    <div class="post-header">
      <SocialAvatar 
        :user="post.author"
        size="normal"
        shape="circle"
        class="mr-2"
      />
      <div class="post-meta">
        <h3 class="author-name">{{ post.author.name }}</h3>
        <span class="post-date">{{ formatDate(post.date) }}</span>
      </div>
    </div>

    <div class="post-content">
      <p>{{ post.content }}</p>
      <img
        v-if="post.image"
        :src="post.image"
        :alt="post.content"
        class="post-image"
      />
    </div>

    <div class="post-actions">
      <Button 
        :icon="'pi pi-heart' + (post.liked ? '-fill' : '')"
        :class="['like-button', { liked: post.liked }]"
        text
        @click="$emit('like', post.id)"
      >
        {{ post.likes }}
      </Button>
      <Button 
        icon="pi pi-comment"
        text
        @click="$emit('comment', post.id)"
      >
        {{ post.comments }}
      </Button>
      <Button 
        icon="pi pi-share-alt"
        text
        @click="$emit('share', post.id)"
      >
        {{ post.shares }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/dateFormatter'
import Button from 'primevue/button'
import SocialAvatar from './SocialAvatar.vue'

interface Author {
  name: string
  avatar: string
}

interface Post {
  id: string
  author: Author
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  date: Date
  liked?: boolean
}

defineProps<{
  post: Post
}>()

defineEmits<{
  (e: 'like', postId: string): void
  (e: 'comment', postId: string): void
  (e: 'share', postId: string): void
}>()
</script>

<style scoped>
.social-post {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--sg-space-1rem);
}

.post-meta {
  flex: 1;
}

.author-name {
  margin: 0;
  font-size: var(--sg-font-size-1rem);
  font-weight: 600;
}

.post-date {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text-muted);
}

.post-content {
  margin-bottom: var(--sg-space-1rem);
}

.post-content p {
  margin: 0 0 var(--sg-space-1rem) 0;
  white-space: pre-wrap;
}

.post-image {
  width: var(--sg-size-100pct);
  border-radius: var(--sg-radius-8px);
  margin-bottom: var(--sg-space-1rem);
}

.post-actions {
  display: flex;
  gap: var(--sg-space-1rem);
  border-top: var(--sg-border-1px) solid var(--sg-color-border);
  padding-top: var(--sg-space-1rem);
}

.like-button.liked {
  color: var(--sg-color-danger);
}
</style>
