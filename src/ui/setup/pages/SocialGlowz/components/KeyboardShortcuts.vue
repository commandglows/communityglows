<template>
  <section class="shortcuts-section">
    <div class="shortcuts-heading">
      <div>
        <h3><i class="pi pi-keyboard" /> Raccourcis clavier</h3>
        <p>Personnalisez les commandes rapides de l'application.</p>
      </div>
      <button
        type="button"
        class="shortcuts-reset"
        @click="shortcutsStore.reset"
      >
        <i
          class="pi pi-refresh"
          aria-hidden="true"
        />
        Réinitialiser
      </button>
    </div>

    <div class="shortcut-list">
      <div
        v-for="shortcut in shortcutsStore.shortcuts"
        :key="shortcut.id"
        class="shortcut-row"
      >
        <div class="shortcut-label">
          <span>{{ shortcut.label }}</span>
          <small>{{ shortcut.enabled ? 'Actif' : 'Désactivé' }}</small>
        </div>
        <div class="shortcut-controls">
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
            @update:model-value="shortcutsStore.setEnabled(shortcut.id, $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { normalizeShortcutEvent, useShortcutsStore } from '@/stores/shortcuts'
import SgSwitch from './ui/SgSwitch.vue'

const shortcutsStore = useShortcutsStore()
const recordingId = ref<string | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (!recordingId.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return
  shortcutsStore.setKeys(recordingId.value, normalizeShortcutEvent(event))
  recordingId.value = null
  window.removeEventListener('keydown', onKeydown, true)
}

function startRecording(id: string) {
  recordingId.value = id
  window.addEventListener('keydown', onKeydown, true)
}

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<style scoped>
.shortcuts-section { padding: var(--sg-shortcuts-section-padding-block) 0; }
.shortcuts-heading, .shortcut-row, .shortcut-controls { display: flex; align-items: center; }
.shortcuts-heading, .shortcut-row { justify-content: space-between; gap: var(--sg-shortcuts-row-gap); }
.shortcuts-heading h3 { margin: 0; font-size: var(--sg-shortcuts-title-size); }
.shortcuts-heading h3 i { margin-right: var(--sg-shortcuts-icon-gap); }
.shortcuts-heading p, .shortcut-label small { color: var(--text-color-secondary); }
.shortcuts-heading p { margin: var(--sg-shortcuts-description-margin-block-start) 0 0; font-size: var(--sg-shortcuts-description-size); }
.shortcut-list { display: grid; gap: var(--sg-shortcuts-list-gap); margin-top: var(--sg-shortcuts-list-margin-block-start); }
.shortcut-row { padding: var(--sg-shortcuts-row-padding-block) 0; border-bottom: 1px solid var(--surface-border); }
.shortcut-label { display: grid; gap: var(--sg-shortcuts-label-gap); }
.shortcut-label small { font-size: var(--sg-shortcuts-label-size); }
.shortcut-controls { gap: var(--sg-shortcuts-controls-gap); }
.shortcut-capture { min-width: var(--sg-shortcuts-capture-min-width); padding: var(--sg-shortcuts-capture-padding-block) var(--sg-shortcuts-capture-padding-inline); border: 1px solid var(--surface-border); border-radius: var(--border-radius); background: var(--surface-ground); color: var(--text-color); cursor: pointer; }
.shortcut-capture.recording { border-color: var(--primary-color); color: var(--primary-color); }
.shortcuts-reset { display: inline-flex; align-items: center; gap: var(--sg-shortcuts-icon-gap); border: 0; border-radius: var(--sg-radius-sm); background: transparent; color: var(--sg-color-action); cursor: pointer; font: inherit; }
.shortcuts-reset:hover { background: var(--sg-color-surface-hover); }
.shortcuts-reset:focus-visible, .shortcut-capture:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
</style>
