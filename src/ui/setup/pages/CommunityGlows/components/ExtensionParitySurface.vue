<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { getVisibleBuiltInSocialNetworks } from "@/config/socialNetworks"
import { i18n, setLocale } from "@/utils/i18n"
import { useProfilesStore } from "@/stores/profiles"
import { useCustomLinksStore } from "@/stores/customLinks"
import { useThemeStore } from "@/stores/theme"
import { getPlatformCapabilities } from "@/platform/capabilities"
import ExtensionTaskCapture from './tasks/ExtensionTaskCapture.vue'
import {
  launchExternalUrl,
  normalizeHttpsUrl,
  openExtensionDashboard,
  openExtensionSidePanel,
  type ExtensionLaunchErrorCode,
} from "@/platform/extensionNetworkLauncher"

type ExtensionSurface = "popup" | "side-panel" | "options" | "install" | "update" | "setup"

const props = withDefaults(
  defineProps<{
    surface: ExtensionSurface
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const profilesStore = useProfilesStore()
const customLinksStore = useCustomLinksStore()
const themeStore = useThemeStore()
const capabilities = getPlatformCapabilities()

const customLabel = ref("")
const customUrl = ref("")
const statusMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const locale = computed({
  get: () => i18n.global.locale.value,
  set: (nextLocale: string) => {
    setLocale(nextLocale, false)
  },
})

const headerKey = computed(() => {
  const keyBySurface: Record<ExtensionSurface, string> = {
    popup: "extension.surface.popup_title",
    "side-panel": "extension.surface.side_panel_title",
    options: "extension.surface.options_title",
    install: "extension.surface.install_title",
    update: "extension.surface.update_title",
    setup: "extension.surface.setup_title",
  }
  return keyBySurface[props.surface]
})

const descriptionKey = computed(() => {
  const keyBySurface: Record<ExtensionSurface, string> = {
    popup: "extension.surface.popup_description",
    "side-panel": "extension.surface.side_panel_description",
    options: "extension.surface.options_description",
    install: "extension.surface.install_description",
    update: "extension.surface.update_description",
    setup: "extension.surface.setup_description",
  }
  return keyBySurface[props.surface]
})

const activeProfileId = computed({
  get: () => profilesStore.activeProfileId,
  set: (profileId: string) => {
    if (!profileId || profileId === profilesStore.activeProfileId) return
    profilesStore.setActive(profileId)
  },
})

const activeProfile = computed(() => profilesStore.activeProfile)

const visibleNetworks = computed(() => {
  const allNetworks = getVisibleBuiltInSocialNetworks(
    activeProfile.value?.hiddenNetworks,
  )
  if (props.compact) {
    return allNetworks.slice(0, 8)
  }
  return allNetworks
})

const profileLinks = computed(() => {
  if (!activeProfileId.value) return []
  return customLinksStore.getLinks(activeProfileId.value)
})

const canOpenSidePanel = computed(() => capabilities.supportsSidePanel)
const isDarkMode = computed(() => themeStore.isDarkMode)

function messageForCode(code: ExtensionLaunchErrorCode): string {
  return i18n.global.t(`extension.launch.errors.${code}`)
}

function clearMessages() {
  statusMessage.value = null
  errorMessage.value = null
}

async function openBuiltInNetwork(url: string) {
  clearMessages()
  const result = await launchExternalUrl(url)
  if (!result.ok) {
    errorMessage.value = messageForCode(result.code)
    return
  }
  statusMessage.value = i18n.global.t("extension.launch.opened")
}

async function openCustomLink(url: string) {
  clearMessages()
  const result = await launchExternalUrl(url)
  if (!result.ok) {
    errorMessage.value = messageForCode(result.code)
    return
  }
  statusMessage.value = i18n.global.t("extension.launch.opened")
}

async function addCustomLink() {
  clearMessages()
  if (!activeProfileId.value) {
    errorMessage.value = i18n.global.t("extension.launch.errors.invalid")
    return
  }

  const validatedUrl = normalizeHttpsUrl(customUrl.value)
  if (!validatedUrl.ok) {
    errorMessage.value = messageForCode(validatedUrl.code)
    return
  }

  const label = customLabel.value.trim()
  if (!label) {
    errorMessage.value = i18n.global.t("extension.launch.errors.empty")
    return
  }

  customLinksStore.addLink(activeProfileId.value, label, validatedUrl.url)
  customLabel.value = ""
  customUrl.value = ""
  statusMessage.value = i18n.global.t("extension.launch.custom_link_added")
}

async function openDashboard() {
  clearMessages()
  const result = await openExtensionDashboard()
  if (!result.ok) {
    errorMessage.value = messageForCode(result.code)
    return
  }
  statusMessage.value = i18n.global.t("extension.launch.dashboard_opened")
}

async function openSidePanel() {
  clearMessages()
  const result = await openExtensionSidePanel()
  if (!result.ok) {
    errorMessage.value = messageForCode(result.code)
    return
  }
  statusMessage.value = i18n.global.t("extension.launch.side_panel_opened")
}

function toggleTheme() {
  const nextMode = isDarkMode.value ? "light" : "dark"
  void themeStore.setThemeMode(nextMode, { allowPrompt: false })
}

onMounted(() => {
  themeStore.initTheme()
  const ensured = profilesStore.ensureDefault()
  if (!profilesStore.activeProfileId) {
    profilesStore.setActive(ensured.id)
  }
})
</script>

<template>
  <section class="ext-parity-root">
    <header class="ext-parity-header">
      <h1 class="ext-parity-title">
        {{ $t(headerKey) }}
      </h1>
      <p class="ext-parity-description">
        {{ $t(descriptionKey) }}
      </p>
    </header>

    <ExtensionTaskCapture v-if="props.surface === 'popup'" />

    <div class="ext-parity-grid ext-parity-grid--settings">
      <label class="ext-field">
        <span class="ext-field-label">{{ $t("extension.profile.label") }}</span>
        <select
          v-model="activeProfileId"
          class="ext-select"
        >
          <option
            v-for="profile in profilesStore.profiles"
            :key="profile.id"
            :value="profile.id"
          >
            {{ profile.emoji }} {{ profile.name }}
          </option>
        </select>
      </label>

      <label class="ext-field">
        <span class="ext-field-label">{{ $t("settings.language") }}</span>
        <select
          v-model="locale"
          class="ext-select"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </label>

      <div class="ext-parity-actions">
        <button
          class="ext-btn ext-btn--outline ext-btn--full"
          type="button"
          @click="toggleTheme"
        >
          {{ isDarkMode ? $t("theme.light") : $t("theme.dark") }}
        </button>
      </div>
    </div>

    <div class="ext-parity-grid">
      <h2 class="ext-parity-section-title">
        {{ $t("extension.networks.title") }}
      </h2>
      <div
        class="ext-network-grid"
        :class="{ 'ext-network-grid--compact': props.compact }"
      >
        <button
          v-for="network in visibleNetworks"
          :key="network.id"
          class="ext-btn ext-btn--small ext-btn--primary ext-btn--left"
          type="button"
          @click="openBuiltInNetwork(network.url)"
        >
          {{ network.label }}
        </button>
      </div>
    </div>

    <div class="ext-parity-grid">
      <h2 class="ext-parity-section-title">
        {{ $t("extension.custom_links.title") }}
      </h2>
      <div class="ext-parity-grid ext-parity-grid--links">
        <input
          v-model="customLabel"
          class="ext-text-input"
          type="text"
          :placeholder="$t('extension.custom_links.name_placeholder')"
        />
        <input
          v-model="customUrl"
          class="ext-text-input"
          type="text"
          :placeholder="$t('extension.custom_links.url_placeholder')"
        />
        <button
          class="ext-btn ext-btn--secondary"
          type="button"
          @click="addCustomLink"
        >
          {{ $t("common.add") }}
        </button>
      </div>

      <ul class="ext-link-list">
        <li
          v-for="link in profileLinks"
          :key="link.id"
          class="ext-link-item"
        >
          <span class="truncate">{{ link.label }}</span>
          <button
            class="ext-btn ext-btn--xs ext-btn--outline"
            type="button"
            @click="openCustomLink(link.url)"
          >
            {{ $t("common.open") }}
          </button>
        </li>
      </ul>
    </div>

    <div class="ext-actions">
      <button
        class="ext-btn ext-btn--outline"
        type="button"
        @click="openDashboard"
      >
        {{ $t("extension.actions.open_dashboard") }}
      </button>
      <button
        class="ext-btn ext-btn--outline"
        type="button"
        :disabled="!canOpenSidePanel"
        @click="openSidePanel"
      >
        {{ $t("extension.actions.open_side_panel") }}
      </button>
    </div>

    <div
      v-if="statusMessage"
      class="ext-alert ext-alert--success"
    >
      {{ statusMessage }}
    </div>
    <div
      v-if="errorMessage"
      class="ext-alert ext-alert--error"
    >
      {{ errorMessage }}
    </div>

    <div class="ext-warning">
      <p>{{ $t("extension.limitations.session_isolation") }}</p>
      <p>{{ $t("extension.limitations.native_backup") }}</p>
      <p>{{ $t("extension.limitations.native_haptics") }}</p>
    </div>
  </section>
</template>
