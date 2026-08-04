<template>
  <div
    class="backup-section"
    :class="{ 'is-dark': themeStore.isDarkMode }"
  >
    <div
      v-if="showInfo"
      class="backup-info"
    >
      <SgIcon icon="pi pi-info-circle" />
      <p>{{ $t('backup.info_text') }}</p>
    </div>

    <div class="backup-actions">
      <button
        class="backup-btn"
        :disabled="busy"
        @click="startExport"
      >
        <SgIcon icon="pi pi-lock" />
        {{ $t('backup.export_button') }}
      </button>
      <button
        class="backup-btn"
        :disabled="busy"
        @click="startImport"
      >
        <SgIcon icon="pi pi-lock-open" />
        {{ $t('backup.import_button') }}
      </button>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="dialogVisible"
          class="backup-dialog-overlay"
          :class="{ 'is-dark': themeStore.isDarkMode }"
          @click.self="closeIfIdle"
        >
          <div class="backup-dialog">
            <!-- ───── Step 1: Password ───── -->
            <template v-if="step === 'password'">
              <h3>{{ dialogTitle }}</h3>
              <p class="dialog-hint">{{ dialogHint }}</p>

              <div class="dialog-field">
                <label>{{ $t('backup.password_label') }}</label>
                <input
                  ref="passwordInput"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('backup.password_placeholder')"
                  autocomplete="off"
                  @keyup.enter="confirm"
                />
                <button
                  class="toggle-password"
                  @click="showPassword = !showPassword"
                >
                  <SgIcon :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                </button>
              </div>

              <div
                v-if="mode === 'export'"
                class="dialog-field"
              >
                <label>{{ $t('backup.confirm_password_label') }}</label>
                <input
                  v-model="passwordConfirm"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('backup.confirm_password_placeholder')"
                  autocomplete="off"
                  @keyup.enter="confirm"
                />
              </div>

              <div class="dialog-actions">
                <button
                  class="dialog-btn cancel"
                  :disabled="busy"
                  @click="close"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  class="dialog-btn primary"
                  :disabled="busy || !canConfirm"
                  @click="confirm"
                >
                  <SgIcon
                    v-if="busy"
                    icon="pi pi-spin pi-spinner"
                  />
                  {{ busy ? $t('common.loading') : (mode === 'export' ? $t('backup.export_button') : $t('backup.import_button')) }}
                </button>
              </div>
            </template>

            <!-- ───── Step 2: Result — Success ───── -->
            <template v-else-if="step === 'success'">
              <div class="result-icon result-success">
                <SgIcon icon="pi pi-check-circle" />
              </div>

              <h3 class="result-title">
                {{ mode === 'export' ? $t('backup.export_done_title') : $t('backup.import_done_title') }}
              </h3>

              <!-- Export success details -->
              <template v-if="mode === 'export'">
                <div class="result-detail">
                  <SgIcon icon="pi pi-file" />
                  <span class="result-path">{{ friendlyPath }}</span>
                </div>
                <div class="result-instructions">
                  <p class="result-instructions-title">{{ $t('backup.export_next_title') }}</p>
                  <ol>
                    <li>{{ $t('backup.export_step_1') }}</li>
                    <li>{{ $t('backup.export_step_2') }}</li>
                    <li>{{ $t('backup.export_step_3') }}</li>
                  </ol>
                </div>
                <div class="result-tip">
                  <SgIcon icon="pi pi-shield" />
                  <span>{{ $t('backup.export_tip') }}</span>
                </div>
              </template>

              <!-- Import success details -->
              <template v-else>
                <p class="result-message">{{ $t('backup.import_done_message') }}</p>
                <div class="result-countdown">
                  <SgIcon icon="pi pi-spin pi-spinner" />
                  <span>{{ $t('backup.import_reloading', { seconds: countdown }) }}</span>
                </div>
              </template>

              <div class="dialog-actions">
                <button
                  class="dialog-btn primary"
                  @click="close"
                >
                  {{ $t('common.ok') }}
                </button>
              </div>
            </template>

            <!-- ───── Step 2: Result — Error ───── -->
            <template v-else-if="step === 'error'">
              <div class="result-icon result-error">
                <SgIcon icon="pi pi-times-circle" />
              </div>

              <h3 class="result-title result-title-error">
                {{ mode === 'export' ? $t('backup.export_error_title') : $t('backup.import_error_title') }}
              </h3>

              <div class="error-box">
                <p>{{ friendlyError }}</p>
                <button
                  class="copy-error-btn"
                  @click="copyError"
                >
                  <SgIcon :icon="copied ? 'pi pi-check' : 'pi pi-copy'" />
                  {{ copied ? $t('common.copied') : $t('common.copy') }}
                </button>
              </div>

              <div
                v-if="mode === 'import'"
                class="result-instructions"
              >
                <p class="result-instructions-title">{{ $t('backup.error_checklist_title') }}</p>
                <ul>
                  <li>{{ $t('backup.error_check_password') }}</li>
                  <li>{{ $t('backup.error_check_file') }}</li>
                  <li>{{ $t('backup.error_check_version') }}</li>
                </ul>
              </div>

              <div class="dialog-actions">
                <button
                  class="dialog-btn cancel"
                  @click="close"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  class="dialog-btn primary"
                  @click="retry"
                >
                  {{ $t('backup.try_again') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useBackup } from '../composables/useBackup'

withDefaults(defineProps<{
  showInfo?: boolean
}>(), {
  showInfo: true,
})

const { t } = useI18n()
const { exportBackup, importBackup } = useBackup()
const themeStore = useThemeStore()

const dialogVisible = ref(false)
const mode = ref<'export' | 'import'>('export')
const step = ref<'password' | 'success' | 'error'>('password')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const busy = ref(false)
const copied = ref(false)
const rawError = ref('')
const resultPath = ref('')
const countdown = ref(3)
const passwordInput = ref<HTMLInputElement | null>(null)

let countdownTimer: ReturnType<typeof setInterval> | null = null

const dialogTitle = computed(() =>
  mode.value === 'export' ? t('backup.export_label') : t('backup.restore_label'),
)
const dialogHint = computed(() =>
  mode.value === 'export' ? t('backup.export_hint') : t('backup.import_hint'),
)
const canConfirm = computed(() => {
  if (password.value.length < 8) return false
  if (mode.value === 'export' && password.value !== passwordConfirm.value) return false
  return true
})

const friendlyError = computed(() => {
  const msg = rawError.value
  if (msg.includes('Mot de passe incorrect') || msg.includes('incorrect') || msg.includes('corrupted'))
    return t('backup.error_wrong_password')
  if (msg.includes('No file selected'))
    return t('backup.error_no_file')
  if (msg.includes('missing stores'))
    return t('backup.error_invalid_file')
  return msg
})

const friendlyPath = computed(() => {
  const p = resultPath.value
  if (p.startsWith('content://')) return t('backup.export_saved_to_downloads')
  if (p.startsWith('Download/')) return p  // Show actual path: Download/SocialGlowz/filename.sfbak
  if (p.startsWith('backups/')) return t('backup.export_saved_to_downloads')
  return p
})

function resetDialog() {
  password.value = ''
  passwordConfirm.value = ''
  showPassword.value = false
  rawError.value = ''
  resultPath.value = ''
  busy.value = false
  step.value = 'password'
  countdown.value = 3
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function startExport() {
  mode.value = 'export'
  resetDialog()
  dialogVisible.value = true
  nextTick(() => passwordInput.value?.focus())
}

function startImport() {
  mode.value = 'import'
  resetDialog()
  dialogVisible.value = true
  nextTick(() => passwordInput.value?.focus())
}

function close() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  dialogVisible.value = false
}

function closeIfIdle() {
  if (!busy.value) close()
}

function retry() {
  step.value = 'password'
  rawError.value = ''
  busy.value = false
  password.value = ''
  passwordConfirm.value = ''
  nextTick(() => passwordInput.value?.focus())
}

async function copyError() {
  try {
    await navigator.clipboard.writeText(rawError.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = rawError.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function startCountdown() {
  countdown.value = 3
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      window.location.reload()
    }
  }, 1000)
}

async function confirm() {
  if (!canConfirm.value || busy.value) return
  rawError.value = ''
  busy.value = true

  try {
    if (mode.value === 'export') {
      resultPath.value = await exportBackup(password.value)
      step.value = 'success'
    } else {
      await importBackup(password.value)
      step.value = 'success'
      startCountdown()
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      rawError.value = e.message
    } else if (e && typeof e === 'object' && 'message' in e) {
      rawError.value = String((e as { message: unknown }).message)
    } else {
      rawError.value = String(e)
    }
    step.value = 'error'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.backup-section {
  --backup-gap-sm: var(--sg-space-0d6rem);
  --backup-gap-md: var(--sg-space-0d75rem);
  --backup-space-sm: var(--sg-space-0d5rem);
  --backup-space-md: var(--sg-space-0d75rem);
  --backup-space-lg: var(--sg-space-1rem);
  --backup-space-xl: calc(var(--sg-space-1rem) + var(--sg-space-0d25rem));
  --backup-radius-sm: var(--sg-radius-sm);
  --backup-radius-md: var(--sg-radius-lg);
  --backup-info-bg: color-mix(in srgb, var(--sg-color-info) 8%, transparent);
  --backup-info-border: color-mix(in srgb, var(--sg-color-info) 24%, transparent);
  --backup-info-text: var(--sg-color-text);
  --backup-info-icon: var(--sg-color-info);
  --backup-btn-bg: var(--sg-color-surface-muted);
  --backup-btn-border: var(--sg-color-border);
  --backup-btn-text: var(--sg-color-text);
  --backup-btn-hover: var(--sg-color-surface-hover);
  width: var(--sg-size-full);
}

.backup-dialog-overlay {
  --backup-overlay-bg: color-mix(in srgb, var(--sg-color-slate-overlay-60) 100%, transparent);
  --backup-dialog-bg: var(--sg-color-surface-raised);
  --backup-dialog-border: var(--sg-color-border);
  --backup-dialog-text: var(--sg-color-text);
  --backup-dialog-muted: color-mix(in srgb, var(--sg-color-text-muted) 72%, transparent);
  --backup-dialog-shadow: var(--sg-shadow-modal);
  --backup-input-bg: var(--sg-color-surface-muted);
  --backup-input-border: var(--sg-color-border);
  --backup-input-text: var(--sg-color-text);
  --backup-input-placeholder: color-mix(in srgb, var(--sg-color-text-muted) 78%, transparent);
  --backup-result-detail-bg: var(--sg-color-surface-muted);
  --backup-result-detail-text: var(--sg-color-text);
  --backup-result-tip-bg: color-mix(in srgb, var(--sg-color-success) 10%, transparent);
  --backup-result-tip-border: color-mix(in srgb, var(--sg-color-success) 24%, transparent);
  --backup-result-tip-text: color-mix(in srgb, var(--sg-color-success) 92%, var(--sg-color-text));
  --backup-result-message: color-mix(in srgb, var(--sg-color-text) 82%, transparent);
  --backup-result-countdown: color-mix(in srgb, var(--sg-color-text) 72%, transparent);
  --backup-error-bg: color-mix(in srgb, var(--sg-color-danger) 10%, transparent);
  --backup-error-border: color-mix(in srgb, var(--sg-color-danger) 24%, transparent);
  --backup-error-text: var(--sg-color-danger-text);
  --backup-copy-btn-border: color-mix(in srgb, var(--sg-color-danger) 30%, transparent);
  --backup-copy-btn-text: var(--sg-color-danger);
  --backup-copy-btn-hover: var(--sg-color-danger-soft);
  --backup-cancel-bg: var(--sg-color-surface-muted);
  --backup-cancel-text: var(--sg-color-text);
  --backup-primary-bg: var(--sg-color-action);
  --backup-primary-bg-hover: var(--sg-color-action-hover);
  --backup-primary-text: var(--sg-color-text-on-action);
  --backup-toggle-color: color-mix(in srgb, var(--sg-color-text) 62%, transparent);
  position: fixed;
  width: var(--sg-size-full);
}

.backup-section.is-dark,
.backup-dialog-overlay.is-dark {
  --backup-info-bg: color-mix(in srgb, var(--sg-color-blue-alpha-20) 100%, transparent);
  --backup-info-border: color-mix(in srgb, var(--sg-color-blue-alpha-20) 50%, transparent);
  --backup-info-text: var(--sg-color-text);
  --backup-info-icon: var(--sg-palette-blue-300);
  --backup-btn-bg: color-mix(in srgb, var(--sg-color-surface-raised) 92%, var(--sg-color-blue-alpha-20) 8%);
  --backup-btn-border: color-mix(in srgb, var(--sg-color-border) 80%, var(--sg-color-action) 20%);
  --backup-btn-text: var(--sg-color-text);
  --backup-btn-hover: color-mix(in srgb, var(--sg-color-surface-raised) 80%, var(--sg-color-action) 20%);
  --backup-overlay-bg: color-mix(in srgb, var(--sg-color-slate-scrim-42) 84%, transparent);
  --backup-dialog-bg: color-mix(in srgb, var(--sg-color-surface-raised) 84%, var(--sg-color-overlay) 16%);
  --backup-dialog-border: color-mix(in srgb, var(--sg-color-border) 72%, transparent);
  --backup-dialog-text: var(--sg-color-text);
  --backup-dialog-muted: var(--sg-color-text-muted);
  --backup-dialog-shadow: var(--sg-shadow-modal);
  --backup-input-bg: color-mix(in srgb, var(--sg-color-surface-raised) 84%, var(--sg-color-white-alpha-06) 16%);
  --backup-input-border: color-mix(in srgb, var(--sg-color-border) 84%, var(--sg-color-white-alpha-08) 16%);
  --backup-input-text: var(--sg-color-text);
  --backup-input-placeholder: var(--sg-color-text-muted);
  --backup-result-detail-bg: color-mix(in srgb, var(--sg-color-surface-raised) 88%, var(--sg-color-white-alpha-06) 12%);
  --backup-result-detail-text: var(--sg-color-text);
  --backup-result-tip-bg: color-mix(in srgb, var(--sg-color-success) 18%, transparent);
  --backup-result-tip-border: color-mix(in srgb, var(--sg-color-success) 30%, transparent);
  --backup-result-tip-text: color-mix(in srgb, var(--sg-color-success) 82%, var(--sg-color-text));
  --backup-result-message: var(--sg-color-text);
  --backup-result-countdown: var(--sg-color-text-muted);
  --backup-error-bg: var(--sg-color-danger-dark-alpha-26);
  --backup-error-border: color-mix(in srgb, var(--sg-color-danger) 24%, transparent);
  --backup-error-text: var(--sg-color-danger-light-alpha-22);
  --backup-copy-btn-border: color-mix(in srgb, var(--sg-color-danger) 26%, transparent);
  --backup-copy-btn-text: var(--sg-color-danger);
  --backup-copy-btn-hover: var(--sg-color-danger-light-alpha-12);
  --backup-cancel-bg: color-mix(in srgb, var(--sg-color-surface-raised) 88%, var(--sg-color-white-alpha-06) 12%);
  --backup-cancel-text: var(--sg-color-text);
  --backup-primary-bg: var(--sg-color-action);
  --backup-primary-bg-hover: var(--sg-color-action-hover);
  --backup-primary-text: var(--sg-color-text-on-action);
  --backup-toggle-color: var(--sg-color-text-muted);
}

.backup-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--backup-gap-sm);
}

.backup-info {
  display: flex;
  gap: var(--backup-gap-sm);
  align-items: flex-start;
  padding: var(--sg-space-0d6rem) var(--sg-space-0d75rem);
  margin-bottom: var(--backup-space-md);
  border-radius: var(--backup-radius-sm);
  background: var(--backup-info-bg);
  border: 1px solid var(--backup-info-border);
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-line-height-1d4);
  color: var(--backup-info-text);
  opacity: 0.85;
}

.backup-info :deep(.sg-icon) {
  color: var(--backup-info-icon);
  font-size: var(--sg-font-size-1rem);
  flex-shrink: 0;
  margin-top: var(--sg-space-0d25rem);
}

.backup-info p {
  margin: 0;
}

.backup-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d4rem);
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d65rem-0);
  border-radius: var(--sg-radius-sm);
  border: 1px solid var(--backup-btn-border);
  background: var(--backup-btn-bg);
  color: var(--backup-btn-text);
  cursor: pointer;
  font-size: var(--sg-font-size-0d85rem);
  font-weight: 600;
  transition: var(--sg-motion-all-0d2s-ease);
}

.backup-btn:hover:not(:disabled) {
  background: var(--backup-btn-hover);
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dialog overlay */
.backup-dialog-overlay {
  inset: 0;
  z-index: var(--sg-layer-1000);
  background: var(--backup-overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sg-space-1rem);
  backdrop-filter: blur(10px);
}

.backup-dialog {
  background: var(--backup-dialog-bg);
  color: var(--backup-dialog-text);
  border-radius: var(--sg-radius-lg);
  padding: var(--sg-space-1d5rem);
  width: var(--sg-size-100pct);
  max-width: var(--sg-dialog-width);
  box-shadow: var(--backup-dialog-shadow);
  border: 1px solid var(--backup-dialog-border);
}

.backup-dialog h3 {
  margin: 0 0 var(--sg-space-0d25rem);
  font-size: var(--sg-font-size-1d1rem);
}

.dialog-hint {
  margin: 0 0 var(--sg-space-1rem);
  font-size: var(--sg-font-size-0d85rem);
  color: var(--backup-dialog-muted);
}

.dialog-field {
  position: relative;
  margin-bottom: var(--backup-space-md);
}

.dialog-field label {
  display: block;
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 600;
  margin-bottom: var(--sg-space-0d25rem);
  color: var(--backup-dialog-muted);
}

.dialog-field input {
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d5rem) var(--sg-space-2rem) var(--sg-space-0d5rem) var(--sg-space-0d75rem);
  border-radius: var(--sg-radius-sm);
  border: 1px solid var(--backup-input-border);
  background: var(--backup-input-bg);
  color: var(--backup-input-text);
  font-size: var(--sg-font-size-0d9rem);
  box-sizing: border-box;
}

.dialog-field input::placeholder {
  color: var(--backup-input-placeholder);
}

.toggle-password {
  position: absolute;
  right: var(--sg-space-0d5rem);
  bottom: var(--sg-space-0d45rem);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--backup-toggle-color);
}

/* ─── Result screens ─── */
.result-icon {
  text-align: center;
  margin-bottom: var(--backup-space-md);
}

.result-icon :deep(.sg-icon) {
  font-size: var(--sg-font-size-3rem);
}

.result-success :deep(.sg-icon) {
  color: var(--sg-color-success);
}

.result-error :deep(.sg-icon) {
  color: var(--sg-color-danger);
}

.result-title {
  text-align: center;
  margin: 0 0 var(--sg-space-1rem);
  font-size: var(--sg-font-size-1d1rem);
}

.result-title-error {
  color: var(--sg-color-danger);
}

.result-detail {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d6rem) var(--sg-space-0d75rem);
  border-radius: var(--sg-radius-sm);
  background: var(--backup-result-detail-bg);
  margin-bottom: var(--sg-space-1rem);
  font-size: var(--sg-font-size-0d8rem);
  word-break: break-all;
  color: var(--backup-result-detail-text);
}

.result-detail :deep(.sg-icon) {
  color: var(--sg-color-info);
  flex-shrink: 0;
}

.result-path {
  color: var(--backup-result-detail-text);
  opacity: 0.88;
}

.result-instructions {
  margin-bottom: var(--sg-space-1rem);
  font-size: var(--sg-font-size-0d82rem);
  line-height: var(--sg-line-height-1d5);
}

.result-instructions-title {
  font-weight: 600;
  margin: 0 0 var(--sg-space-0d4rem);
  font-size: var(--sg-font-size-0d85rem);
}

.result-instructions ol,
.result-instructions ul {
  margin: 0;
  padding-left: var(--sg-space-1rem);
}

.result-instructions li {
  margin-bottom: var(--sg-space-0d25rem);
}

.result-tip {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d5rem) var(--sg-space-0d75rem);
  border-radius: var(--sg-radius-sm);
  background: var(--backup-result-tip-bg);
  border: 1px solid var(--backup-result-tip-border);
  font-size: var(--sg-font-size-0d78rem);
  margin-bottom: var(--sg-space-1rem);
  color: var(--backup-result-tip-text);
}

.result-message {
  text-align: center;
  font-size: var(--sg-font-size-0d9rem);
  margin: 0 0 var(--sg-space-1rem);
  color: var(--backup-result-message);
}

.result-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d5rem);
  margin-bottom: var(--sg-space-1rem);
  font-size: var(--sg-font-size-0d85rem);
  color: var(--backup-result-countdown);
}

.error-box {
  padding: var(--sg-space-0d75rem);
  border-radius: var(--sg-radius-sm);
  background: var(--backup-error-bg);
  border: 1px solid var(--backup-error-border);
  font-size: var(--sg-font-size-0d85rem);
  margin-bottom: var(--sg-space-1rem);
  color: var(--backup-error-text);
}

.error-box p {
  margin: 0;
}

.copy-error-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sg-space-0d25rem);
  margin-top: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d25rem) var(--sg-space-0d5rem);
  border-radius: var(--sg-radius-sm);
  border: 1px solid var(--backup-copy-btn-border);
  background: transparent;
  color: var(--backup-copy-btn-text);
  font-size: var(--sg-font-size-0d78rem);
  cursor: pointer;
  transition: var(--sg-motion-backgroundneg-color-0d15s);
}

.copy-error-btn:hover {
  background: var(--backup-copy-btn-hover);
}

/* ─── Actions ─── */
.dialog-actions {
  display: flex;
  gap: var(--sg-space-0d5rem);
  justify-content: flex-end;
  margin-top: var(--sg-space-1rem);
}

.dialog-btn {
  padding: var(--sg-space-0d5rem) var(--sg-space-1rem);
  border-radius: var(--sg-radius-sm);
  border: none;
  cursor: pointer;
  font-size: var(--sg-font-size-0d85rem);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d4rem);
  transition: var(--sg-motion-opacity-0d15s);
}

.dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-btn.cancel {
  background: var(--backup-cancel-bg);
  color: var(--backup-cancel-text);
}

.dialog-btn.primary {
  background: var(--backup-primary-bg);
  color: var(--backup-primary-text);
}

.dialog-btn.primary:hover:not(:disabled) {
  background: var(--backup-primary-bg-hover);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: var(--sg-motion-opacity-0d15s);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
