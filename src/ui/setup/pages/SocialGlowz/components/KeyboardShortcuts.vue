<template>
  <section class="shortcuts-section">
    <div class="shortcuts-heading">
      <div>
        <h3><SgIcon icon="pi pi-keyboard" /> Raccourcis clavier</h3>
        <p>Personnalisez les commandes rapides de l'application.</p>
      </div>
      <button
        type="button"
        class="shortcuts-reset"
        @click="shortcutsStore.reset"
      >
        <SgIcon
          icon="pi pi-refresh"
          aria-hidden="true"
        />
        Réinitialiser
      </button>
    </div>

    <div class="shortcut-list">
      <div
        v-for="shortcut in visibleShortcuts"
        :key="shortcut.id"
        class="shortcut-row"
      >
        <div class="shortcut-label">
          <span>{{ shortcut.label }}</span>
          <small>{{ shortcut.enabled ? 'Actif' : 'Désactivé' }}</small>
        </div>
        <div class="shortcut-controls">
          <p
            v-if="conflictMessage && recordingId === shortcut.id"
            class="shortcut-conflict"
            aria-live="polite"
          >
            {{ conflictMessage }}
          </p>
          <button
            type="button"
            class="shortcut-capture"
            :class="{ recording: recordingId === shortcut.id }"
            @click="startRecording(shortcut.id)"
          >
            {{ recordingId === shortcut.id ? 'Appuyez sur les touches...' : shortcut.keys || 'Non défini' }}
          </button>
          <SgSwitch
            :model-value="shortcut.enabled"
            :label="`Activer ${shortcut.label}`"
            @update:model-value="(enabled: unknown) => shortcutsStore.setEnabled(shortcut.id, enabled === true || enabled === 'true')"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import { useProfilesStore } from '@/stores/profiles'
import { normalizeShortcutEvent, useShortcutsStore } from '@/stores/shortcuts'
import SgSwitch from './ui/SgSwitch.vue'

const shortcutsStore = useShortcutsStore()
const profilesStore = useProfilesStore()
const recordingId = ref<string | null>(null)
const conflictMessage = ref<string | null>(null)
const activeProfileId = computed(() => profilesStore.activeProfileId)
const visibleNetworkIds = computed(() => builtInSocialNetworks
  .map(item => item.id)
  .filter(networkId => !profilesStore.isNetworkHidden(activeProfileId.value, networkId)))
const visibleProfileIds = computed(() => profilesStore.profiles
  .map(profile => profile.id))
const rightPanelSections = [
  { section: 'feed', label: 'Fil d’actualité' },
  { section: 'profile', label: 'Profil' },
  { section: 'friends', label: 'Amis' },
  { section: 'notifications', label: 'Notifications' },
  { section: 'saved', label: 'Enregistrements' },
  { section: 'events', label: 'Événements' },
]
const visibleShortcuts = computed(() => {
  const core = shortcutsStore.shortcuts.filter((shortcut) =>
    shortcut.action !== 'open-network' && shortcut.action !== 'open-profile')
  const network = shortcutsStore.shortcuts
    .filter((shortcut) => shortcut.action === 'open-network' && !!shortcut.target)
    .filter((shortcut) => visibleNetworkIds.value.includes(shortcut.target as string))
    .sort((a, b) => String(a.target).localeCompare(String(b.target)))
  const profileShortcuts = shortcutsStore.shortcuts
    .filter((shortcut) => shortcut.action === 'open-profile' && !!shortcut.target)
    .filter((shortcut) => visibleProfileIds.value.includes(shortcut.target as string))
    .sort((a, b) => {
      const labelA = (a.label || '').toLowerCase()
      const labelB = (b.label || '').toLowerCase()
      return labelA.localeCompare(labelB)
    })
  const rightPanelShortcutIds = new Set(shortcutsStore.shortcuts
    .filter((shortcut) => shortcut.action === 'open-rightpanel-section' && !!shortcut.target)
    .map((shortcut) => shortcut.target))

  const rightPanel = rightPanelSections
    .filter(({ section }) => rightPanelShortcutIds.has(section))
    .map(({ section, label }) => {
      const found = shortcutsStore.shortcuts.find(
        (shortcut) => shortcut.action === 'open-rightpanel-section' && shortcut.target === section,
      )
      return found ? { ...found, label: found.label || label } : {
        id: `open-rightpanel-section:${section}`,
        action: 'open-rightpanel-section',
        target: section,
        label,
        keys: '',
        enabled: false,
      }
    })
  return [...core, ...network, ...profileShortcuts, ...rightPanel]
})

function hideConflict() {
  conflictMessage.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (!recordingId.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return
  const keys = normalizeShortcutEvent(event)
  const success = shortcutsStore.setKeys(recordingId.value, keys)
  if (!success) {
    conflictMessage.value = 'Ce raccourci est déjà utilisé'
    window.setTimeout(hideConflict, 1500)
  }
  recordingId.value = null
  window.removeEventListener('keydown', onKeydown, true)
}

function startRecording(id: string) {
  conflictMessage.value = null
  recordingId.value = id
  window.addEventListener('keydown', onKeydown, true)
}

watch(
  visibleNetworkIds,
  (networkIds) => {
    for (const networkId of networkIds) {
      const label = builtInSocialNetworks.find(item => item.id === networkId)?.label
      if (label) shortcutsStore.ensureNetworkShortcut(networkId, label)
    }
  },
  { immediate: true },
)

watch(
  () => profilesStore.profiles,
  (profiles) => {
    for (const profile of profiles) {
      shortcutsStore.ensureProfileShortcut(profile.id, profile.name)
    }
  },
  { deep: true, immediate: true },
)

rightPanelSections.forEach(({ section, label }) => {
  shortcutsStore.ensureRightPanelShortcut(section, label)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<style scoped>
.shortcuts-section { padding: var(--sg-shortcuts-section-padding-block) 0; }
.shortcuts-heading, .shortcut-row, .shortcut-controls { display: flex; align-items: center; }
.shortcuts-heading, .shortcut-row { justify-content: space-between; gap: var(--sg-shortcuts-row-gap); }
.shortcuts-heading h3 { margin: 0; font-size: var(--sg-shortcuts-title-size); }
.shortcuts-heading h3 i { margin-right: var(--sg-shortcuts-icon-gap); }
.shortcuts-heading p, .shortcut-label small { color: var(--sg-color-text-muted); }
.shortcuts-heading p { margin: var(--sg-shortcuts-description-margin-block-start) 0 0; font-size: var(--sg-shortcuts-description-size); }
.shortcut-list { display: grid; gap: var(--sg-shortcuts-list-gap); margin-top: var(--sg-shortcuts-list-margin-block-start); }
.shortcut-row { padding: var(--sg-shortcuts-row-padding-block) 0; border-bottom: 1px solid var(--sg-color-border); }
.shortcut-label { display: grid; gap: var(--sg-shortcuts-label-gap); }
.shortcut-label small { font-size: var(--sg-shortcuts-label-size); }
.shortcut-controls { gap: var(--sg-shortcuts-controls-gap); }
.shortcut-capture { min-width: var(--sg-shortcuts-capture-min-width); padding: var(--sg-shortcuts-capture-padding-block) var(--sg-shortcuts-capture-padding-inline); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-muted); color: var(--sg-color-text); cursor: pointer; }
.shortcut-capture.recording { border-color: var(--sg-color-action); color: var(--sg-color-action); }
.shortcuts-reset { display: inline-flex; align-items: center; gap: var(--sg-shortcuts-icon-gap); border: 0; border-radius: var(--sg-radius-sm); background: transparent; color: var(--sg-color-action); cursor: pointer; font: inherit; }
.shortcuts-reset:hover { background: var(--sg-color-surface-hover); }
.shortcuts-reset:focus-visible, .shortcut-capture:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.shortcut-conflict { margin: 0; color: var(--sg-color-danger-text); font-size: var(--sg-shortcuts-label-size); }
</style>
