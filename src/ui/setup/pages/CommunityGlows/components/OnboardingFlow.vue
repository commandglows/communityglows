<template>
  <div class="onboarding-backdrop">
    <div class="onboarding-card">
      <!-- Progress dots -->
      <div class="onboarding-dots">
        <span
          v-for="i in TOTAL_STEPS"
          :key="i"
          class="dot"
          :class="{ active: i === step, done: i < step }"
        />
      </div>

      <!-- Step 1: Language selection -->
      <div
        v-if="step === 1"
        class="onboarding-step"
      >
        <SgIcon icon="pi pi-globe language-icon" />
        <h1 class="step-title">{{ $t('onboarding.language_title') }}</h1>
        <p class="step-desc">{{ $t('onboarding.language_desc') }}</p>
        <div class="language-options">
          <button
            class="language-btn"
            @click="selectLanguage('fr')"
          >
            Français
          </button>
          <button
            class="language-btn"
            @click="selectLanguage('en')"
          >
            English
          </button>
        </div>
      </div>

      <!-- Step 2: Welcome -->
      <div
        v-if="step === 2"
        class="onboarding-step"
      >
        <div class="welcome-icon">
          <img
            :src="logoUrl"
            alt="CommunityGlows"
            class="welcome-logo"
          />
        </div>
        <h1 class="step-title">{{ $t('onboarding.welcome_title') }}</h1>
        <p class="step-desc">{{ $t('onboarding.welcome_desc') }}</p>
        <button
          class="btn-primary"
          @click="step = 3"
        >
          {{ $t('onboarding.start_button') }}
        </button>
      </div>

      <!-- Step 3: Profile setup -->
      <div
        v-if="step === 3"
        class="onboarding-step"
      >
        <h2 class="step-title">{{ $t('onboarding.profile_title') }}</h2>
        <p class="step-desc">{{ $t('onboarding.profile_desc') }}</p>

        <div class="profile-setup">
          <div class="emoji-picker">
            <button
              v-for="emoji in EMOJIS"
              :key="emoji"
              class="emoji-btn"
              :class="{ selected: selectedEmoji === emoji }"
              @click="selectedEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
          <input
            v-model="profileName"
            class="profile-input"
            :placeholder="$t('onboarding.profile_name_placeholder')"
            maxlength="30"
            @keydown.enter="step = 4"
          />
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 2"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="step = 4"
          >
            {{ $t('onboarding.next') }}
          </button>
        </div>
      </div>

      <!-- Step 4: Network selection -->
      <div
        v-if="step === 4"
        class="onboarding-step"
      >
        <h2 class="step-title">{{ $t('onboarding.networks_title') }}</h2>
        <p class="step-desc">{{ $t('onboarding.networks_desc') }}</p>

        <div class="network-grid">
          <button
            v-for="net in NETWORKS"
            :key="net.id"
            class="network-chip"
            :class="{ selected: selectedNetworks.has(net.id) }"
            :style="getNetworkChipStyle(net)"
            @click="toggleNetwork(net.id)"
          >
            <SgIcon :icon="net.icon" />
            <span>{{ net.label }}</span>
          </button>
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 3"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="step = 5"
          >
            {{ $t('onboarding.next') }}
          </button>
        </div>
      </div>

      <!-- Step 5: Feature highlights -->
      <div
        v-if="step === 5"
        class="onboarding-step"
      >
        <h2 class="step-title">{{ $t('onboarding.features_title') }}</h2>
        <div class="features-list">
          <div class="feature-item">
            <SgIcon icon="pi pi-users feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_profiles') }}</strong>
              <p>{{ $t('onboarding.feature_profiles_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <SgIcon icon="pi pi-th-large feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_customize') }}</strong>
              <p>{{ $t('onboarding.feature_customize_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <SgIcon icon="pi pi-palette feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_focus') }}</strong>
              <p>{{ $t('onboarding.feature_focus_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <SgIcon icon="pi pi-heart feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_notifications') }}</strong>
              <p>{{ $t('onboarding.feature_notifications_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <SgIcon icon="pi pi-lock feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_privacy') }}</strong>
              <p>{{ $t('onboarding.feature_privacy_desc') }}</p>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 4"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="finish"
          >
            {{ $t('onboarding.finish_button') }}
          </button>
        </div>
      </div>

      <!-- Skip link -->
      <button
        v-if="step > 1 && step < 5"
        class="skip-link"
        @click="finish"
      >
        {{ $t('onboarding.skip') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useProfilesStore } from '@/stores/profiles'
import { useOnboardingStore } from '@/stores/onboarding'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import { setLocale } from '@/utils/i18n'
import logoUrl from '@/assets/logo.png'

const profilesStore = useProfilesStore()
const onboardingStore = useOnboardingStore()

const TOTAL_STEPS = 5
const step = ref(1)

const EMOJIS = ['🟦', '🔵', '🟣', '🟢', '🔴', '🟡', '🟠', '⚫', '🌊', '🔥', '⚡', '🎯']
const selectedEmoji = ref('🟦')
const profileName = ref('')

function selectLanguage(locale: 'fr' | 'en') {
  setLocale(locale)
  step.value = 2
}

const NETWORKS = computed(() =>
  builtInSocialNetworks
    .filter((network) => network.onboarding)
    .map(({ id, label, icon, color, defaultSelected }) => ({ id, label, icon, color, defaultSelected })),
)

// Default: top 5 selected
const selectedNetworks = reactive(
  new Set(
    NETWORKS.value
      .filter(network => network.defaultSelected)
      .map(network => network.id),
  ),
)

type OnboardingNetwork = {
  id: string
  color: string
}

function getReadableChipTextColor(backgroundColor: string): string {
  const normalized = backgroundColor.trim()
  const hex = normalized.startsWith('#') ? normalized.slice(1) : ''

  if (hex.length !== 3 && hex.length !== 6) {
    return '#ffffff'
  }

  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((digit) => `${digit}${digit}`)
          .join('')
      : hex

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return '#ffffff'
  }

  const r = red / 255
  const g = green / 255
  const b = blue / 255

  const toLinear = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

  return luminance > 0.53 ? '#0f172a' : '#ffffff'
}

function getNetworkChipStyle(network: OnboardingNetwork & { color: string }) {
  if (!selectedNetworks.has(network.id)) {
    return {}
  }

  const textColor = getReadableChipTextColor(network.color)
  return {
    background: network.color,
    borderColor: textColor,
    color: textColor,
  }
}

function toggleNetwork(id: string) {
  if (selectedNetworks.has(id)) {
    selectedNetworks.delete(id)
  } else {
    selectedNetworks.add(id)
  }
}

function finish() {
  // Update profile
  profilesStore.ensureDefault()
  const profile = profilesStore.activeProfile
  if (profile) {
    if (profileName.value.trim()) {
      profilesStore.rename(profile.id, profileName.value.trim())
    }
    profilesStore.setEmoji(profile.id, selectedEmoji.value)

    // Hide unselected networks
    const allIds = NETWORKS.value.map(n => n.id)
    for (const id of allIds) {
      const isHidden = !selectedNetworks.has(id)
      const currentlyHidden = profilesStore.isNetworkHidden(profile.id, id)
      if (isHidden !== currentlyHidden) {
        profilesStore.toggleNetworkHidden(profile.id, id)
      }
    }
  }

  onboardingStore.complete()
}
</script>

<style scoped>
.onboarding-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--sg-layer-10000);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sg-color-background);
  padding: var(--sg-space-1rem);
}

.onboarding-card {
  width: var(--sg-size-100pct);
  max-width: var(--sg-size-480px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1d5rem);
  padding: var(--sg-space-2rem);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-lg);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-modal);
}

.onboarding-dots {
  display: flex;
  gap: var(--sg-space-0d5rem);
}

.dot {
  width: var(--sg-size-8px);
  height: var(--sg-size-8px);
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-border);
  transition: var(--sg-motion-background-0d15s), var(--sg-motion-transform-0d15s);
}

.dot.active {
  background: var(--sg-color-action);
  transform: var(--sg-motion-scale-1d3);
}

.dot.done {
  background: var(--sg-color-action);
  opacity: 0.5;
}

.onboarding-step {
  width: var(--sg-size-100pct);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1rem);
  animation: fadeIn var(--sg-motion-all-0d25s-ease);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(var(--sg-size-8px)); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-icon {
  width: var(--sg-size-80px);
  height: var(--sg-size-80px);
  border-radius: var(--sg-radius-20px);
  background: var(--sg-color-surface-muted);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--sg-space-0d5rem);
}

.welcome-logo {
  width: var(--sg-size-56px);
  height: var(--sg-size-56px);
  border-radius: var(--sg-radius-12px);
}

.step-title {
  font-size: var(--sg-font-size-1d5rem);
  font-weight: 700;
  color: var(--sg-color-text);
  margin: 0;
  text-align: center;
}

.step-desc {
  font-size: var(--sg-font-size-0d95rem);
  color: var(--sg-color-text-muted);
  text-align: center;
  margin: 0;
  line-height: var(--sg-line-height-1d5);
  max-width: var(--sg-size-360px);
}

/* Language selection */
.language-icon {
  font-size: var(--sg-font-size-2rem);
  color: var(--sg-color-action);
}

.language-options {
  width: var(--sg-size-100pct);
  max-width: var(--sg-size-320px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sg-space-0d75rem);
}

.language-btn {
  padding: var(--sg-space-1rem);
  border-radius: var(--sg-radius-12px);
  border: var(--sg-size-1d5px) solid var(--sg-color-border);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-1rem);
  font-weight: var(--sg-font-weight-semibold);
  cursor: pointer;
  transition: var(--sg-motion-all-0d15s);
}

.language-btn:hover,
.language-btn:focus-visible {
  border-color: var(--sg-color-action);
  color: var(--sg-color-action);
}

/* Profile setup */
.profile-setup {
  width: var(--sg-size-100pct);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1rem);
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-0d5rem);
  justify-content: center;
  max-width: var(--sg-size-320px);
}

.emoji-btn {
  width: var(--sg-size-44px);
  height: var(--sg-size-44px);
  border-radius: var(--sg-radius-12px);
  border: var(--sg-border-2px) solid var(--sg-color-border);
  background: var(--sg-color-surface-raised);
  font-size: var(--sg-font-size-1d3rem);
  cursor: pointer;
  transition: var(--sg-motion-borderneg-color-0d15s), var(--sg-motion-transform-0d15s);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn.selected {
  border-color: var(--sg-color-action);
  transform: var(--sg-motion-scale-1d1);
}

.profile-input {
  width: var(--sg-size-100pct);
  max-width: var(--sg-size-300px);
  padding: var(--sg-space-0d75rem) var(--sg-space-1rem);
  border-radius: var(--sg-radius-12px);
  border: var(--sg-size-1d5px) solid var(--sg-color-border);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-1rem);
  text-align: center;
  outline: none;
  transition: var(--sg-motion-borderneg-color-0d15s);
}

.profile-input:focus {
  border-color: var(--sg-color-action);
}

/* Network grid */
.network-grid {
  width: var(--sg-size-100pct);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-0d5rem);
  justify-content: center;
  max-height: var(--sg-size-45vh);
  overflow-y: auto;
  padding: var(--sg-space-0d25rem);
}

.network-chip {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d4rem);
  padding: var(--sg-space-0d5rem) var(--sg-space-0d85rem);
  border-radius: var(--sg-radius-20px);
  border: var(--sg-size-1d5px) solid var(--sg-color-border);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-0d85rem);
  cursor: pointer;
  transition: var(--sg-motion-all-0d15s);
}

.network-chip.selected {
  font-weight: var(--sg-font-weight-semibold);
}

.network-chip i {
  font-size: var(--sg-font-size-1rem);
}

/* Features */
.features-list {
  width: var(--sg-size-100pct);
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d75rem);
}

.feature-item {
  display: flex;
  gap: var(--sg-space-0d75rem);
  align-items: flex-start;
  padding: var(--sg-space-0d75rem);
  border-radius: var(--sg-radius-12px);
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
}

.feature-icon {
  font-size: var(--sg-font-size-1d2rem);
  color: var(--sg-color-action);
  margin-top: var(--sg-space-0d15rem);
  flex-shrink: 0;
}

.feature-item strong {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text);
}

.feature-item p {
  font-size: var(--sg-font-size-0d8rem);
  color: var(--sg-color-text-muted);
  margin: var(--sg-space-0d2rem) 0 0;
  line-height: var(--sg-line-height-1d4);
}

/* Actions */
.step-actions {
  display: flex;
  gap: var(--sg-space-0d75rem);
  width: var(--sg-size-100pct);
  max-width: var(--sg-size-320px);
  margin-top: var(--sg-space-0d5rem);
}

.btn-primary {
  flex: 1;
  padding: var(--sg-space-0d75rem) var(--sg-space-1d5rem);
  border-radius: var(--sg-radius-12px);
  border: none;
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  font-size: var(--sg-font-size-1rem);
  font-weight: 600;
  cursor: pointer;
  transition: var(--sg-motion-opacity-0d15s);
  box-shadow: var(--sg-shadow-control);
}

.btn-primary:hover {
  background: var(--sg-color-action-hover);
}

.btn-primary:active {
  opacity: 0.85;
}

.btn-ghost {
  padding: var(--sg-space-0d75rem) var(--sg-space-1d25rem);
  border-radius: var(--sg-radius-12px);
  border: var(--sg-size-1d5px) solid var(--sg-color-border);
  background: transparent;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
  cursor: pointer;
  transition: var(--sg-motion-background-0d15s);
}

.btn-ghost:active {
  background: var(--sg-color-surface-hover);
}

.skip-link {
  background: none;
  border: none;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d85rem);
  cursor: pointer;
  padding: var(--sg-space-0d5rem);
  transition: var(--sg-motion-opacity-0d15s);
}

.skip-link:hover {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-step { animation: none; }
  .dot { transition: none; }
}
</style>
