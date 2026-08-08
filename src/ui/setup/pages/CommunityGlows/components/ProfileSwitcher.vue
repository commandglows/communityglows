<template>
  <div
    class="profile-switcher"
    :class="{ 'icons-only': iconsOnly, 'menu-up': menuDirection === 'up' }"
  >
    <!-- Trigger button -->
    <div
      v-sg-tooltip.right="
        iconsOnly ? (profilesStore.activeProfile?.name ?? 'Profile') : undefined
      "
      class="profile-trigger"
      :class="{ active: menuVisible }"
      role="button"
      tabindex="0"
      :aria-label="iconsOnly ? 'Switch profile' : undefined"
      @click="toggleMenu"
      @keydown.enter.space.prevent="toggleMenu"
    >
      <span class="profile-emoji">
        {{ profilesStore.activeProfile?.emoji ?? "👤" }}
      </span>
      <span
        v-if="!iconsOnly"
        class="profile-name"
      >
        {{ profilesStore.activeProfile?.name ?? "No profile" }}
      </span>
      <SgIcon
        v-if="!iconsOnly"
        icon="pi"
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
        v-for="profile in profilesStore.profiles"
        :key="profile.id"
        class="profile-option"
        :class="{
          'profile-option--active':
            profile.id === profilesStore.activeProfileId,
        }"
        role="option"
        tabindex="0"
        :aria-selected="profile.id === profilesStore.activeProfileId"
        @click="selectProfile(profile.id)"
        @keydown.enter.space.prevent="selectProfile(profile.id)"
      >
        <img
          v-if="profile.avatar"
          :src="profile.avatar"
          class="profile-option-avatar"
          alt=""
        />
        <span
          v-else
          class="profile-option-emoji"
        >
          {{ profile.emoji }}
        </span>
        <span class="profile-option-name">{{ profile.name }}</span>
        <SgIcon
          v-if="profile.id === profilesStore.activeProfileId"
          icon="pi pi-check"
          aria-hidden="true"
        />
      </div>

      <div class="profile-menu-footer">
        <button
          class="add-profile-btn"
          @click.stop="openManager"
        >
          <SgIcon icon="pi pi-cog" />
          <span>Gérer les profils</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { COMMUNITYGLOWS_PROFILE_PICKED_EVENT } from "@/lib/communityGlowsDeepLinks"
import { useProfilesStore } from "@/stores/profiles"

const emit = defineEmits<{ "manage-profiles": [] }>()

defineProps<{
  iconsOnly: boolean
  menuDirection?: "up" | "down"
}>()

const profilesStore = useProfilesStore()

const menuVisible = ref(false)

function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

function selectProfile(profileId: string) {
  window.dispatchEvent(
    new CustomEvent(COMMUNITYGLOWS_PROFILE_PICKED_EVENT, {
      detail: { profileId },
    }),
  )
  if (profileId === profilesStore.activeProfileId) {
    menuVisible.value = false
    return
  }
  // NetworkWebviewHost watcher will reopen the active network with the new profile session.
  profilesStore.setActive(profileId)
  menuVisible.value = false
}

function openManager() {
  menuVisible.value = false
  emit("manage-profiles")
}

// Close menu on outside click
function handleOutsideClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest(".profile-switcher")
  if (!el) menuVisible.value = false
}

function openProfileMenu() {
  menuVisible.value = true
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick)
  window.addEventListener("communityglows-show-profile-sheet", openProfileMenu)
})

onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick)
  window.removeEventListener(
    "communityglows-show-profile-sheet",
    openProfileMenu,
  )
})
</script>

<style scoped>
.profile-switcher {
  position: relative;
  padding: var(--sg-space-0d5rem-0d5rem-0d75rem);
  border-bottom: 1px solid var(--sg-color-border);
  margin-bottom: var(--sg-space-0d5rem);
}

.profile-switcher.menu-up {
  border-top: 1px solid var(--sg-color-border);
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
  background-color: var(--sg-color-surface-hover);
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
  color: var(--sg-color-text-muted);
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
  background: var(--sg-color-surface-raised);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  box-shadow: var(--sg-shadow-modal);
  z-index: var(--sg-layer-200);
  overflow: hidden;
  backdrop-filter: none;
}

.profile-option,
.profile-menu-footer,
.profile-menu-header {
  background: inherit;
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
  color: var(--sg-color-text-muted);
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
  background-color: var(--sg-color-surface-hover);
}

.profile-option--active {
  background-color: color-mix(in srgb, var(--sg-color-action) 10%, transparent);
}

.profile-option--active .profile-option-name {
  font-weight: 700;
  color: var(--sg-color-action);
}

.profile-option-emoji {
  font-size: var(--sg-font-size-1d1rem);
  line-height: var(--sg-line-height-1);
  flex-shrink: 0;
}

.profile-option-avatar {
  width: var(--sg-avatar-size-sm);
  height: var(--sg-avatar-size-sm);
  border-radius: var(--sg-radius-pill);
  object-fit: cover;
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
  background: var(--sg-color-surface-muted);
  border: 1px solid var(--sg-color-action);
  border-radius: var(--sg-radius-4px);
  padding: var(--sg-space-0d2rem-0d4rem);
  color: var(--sg-color-text);
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
  color: var(--sg-color-text-muted);
  padding: var(--sg-space-0d2rem);
  border-radius: var(--sg-radius-4px);
  display: flex;
  align-items: center;
  font-size: var(--sg-font-size-0d75rem);
  transition: var(--sg-motion-color-0d12s-backgroundneg-color-0d12s);
}

.action-btn:hover {
  background-color: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}

.action-btn--danger:hover {
  color: var(--sg-color-danger);
}

/* Footer */
.profile-menu-footer {
  border-top: 1px solid var(--sg-color-border);
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
  color: var(--sg-color-text-muted);
  transition: var(--sg-motion-backgroundneg-color-0d12s-color-0d12s);
}

.add-profile-btn:hover {
  background-color: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
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
