<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-header">
        <h1>CommunityGlows</h1>
        <p>Your social media command center</p>
      </div>

      <p
        v-if="accessMessage"
        class="login-access-message"
        role="status"
      >
        {{ accessMessage }}
      </p>

      <!-- Email/password upgrade form -->
      <form
        v-if="showEmailForm"
        class="login-form"
        @submit.prevent="handleSignIn"
      >
        <SgInput
          v-model="email"
          placeholder="Email"
          aria-label="Email"
          type="email"
          class="w-full"
        />
        <SgPassword
          v-model="password"
          placeholder="Password"
          aria-label="Password"
          class="w-full"
          toggle-mask
        />
        <small
          v-if="error"
          class="sg-error"
        >{{ error }}</small>
        <SgButton
          :label="isSignUp ? 'Create account' : 'Sign in'"
          type="submit"
          class="w-full"
          :loading="loading"
        />
        <SgButton
          :label="isSignUp ? 'Already have an account?' : 'Create an account'"
          text
          class="w-full"
          @click="isSignUp = !isSignUp"
        />
      </form>

      <!-- Default: anonymous sign-in (auto) -->
      <div
        v-else
        class="login-actions"
      >
        <SgButton
          v-if="!accessMessage"
          label="Get started"
          icon="pi pi-arrow-right"
          @click="handleGetStarted"
        />
        <SgButton
          :label="accessMessage ? 'Se connecter avec une adresse e-mail' : 'Sign in with email'"
          :text="!accessMessage"
          @click="showEmailForm = true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { signIn } from '@/lib/convexAuth'
import { finalizePasswordSignIn } from '@/lib/cloudSync'
import { beginPostAuthSyncFeedback, resetPostAuthSyncFeedback } from '@/lib/postAuthSyncFeedback'
import { useOnboardingStore } from '@/stores/onboarding'
import SgInput from '../components/ui/SgInput.vue'
import SgButton from '../components/ui/SgButton.vue'
import SgPassword from '../components/ui/SgPassword.vue'

const onboardingStore = useOnboardingStore()
const route = useRoute()
const showEmailForm = ref(false)
const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const accessMessage = computed(() => {
  if (route.query.access === 'required') {
    const destination = typeof route.query.destination === 'string' ? route.query.destination : 'cet espace'
    return `Pour ouvrir ${destination}, connectez-vous ou créez votre compte CommunityGlows.`
  }
  if (route.query.access === 'loading') {
    return 'Nous vérifions votre session. Réessayez dans un instant.'
  }
  if (route.query.access === 'unavailable') {
    return 'La connexion n’est pas disponible pour le moment. Vérifiez votre réseau puis réessayez.'
  }
  return null
})

function handleGetStarted() {
  onboardingStore.reset()
}

async function handleSignIn() {
  loading.value = true
  error.value = ''
  try {
    const normalizedEmail = email.value.trim().toLowerCase()
    email.value = normalizedEmail
    beginPostAuthSyncFeedback()
    await signIn('password', {
      email: normalizedEmail,
      password: password.value,
      flow: isSignUp.value ? 'signUp' : 'signIn',
    })
    await finalizePasswordSignIn({
      email: normalizedEmail,
      flow: isSignUp.value ? 'signUp' : 'signIn',
    })
  } catch (err: unknown) {
    resetPostAuthSyncFeedback()
    error.value =
      err instanceof Error ? err.message : 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sg-size-full);
  min-height: var(--sg-size-100vh);
  background: var(--sg-color-background);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1d5rem);
  padding: var(--sg-space-2rem);
  max-width: var(--sg-size-480px);
  width: var(--sg-size-100pct);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-modal);
}

.login-header {
  text-align: center;
}

.login-header h1 {
  font-size: var(--sg-font-size-1d75rem);
  font-weight: 700;
  margin: var(--sg-space-0-0-0d25rem);
  color: var(--sg-color-text);
}

.login-header p {
  margin: 0;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d95rem);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d75rem);
  width: var(--sg-size-100pct);
}

.login-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-0d75rem);
}

.login-access-message {
  width: var(--sg-size-100pct);
  margin: 0;
  padding: var(--sg-space-12px);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  line-height: var(--sg-line-height-1d45);
  text-align: center;
}
</style>
