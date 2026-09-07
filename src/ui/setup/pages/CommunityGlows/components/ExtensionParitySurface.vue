<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from "vue"
import { builtInSocialNetworks, getVisibleBuiltInSocialNetworks } from "@/config/socialNetworks"
import { groupNetworks, networkGroupSelection } from "@/config/socialNetworkGroups"
import ManagedNetworkTabs from './ManagedNetworkTabs.vue'
import { hasManagedNetworkTabs, type NetworkTarget } from '@/platform/managedNetworkTabs'
import { getNetworkGroupId } from '@/config/socialNetworkGroups'
import NetworkGroupHeader from "./NetworkGroupHeader.vue"
import { i18n, setLocale } from "@/utils/i18n"
import { useExtensionState } from "@/composables/useExtensionState"
import {
  selectExtensionProfile,
  saveExtensionLink,
  removeExtensionLink,
  setExtensionNetworksHidden,
} from "@/platform/extensionState"
import { useThemeStore } from "@/stores/theme"
import { getPlatformCapabilities } from "@/platform/capabilities"
import ExtensionNativeGuide from './ExtensionNativeGuide.vue'
import ExtensionTaskCapture from "./tasks/ExtensionTaskCapture.vue"
import {
  launchExternalUrl,
  launchManagedNetwork,
  normalizeHttpsUrl,
  openExtensionDashboard,
  openExtensionSidePanel,
  type ExtensionLaunchErrorCode,
} from "@/platform/extensionNetworkLauncher"

type ExtensionSurface =
  "popup" | "side-panel" | "options" | "install" | "update" | "setup"

const props = withDefaults(
  defineProps<{
    surface: ExtensionSurface
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const { state, loading, error: storageError } = useExtensionState()
const busy = ref(false)
const hasTaskDraft = ref(false)
const editingLinkId = ref<string>()
const themeStore = useThemeStore()
const capabilities = getPlatformCapabilities()

const customLabel = ref("")
const customUrl = ref("")
const statusMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const locale = computed({
  get: () => i18n.global.locale.value,
  set: (nextLocale: string) => {
    clearMessages()
    try {
      setLocale(nextLocale, false)
    } catch {
      errorMessage.value = "extension.repair.storage_error"
    }
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
  get: () => state.value.activeProfileId,
  set: (id: string) => {
    void runMutation(() => selectExtensionProfile(id))
  },
})
const activeProfile = computed(() =>
  state.value.profiles.find((p) => p.id === activeProfileId.value),
)
watch(activeProfileId, () => {
  editingLinkId.value = undefined
  customLabel.value = ""
  customUrl.value = ""
})

const networkEditMode = ref(false)
const collapsedNetworkGroups = ref(new Set<string>())
const selectedNetworkIds = computed(() => getVisibleBuiltInSocialNetworks(activeProfile.value?.hiddenNetworks).map(network => network.id))
const visibleNetworks = computed(() => {
  if (networkEditMode.value) return builtInSocialNetworks
  const allNetworks = getVisibleBuiltInSocialNetworks(
    activeProfile.value?.hiddenNetworks,
  )
  if (props.compact) {
    return allNetworks.slice(0, 8)
  }
  return allNetworks
})
const groupedNetworks = computed(() => groupNetworks(visibleNetworks.value, network => network.id))
function toggleNetworkGroupExpanded(id: string) {
  if (collapsedNetworkGroups.value.has(id)) collapsedNetworkGroups.value.delete(id)
  else collapsedNetworkGroups.value.add(id)
}
async function toggleNetworkSelection(ids: string[]) {
  if (busy.value || loading.value || storageError.value) return
  const profileId = activeProfileId.value
  if (!profileId) return
  busy.value = true
  clearMessages()
  try {
    await setExtensionNetworksHidden(profileId, ids, networkGroupSelection(ids, selectedNetworkIds.value) === 'all')
  } catch {
    errorMessage.value = 'extension.repair.storage_error'
  } finally {
    busy.value = false
  }
}

const profileLinks = computed(() => {
  if (!activeProfileId.value) return []
  return state.value.links[activeProfileId.value] ?? []
})

const managedTargets = computed<NetworkTarget[]>(() => [
  ...builtInSocialNetworks.map(network => ({ profileId: activeProfileId.value, networkId: network.id, groupKey: getNetworkGroupId(network.id), groupTitle: `${activeProfile.value?.name ?? 'CommunityGlows'} · ${i18n.global.t('networkGroups.' + getNetworkGroupId(network.id))}`, label: network.label, url: network.url })),
  ...profileLinks.value.map(link => ({ profileId: activeProfileId.value, networkId: 'link:' + link.id, groupKey: 'custom', groupTitle: `${activeProfile.value?.name ?? 'CommunityGlows'} · ${i18n.global.t('extension.custom_links.title')}`, label: link.label, url: link.url })),
])
const managedTabsAvailable = hasManagedNetworkTabs()
const canOpenSidePanel = computed(() => capabilities.supportsSidePanel)
const isDarkMode = computed(() => themeStore.isDarkMode)

function messageForCode(code: ExtensionLaunchErrorCode): string {
  return code === "restore_required" ? "extension.managed.errors.restore_required" : `extension.launch.errors.${code}`
}

function clearMessages() {
  statusMessage.value = null
  errorMessage.value = null
}

async function openNetworkIdentity(networkId: string) {
  clearMessages()
  const target = managedTargets.value.find(target => target.networkId === networkId)
  if (!target) { errorMessage.value = 'extension.launch.errors.invalid'; return }
  const result = await launchManagedNetwork(target.url, target)
  if (!result.ok) { errorMessage.value = messageForCode(result.code); return }
  statusMessage.value = 'extension.launch.opened'
}

async function addCustomLink() {
  clearMessages()
  if (!activeProfileId.value) {
    errorMessage.value = "extension.launch.errors.invalid"
    return
  }

  const validatedUrl = normalizeHttpsUrl(customUrl.value)
  if (!validatedUrl.ok) {
    errorMessage.value = messageForCode(validatedUrl.code)
    return
  }

  const label = customLabel.value.trim()
  if (!label) {
    errorMessage.value = "extension.launch.errors.empty"
    return
  }

  if (
    !(await runMutation(() =>
      saveExtensionLink(
        activeProfileId.value,
        label,
        validatedUrl.url,
        editingLinkId.value,
      ),
    ))
  )
    return
  editingLinkId.value = undefined
  customLabel.value = ""
  customUrl.value = ""
  statusMessage.value = "extension.launch.custom_link_added"
}

async function openDashboard(route?: string) {
  clearMessages()
  const result = await openExtensionDashboard(route)
  if (!result.ok) {
    errorMessage.value = messageForCode(result.code)
    return
  }
  statusMessage.value = "extension.launch.dashboard_opened"
}

async function openSidePanel() {
  clearMessages()
  const result = await openExtensionSidePanel()
  if (!result.ok) {
    errorMessage.value = messageForCode(result.code)
    return
  }
  statusMessage.value = "extension.launch.side_panel_opened"
}

async function toggleTheme() {
  clearMessages()
  const nextMode = isDarkMode.value ? "light" : "dark"
  try {
    await themeStore.setThemeMode(nextMode, { allowPrompt: false })
  } catch {
    errorMessage.value = "extension.repair.storage_error"
  }
}

onMounted(() => {
  themeStore.initTheme()
  window.addEventListener("storage", syncPreferences)
})
function syncPreferences(event: StorageEvent) {
  if (
    event.key === "user-locale" &&
    (event.newValue === "fr" || event.newValue === "en")
  )
    i18n.global.locale.value = event.newValue
  if (event.key === "theme") themeStore.initTheme()
}
onScopeDispose(() => window.removeEventListener("storage", syncPreferences))

async function runMutation(action: () => Promise<unknown>) {
  busy.value = true
  try {
    await action()
    return true
  } catch {
    errorMessage.value = "extension.repair.storage_error"
    return false
  } finally {
    busy.value = false
  }
}

async function removeLink(id: string) {
  clearMessages()
  if (await runMutation(() => removeExtensionLink(activeProfileId.value, id)))
    statusMessage.value = "extension.repair.deleted"
}

function editLink(link: { id: string; label: string; url: string }) {
  editingLinkId.value = link.id
  customLabel.value = link.label
  customUrl.value = link.url
}
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

    <p
      v-if="storageError"
      role="alert"
    >
      {{ $t("extension.repair.storage_error") }}
    </p>

    <ExtensionTaskCapture
      v-if="props.surface === 'popup'"
      @draft-change="hasTaskDraft = $event"
    />

    <div class="ext-parity-grid ext-parity-grid--settings">
      <label class="ext-field">
        <span class="ext-field-label">{{ $t("extension.profile.label") }}</span>
        <select
          v-model="activeProfileId"
          :disabled="loading || busy || storageError"
          class="ext-select"
        >
          <option
            v-for="profile in state.profiles"
            :key="profile.id"
            :value="profile.id"
          >
            {{ profile.emoji }} {{ profile.name }}
          </option>
        </select>
        <small>{{ $t("extension.native_guide.profile_hint") }}</small>
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

    <ManagedNetworkTabs
      v-if="managedTabsAvailable && props.surface === 'side-panel'"
      :targets="managedTargets"
      :profile-id="activeProfileId"
      @activate-profile="activeProfileId = $event"
    />

    <div class="ext-parity-grid">
      <h2 class="ext-parity-section-title">
        {{ $t("extension.networks.title") }}
      </h2>
      <button
        class="ext-btn ext-btn--small ext-btn--outline"
        type="button"
        :aria-pressed="networkEditMode"
        @click="networkEditMode = !networkEditMode"
      >
        {{ $t(networkEditMode ? 'networks.finish_editing' : 'networkGroups.edit') }}
      </button>
      <section
        v-for="group in groupedNetworks"
        :key="group.id"
      >
        <NetworkGroupHeader
          :label="$t(group.labelKey)"
          :icon="group.icon"
          :selection="networkGroupSelection(group.items.map(network => network.id), selectedNetworkIds)"
          :count="group.items.filter(network => selectedNetworkIds.includes(network.id)).length"
          :total="group.items.length"
          :selecting="networkEditMode"
          :expanded="!collapsedNetworkGroups.has(group.id)"
          @toggle="toggleNetworkSelection(group.items.map(network => network.id))"
          @collapse="toggleNetworkGroupExpanded(group.id)"
        />
        <div
          v-show="!collapsedNetworkGroups.has(group.id)"
          class="ext-network-grid"
          :class="{ 'ext-network-grid--compact': props.compact }"
        >
          <button
            v-for="network in group.items"
            :key="network.id"
            class="ext-btn ext-btn--small ext-btn--left"
            :class="selectedNetworkIds.includes(network.id) ? 'ext-btn--primary' : 'ext-btn--outline'"
            :aria-pressed="networkEditMode ? selectedNetworkIds.includes(network.id) : undefined"
            type="button"
            @click="networkEditMode ? toggleNetworkSelection([network.id]) : openNetworkIdentity(network.id)"
          >
            {{ network.label }}
          </button>
        </div>
      </section>
    </div>

    <div class="ext-parity-grid">
      <h2 class="ext-parity-section-title">
        {{ $t("extension.custom_links.title") }}
      </h2>
      <form
        class="ext-parity-grid ext-parity-grid--links"
        @submit.prevent="addCustomLink"
      >
        <input
          v-model="customLabel"
          class="ext-text-input"
          type="text"
          :placeholder="$t('extension.custom_links.name_placeholder')"
          :aria-label="$t('extension.custom_links.name_placeholder')"
          maxlength="160"
          required
        />
        <input
          v-model="customUrl"
          class="ext-text-input"
          type="text"
          :placeholder="$t('extension.custom_links.url_placeholder')"
          :aria-label="$t('tasks.form.context_url')"
          maxlength="2048"
          required
        />
        <button
          class="ext-btn ext-btn--secondary"
          type="submit"
          :disabled="loading || busy || storageError"
        >
          {{ editingLinkId ? $t("extension.repair.save") : $t("common.add") }}
        </button>
      </form>

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
            @click="openNetworkIdentity('link:' + link.id)"
          >
            {{ $t("common.open") }}
          </button>
          <button
            type="button"
            class="ext-btn ext-btn--xs ext-btn--outline"
            :disabled="busy"
            @click="editLink(link)"
          >
            {{ $t("extension.repair.edit") }}
          </button>
          <button
            type="button"
            class="ext-btn ext-btn--xs ext-btn--outline"
            :disabled="busy || storageError"
            @click="removeLink(link.id)"
          >
            {{ $t("extension.repair.delete") }}
          </button>
        </li>
      </ul>
    </div>

    <div class="ext-actions">
      <button
        class="ext-btn ext-btn--outline"
        type="button"
        @click="openDashboard('/setup/tasks')"
      >
        {{ $t("extension.repair.view_tasks") }}
      </button>
      <button
        class="ext-btn ext-btn--outline"
        type="button"
        @click="openDashboard()"
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
      role="status"
    >
      {{ $t(statusMessage) }}
    </div>
    <div
      v-if="errorMessage"
      class="ext-alert ext-alert--error"
      role="alert"
    >
      {{ $t(errorMessage) }}
    </div>



    <ExtensionNativeGuide :has-pending-input="props.surface === 'popup' && (hasTaskDraft || Boolean(customLabel || customUrl))" />
  </section>
</template>
