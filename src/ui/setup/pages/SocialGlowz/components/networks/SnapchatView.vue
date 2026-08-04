<template>
  <div class="snapchat-view">
    <h2>Snapchat</h2>
    <div class="snapchat-content">
      <div class="snap-grid">
        <div
          v-for="i in 6"
          :key="i"
          class="snap-card"
        >
          <div class="snap-placeholder">
            <SgIcon icon="pi pi-camera" />
          </div>
          <div class="snap-info">
            <p class="snap-title">Snap #{{ i }}</p>
            <div class="snap-stats">
              <span><SgIcon icon="pi pi-eye" /> {{ Math.floor(Math.random() * 500) }}</span>
              <span><SgIcon icon="pi pi-replay" /> {{ Math.floor(Math.random() * 50) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snapchat-content {
  padding: var(--sg-space-1rem);
}

.snap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--sg-space-1rem);
}

.snap-card {
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  overflow: hidden;
}

.snap-placeholder {
  aspect-ratio: 9/16;
  background: var(--sg-color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--sg-font-size-2rem);
  color: var(--sg-color-text-muted);
}

.snap-info {
  padding: var(--sg-space-0d8rem);
}

.snap-title {
  margin: 0;
  font-weight: bold;
}

.snap-stats {
  display: flex;
  gap: var(--sg-space-1rem);
  margin-top: var(--sg-space-0d5rem);
  color: var(--sg-color-text-muted);
}

.snap-stats span {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d3rem);
}
</style>
