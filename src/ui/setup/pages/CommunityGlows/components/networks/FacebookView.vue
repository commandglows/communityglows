<template>
  <div class="facebook-view">
    <NetworkTwoColumnLayout
      class="facebook-content"
      sidebar-width="var(--sg-size-300px)"
    >
      <!-- Feed principal -->
      <template #main>
        <div class="main-feed">
          <!-- Stories -->
          <div class="stories-section">
            <div
              class="stories-scroll"
              tabindex="0"
              aria-label="Stories"
            >
              <div class="stories-container">
                <div
                  v-for="story in store.stories"
                  :key="story.id"
                  class="story-card"
                  :class="{ viewed: story.viewed }"
                  @click="store.viewStory(story.id)"
                >
                  <img
                    :src="story.image"
                    :alt="story.author.name"
                    class="story-image"
                  />
                  <div class="story-overlay">
                    <SocialAvatar
                      :user="story.author"
                      size="normal"
                      :border-color="
                        story.viewed
                          ? 'var(--sg-color-border)'
                          : 'var(--sg-color-action)'
                      "
                      border-width="3px"
                    />
                    <span class="story-author">{{ story.author.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CrÃƒÂ©er un post -->
          <CreatePost
            :current-user="store.currentUser"
            network="facebook"
            @submit="handlePostSubmit"
          />

          <!-- Posts -->
          <div class="posts-section">
            <SocialPost
              v-for="post in store.posts"
              :key="post.id"
              :post="post"
              network="facebook"
              :show-comments="post.showComments"
              @primary-action="store.addReaction(post.id, 'like')"
              @comment="store.addComment(post.id, '')"
              @share="store.sharePost(post.id)"
              @toggle-comments="togglePostComments(post.id)"
            >
              <template
                v-if="post.showComments"
                #comments
              >
                <div
                  v-if="post.comments?.length"
                  class="comments-container"
                >
                  <SocialComment
                    v-for="comment in post.comments"
                    :key="comment.id"
                    :comment="comment"
                    @like="handleCommentLike(post.id, comment.id)"
                    @reply="handleCommentReply(post.id, comment.id)"
                  />
                </div>
                <div class="comment-composer">
                  <SocialAvatar
                    :user="store.currentUser"
                    size="normal"
                  />
                  <SgInput
                    v-model="newComments[post.id]"
                    :placeholder="$t('facebook.comment_placeholder')"
                    :aria-label="$t('facebook.comment_placeholder')"
                    class="flex-1"
                    @keyup.enter="handleCommentSubmit(post.id)"
                  />
                </div>
              </template>
            </SocialPost>
          </div>
        </div>
      </template>

      <template #sidebar>
        <div class="right-sidebar">
          <div class="online-friends">
            <h4>{{ $t('facebook.contacts') }}</h4>
            <div
              v-for="friend in store.onlineFriends"
              :key="friend.id"
              class="friend-item"
            >
              <SocialAvatar
                :user="friend"
                size="normal"
                :show-status="true"
              />
              <span class="friend-name">{{ friend.name }}</span>
            </div>
          </div>
        </div>
      </template>
    </NetworkTwoColumnLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SgInput from '../ui/SgInput.vue'
import { SocialAvatar, SocialPost, SocialComment, CreatePost } from '../feed'
import { useFacebookMockStore } from '../../stores/mockData/facebookMock'
import type { FacebookPost } from '../../stores/mockData/facebookMock'
import NetworkTwoColumnLayout from './NetworkTwoColumnLayout.vue'

const store = useFacebookMockStore()
const newComments = ref<Record<string, string>>({})

type CreatePostPayload = {
  content: string
  privacy: string
  files: File[]
}

const isFacebookPrivacy = (privacy: string): privacy is FacebookPost['privacy'] => {
  return privacy === 'public' || privacy === 'friends' || privacy === 'private'
}

const handlePostSubmit = (post: CreatePostPayload) => {
  store.addPost({
    content: {
      text: post.content,
    },
    privacy: isFacebookPrivacy(post.privacy) ? post.privacy : 'friends',
  })
}

const handleCommentSubmit = (postId: string) => {
  if (newComments.value[postId]?.trim()) {
    store.addComment(postId, newComments.value[postId])
    newComments.value[postId] = ''
  }
}

const handleCommentLike = (postId: string, commentId: string) => {
  store.likeComment(postId, commentId)
}

const handleCommentReply = (postId: string, commentId: string) => {
  // Logique pour repondre a un commentaire
  void postId
  void commentId
}

const togglePostComments = (postId: string) => {
  const post = store.posts.find((p) => p.id === postId)
  if (post) {
    // Vous pouvez ajouter une propriete personnalisee pour suivre l'etat des commentaires
    post.showComments = !post.showComments
  }
}
</script>

<style scoped>
.facebook-view {
  height: var(--sg-size-100pct);
  background: var(--sg-color-surface-muted);
  padding-top: var(--sg-space-4rem);
}

.facebook-content {
  max-width: var(--sg-size-1200px);
  margin: var(--sg-space-0-auto);
  padding: var(--sg-space-1rem);
  height: var(--sg-size-calc-100pct-neg-4rem);
  overflow-y: auto;
}

.main-feed {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
}

.stories-section {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
}

.stories-scroll {
  height: var(--sg-size-250px);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-gutter: stable;
}

.stories-scroll:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.stories-container {
  display: flex;
  gap: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d25rem);
}

.story-card {
  position: relative;
  width: var(--sg-size-140px);
  height: var(--sg-size-220px);
  border-radius: var(--sg-radius-8px);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.story-image {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
  object-fit: cover;
}

.story-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, var(--sg-color-scrim-30), var(--sg-color-scrim-70));
  padding: var(--sg-space-0d75rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.story-author {
  color: var(--sg-color-text-on-dark);
  font-size: var(--sg-font-size-0d9rem);
  font-weight: 500;
}

.story-card.viewed {
  opacity: 0.8;
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
}

.right-sidebar {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
  height: var(--sg-size-fitneg-content);
}

.online-friends {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d75rem);
}

.online-friends h4 {
  margin: var(--sg-space-0-0-0d5rem);
  padding-bottom: var(--sg-space-0d5rem);
  border-bottom: 1px solid var(--sg-color-border);
}

.friend-item {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d75rem);
  padding: var(--sg-space-0d5rem);
  border-radius: var(--sg-radius-8px);
  cursor: pointer;
}

.friend-item:hover {
  background: var(--sg-color-surface-hover);
}

.friend-name {
  font-size: var(--sg-font-size-0d9rem);
}

.comments-container {
  padding: var(--sg-space-0d5rem-1rem);
}

.comment-composer {
  display: flex;
  gap: var(--sg-space-0d75rem);
  padding: var(--sg-space-0d75rem-1rem);
  align-items: center;
}
</style>

