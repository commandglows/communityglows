<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-header">
        <h1>SocialGlowz</h1>
        <p>Your social media command center</p>
      </div>

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
        <SgSpinner
          v-if="signingIn"
        />
        <template v-else>
          <SgButton
            label="Get started"
            icon="pi pi-arrow-right"
            @click="handleAnonymousSignIn"
          />
          <SgButton
            label="Sign in with email"
            text
            @click="showEmailForm = true"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn } from '@/lib/convexAuth'
import { finalizePasswordSignIn } from '@/lib/cloudSync'
import { beginPostAuthSyncFeedback, resetPostAuthSyncFeedback } from '@/lib/postAuthSyncFeedback'
import SgInput from '../components/ui/SgInput.vue'
import SgButton from '../components/ui/SgButton.vue'
import SgPassword from '../components/ui/SgPassword.vue'
import SgSpinner from '../components/ui/SgSpinner.vue'

const router = useRouter()
const showEmailForm = ref(false)
const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const signingIn = ref(false)

async function handleAnonymousSignIn() {
  signingIn.value = true
  try {
    await signIn('anonymous')
    router.push('/twitter')
  } catch (e) {
    error.value = 'Connection failed. Please try again.'
  } finally {
    signingIn.value = false
  }
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
  min-height: var(--sg-size-100vh);
  background: var(--surface-ground);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1d5rem);
  padding: var(--sg-space-2rem);
  max-width: var(--sg-size-480px);
  width: var(--sg-size-100pct);
}

.login-header {
  text-align: center;
}

.login-header h1 {
  font-size: var(--sg-font-size-1d75rem);
  font-weight: 700;
  margin: var(--sg-space-0-0-0d25rem);
  color: var(--text-color);
}

.login-header p {
  margin: 0;
  color: var(--text-color-secondary);
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
</style>
