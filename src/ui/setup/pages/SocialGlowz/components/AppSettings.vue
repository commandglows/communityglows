<template>
  <SgDialog
    v-model="visible"
    :title="$t('common.settings')"
    variant="settings"
  >
    <div class="settings-container">
      <!-- Language -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-globe mr-2"></i>
          <span>{{ $t('settings.language') }}</span>
        </div>
        <select
          v-model="currentLocale"
          class="locale-select"
          @change="onLocaleChange"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <hr class="settings-divider">

      <!-- Theme Toggle -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-moon mr-2"></i>
          <span>{{ $t('theme.mode_label') }}</span>
        </div>
        <div class="theme-mode-group">
          <button
            v-for="mode in themeModes"
            :key="mode.value"
            type="button"
            class="theme-mode-btn"
            :class="{ active: themeStore.themeMode === mode.value }"
            @click="setThemeMode(mode.value)"
          >
            {{ $t(mode.labelKey) }}
          </button>
        </div>
      </div>

      <div
        v-if="themeStore.themeMode === 'auto'"
        class="theme-mode-hint"
      >
        {{ autoThemeHint }}
      </div>

      <hr class="settings-divider">

      <!-- Grayscale / focus mode -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-palette mr-2"></i>
          <span>{{ $t('theme.focus_mode') }}</span>
        </div>
        <SgSwitch
          :model-value="themeStore.grayscaleEnabled"
          :label="$t('theme.focus_mode')"
          @update:model-value="themeStore.setGrayscale"
        />
      </div>

      <hr class="settings-divider">

      <!-- Other settings -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-bell mr-2"></i>
          <span>{{ $t('common.notifications') }}</span>
        </div>
        <SgSwitch
          v-model="notifications"
          :label="$t('common.notifications')"
        />
      </div>

      <hr class="settings-divider">

      <!-- Replay onboarding -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-info-circle mr-2"></i>
          <span>{{ $t('onboarding.replay_button') }}</span>
        </div>
        <button
          class="replay-btn"
          @click="replayOnboarding"
        >
          <i class="pi pi-refresh" />
        </button>
      </div>

      <hr class="settings-divider">

      <!-- Text zoom -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-search-plus mr-2"></i>
          <span>{{ $t('settings.text_zoom') }}</span>
        </div>
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

      <hr class="settings-divider">

      <div class="settings-full-row">
        <KeyboardShortcuts />
      </div>

      <hr class="settings-divider">

      <div class="settings-full-row">
        <BillingAccessPanel />
      </div>

      <hr class="settings-divider">

      <!-- Backup / Restore -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-database mr-2"></i>
          <span>{{ $t('backup.section_title') }}</span>
        </div>
      </div>
      <div class="settings-full-row">
        <BackupRestore />
      </div>
    </div>
  </SgDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/utils/i18n'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import {
  TEXT_ZOOM_DEFAULT,
  TEXT_ZOOM_MAX,
  TEXT_ZOOM_MIN,
  TEXT_ZOOM_STEP,
  normalizeTextZoomLevel,
} from '../utils/textZoom'
import { useThemeStore } from '@/stores/theme'
import { useOnboardingStore } from '@/stores/onboarding'
import BackupRestore from './BackupRestore.vue'
import BillingAccessPanel from './BillingAccessPanel.vue'
import KeyboardShortcuts from './KeyboardShortcuts.vue'
import SgDialog from './ui/SgDialog.vue'
import SgSwitch from './ui/SgSwitch.vue'
import type { ThemeMode } from '@/utils/themeAuto'

const { locale, t } = useI18n()

const visible = ref(false)
const notifications = ref(true)
const currentLocale = ref(locale.value)

const themeStore = useThemeStore()
const onboardingStore = useOnboardingStore()
const themeModes: Array<{ value: ThemeMode; labelKey: string }> = [
  { value: 'light', labelKey: 'theme.light' },
  { value: 'dark', labelKey: 'theme.dark' },
  { value: 'auto', labelKey: 'theme.auto' },
]

const autoThemeHint = computed(() => {
  const sourceKey = themeStore.autoThemeSource === 'sun'
    ? 'theme.auto_source_sun'
    : 'theme.auto_source_system'
  return `${t('theme.auto_helper')} ${t(sourceKey)}`
})

function setThemeMode(mode: ThemeMode) {
  void themeStore.setThemeMode(mode, { allowPrompt: mode === 'auto' })
}

function onLocaleChange() {
  setLocale(currentLocale.value)
}

function replayOnboarding() {
  visible.value = false
  onboardingStore.reset()
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const storedTextZoom = Number(localStorage.getItem('sfz_text_zoom') ?? String(TEXT_ZOOM_DEFAULT))
const textZoomLevel = ref(normalizeTextZoomLevel(storedTextZoom))

if (textZoomLevel.value !== storedTextZoom) {
  localStorage.setItem('sfz_text_zoom', String(textZoomLevel.value))
}

function onTextZoomChange() {
  textZoomLevel.value = normalizeTextZoomLevel(textZoomLevel.value)
  localStorage.setItem('sfz_text_zoom', String(textZoomLevel.value))
  syncSettingsPatch({ textZoom: textZoomLevel.value })
  window.dispatchEvent(new CustomEvent('sfz-text-zoom-changed', {
    detail: { level: textZoomLevel.value },
  }))
  if (isTauri) {
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('set_text_zoom', { level: textZoomLevel.value }).catch(() => {})
    })
  }
}

defineExpose({
  show: () => visible.value = true
})
</script>

<style scoped>
.settings-container {
  padding: var(--sg-settings-padding);
  max-height: var(--sg-settings-max-height);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--sg-scrollbar-thumb) transparent;
  scrollbar-gutter: stable;
}

@media (min-width: 980px) {
  .settings-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--sg-space-1rem);
    row-gap: var(--sg-settings-item-spacing);
  }

  .setting-item,
  .theme-mode-hint,
  .settings-full-row,
  .settings-divider {
    grid-column: span 1;
  }

  .settings-full-row,
  .theme-mode-hint {
    grid-column: 1 / -1;
  }

  .settings-divider {
    width: 100%;
  }
}

.settings-divider { border: 0; border-top: 1px solid var(--surface-border); margin: var(--sg-settings-item-spacing) 0; }

.settings-container::-webkit-scrollbar {
  width: var(--sg-settings-scrollbar-width);
  -webkit-appearance: none;
}

.settings-container::-webkit-scrollbar-track {
  background: transparent;
}

.settings-container::-webkit-scrollbar-thumb {
  background: var(--sg-scrollbar-thumb);
  border-radius: var(--sg-settings-scrollbar-radius);
}

.settings-container::-webkit-scrollbar-thumb:hover {
  background: var(--sg-scrollbar-thumb-hover);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sg-settings-item-spacing);
}

.setting-label {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.setting-label i {
  margin-right: var(--sg-settings-label-icon-gap);
}

.locale-select {
  padding: var(--sg-settings-control-padding-block) var(--sg-settings-control-padding-inline);
  border-radius: var(--sg-settings-control-radius);
  border: 1px solid var(--sg-color-border);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font-size: var(--sg-settings-control-copy-size);
  cursor: pointer;
}

.theme-mode-group {
  display: inline-flex;
  gap: var(--sg-settings-theme-gap);
  padding: var(--sg-settings-theme-group-padding);
  border-radius: var(--sg-settings-theme-group-radius);
  border: 1px solid var(--sg-color-border);
  background: var(--sg-color-surface-muted);
}

.theme-mode-btn {
  border: none;
  border-radius: var(--sg-settings-theme-button-radius);
  background: transparent;
  color: var(--sg-color-text-muted);
  padding: var(--sg-settings-theme-button-padding-block) var(--sg-settings-theme-button-padding-inline);
  font-size: var(--sg-settings-theme-button-size);
  font-weight: 600;
  cursor: pointer;
  transition: var(--sg-settings-transition);
}

.theme-mode-btn.active {
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-action);
}

.theme-mode-hint {
  margin: var(--sg-settings-hint-margin-block-start) 0 var(--sg-settings-hint-margin-block-end);
  font-size: var(--sg-settings-hint-size);
  line-height: var(--sg-settings-hint-line-height);
  color: var(--sg-color-text-muted);
}

.text-zoom-value {
  font-size: var(--sg-settings-control-copy-size);
  color: var(--primary-color);
  font-weight: 600;
}

.text-zoom-slider {
  width: var(--sg-sidebar-fill-size);
  margin: var(--sg-settings-slider-margin-block-start) 0 var(--sg-settings-slider-margin-block-end);
  accent-color: var(--primary-color);
}

.replay-btn {
  padding: var(--sg-settings-theme-button-padding-block) var(--sg-settings-theme-button-padding-inline);
  border-radius: var(--sg-settings-control-radius);
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: var(--sg-settings-transition);
}

.replay-btn:hover {
  background: var(--surface-hover);
}

:global(.dark) .locale-select {
  background: var(--sg-settings-dark-surface);
  border-color: var(--sg-settings-dark-border);
  color: var(--sg-settings-dark-text);
}

:global(.dark) .theme-mode-group {
  background: var(--sg-settings-dark-ground);
  border-color: var(--sg-settings-dark-border);
}

:global(.dark) .theme-mode-btn.active {
  background: var(--sg-settings-dark-surface);
  color: var(--sg-settings-dark-primary);
}
</style>
