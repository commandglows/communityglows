<template>
  <div class="tiktok-view">
    <h2>TikTok Feed</h2>
    <div class="tiktok-content">
      <div class="video-grid">
        <div
          v-for="i in 6"
          :key="i"
          class="video-card"
        >
          <div class="video-placeholder">
            <SgIcon icon="pi pi-play" />
          </div>
          <div class="video-info">
            <p class="video-title">TikTok #{{ i }}</p>
            <div class="video-stats">
              <span><SgIcon icon="pi pi-heart" /> {{ Math.floor(Math.random() * 1000) }}K</span>
              <span><SgIcon icon="pi pi-comments" /> {{ Math.floor(Math.random() * 100) }}K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tiktok-content {
  padding: var(--sg-space-1rem);
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--sg-space-1rem);
}

.video-card {
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-8px);
  overflow: hidden;
  box-shadow: var(--sg-shadow-control);
}

.video-placeholder {
  aspect-ratio: 9/16;
  background: var(--sg-color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--sg-font-size-2rem);
  color: var(--sg-color-text-muted);
}

.video-info {
  padding: var(--sg-space-0d8rem);
}

.video-title {
  margin: 0;
  font-weight: bold;
}

.video-stats {
  display: flex;
  gap: var(--sg-space-1rem);
  margin-top: var(--sg-space-0d5rem);
  color: var(--sg-color-text-muted);
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d3rem);
}
</style>
