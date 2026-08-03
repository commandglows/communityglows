<template>
  <div class="twitter-view">
    <template v-if="isConnected">
      <div class="header">
        <SocialNetworkLogo 
          network="twitter"
          size="small"
          class="mr-2"
        />
        <h2>Twitter Feed</h2>
      </div>
      <div class="twitter-content">
        <div class="profile-sidebar">
          <h3>{{ $t('twitter.my_profile') }}</h3>
          <div class="profile-card">
            <Avatar
              :image="profileInfo.avatar"
              size="xlarge"
              shape="circle"
            />
            <h4>{{ profileInfo.name }}</h4>
            <p class="handle">@{{ profileInfo.handle }}</p>
            <div class="stats">
              <div class="stat-item">
                <strong>{{ profileInfo.following }}</strong>
                <span>{{ $t('twitter.following') }}</span>
              </div>
              <div class="stat-item">
                <strong>{{ profileInfo.followers }}</strong>
                <span>{{ $t('twitter.followers') }}</span>
              </div>
            </div>
          </div>
          
          <div class="trends">
            <h3>{{ $t('twitter.trends') }}</h3>
            <div
              v-for="trend in trends"
              :key="trend.id"
              class="trend-item"
            >
              <span class="category">{{ trend.category }}</span>
              <h4>{{ trend.tag }}</h4>
              <span class="tweets">{{ trend.tweets }} {{ $t('twitter.tweets_count') }}</span>
            </div>
          </div>
        </div>

        <div class="tweets-section">
          <div class="compose-tweet">
            <Avatar
              :image="profileInfo.avatar"
              size="normal"
              shape="circle"
            />
            <div class="compose-input">
              <SgTextarea
                v-model="newTweet" 
                :placeholder="$t('twitter.compose_placeholder')"
                :aria-label="$t('twitter.compose_placeholder')"
                :auto-resize="true"
                rows="2"
              />
              <div class="compose-actions">
                <div class="tweet-tools">
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
                    icon="pi pi-list"
                    aria-label="Créer un sondage"
                    text
                    rounded
                  />
                  <Button
                    icon="pi pi-smile"
                    aria-label="Ajouter un emoji"
                    text
                    rounded
                  />
                </div>
                <Button 
                  label="Tweeter" 
                  :disabled="!newTweet.length"
                  class="sg-button-twitter"
                />
              </div>
            </div>
          </div>

          <div
            v-for="tweet in tweets"
            :key="tweet.id"
            class="tweet-card"
          >
            <Avatar
              :image="tweet.authorAvatar"
              size="normal"
              shape="circle"
            />
            <div class="tweet-content">
              <div class="tweet-header">
                <span class="author-name">{{ tweet.authorName }}</span>
                <span class="author-handle">@{{ tweet.authorHandle }}</span>
                <span class="tweet-time">· {{ tweet.time }}</span>
              </div>
              <p class="tweet-text">{{ tweet.text }}</p>
              <div class="tweet-actions">
                <Button
                  icon="pi pi-comment"
                  text
                  rounded
                >
                  {{ tweet.replies }}
                </Button>
                <Button
                  icon="pi pi-refresh"
                  text
                  rounded
                >
                  {{ tweet.retweets }}
                </Button>
                <Button
                  icon="pi pi-heart"
                  text
                  rounded
                >
                  {{ tweet.likes }}
                </Button>
                <Button
                  icon="pi pi-share-alt"
                  aria-label="Partager le tweet"
                  text
                  rounded
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="connect-prompt">
        <SocialNetworkLogo 
          network="twitter"
          size="large"
          class="mb-3"
        />
        <h3>{{ $t('twitter.connect_title') }}</h3>
        <p>{{ $t('twitter.connect_message') }}</p>
        <Button 
          icon="pi pi-twitter" 
          :label="$t('twitter.connect_button')"
          class="sg-button-twitter"
          @click="connectTwitter"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import Button from '../ui/SgButton.vue'
import SgTextarea from '../ui/SgTextarea.vue'
import Avatar from '../ui/SgAvatar.vue'
import { SocialNetworkLogo } from '../common'

const store = useSocialNetworksStore()
const isConnected = computed(() => store.isConnected('twitter'))
const newTweet = ref('')

const profileInfo = ref({
  name: 'John Doe',
  handle: 'johndoe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  following: '234',
  followers: '1.2K'
})

const trends = ref([
  { id: 1, category: 'Technologies', tag: '#VueJS', tweets: '24.5K' },
  { id: 2, category: 'France', tag: '#DevWeb', tweets: '15.2K' },
  { id: 3, category: 'Tendances', tag: '#JavaScript', tweets: '125.4K' },
  { id: 4, category: 'Technologies', tag: '#OpenSource', tweets: '32.1K' },
  { id: 5, category: 'Business', tag: '#Tech', tweets: '85.7K' }
])

const tweets = ref([
  {
    id: 1,
    authorName: 'Vue.js',
    authorHandle: 'vuejs',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vue',
    text: 'Vue 3.4 est maintenant disponible ! Découvrez les nouvelles fonctionnalités et améliorations de performances.',
    time: '2h',
    replies: '45',
    retweets: '234',
    likes: '1.2K'
  },
  {
    id: 2,
    authorName: 'TypeScript',
    authorHandle: 'typescript',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ts',
    text: 'TypeScript 5.3 apporte de nouvelles fonctionnalités pour améliorer votre expérience de développement !',
    time: '4h',
    replies: '32',
    retweets: '156',
    likes: '892'
  }
])

const connectTwitter = () => {
  const authWindow = window.open(
    '/api/auth/twitter',
    'Twitter Auth',
    'width=500,height=600,scrollbars=yes'
  )

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return
    
    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork('twitter', authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.twitter-view {
  padding: var(--sg-space-1rem);
}

.connect-prompt {
  max-width: var(--sg-size-400px);
  margin: var(--sg-space-2rem-auto);
  text-align: center;
  padding: var(--sg-space-2rem);
  background: var(--surface-card);
  border-radius: var(--sg-radius-8px);
}

.connect-prompt h3 {
  margin-bottom: var(--sg-space-1rem);
}

.connect-prompt p {
  margin-bottom: var(--sg-space-1d5rem);
  color: var(--text-color-secondary);
}

.twitter-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--sg-space-2rem);
}

@media (max-width: 900px) {
  .twitter-content {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--sg-space-1rem);
  }
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-2rem);
}

.profile-card {
  background: var(--surface-card);
  border-radius: var(--sg-radius-16px);
  padding: var(--sg-space-1d5rem);
  text-align: center;
}

.profile-card h4 {
  margin: var(--sg-space-1rem-0-0d25rem);
}

.handle {
  color: var(--text-color-secondary);
  margin-bottom: var(--sg-space-1rem);
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: var(--sg-space-1rem);
  border-top: 1px solid var(--surface-border);
  padding-top: var(--sg-space-1rem);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item strong {
  font-size: var(--sg-font-size-1d1rem);
}

.stat-item span {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--text-color-secondary);
}

.trends {
  background: var(--surface-card);
  border-radius: var(--sg-radius-16px);
  padding: var(--sg-space-1rem);
}

.trend-item {
  padding: var(--sg-space-1rem);
  border-bottom: 1px solid var(--surface-border);
}

.trend-item:last-child {
  border-bottom: var(--sg-position-none);
}

.category {
  font-size: var(--sg-font-size-0d8rem);
  color: var(--text-color-secondary);
}

.tweets {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--text-color-secondary);
}

.compose-tweet {
  display: flex;
  gap: var(--sg-space-1rem);
  background: var(--surface-card);
  border-radius: var(--sg-radius-16px);
  padding: var(--sg-space-1rem);
  margin-bottom: var(--sg-space-1rem);
}

.compose-input {
  flex: 1;
}

.compose-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--sg-space-0d5rem);
}

.tweet-tools {
  display: flex;
  gap: var(--sg-space-0d5rem);
}

.tweets-section {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
}

.tweet-card {
  display: flex;
  gap: var(--sg-space-1rem);
  background: var(--surface-card);
  border-radius: var(--sg-radius-16px);
  padding: var(--sg-space-1rem);
}

.tweet-content {
  flex: 1;
}

.tweet-header {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  margin-bottom: var(--sg-space-0d5rem);
}

.author-name {
  font-weight: bold;
}

.author-handle, .tweet-time {
  color: var(--text-color-secondary);
}

.tweet-text {
  margin-bottom: var(--sg-space-0d5rem);
  line-height: var(--sg-line-height-1d5);
}

.tweet-actions {
  display: flex;
  justify-content: space-between;
  max-width: var(--sg-size-400px);
}

:deep(.sg-button-twitter) {
  background: var(--sg-color-twitter);
}

:deep(.sg-button-twitter:hover) {
  background: var(--sg-color-twitter-hover);
}

:deep(.sg-textarea) {
  width: var(--sg-size-100pct);
  border: none;
  background: transparent;
  resize: none;
  field-sizing: content;
}

:deep(.sg-textarea:focus-visible) {
  box-shadow: var(--sg-shadow-none);
  border: none;
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
