<template>
  <SgSheet
    :model-value="modelValue"
    :title="$t('common.settings')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      class="settings-sheet"
      :class="{ 'is-dark': themeStore.isDarkMode, 'is-mobile-compact': isMobileSettingsNarrow }"
    >
      <div
        class="settings-content"
        :class="{
          'is-desktop-grid': isSettingsDesktop,
          'is-ultrawide-grid': isSettingsUltraWide,
        }"
      >
        <div class="settings-column settings-account-column">
          <!-- Account + backup section -->
          <p class="settings-section-label">{{ $t('account.section_title') }}</p>
          <div class="settings-account-card">
            <div class="settings-account-card-header">
              <div>
                <p class="settings-account-hint">
                  {{ isSignedIn && nudge.hasEmailAccount.value
                    ? $t('account.signed_in_hint')
                    : !isConvexConfigured
                      ? $t('account.unavailable_hint')
                      : $t('account.auth_hint') }}
                </p>
              </div>
            </div>

            <div class="settings-account-actions-row">
              <span
                class="settings-account-status"
                :class="{ connected: isSignedIn && nudge.hasEmailAccount.value }"
              >
                {{ isSignedIn && nudge.hasEmailAccount.value
                  ? $t('account.connected_status')
                  : $t('account.disconnected_status') }}
              </span>
              <button
                type="button"
                class="settings-sync-toggle"
                @click="syncInfoExpanded = !syncInfoExpanded"
              >
                <span>
                  {{ syncInfoExpanded ? $t('account.sync_less') : $t('account.sync_more') }}
                </span>
                <SgIcon
                  icon="pi"
                  :class="syncInfoExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"
                />
              </button>
            </div>

            <div
              v-if="syncInfoExpanded"
              class="settings-sync-info-box"
            >
              <div class="settings-sync-info-row">
                <SgIcon icon="pi pi-cloud" />
                <p>{{ $t('account.sync_info') }}</p>
              </div>
              <div class="settings-sync-warning-row">
                <SgIcon icon="pi pi-info-circle" />
                <p>{{ $t('account.cookies_info') }}</p>
              </div>
            </div>

            <template v-if="isSignedIn && nudge.hasEmailAccount.value">
              <div class="settings-field">
                <label class="settings-label">
                  <SgIcon icon="pi pi-envelope" />
                  {{ $t('account.signed_in_as') }}
                </label>
                <span class="settings-email-display">{{ settingsEmail }}</span>
              </div>
              <button
                class="nudge-cta sign-out-btn"
                @click="handleSignOut"
              >
                <SgIcon icon="pi pi-sign-out" />
                {{ $t('account.sign_out') }}
              </button>
              <button
                type="button"
                class="account-delete-trigger"
                @click="openAccountDeletion"
              >
                <SgIcon icon="pi pi-trash" />
                {{ $t('account.delete_action') }}
              </button>
            </template>

            <template v-else-if="isConvexConfigured">
              <form
                class="settings-signup-form"
                @submit.prevent="handleAccountAuth('signIn')"
              >
                <input
                  v-model="signupEmail"
                  type="email"
                  class="settings-input"
                  :placeholder="$t('account.email_placeholder')"
                  required
                />
                <input
                  v-model="signupPassword"
                  type="password"
                  class="settings-input"
                  :placeholder="$t('account.password_placeholder')"
                  minlength="8"
                  required
                />
                <div
                  v-if="signupError"
                  class="signup-error-card"
                >
                  <p class="nudge-error">{{ displayedSignupError }}</p>
                  <div class="signup-error-actions">
                    <button
                      type="button"
                      class="signup-error-btn"
                      @click="copySignupError"
                    >
                      <SgIcon
                        icon="pi"
                        :class="signupErrorCopied ? 'pi-check' : 'pi-copy'"
                      />
                      {{ signupErrorCopied ? $t('common.copied') : $t('common.copy') }}
                    </button>
                    <button
                      v-if="signupErrorNeedsCollapse"
                      type="button"
                      class="signup-error-btn"
                      @click="signupErrorExpanded = !signupErrorExpanded"
                    >
                      {{ signupErrorExpanded ? $t('common.show_less') : $t('common.show_more') }}
                    </button>
                  </div>
                </div>
                <div class="settings-auth-actions">
                  <button
                    type="submit"
                    class="nudge-cta"
                    :disabled="signupLoading"
                  >
                    <SgIcon
                      v-if="signupLoading && authAction === 'signIn'"
                      icon="pi pi-spin pi-spinner"
                    />
                    {{ signupLoading && authAction === 'signIn' ? '' : $t('account.sign_in_button') }}
                  </button>
                  <button
                    type="button"
                    class="nudge-cta secondary-auth-btn"
                    :disabled="signupLoading"
                    @click="handleAccountAuth('signUp')"
                  >
                    <SgIcon
                      v-if="signupLoading && authAction === 'signUp'"
                      icon="pi pi-spin pi-spinner"
                    />
                    {{ signupLoading && authAction === 'signUp' ? '' : $t('account.create_button') }}
                  </button>
                </div>
              </form>
            </template>

            <div class="settings-backup-section">
              <p class="settings-backup-hint">{{ $t('backup.inline_hint') }}</p>
              <BackupRestore :show-info="false" />
            </div>
          </div>
        </div>

        <div class="settings-column settings-service-column">
          <p class="settings-section-label">{{ $t('billing.section_title') }}</p>
          <BillingAccessPanel />

          <BitwardenExtensionSettings />

          <p class="settings-section-label">Support</p>
          <div class="settings-account-card">
            <p class="settings-account-hint">
              Diagnostic de cette installation.
            </p>
            <div class="settings-account-actions-row">
              <span class="settings-account-status">
                {{ buildIdentityLabel }}
              </span>
              <button
                type="button"
                class="settings-sync-toggle"
                @click="copyDiagnostics"
              >
                <SgIcon
                  icon="pi"
                  :class="diagnosticsCopied ? 'pi-check' : 'pi-copy'"
                />
                <span>{{ diagnosticsCopied ? $t('common.copied') : $t('common.copy') }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="settings-column settings-preferences-column">
          <!-- Preferences section -->
          <p class="settings-section-label">{{ $t('settings.preferences') }}</p>

          <div class="settings-account-card">
            <p class="settings-account-hint">Image du profil actif</p>
            <button
              type="button"
              class="nudge-cta"
              @click="emit('edit-profile-avatar')"
            >
              <SgIcon icon="pi pi-pencil" />
              Modifier la photo ou l’emoji
            </button>
          </div>

          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-moon" />
              {{ $t('theme.mode_label') }}
            </span>
          </div>
          <div class="settings-theme-mode-group">
            <button
              v-for="mode in themeModes"
              :key="mode.value"
              type="button"
              class="settings-theme-mode-btn"
              :class="{ active: themeStore.themeMode === mode.value }"
              @click="setThemeMode(mode.value)"
            >
              {{ $t(mode.labelKey) }}
            </button>
          </div>
          <p
            v-if="themeStore.themeMode === 'auto'"
            class="settings-theme-hint"
          >
            {{ autoThemeHint }}
          </p>

          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-window-maximize" />
              Position de la barre de contrôles
            </span>
          </div>
          <div class="settings-theme-mode-group settings-control-bar-position">
            <button
              v-for="position in controlBarPositions"
              :key="position.value"
              type="button"
              class="settings-theme-mode-btn"
              :class="{ active: controlBarStore.position === position.value }"
              @click="controlBarStore.setPosition(position.value)"
            >
              {{ position.label }}
            </button>
          </div>

          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-palette" />
              {{ $t('theme.focus_mode') }}
            </span>
            <button
              class="friends-toggle-pill"
              :class="{ enabled: themeStore.grayscaleEnabled }"
              @click="themeStore.setGrayscale(!themeStore.grayscaleEnabled)"
            >
              <span class="toggle-thumb" />
            </button>
          </div>

          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-mobile" />
              {{ $t('settings.haptic_feedback') }}
            </span>
            <button
              class="friends-toggle-pill"
              :class="{ enabled: hapticEnabled }"
              @click="toggleHaptic"
            >
              <span class="toggle-thumb" />
            </button>
          </div>

          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-volume-up" />
              {{ $t('settings.tap_sound') }}
            </span>
            <button
              class="friends-toggle-pill"
              :class="{ enabled: tapSoundEnabled }"
              @click="toggleTapSound"
            >
              <span class="toggle-thumb" />
            </button>
          </div>
          <div class="settings-sound-variant-row">
            <span class="settings-label settings-sound-variant-label">
              <SgIcon icon="pi pi-sliders-h" />
              {{ $t('settings.tap_sound_variant') }}
            </span>
            <div class="settings-sound-variant-options">
              <button
                v-for="option in TAP_SOUND_VARIANTS"
                :key="option.value"
                type="button"
                class="settings-sound-variant-btn"
                :class="{ active: tapSoundVariant === option.value, disabled: !tapSoundEnabled }"
                :disabled="!tapSoundEnabled"
                @click="selectTapSoundVariant(option.value)"
              >
                {{ $t(option.labelKey) }}
              </button>
            </div>
          </div>

          <!-- Text zoom -->
          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-desktop" />
              {{ $t('settings.ui_scale') }}
            </span>
            <span class="text-zoom-value">{{ uiScaleLevel }}%</span>
          </div>
          <input
            v-model.number="uiScaleLevel"
            type="range"
            class="text-zoom-slider"
            :min="UI_SCALE_MIN"
            :max="UI_SCALE_MAX"
            :step="UI_SCALE_STEP"
            @change="onUiScaleChange"
          />

          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-image" />
              {{ $t('settings.icon_scale') }}
            </span>
            <span class="text-zoom-value">{{ iconScaleLevel }} px</span>
          </div>
          <input
            v-model.number="iconScaleLevel"
            type="range"
            class="text-zoom-slider"
            :min="ICON_SCALE_MIN"
            :max="ICON_SCALE_MAX"
            :step="ICON_SCALE_STEP"
            @change="onIconScaleChange"
          />

          <!-- Network text zoom -->
          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              <SgIcon icon="pi pi-search-plus" />
              {{ $t('settings.text_zoom') }}
            </span>
            <span class="text-zoom-value">{{ textZoomLevel }}%</span>
          </div>
          <input
            v-model.number="textZoomLevel"
            type="range"
            class="text-zoom-slider"
            :min="TEXT_ZOOM_MIN"
            :max="TEXT_ZOOM_MAX"
            :step="TEXT_ZOOM_STEP"
            @change="onTextZoomChange"
          />

          <KeyboardShortcuts />

          <!-- Replay onboarding -->
          <button
            class="settings-replay-btn"
            @click="replayOnboarding"
          >
            <SgIcon icon="pi pi-info-circle" />
            {{ $t('onboarding.replay_button') }}
          </button>
        </div>
      </div>
    </div>

    <SgDialog
      v-model="accountDeletionOpen"
      :title="$t('account.delete_title')"
      :description="$t('account.delete_description')"
      variant="settings"
    >
      <form
        class="account-delete-dialog"
        @submit.prevent="handleAccountDeletion"
      >
        <p class="account-delete-warning">{{ $t('account.delete_warning') }}</p>
        <ul class="account-delete-list">
          <li>{{ $t('account.delete_cloud_data') }}</li>
          <li>{{ $t('account.delete_social_accounts_untouched') }}</li>
          <li>{{ $t('account.delete_license_retention') }}</li>
        </ul>
        <label class="settings-label" for="account-delete-confirmation">
          {{ $t('account.delete_confirmation_label', { email: settingsEmail }) }}
        </label>
        <input
          id="account-delete-confirmation"
          v-model="accountDeletionConfirmation"
          type="email"
          class="settings-input"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :placeholder="settingsEmail"
          :disabled="accountDeletionLoading"
          required
        />
        <p v-if="accountDeletionError" class="nudge-error" role="alert">
          {{ accountDeletionError }}
        </p>
        <div class="account-delete-actions">
          <button
            type="button"
            class="nudge-cta secondary-auth-btn"
            :disabled="accountDeletionLoading"
            @click="accountDeletionOpen = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="account-delete-confirm"
            :disabled="!canDeleteAccount || accountDeletionLoading"
          >
            <SgIcon
              v-if="accountDeletionLoading"
              icon="pi pi-spin pi-spinner"
            />
            {{ accountDeletionLoading ? $t('account.delete_loading') : $t('account.delete_confirm') }}
          </button>
        </div>
      </form>
    </SgDialog>
  </SgSheet>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useDesktopControlBarStore, type DesktopControlBarPosition } from '@/stores/desktopControlBar'
import { useOnboardingStore } from '@/stores/onboarding'
import { useSignupNudge } from '@/composables/useSignupNudge'
import { clearDeletedAccountAuthState, signIn, signOut as convexSignOut, isAuthenticated, isConvexConfigured } from '@/lib/convexAuth'
import { finalizePasswordSignIn, resetCloudSyncState, resetSyncedLocalState } from '@/lib/cloudSync'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { beginPostAuthSyncFeedback, resetPostAuthSyncFeedback } from '@/lib/postAuthSyncFeedback'
import { buildDiagnosticsReport, buildIdentityHeader } from '@/lib/buildDiagnostics'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../../../convex/_generated/api'
import { push } from 'notivue'
import {
  DEFAULT_TAP_SOUND_VARIANT,
  TAP_SOUND_STORAGE_KEY,
  TAP_SOUND_VARIANTS,
  type TapSoundVariant,
  normalizeTapSoundVariant,
} from '../utils/tapSound'
import {
  TEXT_ZOOM_DEFAULT,
  TEXT_ZOOM_MAX,
  TEXT_ZOOM_MIN,
  TEXT_ZOOM_STEP,
  normalizeTextZoomLevel,
} from '../utils/textZoom'
import {
  UI_SCALE_MAX,
  UI_SCALE_MIN,
  UI_SCALE_STEP,
  persistUiScaleLevel,
  readUiScaleLevel,
} from '../utils/uiScale'
import {
  ICON_SCALE_MAX,
  ICON_SCALE_MIN,
  ICON_SCALE_STEP,
  persistIconScaleLevel,
  readIconScaleLevel,
} from '../utils/iconScale'
import { useMediaQuery } from '@/composables/useMediaQuery'
import BackupRestore from './BackupRestore.vue'
import BitwardenExtensionSettings from './BitwardenExtensionSettings.vue'
import BillingAccessPanel from './BillingAccessPanel.vue'
import KeyboardShortcuts from './KeyboardShortcuts.vue'
import SgSheet from './ui/SgSheet.vue'
import SgDialog from './ui/SgDialog.vue'
import type { ThemeMode } from '@/utils/themeAuto'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit-profile-avatar': []
}>()

const { t } = useI18n()
const themeStore = useThemeStore()
const controlBarStore = useDesktopControlBarStore()
const onboardingStore = useOnboardingStore()
const nudge = useSignupNudge()
const isSignedIn = isAuthenticated
const themeModes: Array<{ value: ThemeMode; labelKey: string }> = [
  { value: 'light', labelKey: 'theme.light' },
  { value: 'dark', labelKey: 'theme.dark' },
  { value: 'auto', labelKey: 'theme.auto' },
]
const controlBarPositions: Array<{ value: DesktopControlBarPosition; label: string }> = [
  { value: 'top', label: 'En haut' },
  { value: 'bottom', label: 'En bas' },
]
const autoThemeHint = computed(() => {
  const sourceKey = themeStore.autoThemeSource === 'sun'
    ? 'theme.auto_source_sun'
    : 'theme.auto_source_system'
  return `${t('theme.auto_helper')} ${t(sourceKey)}`
})
const isMobileSettingsNarrow = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.mobileSettingsCompact}px)`)
const isSettingsDesktop = useMediaQuery(`(min-width: ${RESPONSIVE_BREAKPOINTS.settingsDesktop}px)`)
const isSettingsUltraWide = useMediaQuery(`(min-width: ${RESPONSIVE_BREAKPOINTS.settingsUltraWide}px)`)

function setThemeMode(mode: ThemeMode) {
  void themeStore.setThemeMode(mode, { allowPrompt: mode === 'auto' })
}

// ─── Settings state ──────────────────────────────────────────
const settingsEmail = ref(localStorage.getItem('communityglows_email') ?? '')

// ─── Signup form ─────────────────────────────────────────────
const signupEmail = ref('')
const signupPassword = ref('')
const authAction = ref<'signIn' | 'signUp'>('signIn')
const signupError = ref('')
const signupLoading = ref(false)
const accountDeletionOpen = ref(false)
const accountDeletionConfirmation = ref('')
const accountDeletionLoading = ref(false)
const accountDeletionError = ref('')
const canDeleteAccount = computed(() =>
  accountDeletionConfirmation.value.trim().toLowerCase() === settingsEmail.value.trim().toLowerCase()
)
const syncInfoExpanded = ref(false)
const signupErrorCopied = ref(false)
const diagnosticsCopied = ref(false)
const signupErrorExpanded = ref(false)
const SIGNUP_ERROR_PREVIEW_LENGTH = 180
const buildIdentityLabel = computed(() => buildIdentityHeader()[0].replace('commit/build: ', ''))

const signupErrorNeedsCollapse = computed(() =>
  signupError.value.length > SIGNUP_ERROR_PREVIEW_LENGTH || signupError.value.includes('\n'),
)

const displayedSignupError = computed(() => {
  if (signupErrorExpanded.value || !signupErrorNeedsCollapse.value) return signupError.value
  return `${signupError.value.slice(0, SIGNUP_ERROR_PREVIEW_LENGTH).trimEnd()}…`
})

function getAuthErrorMessage(error: unknown, flow: 'signIn' | 'signUp') {
  const message = error instanceof Error ? error.message : ''

  if (flow === 'signUp' && /already exists/i.test(message)) {
    return t('account.already_exists_error')
  }
  if (flow === 'signIn' && /invalid/i.test(message)) {
    return t('account.invalid_credentials_error')
  }

  return message || t('account.error_generic')
}

async function handleAccountAuth(flow: 'signIn' | 'signUp') {
  signupError.value = ''
  signupErrorCopied.value = false
  signupErrorExpanded.value = false
  authAction.value = flow
  signupLoading.value = true
  try {
    const normalizedEmail = signupEmail.value.trim().toLowerCase()
    signupEmail.value = normalizedEmail

    if (flow === 'signUp') {
      const emailExists = await getConvexClient().query(api.users.emailExists, {
        email: normalizedEmail,
      })
      if (emailExists) {
        signupError.value = t('account.already_exists_error')
        return
      }
    }

    beginPostAuthSyncFeedback()
    await signIn('password', {
      email: normalizedEmail,
      password: signupPassword.value,
      flow,
    })
    settingsEmail.value = normalizedEmail
    nudge.onAccountCreated()
    push.success({
      message: flow === 'signIn' ? t('account.signed_in_toast') : t('account.created_toast'),
      duration: 1800,
    })
    signupPassword.value = ''
    await finalizePasswordSignIn({
      email: normalizedEmail,
      flow,
      reopenSettings: true,
    })
  } catch (e: unknown) {
    resetPostAuthSyncFeedback()
    signupError.value = getAuthErrorMessage(e, flow)
  } finally {
    signupLoading.value = false
  }
}

async function copySignupError() {
  if (!signupError.value) return

  try {
    await navigator.clipboard.writeText(signupError.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = signupError.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  signupErrorCopied.value = true
  window.setTimeout(() => {
    signupErrorCopied.value = false
  }, 2000)
}

async function copyDiagnostics() {
  const report = buildDiagnosticsReport({
    account_state: isSignedIn.value && nudge.hasEmailAccount.value ? 'signed_in' : 'signed_out',
    convex_configured: isConvexConfigured ? 'yes' : 'no',
    text_zoom: String(textZoomLevel.value),
    haptic_enabled: String(hapticEnabled.value),
    tap_sound_enabled: String(tapSoundEnabled.value),
  })

  try {
    await navigator.clipboard.writeText(report)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = report
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  diagnosticsCopied.value = true
  window.setTimeout(() => {
    diagnosticsCopied.value = false
  }, 2000)
}

async function handleSignOut() {
  await convexSignOut()
  resetCloudSyncState()
  resetSyncedLocalState()
  nudge.hasEmailAccount.value = false
  settingsEmail.value = ''
  signupPassword.value = ''
  authAction.value = 'signIn'
  push.success({ message: t('account.signed_out_toast'), duration: 3000 })
}

function openAccountDeletion() {
  accountDeletionConfirmation.value = ''
  accountDeletionError.value = ''
  accountDeletionOpen.value = true
}

async function handleAccountDeletion() {
  if (!canDeleteAccount.value || accountDeletionLoading.value) return
  accountDeletionLoading.value = true
  accountDeletionError.value = ''
  try {
    await getConvexClient().action((api as any).accountDeletion.deleteMyAccount, {
      confirmation: accountDeletionConfirmation.value,
    })
    clearDeletedAccountAuthState()
    resetCloudSyncState()
    resetSyncedLocalState()
    nudge.hasEmailAccount.value = false
    settingsEmail.value = ''
    signupPassword.value = ''
    accountDeletionOpen.value = false
    emit('update:modelValue', false)
    push.success({ message: t('account.delete_success'), duration: 4000 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    accountDeletionError.value = /confirmation_mismatch/i.test(message)
      ? t('account.delete_confirmation_error')
      : t('account.delete_error')
  } finally {
    accountDeletionLoading.value = false
  }
}

// ─── Haptic & tap sound ─────────────────────────────────────
const hapticEnabled = ref(localStorage.getItem('communityglows_haptic') !== 'false')
const tapSoundEnabled = ref(localStorage.getItem('communityglows_tap_sound') === 'true')
const tapSoundVariant = ref<TapSoundVariant>(
  normalizeTapSoundVariant(localStorage.getItem(TAP_SOUND_STORAGE_KEY) ?? DEFAULT_TAP_SOUND_VARIANT)
)
const onNativeTapSoundChanged = ((e: CustomEvent) => {
  const enabled = e.detail?.enabled
  if (typeof enabled !== 'boolean') return
  tapSoundEnabled.value = enabled
}) as unknown as (e: Event) => void

if (tapSoundVariant.value !== localStorage.getItem(TAP_SOUND_STORAGE_KEY)) {
  localStorage.setItem(TAP_SOUND_STORAGE_KEY, tapSoundVariant.value)
}

function toggleHaptic() {
  hapticEnabled.value = !hapticEnabled.value
  localStorage.setItem('communityglows_haptic', String(hapticEnabled.value))
  syncSettingsPatch({ hapticEnabled: hapticEnabled.value })
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('plugin:android-webview|set_haptic', { enabled: hapticEnabled.value }).catch(() => {})
  }).catch(() => {})
}

function toggleTapSound() {
  tapSoundEnabled.value = !tapSoundEnabled.value
  localStorage.setItem('communityglows_tap_sound', String(tapSoundEnabled.value))
  syncSettingsPatch({ tapSoundEnabled: tapSoundEnabled.value })
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('plugin:android-webview|set_tap_sound', { enabled: tapSoundEnabled.value }).catch(() => {})
  }).catch(() => {})
}

function selectTapSoundVariant(variant: TapSoundVariant) {
  tapSoundVariant.value = normalizeTapSoundVariant(variant)
  localStorage.setItem(TAP_SOUND_STORAGE_KEY, tapSoundVariant.value)
  syncSettingsPatch({ tapSoundVariant: tapSoundVariant.value })
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('plugin:android-webview|set_tap_sound_variant', { variant: tapSoundVariant.value }).catch(() => {})
    if (tapSoundEnabled.value) {
      invoke('plugin:android-webview|preview_tap_sound').catch(() => {})
    }
  }).catch(() => {})
}

// ─── Text zoom ──────────────────────────────────────────────
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const storedTextZoom = Number(localStorage.getItem('communityglows_text_zoom') ?? String(TEXT_ZOOM_DEFAULT))
const textZoomLevel = ref(normalizeTextZoomLevel(storedTextZoom))

if (textZoomLevel.value !== storedTextZoom) {
  localStorage.setItem('communityglows_text_zoom', String(textZoomLevel.value))
}

function onTextZoomChange() {
  textZoomLevel.value = normalizeTextZoomLevel(textZoomLevel.value)
  localStorage.setItem('communityglows_text_zoom', String(textZoomLevel.value))
  syncSettingsPatch({ textZoom: textZoomLevel.value })
  window.dispatchEvent(new CustomEvent('communityglows-text-zoom-changed', {
    detail: { level: textZoomLevel.value },
  }))
  if (isTauri) {
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('set_text_zoom', { level: textZoomLevel.value }).catch(() => {})
    })
  }
}

const uiScaleLevel = ref(readUiScaleLevel())
const iconScaleLevel = ref(readIconScaleLevel())

function onUiScaleChange() {
  uiScaleLevel.value = persistUiScaleLevel(uiScaleLevel.value)
  syncSettingsPatch({ uiScale: uiScaleLevel.value })
  window.dispatchEvent(new CustomEvent('communityglows-ui-scale-changed', {
    detail: { level: uiScaleLevel.value },
  }))
}

function onIconScaleChange() {
  iconScaleLevel.value = persistIconScaleLevel(iconScaleLevel.value)
  syncSettingsPatch({ iconScale: iconScaleLevel.value })
  window.dispatchEvent(new CustomEvent('communityglows-icon-scale-changed', {
    detail: { level: iconScaleLevel.value },
  }))
}

function replayOnboarding() {
  emit('update:modelValue', false)
  onboardingStore.reset()
}

watch(() => props.modelValue, (open) => {
  if (open) uiScaleLevel.value = readUiScaleLevel()
  if (open) iconScaleLevel.value = readIconScaleLevel()
  if (open) {
    hapticEnabled.value = localStorage.getItem('communityglows_haptic') !== 'false'
    tapSoundEnabled.value = localStorage.getItem('communityglows_tap_sound') === 'true'
    tapSoundVariant.value = normalizeTapSoundVariant(
      localStorage.getItem(TAP_SOUND_STORAGE_KEY) ?? DEFAULT_TAP_SOUND_VARIANT
    )
    return
  }
})

onMounted(() => {
  window.addEventListener('communityglows-tap-sound-changed', onNativeTapSoundChanged)
})

onUnmounted(() => {
  window.removeEventListener('communityglows-tap-sound-changed', onNativeTapSoundChanged)
})
</script>

<style scoped>
.settings-sheet {
  --settings-account-card-bg: var(--sg-color-surface-raised);
  --settings-account-card-border: var(--sg-color-border-strong);
  --settings-account-card-shadow: var(--sg-shadow-0-28px-70px-rgba-15-23-42-0d22);
  --settings-account-status-bg: var(--sg-color-slate-alpha-18);
  --settings-account-status-color: var(--sg-color-text-muted);
  --settings-account-status-connected-bg: var(--sg-color-translucent-surface);
  --settings-account-status-connected-color: var(--sg-color-action);
  --settings-sync-info-bg: var(--sg-color-surface-muted);
  --settings-sync-info-border: var(--sg-color-border);
  --settings-sync-warning-icon: var(--sg-color-warning);
  --settings-cta-gradient-start: var(--sg-color-action);
  --settings-cta-gradient-end: var(--sg-color-action-hover);
  --settings-cta-shadow: var(--sg-shadow-0-8px-20px-rgba-15-23-42-d08);
  --settings-secondary-auth-bg: var(--sg-color-surface-muted);
  --settings-secondary-auth-border: var(--sg-color-border-strong);
  --settings-danger-bg: var(--sg-color-danger-alpha-04);
  --settings-danger-border: var(--sg-color-danger-alpha-36);
  --settings-danger-color: var(--sg-palette-red-600);
  --settings-error-bg: var(--sg-color-danger-alpha-08);
  --settings-error-border: var(--sg-color-danger-alpha-108);
  --settings-error-text: var(--sg-palette-red-600);
  --settings-error-btn-bg: var(--sg-color-surface-raised);
  --settings-error-btn-border: var(--sg-color-danger-alpha-20);
  --settings-error-btn-text: var(--sg-palette-red-700);
  --settings-backup-divider: var(--sg-color-slate-alpha-18);
}

.settings-sheet.is-dark,
:global(html.dark) .settings-sheet,
:global(.dark) .settings-sheet {
  --settings-account-card-bg: var(--sg-color-surface-raised);
  --settings-account-card-border: var(--sg-color-border-strong);
  --settings-account-card-shadow: var(--sg-shadow-0-28px-70px-rgba-2-6-23-0d56);
  --settings-account-status-bg: var(--sg-color-white-alpha-06);
  --settings-account-status-color: var(--sg-color-text-muted);
  --settings-account-status-connected-bg: var(--sg-color-translucent-surface);
  --settings-account-status-connected-color: var(--sg-palette-blue-300);
  --settings-sync-info-bg: var(--sg-color-surface-muted);
  --settings-sync-info-border: var(--sg-color-border);
  --settings-sync-warning-icon: var(--sg-color-warning);
  --settings-cta-gradient-start: var(--sg-color-action);
  --settings-cta-gradient-end: var(--sg-color-action-hover);
  --settings-cta-shadow: var(--sg-shadow-0-8px-24px-rgba-0-0-0-0d15);
  --settings-secondary-auth-bg: var(--sg-color-surface-muted);
  --settings-secondary-auth-border: var(--sg-color-border-strong);
  --settings-danger-bg: var(--sg-color-danger-alpha-10);
  --settings-danger-border: var(--sg-color-danger-light-alpha-32);
  --settings-danger-color: var(--sg-palette-red-300);
  --settings-error-bg: var(--sg-color-danger-dark-alpha-26);
  --settings-error-border: var(--sg-color-danger-light-alpha-22);
  --settings-error-text: var(--sg-palette-red-200);
  --settings-error-btn-bg: var(--sg-color-surface-raised);
  --settings-error-btn-border: var(--sg-color-danger-light-alpha-22);
  --settings-error-btn-text: var(--sg-palette-red-300);
  --settings-backup-divider: var(--sg-color-neutral-alpha-16);
}

/* ─── Settings content ───────────────────────────────────────── */

.settings-content {
  padding: var(--sg-space-0-1d25rem-1d5rem);
}

.settings-content.is-desktop-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: var(--sg-space-1rem);
}

.settings-content.is-desktop-grid .settings-preferences-column {
  grid-column: 1 / -1;
}

.settings-content.is-ultrawide-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.settings-content.is-ultrawide-grid .settings-preferences-column {
  grid-column: auto;
}

.settings-column {
  min-width: 0;
}

.settings-section-label {
  margin: var(--sg-space-1rem-0-0d5rem);
  font-size: var(--sg-font-size-0d72rem);
  font-weight: 700;
  letter-spacing: var(--sg-letter-spacing-0d06em);
  text-transform: uppercase;
  color: var(--sg-color-text-muted);
}

.settings-sound-variant-row {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d55rem);
  margin: var(--sg-space-neg-0d2rem-0-0d8rem);
}

.settings-sound-variant-label {
  margin-bottom: 0;
}

.settings-sound-variant-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sg-space-0d55rem);
}

.settings-sound-variant-btn {
  min-height: var(--sg-size-2d4rem);
  padding: var(--sg-space-0d55rem-0d6rem);
  border-radius: var(--sg-radius-12px);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 600;
  transition: var(--sg-motion-borderneg-color-0d15s-backgroundneg-color-0d15s-color-0d15s-opacity-0d15s);
}

.settings-sound-variant-btn.active {
  background: var(--sg-color-translucent-surface);
  border-color: var(--sg-color-action);
  color: var(--sg-color-action);
}

.settings-sound-variant-btn.disabled {
  opacity: var(--sg-opacity-disabled);
}

.settings-field {
  margin-bottom: var(--sg-space-0d75rem);
}

.settings-label {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 500;
  color: var(--sg-color-text-muted);
  margin-bottom: var(--sg-space-0d35rem);
}

.settings-label i {
  font-size: var(--sg-font-size-0d85rem);
}

.settings-input {
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d6rem-0d75rem);
  font-size: var(--sg-font-size-0d9rem);
  background: var(--sg-color-surface-muted);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  color: var(--sg-color-text);
  outline: none;
  transition: var(--sg-motion-borderneg-color-0d15s);
  box-sizing: border-box;
}

.settings-input:focus {
  border-color: var(--sg-color-action);
}

.settings-account-hint {
  font-size: var(--sg-font-size-0d82rem);
  color: var(--sg-color-text-muted);
  line-height: var(--sg-line-height-1d45);
  margin: 0;
}

.settings-account-card {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d9rem);
  padding: var(--sg-space-0d9rem);
  margin-bottom: var(--sg-space-1rem);
  border-radius: var(--sg-radius-16px);
  background: var(--settings-account-card-bg);
  border: var(--sg-border-1px) solid var(--settings-account-card-border);
  box-shadow: var(--settings-account-card-shadow);
}

.settings-account-card-header {
  display: block;
}

.settings-account-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--sg-space-0d3rem-0d55rem);
  border-radius: var(--sg-radius-999px);
  background: var(--settings-account-status-bg);
  color: var(--settings-account-status-color);
  font-size: var(--sg-font-size-0d72rem);
  font-weight: 700;
  white-space: nowrap;
}

.settings-account-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-0d75rem);
}

.settings-account-status.connected {
  background: var(--settings-account-status-connected-bg);
  color: var(--settings-account-status-connected-color);
}

.settings-sync-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d35rem);
  padding: 0;
  border: none;
  border-radius: var(--sg-radius-999px);
  background: transparent;
  color: var(--sg-color-action);
  font-size: var(--sg-font-size-0d78rem);
  font-weight: 700;
  cursor: pointer;
}

.settings-sync-info-box {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d55rem);
  padding: var(--sg-space-0d7rem-0d8rem);
  border-radius: var(--sg-radius-14px);
  background: var(--settings-sync-info-bg);
  border: var(--sg-border-1px) solid var(--settings-sync-info-border);
}

.settings-sync-info-row,
.settings-sync-warning-row {
  display: flex;
  align-items: flex-start;
  gap: var(--sg-space-0d55rem);
}

.settings-sync-info-row i {
  color: var(--sg-color-action);
  font-size: var(--sg-font-size-0d95rem);
  margin-top: var(--sg-space-0d15rem);
}

.settings-sync-warning-row i {
  color: var(--settings-sync-warning-icon);
  font-size: var(--sg-font-size-0d95rem);
  margin-top: var(--sg-space-0d15rem);
}

.settings-sync-info-row p,
.settings-sync-warning-row p {
  margin: 0;
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-line-height-1d45);
  color: var(--sg-color-text-muted);
}

.settings-signup-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d55rem);
}

.settings-auth-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sg-space-0d6rem);
}

.settings-signup-form .nudge-cta,
.sign-out-btn {
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d7rem);
  border: none;
  border-radius: var(--sg-radius-10px);
  background: linear-gradient(
    135deg,
    var(--settings-cta-gradient-start),
    var(--settings-cta-gradient-end)
  );
  color: var(--sg-color-white);
  font-size: var(--sg-font-size-0d9rem);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d5rem);
  margin-top: 0;
  min-height: var(--sg-size-2d7rem);
  box-shadow: var(--settings-cta-shadow);
}

.account-delete-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d5rem);
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d65rem-0d8rem);
  border: none;
  background: transparent;
  color: var(--settings-danger-color);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 700;
  cursor: pointer;
}

.account-delete-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d9rem);
}

.account-delete-warning {
  margin: 0;
  padding: var(--sg-space-0d7rem-0d8rem);
  border: var(--sg-border-1px) solid var(--settings-danger-border);
  border-radius: var(--sg-radius-12px);
  background: var(--settings-danger-bg);
  color: var(--settings-danger-color);
  font-size: var(--sg-font-size-0d82rem);
  font-weight: 700;
  line-height: var(--sg-line-height-1d45);
}

.account-delete-list {
  margin: 0;
  padding-left: var(--sg-space-1d5rem);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d82rem);
  line-height: var(--sg-line-height-1d45);
}

.account-delete-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sg-space-0d65rem);
}

.account-delete-confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d4rem);
  padding: var(--sg-space-0d65rem-0d8rem);
  border: var(--sg-border-1px) solid var(--settings-danger-border);
  border-radius: var(--sg-radius-10px);
  background: var(--settings-danger-bg);
  color: var(--settings-danger-color);
  font-weight: 700;
  cursor: pointer;
}

.account-delete-confirm:disabled {
  opacity: var(--sg-opacity-disabled);
  cursor: not-allowed;
}

.settings-signup-form .nudge-cta:disabled {
  opacity: var(--sg-opacity-muted);
}

.secondary-auth-btn {
  background: var(--settings-secondary-auth-bg);
  color: var(--sg-color-action);
  border: var(--sg-border-1px) solid var(--settings-secondary-auth-border);
  box-shadow: var(--sg-shadow-none);
}

.sign-out-btn {
  background: var(--settings-danger-bg);
  color: var(--settings-danger-color);
  border: var(--sg-border-1px) solid var(--settings-danger-border);
  margin-top: 0;
  box-shadow: var(--sg-shadow-none);
}

.signup-error-card {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d55rem);
  padding: var(--sg-space-0d7rem-0d8rem);
  border-radius: var(--sg-radius-12px);
  background: var(--settings-error-bg);
  border: var(--sg-border-1px) solid var(--settings-error-border);
}

.nudge-error {
  margin: 0;
  color: var(--settings-error-text);
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-line-height-1d45);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.signup-error-actions {
  display: flex;
  gap: var(--sg-space-0d45rem);
  flex-wrap: wrap;
}

.signup-error-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sg-space-0d35rem);
  padding: var(--sg-space-0d3rem-0d6rem);
  border: var(--sg-border-1px) solid var(--settings-error-btn-border);
  border-radius: var(--sg-radius-999px);
  background: var(--settings-error-btn-bg);
  color: var(--settings-error-btn-text);
  font-size: var(--sg-font-size-0d76rem);
  font-weight: 600;
  cursor: pointer;
}

.settings-email-display {
  font-size: var(--sg-font-size-0d85rem);
  color: var(--sg-color-text);
  font-weight: 500;
}

.settings-backup-section {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d6rem);
  padding-top: var(--sg-space-0d05rem);
  border-top: var(--sg-border-1px) solid var(--settings-backup-divider);
}

.settings-backup-hint {
  margin: 0;
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-line-height-1d45);
  color: var(--sg-color-text-muted);
}

.settings-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sg-space-0d65rem-0);
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
}

.settings-toggle-row:last-child {
  border-bottom: var(--sg-position-none);
}

.settings-theme-mode-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sg-space-0d55rem);
  margin: var(--sg-space-neg-0d15rem-0-0d8rem);
}

.settings-control-bar-position { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.settings-theme-mode-btn {
  min-height: var(--sg-size-2d45rem);
  padding: var(--sg-space-0d55rem-0d6rem);
  border-radius: var(--sg-radius-12px);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 700;
  transition: var(--sg-motion-borderneg-color-0d15s-backgroundneg-color-0d15s-color-0d15s);
}

.settings-theme-mode-btn.active {
  background: var(--sg-color-translucent-surface);
  border-color: var(--sg-color-action);
  color: var(--sg-color-action);
}

.settings-theme-hint {
  margin: var(--sg-space-neg-0d3rem-0-0d8rem);
  font-size: var(--sg-font-size-0d78rem);
  line-height: var(--sg-line-height-1d4);
  color: var(--sg-color-text-muted);
}

.settings-toggle-label {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d6rem);
  font-size: var(--sg-font-size-0d9rem);
  font-weight: 500;
  color: var(--sg-color-text);
}

.settings-toggle-label i {
  font-size: var(--sg-font-size-1rem);
  width: var(--sg-size-2rem);
  text-align: center;
}

.friends-toggle-pill {
  position: relative;
  width: var(--sg-size-2d8rem);
  height: var(--sg-size-1d6rem);
  border-radius: var(--sg-radius-1rem);
  border: none;
  background: var(--sg-color-border);
  cursor: pointer;
  transition: var(--sg-motion-backgroundneg-color-0d2s);
  flex-shrink: 0;
  padding: 0;
}

.friends-toggle-pill.enabled {
  background: var(--sg-color-action);
}

.toggle-thumb {
  position: absolute;
  top: var(--sg-position-3px);
  left: var(--sg-position-3px);
  width: var(--sg-size-1d1rem);
  height: var(--sg-size-1d1rem);
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-control);
  transition: var(--sg-motion-transform-0d2s);
}

.friends-toggle-pill.enabled .toggle-thumb {
  transform: translateX(var(--sg-space-1d2rem));
}

.text-zoom-value {
  font-size: var(--sg-font-size-0d85rem);
  color: var(--sg-color-action);
  font-weight: 600;
  min-width: var(--sg-size-3rem);
  text-align: right;
}

.text-zoom-slider {
  width: var(--sg-size-100pct);
  margin: var(--sg-space-0-0-0d75rem);
  accent-color: var(--sg-color-action);
}

.settings-replay-btn {
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d75rem-1rem);
  margin-top: var(--sg-space-0d5rem);
  border-radius: var(--sg-radius-10px);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d6rem);
  cursor: pointer;
}

.settings-replay-btn:active {
  background: var(--sg-color-surface-hover);
}

@media (prefers-reduced-motion: reduce) {
  .friends-toggle-pill,
  .toggle-thumb {
    transition: var(--sg-motion-none);
  }
}

 .settings-sheet.is-mobile-compact .settings-account-card {
  gap: var(--sg-space-0d75rem);
  padding: var(--sg-space-0d8rem);
}

  .settings-sheet.is-mobile-compact .settings-account-actions-row {
    gap: var(--sg-space-0d5rem);
  }

.settings-sheet.is-mobile-compact .settings-account-status,
.settings-sheet.is-mobile-compact .settings-sync-toggle {
  font-size: var(--sg-font-size-0d72rem);
}
</style>
