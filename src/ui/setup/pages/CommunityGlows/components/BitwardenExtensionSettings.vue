<template>
  <section
    v-if="status.supported"
    class="bitwarden-settings"
    aria-labelledby="bitwarden-settings-title"
  >
    <p class="bitwarden-section-label">
      {{ $t('bitwarden_settings.section_title') }}
    </p>

    <div class="bitwarden-card">
      <div class="bitwarden-heading">
        <span
          class="bitwarden-icon"
          aria-hidden="true"
        >
          <SgIcon icon="pi pi-shield" />
        </span>
        <div class="bitwarden-heading-copy">
          <h3 id="bitwarden-settings-title">
            {{ $t('bitwarden_settings.title') }}
          </h3>
          <p>{{ $t('bitwarden_settings.description') }}</p>
        </div>
        <span
          class="bitwarden-status"
          :class="statusClass"
        >
          {{ statusLabel }}
        </span>
      </div>

      <div class="bitwarden-trust-note">
        <SgIcon
          icon="pi pi-lock"
          aria-hidden="true"
        />
        <p>{{ $t('bitwarden_settings.local_only') }}</p>
      </div>

      <ol
        v-if="!status.installed"
        class="bitwarden-steps"
      >
        <li>{{ $t('bitwarden_settings.step_download') }}</li>
        <li>{{ $t('bitwarden_settings.step_checksum') }}</li>
        <li>{{ $t('bitwarden_settings.step_choose') }}</li>
        <li>{{ $t('bitwarden_settings.step_restart') }}</li>
      </ol>

      <label
        v-if="!status.installed || status.source === 'managed'"
        class="bitwarden-checksum"
      >
        <span>{{ $t('bitwarden_settings.checksum_label') }}</span>
        <input
          v-model.trim="expectedSha256"
          type="text"
          name="bitwarden-sha256"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :placeholder="$t('bitwarden_settings.checksum_placeholder')"
        />
        <small>{{ $t('bitwarden_settings.checksum_help') }}</small>
      </label>

      <p
        v-if="status.installed && status.version"
        class="bitwarden-version"
      >
        {{ $t('bitwarden_settings.version', { version: status.version }) }}
      </p>

      <p
        v-if="status.source === 'environment'"
        class="bitwarden-managed-note"
      >
        {{ $t('bitwarden_settings.developer_managed') }}
      </p>

      <p
        v-if="status.restartRequired"
        class="bitwarden-restart-note"
        role="status"
      >
        <SgIcon
          icon="pi pi-refresh"
          aria-hidden="true"
        />
        {{ $t('bitwarden_settings.restart_required') }}
      </p>

      <p
        v-if="errorMessage"
        class="bitwarden-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div
        class="bitwarden-actions"
        :aria-busy="busy"
      >
        <button
          type="button"
          class="bitwarden-button secondary"
          :disabled="busy"
          @click="openDownloadPage"
        >
          <SgIcon icon="pi pi-external-link" />
          {{ $t('bitwarden_settings.download') }}
        </button>
        <button
          type="button"
          class="bitwarden-button primary"
          :disabled="busy || status.source === 'environment' || !hasValidSha256"
          @click="chooseArchive"
        >
          <SgIcon
            :icon="busyAction === 'import' ? 'pi pi-spin pi-spinner' : 'pi pi-file-import'"
          />
          {{ status.installed
            ? $t('bitwarden_settings.replace')
            : $t('bitwarden_settings.import') }}
        </button>
        <button
          v-if="status.installed && status.source === 'managed'"
          type="button"
          class="bitwarden-button quiet"
          :disabled="busy"
          @click="disableExtension"
        >
          <SgIcon icon="pi pi-power-off" />
          {{ $t('bitwarden_settings.disable') }}
        </button>
        <button
          v-if="status.restartRequired"
          type="button"
          class="bitwarden-button restart"
          :disabled="busy"
          @click="restartApp"
        >
          <SgIcon
            :icon="busyAction === 'restart' ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
          />
          {{ $t('bitwarden_settings.restart') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface BitwardenExtensionStatus {
  supported: boolean
  installed: boolean
  source: 'none' | 'managed' | 'environment'
  version: string | null
  restartRequired: boolean
}

const emptyStatus = (): BitwardenExtensionStatus => ({
  supported: false,
  installed: false,
  source: 'none',
  version: null,
  restartRequired: false,
})

const { t } = useI18n()
const status = ref<BitwardenExtensionStatus>(emptyStatus())
const busyAction = ref<'status' | 'download' | 'import' | 'disable' | 'restart' | null>('status')
const errorMessage = ref('')
const expectedSha256 = ref('')
const busy = computed(() => busyAction.value !== null)
const hasValidSha256 = computed(() => /^(?:sha256:)?[a-f\d]{64}$/i.test(expectedSha256.value.trim()))
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const statusLabel = computed(() => {
  if (status.value.restartRequired) return t('bitwarden_settings.status_restart')
  if (status.value.installed) return t('bitwarden_settings.status_ready')
  return t('bitwarden_settings.status_missing')
})

const statusClass = computed(() => ({
  ready: status.value.installed && !status.value.restartRequired,
  pending: status.value.restartRequired,
}))

async function invokeStatus(command: string, args?: Record<string, unknown>) {
  const { invoke } = await import('@tauri-apps/api/core')
  status.value = await invoke<BitwardenExtensionStatus>(command, args)
}

async function loadStatus() {
  if (!isTauri) {
    busyAction.value = null
    return
  }
  errorMessage.value = ''
  busyAction.value = 'status'
  try {
    await invokeStatus('get_bitwarden_extension_status')
  } catch {
    errorMessage.value = t('bitwarden_settings.status_error')
  } finally {
    busyAction.value = null
  }
}

async function openDownloadPage() {
  errorMessage.value = ''
  busyAction.value = 'download'
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('open_bitwarden_download_page')
  } catch {
    errorMessage.value = t('bitwarden_settings.download_error')
  } finally {
    busyAction.value = null
  }
}

async function chooseArchive() {
  errorMessage.value = ''
  busyAction.value = 'import'
  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{
        name: t('bitwarden_settings.archive_filter'),
        extensions: ['zip'],
      }],
    })
    if (typeof selected !== 'string') return
    await invokeStatus('import_bitwarden_extension', {
      archivePath: selected,
      expectedSha256: expectedSha256.value,
    })
  } catch {
    errorMessage.value = t('bitwarden_settings.import_error')
  } finally {
    busyAction.value = null
  }
}

async function disableExtension() {
  errorMessage.value = ''
  busyAction.value = 'disable'
  try {
    await invokeStatus('disable_bitwarden_extension')
  } catch {
    errorMessage.value = t('bitwarden_settings.disable_error')
  } finally {
    busyAction.value = null
  }
}

async function restartApp() {
  errorMessage.value = ''
  busyAction.value = 'restart'
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('restart_communityglows')
  } catch {
    errorMessage.value = t('bitwarden_settings.restart_error')
    busyAction.value = null
  }
}

onMounted(loadStatus)
</script>

<style scoped>
.bitwarden-settings {
  margin-top: var(--sg-space-1rem);
}

.bitwarden-section-label {
  margin: var(--sg-space-1rem-0-0d5rem);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d72rem);
  font-weight: 700;
  letter-spacing: var(--sg-letter-spacing-0d06em);
  text-transform: uppercase;
}

.bitwarden-card {
  display: grid;
  gap: var(--sg-space-0d75rem);
  padding: var(--sg-space-1rem);
  border: var(--sg-border-1px) solid var(--sg-color-border-strong);
  border-radius: var(--sg-radius-12px);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-control);
}

.bitwarden-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--sg-space-0d75rem);
}

.bitwarden-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: var(--sg-space-0d6rem);
  border-radius: var(--sg-radius-10px);
  background: var(--sg-color-translucent-surface);
  color: var(--sg-color-action);
}

.bitwarden-heading-copy {
  flex: 1;
  min-width: 0;
}

.bitwarden-heading h3,
.bitwarden-heading p,
.bitwarden-trust-note p,
.bitwarden-managed-note,
.bitwarden-restart-note,
.bitwarden-error,
.bitwarden-version {
  margin: 0;
}

.bitwarden-heading h3 {
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d95rem);
}

.bitwarden-heading p,
.bitwarden-version,
.bitwarden-managed-note {
  margin-top: var(--sg-space-0d35rem);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-settings-hint-line-height);
}

.bitwarden-status {
  flex: 0 0 auto;
  padding: var(--sg-settings-control-padding-block) var(--sg-settings-control-padding-inline);
  border-radius: var(--sg-settings-control-radius);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-settings-control-copy-size);
  font-weight: 700;
}

.bitwarden-status.ready {
  background: var(--sg-color-translucent-surface);
  color: var(--sg-color-action);
}

.bitwarden-status.pending {
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-warning);
}

.bitwarden-trust-note,
.bitwarden-restart-note {
  display: flex;
  align-items: flex-start;
  gap: var(--sg-space-0d55rem);
  padding: var(--sg-space-0d75rem);
  border-radius: var(--sg-radius-10px);
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-settings-hint-line-height);
}

.bitwarden-trust-note {
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
}

.bitwarden-restart-note {
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-warning);
}

.bitwarden-steps {
  display: grid;
  gap: var(--sg-space-0d5rem);
  margin: 0;
  padding-left: var(--sg-space-1d5rem);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
  line-height: var(--sg-settings-hint-line-height);
}

.bitwarden-checksum {
  display: grid;
  gap: var(--sg-space-0d35rem);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 700;
}

.bitwarden-checksum input {
  min-height: var(--sg-size-2d4rem);
  padding: var(--sg-space-0d55rem-0d75rem);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  font: inherit;
  font-family: monospace;
  font-weight: 400;
}

.bitwarden-checksum small {
  color: var(--sg-color-text-muted);
  font-weight: 400;
  line-height: var(--sg-settings-hint-line-height);
}

.bitwarden-error {
  padding: var(--sg-space-0d75rem);
  border: var(--sg-border-1px) solid var(--sg-color-danger-alpha-108);
  border-radius: var(--sg-radius-10px);
  background: var(--sg-color-danger-alpha-08);
  color: var(--sg-color-danger-text);
  font-size: var(--sg-font-size-0d8rem);
}

.bitwarden-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-0d55rem);
}

.bitwarden-button {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-0d5rem);
  min-height: var(--sg-size-2d4rem);
  padding: var(--sg-space-0d55rem-0d75rem);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text);
  cursor: pointer;
  font: inherit;
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 700;
}

.bitwarden-button.primary,
.bitwarden-button.restart {
  border-color: var(--sg-color-action);
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
}

.bitwarden-button.quiet {
  color: var(--sg-color-text-muted);
}

.bitwarden-button:hover:not(:disabled) {
  border-color: var(--sg-color-action);
}

.bitwarden-button:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.bitwarden-button:disabled {
  cursor: not-allowed;
  opacity: var(--sg-opacity-disabled);
}

</style>
