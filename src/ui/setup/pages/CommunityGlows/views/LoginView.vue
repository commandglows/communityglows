<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-header">
        <h1>CommunityGlows</h1>
        <h2>{{ $t('login_value.title') }}</h2><p>{{ $t('login_value.description') }}</p>
      </div>

      <p
        v-if="accessMessage"
        class="login-access-message"
        role="status"
      >
        {{ accessMessage }}
      </p>

      <ul v-if="!showEmailForm" class="login-benefits">
        <li>{{ $t('login_value.tasks') }}</li>
        <li>{{ $t('login_value.workspaces') }}</li>
        <li>{{ $t('login_value.preferences') }}</li>
      </ul>
      <!-- Email/password upgrade form -->
      <form
        v-if="showEmailForm"
        class="login-form"
        @submit.prevent="handleSignIn"
      >
        <SgInput
          v-model="email"
          :placeholder="$t('login.email')"
          :aria-label="$t('login.email')"
          type="email"
          name="email"
          autocomplete="username"
          inputmode="email"
          autocapitalize="none"
          spellcheck="false"
          class="w-full"
        />
        <SgPassword
          v-model="password"
          :placeholder="$t('login.password')"
          :aria-label="$t('login.password')"
          name="password"
          :autocomplete="passwordAutocomplete"
          spellcheck="false"
          class="w-full"
          toggle-mask
        />
        <small
          v-if="error"
          class="sg-error"
          role="alert"
        >{{ error }}</small>
        <SgButton
          :label="isSignUp ? $t('login.create_account') : $t('login.sign_in')"
          type="submit"
          class="w-full"
          :loading="loading"
        />
        <SgButton
          :label="isSignUp ? $t('login.already_have_account') : $t('login.create_an_account')"
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
        <SgButton :label="$t('login_value.account_cta')" icon="pi pi-arrow-right" @click="isSignUp = true; showEmailForm = true" />
        <SgButton :label="$t('login.already_have_account')" text @click="isSignUp = false; showEmailForm = true" />
        <div class="login-local-option">
          <RouterLink to="/local-kanban">{{ $t('login_value.try_local') }}</RouterLink>
          <p>{{ $t('login_value.local_warning') }}</p>
        </div>      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { signIn } from '@/lib/convexAuth'
import { loginErrorKey } from '@/lib/loginError'
import { finalizePasswordSignIn } from '@/lib/cloudSync'
import { beginPostAuthSyncFeedback, resetPostAuthSyncFeedback } from '@/lib/postAuthSyncFeedback'

import SgInput from '../components/ui/SgInput.vue'
import SgButton from '../components/ui/SgButton.vue'
import SgPassword from '../components/ui/SgPassword.vue'


const route = useRoute()
const { t } = useI18n()
const showEmailForm = ref(false)
const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const passwordAutocomplete = computed(() =>
  isSignUp.value ? 'new-password' : 'current-password',
)

const accessMessage = computed(() => {
  if (route.query.access === 'required') {
    const destination = typeof route.query.destination === 'string'
      ? route.query.destination
      : t('login.default_destination')
    return t('login.access_required', { destination })
  }
  if (route.query.access === 'loading') {
    return t('login.access_loading')
  }
  if (route.query.access === 'unavailable') {
    return t('login.access_unavailable')
  }
  return null
})



async function handleSignIn() {
  loading.value = true
  error.value = ''
  let authenticated = false
  try {
    const normalizedEmail = email.value.trim().toLowerCase()
    email.value = normalizedEmail
    beginPostAuthSyncFeedback()
    await signIn('password', {
      email: normalizedEmail,
      password: password.value,
      flow: isSignUp.value ? 'signUp' : 'signIn',
    })
    authenticated = true
    await finalizePasswordSignIn({
      email: normalizedEmail,
      flow: isSignUp.value ? 'signUp' : 'signIn',
    })
  } catch (err: unknown) {
    resetPostAuthSyncFeedback()
    error.value = t(loginErrorKey(err, isSignUp.value ? 'signUp' : 'signIn', authenticated))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-benefits { margin: 0; padding-inline-start: var(--sg-space-4); display: grid; gap: var(--sg-space-3); color: var(--sg-color-text); }
.login-header h2 { font-size: var(--sg-font-size-1d25rem); color: var(--sg-color-text); }
.login-local-option { border-top: var(--sg-border-1px) solid var(--sg-color-border); padding-top: var(--sg-space-3); text-align: center; }
.login-local-option a { color: var(--sg-color-action); }
.login-local-option p { color: var(--sg-color-text-muted); font-size: var(--sg-font-size-0d875rem); }
.login-screen {
  display: flex;
  align-items: safe center;
  justify-content: center;
  width: var(--sg-size-full);
  min-height: 100%;
  padding: var(--sg-space-4); box-sizing: border-box; overflow: auto;
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
  box-sizing: border-box;
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
