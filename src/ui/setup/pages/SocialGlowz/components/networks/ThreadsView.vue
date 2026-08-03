<template>
  <div class="threads-view">
    <h2>Threads Feed</h2>
    <div class="threads-content">
      <div class="thread-list">
        <div
          v-for="i in 5"
          :key="i"
          class="thread-card"
        >
          <div class="thread-header">
            <SgAvatar
              :image="`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`"
              shape="circle"
              size="normal"
            />
            <div class="thread-user">
              <span class="username">@user{{ i }}</span>
              <span class="timestamp">{{ Math.floor(Math.random() * 24) }}h ago</span>
            </div>
          </div>
          <div class="thread-body">
            <p>This is a thread post #{{ i }}. Engaging with the community! 🚀</p>
          </div>
          <div class="thread-actions">
            <SgButton
              aria-label="Aimer"
              icon="pi pi-heart"
              text
            />
            <SgButton
              aria-label="Commenter"
              icon="pi pi-comment"
              text
            />
            <SgButton
              aria-label="Partager"
              icon="pi pi-share-alt"
              text
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SgAvatar from '../ui/SgAvatar.vue'
import SgButton from '../ui/SgButton.vue'
</script>

<style scoped>
.threads-content {
  padding: var(--sg-space-1rem);
}

.thread-list {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
  max-width: var(--sg-size-600px);
  margin: var(--sg-space-0-auto);
}

.thread-card {
  background: var(--surface-card);
  border-radius: var(--sg-radius-12px);
  padding: var(--sg-space-1rem);
}

.thread-header {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d8rem);
  margin-bottom: var(--sg-space-1rem);
}

.thread-user {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
}

.timestamp {
  font-size: var(--sg-font-size-0d8rem);
  color: var(--text-color-secondary);
}

.thread-body {
  margin-bottom: var(--sg-space-1rem);
}

.thread-actions {
  display: flex;
  gap: var(--sg-space-0d5rem);
  border-top: 1px solid var(--surface-border);
  padding-top: var(--sg-space-0d8rem);
}
</style>
