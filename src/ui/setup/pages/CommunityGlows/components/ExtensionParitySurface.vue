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
import SgIcon from "./ui/SgIcon.vue"
import logoUrl from "@/assets/logo.png"
import {
  launchManagedNetwork,
  normalizeHttpsUrl,
  openExtensionDashboard,
  openExtensionOptions,
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
const profileMenuOpen = ref(false)
const hasTaskDraft = ref(false)
const editingLinkId = ref<string>()
const themeStore = useThemeStore()
const capabilities = getPlatformCapabilities()
const isPopup = computed(() => props.surface === "popup")
const isSidePanel = computed(() => props.surface === "side-panel")
const isFullPage = computed(() => !isPopup.value && !isSidePanel.value)
const isSetupPage = computed(() =>
  ["install", "update", "setup"].includes(props.surface),
)

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
const otherProfiles = computed(() => state.value.profiles.filter((profile) => profile.id !== activeProfileId.value))
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
  if (isPopup.value) {
    return allNetworks.slice(0, 6)
  }
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

async function openSettingsPage() {
  clearMessages()
  const result = await openExtensionOptions()
  if (!result.ok) errorMessage.value = messageForCode(result.code)
}

function closeProfileMenuOnFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  const currentTarget = event.currentTarget
  if (!(currentTarget instanceof HTMLElement) || !(nextTarget instanceof Node) || !currentTarget.contains(nextTarget)) profileMenuOpen.value = false
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
  <section
    class="ext-parity-root"
    :class="{ 'ext-parity-root--task-entry': isPopup && hasTaskDraft }"
  >
    <header class="ext-parity-header">
      <img v-if="isPopup" class="ext-popup-logo" :src="logoUrl" alt="CommunityGlows" />
      <template v-else>
        <h1 class="ext-parity-title">{{ $t(headerKey) }}</h1>
        <p class="ext-parity-description">{{ $t(descriptionKey) }}</p>
      </template>
      <div v-if="isPopup" class="ext-popup-header-actions">
        <div class="ext-popup-profile-control" @mouseenter="profileMenuOpen = otherProfiles.length > 0" @mouseleave="profileMenuOpen = false" @focusin="profileMenuOpen = otherProfiles.length > 0" @focusout="closeProfileMenuOnFocusOut">
          <button class="ext-popup-profile-trigger" type="button" :disabled="loading || busy || storageError" :aria-haspopup="otherProfiles.length ? 'menu' : undefined" :aria-expanded="profileMenuOpen" :aria-label="$t('extension.profile.label')">
            <span class="ext-popup-profile-emoji">{{ activeProfile?.emoji }}</span>
            <span class="ext-popup-profile-name">{{ activeProfile?.name }}</span>
          </button>
          <div v-if="profileMenuOpen && otherProfiles.length" class="ext-popup-profile-menu" role="menu" :aria-label="$t('extension.profile.label')">
            <button v-for="profile in otherProfiles" :key="profile.id" type="button" role="menuitemradio" aria-checked="false" @click="activeProfileId = profile.id; profileMenuOpen = false">
              <span class="ext-popup-profile-option-emoji">{{ profile.emoji }}</span>
              <span>{{ profile.name }}</span>
            </button>
          </div>
        </div>
        <button class="ext-btn ext-btn--outline ext-popup-icon-button" type="button" :aria-label="$t(isDarkMode ? 'theme.light' : 'theme.dark')" :title="$t(isDarkMode ? 'theme.light' : 'theme.dark')" @click="toggleTheme">
          <SgIcon :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
        <button class="ext-btn ext-btn--outline ext-popup-icon-button" type="button" :aria-label="$t('common.settings')" :title="$t('common.settings')" @click="openSettingsPage">
          <SgIcon icon="pi pi-cog" />
        </button>
      </div>
    </header>

    <p
      v-if="storageError"
      role="alert"
    >
      {{ $t("extension.repair.storage_error") }}
    </p>

    <section
      v-if="isSetupPage"
      class="ext-flow-steps"
      :aria-label="$t('extension.flow.title')"
    >
      <article class="ext-flow-step">
        <span>1</span>
        <strong>{{ $t("extension.flow.profile_title") }}</strong>
        <p>{{ $t("extension.flow.profile_body") }}</p>
      </article>
      <article class="ext-flow-step">
        <span>2</span>
        <strong>{{ $t("extension.flow.network_title") }}</strong>
        <p>{{ $t("extension.flow.network_body") }}</p>
      </article>
      <article class="ext-flow-step">
        <span>3</span>
        <strong>{{ $t("extension.flow.task_title") }}</strong>
        <p>{{ $t("extension.flow.task_body") }}</p>
      </article>
    </section>

    <div
      v-if="!isSidePanel && !isPopup"
      class="ext-parity-grid ext-parity-grid--settings"
    >
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

    <div
      v-else-if="isSidePanel"
      class="ext-panel-context"
    >
      <div>
        <span class="ext-field-label">{{ $t("extension.profile.label") }}</span>
        <p>{{ activeProfile?.emoji }} {{ activeProfile?.name }}</p>
        <small>{{ $t("extension.native_guide.profile_hint") }}</small>
      </div>
      <button
        class="ext-btn ext-btn--outline"
        type="button"
        @click="openDashboard()"
      >
        {{ $t("extension.actions.configure") }}
      </button>
    </div>

    <ManagedNetworkTabs
      v-if="managedTabsAvailable && isSidePanel"
      :targets="managedTargets"
      :profile-id="activeProfileId"
      @activate-profile="activeProfileId = $event"
    />

    <div
      v-if="!isPopup || !hasTaskDraft"
      class="ext-parity-grid"
      :class="{ 'ext-parity-grid--popup-networks': isPopup }"
    >
      <h2 class="ext-parity-section-title">
        {{ $t(isPopup ? "extension.networks.quick_title" : "extension.networks.title") }}
      </h2>
      <button
        v-if="isFullPage"
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
        class="ext-network-group"
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

    <div
      v-if="isFullPage"
      class="ext-parity-grid"
    >
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
      <ExtensionTaskCapture
        v-if="isPopup"
        compact
        @draft-change="hasTaskDraft = $event"
      />
      <button
        v-if="!isSidePanel && (!isPopup || !hasTaskDraft)"
        class="ext-btn ext-btn--outline"
        type="button"
        @click="openDashboard('/setup/tasks')"
      >
        {{ $t("extension.repair.view_tasks") }}
      </button>
      <button
        v-if="!isFullPage && (!isPopup || !hasTaskDraft)"
        class="ext-btn ext-btn--outline"
        type="button"
        @click="openDashboard()"
      >
        {{ $t("extension.actions.open_dashboard") }}
      </button>
      <button
        v-if="!isSidePanel && (!isPopup || !hasTaskDraft)"
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



    <ExtensionNativeGuide
      v-if="isFullPage"
      :has-pending-input="isPopup && (hasTaskDraft || Boolean(customLabel || customUrl))"
    />
  </section>
</template>

<style scoped>
.ext-flow-steps {
  display: grid;
  gap: var(--sg-space-0d75rem);
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}

.ext-flow-step,
.ext-panel-context {
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  padding: var(--sg-space-0d75rem);
}

.ext-flow-step {
  display: grid;
  gap: var(--sg-space-0d375rem);
}

.ext-flow-step span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--sg-size-1d75rem);
  height: var(--sg-size-1d75rem);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
  font-weight: 700;
}

.ext-flow-step p,
.ext-panel-context p {
  margin: 0;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-crm-secondary-copy-size);
}

.ext-panel-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sg-space-0d75rem);
  flex-wrap: wrap;
}

.ext-popup-logo {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
  border-radius: var(--sg-radius-sm);
}

.ext-popup-header-actions {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  margin-inline-start: auto;
}

.ext-popup-profile-control {
  position: relative;
  min-width: 10rem;
  max-width: 15rem;
}

.ext-popup-profile-trigger {
  display: flex;
  width: 100%;
  height: var(--sg-control-height-lg);
  min-height: var(--sg-control-height-lg);
  box-sizing: border-box;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  padding: 0 var(--sg-space-0d5rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.ext-popup-profile-trigger:disabled {
  opacity: var(--sg-opacity-disabled);
  cursor: not-allowed;
}

.ext-popup-profile-emoji {
  flex: 0 0 auto;
  font-size: 2em;
  line-height: 1;
}

.ext-popup-profile-name {
  min-width: 0;
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ext-popup-profile-menu {
  position: absolute;
  z-index: 30;
  inset-block-start: calc(100% + 4px);
  inset-inline: 0;
  display: grid;
  max-height: 14rem;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-md);
}

.ext-popup-profile-menu button {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  min-width: 0;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: var(--sg-color-text);
  text-align: start;
  cursor: pointer;
}

.ext-popup-profile-menu button:hover,
.ext-popup-profile-menu button[aria-checked="true"] {
  background: var(--sg-color-surface-muted);
}

.ext-popup-profile-option-emoji {
  flex: 0 0 auto;
}

.ext-popup-icon-button {
  width: 2.25rem;
  min-width: 2.25rem;
  height: var(--sg-control-height-lg);
  min-height: var(--sg-control-height-lg);
  box-sizing: border-box;
  padding: 0;
  justify-content: center;
}

.ext-popup-icon-button :deep(.sg-icon) {
  width: 1.125rem;
  height: 1.125rem;
}
</style>
