<template>
  <!-- Mobile: bottom sheet -->
  <Teleport to="body">
    <Transition name="nudge-sheet">
      <div
        v-if="visible && isMobile"
        class="nudge-overlay"
        @click.self="handleDismiss"
      >
        <div class="nudge-sheet">
          <div class="nudge-handle" />
          <div class="nudge-content">
            <div class="nudge-icon">
              <SgIcon icon="pi pi-gift" />
            </div>
            <h3 class="nudge-title">{{ $t('nudge.title') }}</h3>
            <p class="nudge-promo">{{ $t('nudge.promo_text') }}</p>

            <form
              class="nudge-form"
              @submit.prevent="handleSignup"
            >
              <input
                v-model="email"
                type="email"
                class="nudge-input"
                :placeholder="$t('account.email_placeholder')"
                required
              />
              <input
                v-model="password"
                type="password"
                class="nudge-input"
                :placeholder="$t('account.password_placeholder')"
                minlength="8"
                required
              />
              <div
                v-if="error"
                class="signup-error-card"
              >
                <p class="nudge-error">{{ displayedError }}</p>
                <div class="signup-error-actions">
                  <button
                    type="button"
                    class="signup-error-btn"
                    @click="copyError"
                  >
                    <SgIcon
                      icon="pi"
                      :class="errorCopied ? 'pi-check' : 'pi-copy'"
                    />
                    {{ errorCopied ? $t('common.copied') : $t('common.copy') }}
                  </button>
                  <button
                    v-if="errorNeedsCollapse"
                    type="button"
                    class="signup-error-btn"
                    @click="errorExpanded = !errorExpanded"
                  >
                    {{ errorExpanded ? $t('common.show_less') : $t('common.show_more') }}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                class="nudge-cta"
                :disabled="loading"
              >
                <SgIcon
                  v-if="loading"
                  icon="pi pi-spin pi-spinner"
                />
                {{ loading ? '' : $t('nudge.cta_button') }}
              </button>
            </form>

            <button
              class="nudge-dismiss"
              @click="handleDismiss"
            >
              {{ $t('nudge.dismiss') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Desktop: Reka UI dialog with managed focus and Escape behavior -->
  <SgDialog
    v-if="!isMobile"
    v-model="visible"
    :title="$t('nudge.title')"
    variant="nudge"
  >
    <div class="nudge-content nudge-desktop">
      <div class="nudge-icon">
        <SgIcon icon="pi pi-gift" />
      </div>
      <p class="nudge-promo">{{ $t('nudge.promo_text') }}</p>

      <form
        class="nudge-form"
        @submit.prevent="handleSignup"
      >
        <input
          v-model="email"
          type="email"
          class="nudge-input"
          :placeholder="$t('account.email_placeholder')"
          required
        />
        <input
          v-model="password"
          type="password"
          class="nudge-input"
          :placeholder="$t('account.password_placeholder')"
          minlength="8"
          required
        />
        <div
          v-if="error"
          class="signup-error-card"
        >
          <p class="nudge-error">{{ displayedError }}</p>
          <div class="signup-error-actions">
            <button
              type="button"
              class="signup-error-btn"
              @click="copyError"
            >
              <SgIcon
                icon="pi"
                :class="errorCopied ? 'pi-check' : 'pi-copy'"
              />
              {{ errorCopied ? $t('common.copied') : $t('common.copy') }}
            </button>
            <button
              v-if="errorNeedsCollapse"
              type="button"
              class="signup-error-btn"
              @click="errorExpanded = !errorExpanded"
            >
              {{ errorExpanded ? $t('common.show_less') : $t('common.show_more') }}
            </button>
          </div>
        </div>
        <button
          type="submit"
          class="nudge-cta"
          :disabled="loading"
        >
          <SgIcon
            v-if="loading"
            icon="pi pi-spin pi-spinner"
          />
          {{ loading ? '' : $t('nudge.cta_button') }}
        </button>
      </form>

      <button
        class="nudge-dismiss"
        @click="handleDismiss"
      >
        {{ $t('nudge.dismiss') }}
      </button>
    </div>
  </SgDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import { useI18n } from 'vue-i18n'
import { signIn } from '@/lib/convexAuth'
import { finalizePasswordSignIn } from '@/lib/cloudSync'
import { beginPostAuthSyncFeedback, resetPostAuthSyncFeedback } from '@/lib/postAuthSyncFeedback'
import SgDialog from './ui/SgDialog.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'dismiss'): void
  (e: 'account-created'): void
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isMobile = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.sidebarTablet}px)`)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const errorCopied = ref(false)
const errorExpanded = ref(false)
const ERROR_PREVIEW_LENGTH = 180

const errorNeedsCollapse = computed(() =>
  error.value.length > ERROR_PREVIEW_LENGTH || error.value.includes('\n'),
)

const displayedError = computed(() => {
  if (errorExpanded.value || !errorNeedsCollapse.value) return error.value
  return `${error.value.slice(0, ERROR_PREVIEW_LENGTH).trimEnd()}…`
})

function handleDismiss() {
  visible.value = false
  emit('dismiss')
}

async function handleSignup() {
  error.value = ''
  errorCopied.value = false
  errorExpanded.value = false
  loading.value = true
  try {
    const normalizedEmail = email.value.trim().toLowerCase()
    email.value = normalizedEmail
    beginPostAuthSyncFeedback()
    await signIn('password', {
      email: normalizedEmail,
      password: password.value,
      flow: 'signUp',
    })
    visible.value = false
    emit('account-created')
    await finalizePasswordSignIn({
      email: normalizedEmail,
      flow: 'signUp',
    })
  } catch (caughtError: unknown) {
    resetPostAuthSyncFeedback()
    error.value = caughtError instanceof Error ? caughtError.message : t('account.error_generic')
  } finally {
    loading.value = false
  }
}

async function copyError() {
  if (!error.value) return

  try {
    await navigator.clipboard.writeText(error.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = error.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  errorCopied.value = true
  window.setTimeout(() => {
    errorCopied.value = false
  }, 2000)
}
</script>

<style scoped>
/* ─── Mobile bottom sheet ─── */
.nudge-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--sg-nudge-layer);
  background: var(--sg-color-overlay);
  display: flex;
  align-items: flex-end;
}

.nudge-sheet {
  width: var(--sg-size-full);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-nudge-sheet-radius);
  padding: var(--sg-nudge-sheet-padding);
  max-height: var(--sg-nudge-sheet-max-height);
  overflow-y: auto;
}

.nudge-handle {
  width: var(--sg-nudge-handle-width);
  height: var(--sg-nudge-handle-height);
  background: var(--sg-color-border);
  border-radius: var(--sg-nudge-handle-radius);
  margin: 0 auto var(--sg-space-4);
}

/* ─── Shared content ─── */
.nudge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--sg-nudge-content-gap);
}

.nudge-desktop {
  padding: var(--sg-nudge-desktop-padding);
}

.nudge-icon {
  width: var(--sg-nudge-icon-size);
  height: var(--sg-nudge-icon-size);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-action);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sg-color-text-on-action);
  font-size: var(--sg-nudge-icon-font-size);
}

.nudge-title {
  margin: 0;
  font-size: var(--sg-nudge-title-size);
  font-weight: 700;
  color: var(--sg-color-text);
}

.nudge-promo {
  margin: 0;
  font-size: var(--sg-nudge-copy-size);
  color: var(--sg-color-text-muted);
  line-height: var(--sg-nudge-copy-line-height);
}

.nudge-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-nudge-form-gap);
  width: var(--sg-size-full);
  margin-top: var(--sg-space-2);
}

.nudge-input {
  width: var(--sg-size-full);
  padding: var(--sg-nudge-input-padding);
  border-radius: var(--sg-nudge-input-radius);
  border: 1px solid var(--sg-color-border);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font-size: var(--sg-nudge-input-size);
  outline: none;
  box-sizing: border-box;
}

.nudge-input:focus {
  border-color: var(--sg-color-action);
}

.signup-error-card {
  display: flex;
  flex-direction: column;
  gap: var(--sg-nudge-error-gap);
  padding: var(--sg-nudge-error-padding);
  border-radius: var(--sg-nudge-error-radius);
  background: var(--sg-color-danger-soft);
  border: 1px solid var(--sg-color-danger-border);
}

.nudge-error {
  margin: 0;
  color: var(--sg-color-danger);
  font-size: var(--sg-nudge-error-size);
  line-height: var(--sg-nudge-error-line-height);
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.signup-error-actions {
  display: flex;
  gap: var(--sg-nudge-error-action-gap);
  flex-wrap: wrap;
}

.signup-error-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sg-nudge-error-button-gap);
  padding: var(--sg-nudge-error-button-padding);
  border: 1px solid var(--sg-color-danger-border);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-translucent-surface);
  color: var(--sg-color-danger-text);
  font-size: var(--sg-nudge-error-button-size);
  font-weight: 600;
  cursor: pointer;
}

.nudge-cta {
  width: var(--sg-size-full);
  padding: var(--sg-nudge-cta-padding);
  border: none;
  border-radius: var(--sg-nudge-input-radius);
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  font-size: var(--sg-nudge-cta-size);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-2);
}

.nudge-cta:disabled {
  opacity: 0.6;
}

.nudge-dismiss {
  background: none;
  border: none;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-nudge-dismiss-size);
  cursor: pointer;
  padding: var(--sg-space-2);
  margin-top: var(--sg-space-1);
}

/* ─── Transitions ─── */
.nudge-sheet-enter-active,
.nudge-sheet-leave-active {
  transition: var(--sg-nudge-motion);
}

.nudge-sheet-enter-active .nudge-sheet,
.nudge-sheet-leave-active .nudge-sheet {
  transition: var(--sg-nudge-transform-motion);
}

.nudge-sheet-enter-from,
.nudge-sheet-leave-to {
  background: var(--sg-color-transparent);
}

.nudge-sheet-enter-from .nudge-sheet,
.nudge-sheet-leave-to .nudge-sheet {
  transform: translateY(var(--sg-nudge-hidden-offset));
}

</style>
