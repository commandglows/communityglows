<template>
  <div class="linkedin-view">
    <template v-if="isConnected">
      <div class="header">
        <SocialNetworkLogo
          network="linkedin"
          size="small"
          class="mr-2"
        />
        <h2>LinkedIn Feed</h2>
      </div>
      <NetworkTwoColumnLayout
        class="linkedin-content"
        sidebar-width="var(--sg-size-300px)"
        sidebar-position="left"
      >
        <template #main>
          <div class="feed-section">
            <div class="post-composer">
              <Avatar
                :image="profileInfo.avatar"
                size="normal"
                shape="circle"
              />
              <div class="composer-input">
                <Button
                  class="start-post"
                  text
                  @click="showPostDialog = true"
                >
                  {{ $t('linkedin.start_post') }}
                </Button>
                <div class="post-types">
                  <Button
                    icon="pi pi-image"
                    :label="$t('common.photo')"
                    text
                    class="flex-1"
                  />
                  <Button
                    icon="pi pi-video"
                    :label="$t('common.video')"
                    text
                    class="flex-1"
                  />
                  <Button
                    icon="pi pi-calendar"
                    :label="$t('common.event')"
                    text
                    class="flex-1"
                  />
                  <Button
                    icon="pi pi-file"
                    :label="$t('common.article')"
                    text
                    class="flex-1"
                  />
                </div>
              </div>
            </div>

            <div
              v-for="post in posts"
              :key="post.id"
              class="post-card"
            >
              <div class="post-header">
                <Avatar
                  :image="post.authorAvatar"
                  size="normal"
                  shape="circle"
                />
                <div class="author-info">
                  <h4>{{ post.authorName }}</h4>
                  <p class="author-headline">{{ post.authorHeadline }}</p>
                  <span class="post-time">{{ post.time }}</span>
                </div>
                <Button
                  icon="pi pi-ellipsis-h"
                  aria-label="Ouvrir le menu de la publication"
                  text
                  rounded
                />
              </div>

              <div class="post-content">
                <p>{{ post.text }}</p>
                <img
                  v-if="post.image"
                  :src="post.image"
                  :alt="post.text"
                  class="post-image"
                />
              </div>

              <div class="post-stats">
                <span><SgIcon icon="pi pi-thumbs-up" /> {{ post.likes }}</span>
                <span>{{ post.comments }} {{ $t('common.comments_count') }}</span>
                <span>{{ post.shares }} {{ $t('common.shares_count') }}</span>
              </div>

              <div class="post-actions">
                <Button
                  icon="pi pi-thumbs-up"
                  :label="$t('common.like')"
                  text
                />
                <Button
                  icon="pi pi-comment"
                  :label="$t('common.comment')"
                  text
                />
                <Button
                  icon="pi pi-share-alt"
                  :label="$t('common.share')"
                  text
                />
                <Button
                  icon="pi pi-send"
                  :label="$t('common.send')"
                  text
                />
              </div>
            </div>
          </div>
        </template>

        <template #sidebar>
          <div class="profile-sidebar">
            <div class="profile-card">
              <div class="profile-banner" />
              <div class="profile-info">
                <h3>{{ profileInfo.name }}</h3>
                <p class="headline">{{ profileInfo.headline }}</p>
                <div class="profile-stats">
                  <div class="stat-item">
                    <span>{{ $t('linkedin.profile_views') }}</span>
                    <strong>{{ profileInfo.profileViews }}</strong>
                  </div>
                  <div class="stat-item">
                    <span>{{ $t('linkedin.search_appearances') }}</span>
                    <strong>{{ profileInfo.searchAppearances }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="network-card">
              <h3>{{ $t('linkedin.network_section') }}</h3>
              <div class="network-stats">
                <div class="network-stat">
                  <SgIcon icon="pi pi-users" />
                  <div class="stat-content">
                    <span>{{ $t('linkedin.connections') }}</span>
                    <strong>{{ profileInfo.connections }}</strong>
                  </div>
                </div>
                <div class="network-stat">
                  <SgIcon icon="pi pi-building" />
                  <div class="stat-content">
                    <span>{{ $t('linkedin.followed_pages') }}</span>
                    <strong>{{ profileInfo.followedPages }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </NetworkTwoColumnLayout>
    </template>
    <template v-else>
      <div class="connect-prompt">
        <SocialNetworkLogo
          network="linkedin"
          size="large"
          class="mb-3"
        />
        <h3>{{ $t('linkedin.connect_title') }}</h3>
        <p>{{ $t('linkedin.connect_message') }}</p>
        <Button
          icon="pi pi-linkedin"
          :label="$t('linkedin.connect_button')"
          class="sg-button-linkedin"
          @click="connectLinkedIn"
        />
      </div>
    </template>

    <SgDialog
      v-model="showPostDialog"
      :title="$t('linkedin.create_post_title')"
      variant="post-wide"
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <Avatar
            :image="profileInfo.avatar"
            size="normal"
            shape="circle"
          />
          <div>
            <h4>{{ profileInfo.name }}</h4>
            <Button
              icon="pi pi-globe"
              :label="$t('common.visibility_public')"
              text
              class="visibility-selector"
            />
          </div>
        </div>

        <SgTextarea
          v-model="newPost"
          :placeholder="$t('linkedin.post_placeholder')"
          :aria-label="$t('linkedin.post_placeholder')"
          :auto-resize="true"
          rows="5"
        />

        <div class="dialog-footer">
          <div class="post-attachments">
            <Button
              icon="pi pi-image"
              aria-label="Ajouter une image"
              text
              rounded
            />
            <Button
              icon="pi pi-video"
              aria-label="Ajouter une vidéo"
              text
              rounded
            />
            <Button
              icon="pi pi-file"
              aria-label="Ajouter un document"
              text
              rounded
            />
            <Button
              icon="pi pi-briefcase"
              aria-label="Ajouter une offre d’emploi"
              text
              rounded
            />
            <Button
              icon="pi pi-chart-bar"
              aria-label="Créer un sondage"
              text
              rounded
            />
            <Button
              icon="pi pi-ellipsis-h"
              aria-label="Afficher plus d’options"
              text
              rounded
            />
          </div>
          <Button
            :label="$t('common.publish')"
            :disabled="!newPost.length"
            class="sg-button-linkedin"
          />
        </div>
      </div>
    </SgDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import Button from '../ui/SgButton.vue'
import SgTextarea from '../ui/SgTextarea.vue'
import Avatar from '../ui/SgAvatar.vue'
import SgDialog from '../ui/SgDialog.vue'
import { SocialNetworkLogo } from '../common'
import NetworkTwoColumnLayout from './NetworkTwoColumnLayout.vue'

const store = useSocialNetworksStore()
const isConnected = computed(() => store.isConnected('linkedin'))
const showPostDialog = ref(false)
const newPost = ref('')

const profileInfo = ref({
  name: 'John Doe',
  headline: 'DÃ©veloppeur Full Stack Vue.js | TypeScript | Node.js',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  profileViews: '142',
  searchAppearances: '24',
  connections: '1,483',
  followedPages: '28',
})

const posts = ref([
  {
    id: 1,
    authorName: 'Vue.js Jobs',
    authorHeadline: 'Offres d\'emploi pour dÃ©veloppeurs Vue.js',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vuejobs',
    time: '2h',
    text: 'Nous recherchons un dÃ©veloppeur Vue.js senior pour rejoindre notre Ã©quipe en pleine croissance ! Stack technique : Vue 3, TypeScript, Node.js, PostgreSQL. Remote possible.',
    likes: '45',
    comments: '12',
    shares: '8',
  },
  {
    id: 2,
    authorName: 'Tech Conference Paris',
    authorHeadline: 'Ã‰vÃ©nements tech Ã  Paris',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=techparis',
    time: '5h',
    text: 'La plus grande confÃ©rence Vue.js en France arrive bientÃ´t ! Rejoignez-nous pour deux jours de talks, workshops et networking.',
    image: 'https://picsum.photos/seed/conf/600/400',
    likes: '234',
    comments: '45',
    shares: '23',
  },
])

const connectLinkedIn = () => {
  const authWindowWidth = 500
  const authWindowHeight = 600
  const authWindowFeatures = `width=${authWindowWidth},height=${authWindowHeight},scrollbars=yes`
  const authWindow = window.open(
    '/api/auth/linkedin',
    'LinkedIn Auth',
    authWindowFeatures,
  )

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return

    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork('linkedin', authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.linkedin-view {
  padding: var(--sg-space-1rem);
}

.linkedin-content {
  gap: var(--sg-space-2rem);
  margin: 0;
  max-width: none;
}

.connect-prompt {
  max-width: var(--sg-size-400px);
  margin: var(--sg-space-2rem-auto);
  text-align: center;
  padding: var(--sg-space-2rem);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
}

.connect-prompt h3 {
  margin-bottom: var(--sg-space-1rem);
}

.connect-prompt p {
  margin-bottom: var(--sg-space-1d5rem);
  color: var(--sg-color-text-muted);
}

.profile-card {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-10px);
  overflow: hidden;
  margin-bottom: var(--sg-space-1rem);
}

.profile-banner {
  height: var(--sg-size-100px);
  background: linear-gradient(to right, var(--sg-color-linkedin), var(--sg-color-linkedin-light));
}

.profile-info {
  padding: var(--sg-space-0d5rem-1d5rem-1d5rem);
  text-align: center;
  margin-top: var(--sg-space-neg-40px);
}

.profile-avatar {
  border: 4px solid var(--sg-color-surface-raised);
}

.profile-info h3 {
  margin: var(--sg-space-1rem-0-0d5rem);
}

.headline {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
  margin-bottom: var(--sg-space-1rem);
}

.profile-stats {
  border-top: 1px solid var(--sg-color-border);
  padding-top: var(--sg-space-1rem);
  margin-top: var(--sg-space-1rem);
}

.stat-item {
  text-align: left;
  padding: var(--sg-space-0d5rem-0);
}

.stat-label {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
}

.network-card {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-10px);
  padding: var(--sg-space-1d5rem);
}

.network-stats {
  margin-top: var(--sg-space-1rem);
}

.network-stat {
  display: flex;
  align-items: center;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-0d5rem-0);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-content span {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text-muted);
}

.feed-section {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
}

.post-composer {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-10px);
  padding: var(--sg-space-1rem);
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
  background: var(--sg-color-surface-muted);
  border-radius: var(--sg-radius-2rem);
}

.post-types {
  display: flex;
  gap: var(--sg-space-0d5rem);
}

.post-card {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-10px);
  padding: var(--sg-space-1d5rem);
}

.post-header {
  display: flex;
  gap: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.author-info {
  flex: 1;
}

.author-info h4 {
  margin: 0;
}

.author-headline {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text-muted);
  margin: var(--sg-space-0d25rem-0);
}

.post-time {
  font-size: var(--sg-font-size-0d8rem);
  color: var(--sg-color-text-muted);
}

.post-content {
  margin-bottom: var(--sg-space-1rem);
}

.post-image {
  width: var(--sg-size-100pct);
  border-radius: var(--sg-radius-8px);
  margin-top: var(--sg-space-1rem);
}

.post-stats {
  display: flex;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-0d5rem-0);
  border-top: 1px solid var(--sg-color-border);
  border-bottom: 1px solid var(--sg-color-border);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
}

.post-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--sg-space-0d5rem);
}

.dialog-content {
  padding: var(--sg-space-1rem);
}

.dialog-header {
  display: flex;
  gap: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.visibility-selector {
  font-size: var(--sg-font-size-0d9rem);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--sg-space-1rem);
}

.post-attachments {
  display: flex;
  gap: var(--sg-space-0d5rem);
}

:deep(.sg-button-linkedin) {
  background: var(--sg-color-linkedin);
}

:deep(.sg-button-linkedin:hover) {
  background: var(--sg-color-linkedin-hover);
}

:deep(.sg-textarea) {
  field-sizing: content;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: var(--sg-space-1rem);
}

.header h2 {
  margin: 0;
}
</style>
