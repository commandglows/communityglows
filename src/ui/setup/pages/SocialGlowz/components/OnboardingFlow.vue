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

      <!-- Step 1: Welcome -->
      <div
        v-if="step === 1"
        class="onboarding-step"
      >
        <div class="welcome-icon">
          <img
            :src="logoUrl"
            alt="SocialGlowz"
            class="welcome-logo"
          />
        </div>
        <h1 class="step-title">{{ $t('onboarding.welcome_title') }}</h1>
        <p class="step-desc">{{ $t('onboarding.welcome_desc') }}</p>
        <button
          class="btn-primary"
          @click="step = 2"
        >
          {{ $t('onboarding.start_button') }}
        </button>
      </div>

      <!-- Step 2: Profile setup -->
      <div
        v-if="step === 2"
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
            @keydown.enter="step = 3"
          />
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 1"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="step = 3"
          >
            {{ $t('onboarding.next') }}
          </button>
        </div>
      </div>

      <!-- Step 3: Network selection -->
      <div
        v-if="step === 3"
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
            :style="selectedNetworks.has(net.id) ? { background: net.color, borderColor: net.color } : {}"
            @click="toggleNetwork(net.id)"
          >
            <SgIcon :icon="net.icon" />
            <span>{{ net.label }}</span>
          </button>
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

      <!-- Step 4: Feature highlights -->
      <div
        v-if="step === 4"
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
              <strong>{{ $t('onboarding.feature_friends') }}</strong>
              <p>{{ $t('onboarding.feature_friends_desc') }}</p>
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
            @click="step = 3"
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
        v-if="step < 4"
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
import logoUrl from '@/assets/logo.png'

const profilesStore = useProfilesStore()
const onboardingStore = useOnboardingStore()

const TOTAL_STEPS = 4
const step = ref(1)

const EMOJIS = ['🟦', '🔵', '🟣', '🟢', '🔴', '🟡', '🟠', '⚫', '🌊', '🔥', '⚡', '🎯']
const selectedEmoji = ref('🟦')
const profileName = ref('')

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
  background: var(--sg-color-surface-muted);
  padding: var(--sg-space-1rem);
}

.onboarding-card {
  width: var(--sg-size-100pct);
  max-width: var(--sg-size-480px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sg-space-1d5rem);
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
  background: var(--sg-color-action);
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
  color: var(--sg-color-text-on-action);
  border-color: transparent;
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
  opacity: 0.7;
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
