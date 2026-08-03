<template>
  <div
    class="profile-switcher"
    :class="{ 'icons-only': iconsOnly, 'menu-up': menuDirection === 'up' }"
  >
    <!-- Trigger button -->
    <div
      v-sg-tooltip.right="iconsOnly ? (profilesStore.activeProfile?.name ?? 'Profile') : undefined"
      class="profile-trigger"
      :class="{ active: menuVisible }"
      role="button"
      tabindex="0"
      :aria-label="iconsOnly ? 'Switch profile' : undefined"
      @click="toggleMenu"
      @keydown.enter.space.prevent="toggleMenu"
    >
      <span class="profile-emoji">{{ profilesStore.activeProfile?.emoji ?? '👤' }}</span>
      <span
        v-if="!iconsOnly"
        class="profile-name"
      >
        {{ profilesStore.activeProfile?.name ?? 'No profile' }}
      </span>
      <i
        v-if="!iconsOnly"
        class="pi chevron"
        :class="[
          menuDirection === 'up' ? 'pi-chevron-up' : 'pi-chevron-down',
          { rotated: menuVisible },
        ]"
      />
    </div>

    <!-- Dropdown panel -->
    <div
      v-if="menuVisible"
      class="profile-menu"
      role="listbox"
      aria-label="Profiles"
    >
      <div class="profile-menu-header">Profiles</div>
      <div
        v-if="deleteError"
        class="profile-error"
        role="alert"
      >
        {{ deleteError }}
      </div>

      <div
        v-for="profile in profilesStore.profiles"
        :key="profile.id"
        class="profile-option"
        :class="{ 'profile-option--active': profile.id === profilesStore.activeProfileId }"
        role="option"
        tabindex="0"
        :aria-selected="profile.id === profilesStore.activeProfileId"
        @click="selectProfile(profile.id)"
        @keydown.enter.space.prevent="selectProfile(profile.id)"
      >
        <span class="profile-option-emoji">{{ profile.emoji }}</span>
        <span
          v-if="editingId !== profile.id"
          class="profile-option-name"
        >{{ profile.name }}</span>
        <input
          v-else
          ref="editInputRef"
          v-model="editName"
          class="profile-edit-input"
          @blur="saveEdit(profile.id)"
          @keydown.enter="saveEdit(profile.id)"
          @keydown.escape="cancelEdit"
          @click.stop
        />
        <div class="profile-option-actions">
          <button
            class="action-btn"
            aria-label="Rename profile"
            @click.stop="startEdit(profile)"
          >
            <i class="pi pi-pencil" />
          </button>
          <button
            v-if="profilesStore.profiles.length > 1"
            class="action-btn action-btn--danger"
            aria-label="Delete profile"
            @click.stop="deleteProfile(profile.id)"
          >
            <i class="pi pi-trash" />
          </button>
        </div>
      </div>

      <div class="profile-menu-footer">
        <div
          v-if="addingNew"
          class="add-profile-row"
        >
          <input
            ref="addInputRef"
            v-model="newProfileName"
            class="profile-edit-input"
            placeholder="Profile name…"
            @blur="confirmAdd"
            @keydown.enter="confirmAdd"
            @keydown.escape="cancelAdd"
          />
        </div>
        <button
          v-else
          class="add-profile-btn"
          @click="startAdd"
        >
          <i class="pi pi-plus" />
          <span>Add profile</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { SOCIALGLOWZ_PROFILE_PICKED_EVENT } from '@/lib/socialGlowzDeepLinks'
import { useProfilesStore } from '@/stores/profiles'
import type { Profile } from '@/stores/profiles'

defineProps<{
  iconsOnly: boolean
  menuDirection?: 'up' | 'down'
}>()

const profilesStore = useProfilesStore()

const menuVisible = ref(false)
const editingId = ref<string | null>(null)
const editName = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)
const addingNew = ref(false)
const newProfileName = ref('')
const addInputRef = ref<HTMLInputElement | null>(null)
const deleteError = ref<string | null>(null)

function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

function selectProfile(profileId: string) {
  window.dispatchEvent(new CustomEvent(SOCIALGLOWZ_PROFILE_PICKED_EVENT, { detail: { profileId } }))
  if (profileId === profilesStore.activeProfileId) {
    menuVisible.value = false
    return
  }
  // NetworkWebviewHost watcher will reopen the active network with the new profile session.
  profilesStore.setActive(profileId)
  menuVisible.value = false
}

function startEdit(profile: Profile) {
  editingId.value = profile.id
  editName.value = profile.name
  nextTick(() => editInputRef.value?.focus())
}

function saveEdit(profileId: string) {
  const trimmed = editName.value.trim()
  if (trimmed) profilesStore.rename(profileId, trimmed)
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

async function deleteProfile(profileId: string) {
  deleteError.value = null
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('delete_profile_session', { profileId })
    } catch {
      deleteError.value = 'Unable to delete this profile session.'
      return
    }
  }
  profilesStore.remove(profileId)
}

function startAdd() {
  addingNew.value = true
  newProfileName.value = ''
  nextTick(() => addInputRef.value?.focus())
}

function confirmAdd() {
  const trimmed = newProfileName.value.trim()
  if (trimmed) profilesStore.add(trimmed)
  addingNew.value = false
}

function cancelAdd() {
  addingNew.value = false
}

// Close menu on outside click
function handleOutsideClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest('.profile-switcher')
  if (!el) menuVisible.value = false
}

function openProfileMenu() {
  menuVisible.value = true
}

function openProfileCreator() {
  menuVisible.value = true
  startAdd()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('sfz-show-profile-sheet', openProfileMenu)
  window.addEventListener('sfz-create-profile', openProfileCreator)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('sfz-show-profile-sheet', openProfileMenu)
  window.removeEventListener('sfz-create-profile', openProfileCreator)
})
</script>

<style scoped>
.profile-switcher {
  position: relative;
  padding: var(--sg-space-0d5rem-0d5rem-0d75rem);
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: var(--sg-space-0d5rem);
}

.profile-switcher.menu-up {
  border-top: 1px solid var(--surface-border);
  border-bottom: 0;
  margin-top: var(--sg-space-0d5rem);
  margin-bottom: 0;
  padding: var(--sg-space-0d75rem-0d5rem-0d5rem);
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d5rem-0d75rem);
  border-radius: var(--sg-radius-8px);
  cursor: pointer;
  user-select: none;
  transition: var(--sg-motion-backgroundneg-color-0d15s);
}

.profile-trigger:hover,
.profile-trigger.active {
  background-color: var(--surface-hover);
}

.profile-emoji {
  font-size: var(--sg-font-size-1d25rem);
  line-height: var(--sg-line-height-1);
  flex-shrink: 0;
}

.profile-name {
  flex: 1;
  font-weight: 600;
  font-size: var(--sg-font-size-0d9rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  font-size: var(--sg-font-size-0d7rem);
  transition: var(--sg-motion-transform-0d2s);
  color: var(--text-color-secondary);
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* Dropdown */
.profile-menu {
  position: absolute;
  top: var(--sg-position-calc-100pct-4px);
  left: var(--sg-position-0d5rem);
  right: var(--sg-position-0d5rem);
  background: var(--surface-overlay);
  border: 1px solid var(--surface-border);
  border-radius: var(--sg-radius-10px);
  box-shadow: var(--sg-shadow-0-8px-24px-rgba-0-0-0-0d15);
  z-index: var(--sg-layer-200);
  overflow: hidden;
}

.profile-switcher.menu-up .profile-menu {
  top: auto;
  bottom: var(--sg-position-calc-100pct-4px);
}

.profile-menu-header {
  padding: var(--sg-space-0d5rem-1rem-0d25rem);
  font-size: var(--sg-font-size-0d7rem);
  font-weight: 700;
  letter-spacing: var(--sg-letter-spacing-0d06em);
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.profile-option {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d6rem-0d75rem);
  cursor: pointer;
  transition: var(--sg-motion-backgroundneg-color-0d12s);
}

.profile-option:hover {
  background-color: var(--surface-hover);
}

.profile-option--active {
  background-color: color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.profile-option--active .profile-option-name {
  font-weight: 700;
  color: var(--primary-color);
}

.profile-option-emoji {
  font-size: var(--sg-font-size-1d1rem);
  line-height: var(--sg-line-height-1);
  flex-shrink: 0;
}

.profile-option-name {
  flex: 1;
  font-size: var(--sg-font-size-0d88rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-edit-input {
  flex: 1;
  font-size: var(--sg-font-size-0d88rem);
  background: var(--surface-ground);
  border: 1px solid var(--primary-color);
  border-radius: var(--sg-radius-4px);
  padding: var(--sg-space-0d2rem-0d4rem);
  color: var(--text-color);
  outline: none;
}

.profile-option-actions {
  display: flex;
  gap: var(--sg-space-0d15rem);
  opacity: 0;
  transition: var(--sg-motion-opacity-0d15s);
}

.profile-option:hover .profile-option-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: var(--sg-space-0d2rem);
  border-radius: var(--sg-radius-4px);
  display: flex;
  align-items: center;
  font-size: var(--sg-font-size-0d75rem);
  transition: var(--sg-motion-color-0d12s-backgroundneg-color-0d12s);
}

.action-btn:hover {
  background-color: var(--surface-hover);
  color: var(--text-color);
}

.action-btn--danger:hover {
  color: var(--red-500);
}

/* Footer */
.profile-menu-footer {
  border-top: 1px solid var(--surface-border);
  padding: var(--sg-space-0d4rem-0d5rem);
}

.add-profile-btn {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d4rem);
  width: var(--sg-size-100pct);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--sg-space-0d5rem-0d75rem);
  border-radius: var(--sg-radius-6px);
  font-size: var(--sg-font-size-0d85rem);
  color: var(--text-color-secondary);
  transition: var(--sg-motion-backgroundneg-color-0d12s-color-0d12s);
}

.add-profile-btn:hover {
  background-color: var(--surface-hover);
  color: var(--text-color);
}

.add-profile-row {
  padding: var(--sg-space-0d25rem-0d25rem);
}

/* Icons-only mode: center the emoji trigger */
.profile-switcher.icons-only .profile-trigger {
  justify-content: center;
  padding: var(--sg-space-0d5rem);
}
</style>
