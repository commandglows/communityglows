<template>
  <div class="social-login">
    <div class="login-buttons">
      <Button
        icon="pi pi-facebook"
        :label="$t('facebook.connect_button', 'Sign in with Facebook')"
        class="facebook-button"
        @click="connectWithFacebook"
      />
      <Button
        icon="pi pi-twitter"
        :label="$t('twitter.connect_button')"
        class="twitter-button"
        @click="connectWithTwitter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/SgButton.vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'

const store = useSocialNetworksStore()

const connectWithFacebook = async () => {
  try {
    await store.connectNetwork('facebook', 'fake-auth-code')
  } catch (error) {
    console.error('Erreur de connexion Facebook:', error)
  }
}

const connectWithTwitter = async () => {
  try {
    await store.connectNetwork('twitter', 'fake-auth-code')
  } catch (error) {
    console.error('Erreur de connexion Twitter:', error)
  }
}

</script>

<style scoped>
.social-login {
  max-width: var(--sg-size-400px);
  margin: var(--sg-space-2rem-auto);
  padding: var(--sg-space-2rem);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-radius-8px);
  box-shadow: var(--card-shadow);
}

.login-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1rem);
}

:deep(.facebook-button) {
  background: var(--sg-color-facebook);
}

:deep(.facebook-button:hover) {
  background: var(--sg-color-facebook-hover);
}

:deep(.twitter-button) {
  background: var(--sg-color-twitter);
}

:deep(.twitter-button:hover) {
  background: var(--sg-color-twitter-hover);
}

</style> 
