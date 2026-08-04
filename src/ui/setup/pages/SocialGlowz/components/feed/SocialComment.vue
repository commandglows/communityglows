<template>
  <div
    class="social-comment"
    :class="{ 'is-reply': isReply }"
  >
    <div class="comment-container">
      <SocialAvatar 
        :user="comment.author"
        size="normal"
      />
      
      <div class="comment-content">
        <div class="comment-bubble">
          <h5 class="author-name">{{ comment.author.name }}</h5>
          <p class="comment-text">{{ comment.content }}</p>
        </div>
        
        <div class="comment-actions">
          <Button 
            :label="likeLabel" 
            :class="{ 'sg-button-text-primary': comment.liked }"
            text 
            size="small"
            @click="handleLike"
          />
          <Button 
            :label="$t('common.reply')"
            text 
            size="small"
            @click="handleReply"
          />
          <span class="comment-time">{{ formatDate(comment.timestamp) }}</span>
        </div>

        <div
          v-if="showLikes && comment.likes > 0"
          class="likes-count"
        >
          <SgIcon icon="pi pi-thumbs-up" />
          <span>{{ comment.likes }}</span>
        </div>
      </div>

      <Button 
        v-if="showMenu"
        icon="pi pi-ellipsis-h" 
        aria-label="Ouvrir le menu du commentaire"
        text 
        rounded
        size="small"
        @click="$emit('menu', $event)"
      />
    </div>

    <div
      v-if="comment.replies?.length"
      class="replies-section"
    >
      <div
        v-if="!showAllReplies && comment.replies.length > 2"
        class="show-replies"
      >
        <Button 
          :label="$t('comment.show_more_replies', { count: comment.replies.length - 2 })"
          link
          @click="showAllReplies = true"
        />
      </div>

      <TransitionGroup name="reply">
        <SocialComment
          v-for="reply in visibleReplies"
          :key="reply.id"
          :comment="reply"
          :is-reply="true"
          :show-menu="showMenu"
          @like="$emit('like-reply', reply.id)"
          @reply="$emit('reply', reply.id)"
          @menu="$emit('menu-reply', reply.id, $event)"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../ui/SgButton.vue'
import SocialAvatar from './SocialAvatar.vue'

const { t } = useI18n()

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  likes: number
  liked?: boolean
  replies?: Comment[]
}

interface Props {
  comment: Comment
  isReply?: boolean
  showMenu?: boolean
  showLikes?: boolean
  maxVisibleReplies?: number
}

const props = withDefaults(defineProps<Props>(), {
  isReply: false,
  showMenu: true,
  showLikes: true,
  maxVisibleReplies: 2
})

const emit = defineEmits<{
  'like': []
  'reply': [commentId: string]
  'menu': [event: MouseEvent]
  'like-reply': [replyId: string]
  'menu-reply': [replyId: string, event: MouseEvent]
}>()

const showAllReplies = ref(false)

const visibleReplies = computed(() => {
  if (!props.comment.replies) return []
  return showAllReplies.value 
    ? props.comment.replies 
    : props.comment.replies.slice(0, props.maxVisibleReplies)
})

const likeLabel = computed(() => {
  return props.comment.liked ? t('comment.unlike') : t('common.like')
})

const formatDate = (timestamp: string) => {
  // Ici vous pouvez utiliser une librairie comme date-fns
  return new Date(timestamp).toLocaleDateString()
}

const handleLike = () => {
  emit('like')
}

const handleReply = () => {
  emit('reply', props.comment.id)
}
</script>

<style scoped>
.social-comment {
  margin-bottom: var(--sg-space-1rem);
}

.comment-container {
  display: flex;
  gap: var(--sg-space-0d75rem);
  align-items: flex-start;
}

.comment-content {
  flex: 1;
  position: relative;
}

.comment-bubble {
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-radius-18px);
  padding: var(--sg-space-0d75rem-1rem);
  margin-bottom: var(--sg-space-0d25rem);
}

.author-name {
  margin: var(--sg-space-0-0-0d25rem);
  font-size: var(--sg-font-size-0d9rem);
}

.comment-text {
  margin: 0;
  font-size: var(--sg-font-size-0d95rem);
  line-height: var(--sg-line-height-1d4);
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-0-0d5rem);
}

.comment-time {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d85rem);
}

.likes-count {
  position: absolute;
  right: 0;
  bottom: 0;
  transform: translateY(50%);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-1rem);
  padding: var(--sg-space-0d25rem-0d5rem);
  font-size: var(--sg-font-size-0d85rem);
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d25rem);
  box-shadow: var(--card-shadow);
}

.likes-count :deep(.sg-icon) {
  color: var(--sg-color-action);
}

.is-reply {
  padding-left: var(--sg-space-2d5rem);
}

.replies-section {
  margin-top: var(--sg-space-0d5rem);
}

.show-replies {
  padding-left: var(--sg-space-3d25rem);
  margin-bottom: var(--sg-space-0d5rem);
}

/* Animations */
.reply-enter-active,
.reply-leave-active {
  transition: var(--sg-motion-all-0d3s-ease);
}

.reply-enter-from,
.reply-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style> 
