<template>
  <div class="discord-view">
    <div class="header">
      <SocialNetworkLogo 
        network="discord"
        size="small"
        class="mr-2"
      />
      <h2>Discord Channels</h2>
    </div>
    <div class="discord-content">
      <div class="servers-list">
        <div
          v-for="server in servers"
          :key="server.id"
          class="server-item"
          role="button"
          tabindex="0"
          :aria-label="`Server ${server.id}`"
          @keydown.enter.space.prevent="() => {}"
        >
          <Avatar
            :image="`https://api.dicebear.com/7.x/identicon/svg?seed=server${server.id}`"
            shape="circle"
            size="large"
            class="server-avatar"
          />
          <div
            v-if="server.notifications > 0"
            class="notification-badge"
          >
            {{ server.notifications }}
          </div>
        </div>
      </div>
      <div class="channels-section">
        <div
          v-for="channel in channels"
          :key="channel.id"
          class="channel-item"
          role="button"
          tabindex="0"
          :aria-label="`Channel: ${channel.name}`"
          @keydown.enter.space.prevent="() => {}"
        >
          <SgIcon :icon="channel.icon" />
          <span>{{ channel.name }}</span>
          <span class="member-count">{{ channel.members }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Avatar from '../ui/SgAvatar.vue'
import { SocialNetworkLogo } from '../common'

const servers = ref([
  { id: 1, notifications: 3 },
  { id: 2, notifications: 0 },
  { id: 3, notifications: 7 },
  { id: 4, notifications: 1 },
  { id: 5, notifications: 0 },
])

const channels = ref([
  { id: 1, name: 'general', icon: 'pi pi-hashtag', members: '245' },
  { id: 2, name: 'gaming', icon: 'pi pi-hashtag', members: '123' },
  { id: 3, name: 'music', icon: 'pi pi-volume-up', members: '89' },
  { id: 4, name: 'dev-chat', icon: 'pi pi-code', members: '167' },
  { id: 5, name: 'voice-lounge', icon: 'pi pi-volume-down', members: '34' },
])
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  margin-bottom: var(--sg-space-1rem);
  padding: var(--sg-space-0-1rem);
}

.header h2 {
  margin: 0;
}

.discord-content {
  display: flex;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-1rem);
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-1rem);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
}

.server-item {
  position: relative;
  cursor: pointer;
}

.server-avatar {
  transition: var(--sg-motion-borderneg-radius-0d3s);
}

.server-item:hover :deep(.sg-avatar),
.server-item:focus :deep(.sg-avatar) {
  border-radius: var(--sg-radius-30pct);
}

@media (prefers-reduced-motion: reduce) {
  .server-avatar {
    transition: var(--sg-motion-none);
  }
}

.notification-badge {
  position: absolute;
  bottom: 0;
  right: var(--sg-position-neg-5px);
  background: var(--sg-color-action);
  color: white;
  border-radius: var(--sg-radius-50pct);
  width: var(--sg-size-20px);
  height: var(--sg-size-20px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--sg-font-size-0d8rem);
}

.channels-section {
  flex: 1;
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  padding: var(--sg-space-1rem);
}

.channel-item {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d8rem);
  padding: var(--sg-space-0d5rem);
  border-radius: var(--sg-radius-4px);
  cursor: pointer;
}

.channel-item:hover {
  background: var(--sg-color-surface-hover);
}

.member-count {
  margin-left: auto;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
}
</style> 
