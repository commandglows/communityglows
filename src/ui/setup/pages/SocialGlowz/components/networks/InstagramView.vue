<template>
  <div class="instagram-view">
    <div class="header">
      <SocialNetworkLogo 
        network="instagram"
        size="small"
        class="mr-2"
      />
      <h2>Instagram Feed</h2>
    </div>
    <div class="instagram-grid">
      <!-- Grille de photos Instagram -->
      <div
        v-for="i in 9"
        :key="i"
        class="instagram-item"
      >
        <div class="image-placeholder">
          <SgIcon icon="pi pi-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SocialNetworkLogo } from '../common'
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

.instagram-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-1rem);
}

.instagram-item {
  aspect-ratio: 1;
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-8px);
  overflow: hidden;
  box-shadow: var(--sg-shadow-control);
}

.image-placeholder {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-2rem);
}
</style> 
