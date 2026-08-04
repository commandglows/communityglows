<template>
  <div class="lock-screen">
    <section class="lock-panel">
      <div class="lock-mark">
        <SgIcon icon="pi pi-lock" />
      </div>
      <h1>Session verrouillée</h1>
      <p>
        Déverrouillez SocialGlowz pour reprendre votre session. Le code PIN reste
        local à cette session et n'est pas synchronisé.
      </p>
      <p
        v-if="!hasPin"
        class="sg-error"
      >
        Aucun code PIN n'est configuré pour cette session verrouillée. Pour continuer,
        reconnectez-vous.
      </p>

      <form
        class="lock-form"
        @submit.prevent="submitPin"
      >
        <SgPassword
          v-model="pin"
          placeholder="Code PIN"
          aria-label="Code PIN"
          inputmode="numeric"
          toggle-mask
          class="w-full"
          :disabled="!hasPin"
        />
        <small
          v-if="error"
          class="sg-error"
        >{{ error }}</small>
        <SgButton
          label="Déverrouiller"
          type="submit"
          class="w-full"
          :loading="loading"
          :disabled="!hasPin"
        />
      </form>

      <SgButton
        label="Retour à login"
        text
        class="w-full"
        @click="returnToLogin"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SgButton from '../components/ui/SgButton.vue'
import SgPassword from '../components/ui/SgPassword.vue'
import {
  clearSessionPin,
  hasSessionPin,
  unlockSessionWithPin,
} from '@/lib/convexAuth'

const router = useRouter()
const pin = ref('')
const error = ref('')
const loading = ref(false)
const hasPin = computed(() => hasSessionPin())

async function submitPin() {
  loading.value = true
  error.value = ''
  try {
    if (!hasSessionPin()) {
      error.value = 'Aucun code PIN configuré. Reconnectez-vous pour rétablir la session.'
      return
    }

    const unlocked = await unlockSessionWithPin(pin.value)
    if (!unlocked) {
      error.value = 'Code PIN incorrect.'
      return
    }

    await router.replace('/twitter')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Déverrouillage impossible.'
  } finally {
    loading.value = false
  }
}

async function returnToLogin() {
  clearSessionPin()
  await router.replace('/login')
}
</script>

<style scoped>
.lock-screen {
  min-height: var(--sg-size-100vh);
  display: grid;
  place-items: center;
  padding: var(--sg-space-1d5rem);
  background: var(--sg-color-surface-muted);
}

.lock-panel {
  width: var(--sg-size-min-100pct-420px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1rem);
  padding: var(--sg-space-2rem);
  color: var(--sg-color-text);
}

.lock-mark {
  width: var(--sg-size-3rem);
  height: var(--sg-size-3rem);
  border-radius: var(--sg-radius-999px);
  display: grid;
  place-items: center;
  color: var(--sg-color-action);
  background: var(--sg-color-surface-hover);
}

.lock-panel h1 {
  margin: 0;
  font-size: var(--sg-font-size-1d5rem);
}

.lock-panel p {
  margin: 0;
  text-align: center;
  color: var(--sg-color-text-muted);
  line-height: var(--sg-line-height-1d45);
}

.lock-form {
  width: var(--sg-size-100pct);
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d75rem);
}
</style>
