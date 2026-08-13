<template>
  <div class="reddit-view">
    <template v-if="isConnected">
      <div class="header">
        <SocialNetworkLogo
          network="reddit"
          size="small"
          class="mr-2"
        />
        <h2>Reddit Feed</h2>
      </div>
      <NetworkTwoColumnLayout
        class="reddit-content"
        sidebar-width="var(--sg-size-300px)"
      >
        <template #sidebar>
          <div class="subreddits-sidebar">
            <h3>Mes Subreddits</h3>
            <div
              v-for="sub in subreddits"
              :key="sub.id"
              class="subreddit-item"
            >
              <Avatar
                :image="sub.icon"
                shape="circle"
                size="normal"
              />
              <span>r/{{ sub.name }}</span>
              <span class="members">{{ sub.members }}</span>
            </div>
          </div>
        </template>

        <template #main>
          <div class="posts-section">
            <div
              v-for="i in 5"
              :key="i"
              class="post-card"
            >
              <div class="vote-section">
                <Button
                  icon="pi pi-chevron-up"
                  aria-label="Voter pour"
                  text
                />
                <span>{{ Math.floor(Math.random() * 1000) }}</span>
                <Button
                  icon="pi pi-chevron-down"
                  aria-label="Voter contre"
                  text
                />
              </div>
              <div class="post-content">
                <div class="post-header">
                  <span class="subreddit">r/programming</span>
                  <span class="post-meta">Posted by u/user{{ i }} â€¢ {{ Math.floor(Math.random() * 24) }}h ago</span>
                </div>
                <h3>Post Title #{{ i }}</h3>
                <p>This is a sample post content. Lorem ipsum dolor sit amet...</p>
                <div class="post-actions">
                  <Button
                    icon="pi pi-comments"
                    text
                  >
                    {{ Math.floor(Math.random() * 100) }} Comments
                  </Button>
                  <Button
                    icon="pi pi-share-alt"
                    text
                  >
                    {{ $t('common.share') }}
                  </Button>
                  <Button
                    icon="pi pi-bookmark"
                    text
                  >
                    {{ $t('reddit.save_button') }}
                  </Button>
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
          network="reddit"
          size="large"
          class="mb-3"
        />
        <h3>{{ $t('reddit.connect_title') }}</h3>
        <p>{{ $t('reddit.connect_message') }}</p>
        <Button
          icon="pi pi-reddit"
          :label="$t('reddit.connect_button')"
          class="sg-button-reddit"
          @click="connectReddit"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import Button from '../ui/SgButton.vue'
import Avatar from '../ui/SgAvatar.vue'
import { SocialNetworkLogo } from '../common'
import NetworkTwoColumnLayout from './NetworkTwoColumnLayout.vue'

const store = useSocialNetworksStore()
const isConnected = computed(() => store.isConnected('reddit'))

const subreddits = ref([
  { id: 1, name: 'programming', members: '5.2M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=prog' },
  { id: 2, name: 'webdev', members: '1.1M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=web' },
  { id: 3, name: 'javascript', members: '2.3M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=js' },
  { id: 4, name: 'vuejs', members: '234K', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=vue' },
  { id: 5, name: 'ProgrammerHumor', members: '2.8M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=humor' }
])

const connectReddit = () => {
  const authWindowWidth = 500
  const authWindowHeight = 600
  const authWindowFeatures = `width=${authWindowWidth},height=${authWindowHeight},scrollbars=yes`
  const authWindow = window.open(
    '/api/auth/reddit',
    'Reddit Auth',
    authWindowFeatures
  )

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return

    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork('reddit', authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.reddit-view {
  padding: var(--sg-space-1rem);
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

.reddit-content {
  gap: var(--sg-space-1rem);
}

.subreddits-sidebar {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
}

.subreddit-item {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d8rem);
  padding: var(--sg-space-0d5rem);
  border-radius: var(--sg-radius-4px);
  cursor: pointer;
}

.subreddit-item:hover {
  background: var(--sg-color-surface-hover);
}

.members {
  margin-left: auto;
  font-size: var(--sg-font-size-0d8rem);
  color: var(--sg-color-text-muted);
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
}

.post-card {
  display: flex;
  gap: var(--sg-space-1rem);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
}

.vote-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--sg-color-text-muted);
}

.post-content {
  flex: 1;
}

.post-header {
  display: flex;
  gap: var(--sg-space-0d5rem);
  align-items: center;
  margin-bottom: var(--sg-space-0d5rem);
}

.subreddit {
  font-weight: bold;
  color: var(--sg-color-action);
}

.post-meta {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text-muted);
}

.post-actions {
  display: flex;
  gap: var(--sg-space-1rem);
  margin-top: var(--sg-space-1rem);
  border-top: 1px solid var(--sg-color-border);
  padding-top: var(--sg-space-0d8rem);
}

:deep(.sg-button-reddit) {
  background: var(--sg-color-reddit);
}

:deep(.sg-button-reddit:hover) {
  background: var(--sg-color-reddit-hover);
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
