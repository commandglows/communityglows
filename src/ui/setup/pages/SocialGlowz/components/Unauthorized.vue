<template>
  <div class="unauthorized">
    <SgIcon icon="pi pi-lock unauthorized-icon" />
    <h1>Accès non autorisé</h1>
    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
    <Button
      label="Retour"
      icon="pi pi-arrow-left"
      @click="router.back()"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from './ui/SgButton.vue'

const router = useRouter()
</script>

<style scoped>
.unauthorized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: var(--sg-size-60vh);
  gap: var(--sg-space-1rem);
  text-align: center;
  padding: var(--sg-space-2rem);
}

.unauthorized-icon {
  font-size: var(--sg-font-size-3rem);
  color: var(--sg-color-text-muted);
  opacity: 0.5;
}

.unauthorized h1 {
  margin: 0;
  font-size: var(--sg-font-size-1d5rem);
  color: var(--sg-color-text);
}

.unauthorized p {
  margin: 0;
  color: var(--sg-color-text-muted);
  max-width: var(--sg-size-400px);
}
</style>
