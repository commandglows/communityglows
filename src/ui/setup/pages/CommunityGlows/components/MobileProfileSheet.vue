<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="modelValue"
        class="sheet-overlay"
        @click.self="closeSheet"
      >
        <div
          ref="sheetRef"
          class="profile-sheet"
          :style="sheetStyle"
        >
          <div
            class="sheet-drag-zone"
            @pointerdown="onDragStart"
            @pointermove="onDragMove"
            @pointerup="onDragEnd"
            @pointercancel="onDragCancel"
          >
            <!-- Handle -->
            <div class="sheet-handle" />

            <!-- Header -->
            <div class="sheet-header">
              <span class="sheet-title">{{ $t('profiles.title') }}</span>
              <button
                class="sheet-close-btn"
                @click="closeSheet"
              >
                <SgIcon icon="pi pi-times" />
              </button>
            </div>
          </div>

          <!-- Profile list -->
          <div class="sheet-profiles">
            <div
              v-for="profile in profilesStore.profiles"
              :key="profile.id"
              class="sheet-profile-row"
              :class="{ 'sheet-profile-row--active': profile.id === profilesStore.activeProfileId }"
            >
              <!-- Avatar (tap to select profile) -->
              <div
                class="sheet-avatar"
                @click="selectProfile(profile.id)"
              >
                <img
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  class="sheet-avatar-img"
                />
                <span
                  v-else
                  class="sheet-avatar-emoji"
                >{{ profile.emoji }}</span>
                <SgIcon
                  v-if="profile.id === profilesStore.activeProfileId"
                  icon="pi pi-check sheet-avatar-check"
                />
              </div>

              <!-- Name / inline edit -->
              <div
                class="sheet-profile-info"
                @click="selectProfile(profile.id)"
              >
                <input
                  v-if="editingId === profile.id"
                  :ref="el => { if (el) editInputRef = el as HTMLInputElement }"
                  v-model="editName"
                  class="name-edit-input"
                  @blur="saveEdit(profile.id)"
                  @keydown.enter="saveEdit(profile.id)"
                  @keydown.escape="cancelEdit"
                  @click.stop
                />
                <span
                  v-else
                  class="sheet-profile-name"
                >{{ profile.name }}</span>
                <span
                  v-if="profile.id === profilesStore.activeProfileId"
                  class="active-label"
                >{{ $t('profile.active_label') }}</span>
              </div>

              <!-- Actions -->
              <div class="sheet-profile-actions">
                <button
                  class="sheet-action"
                  :aria-label="$t('profile.rename_action')"
                  @click.stop="startEdit(profile)"
                >
                  <SgIcon icon="pi pi-pencil" />
                </button>
                <button
                  class="sheet-action"
                  :aria-label="$t('profile.avatar_action')"
                  @click.stop="pickAvatar(profile.id)"
                >
                  <SgIcon icon="pi pi-camera" />
                </button>
                <button
                  class="sheet-action"
                  :aria-label="$t('profile.clear_cookies_action')"
                  @click.stop="clearCookiesProfileId = clearCookiesProfileId === profile.id ? null : profile.id"
                >
                  <SgIcon icon="pi pi-eraser" />
                </button>
                <button
                  v-if="profilesStore.profiles.length > 1"
                  class="sheet-action sheet-action--danger"
                  :aria-label="$t('common.delete')"
                  @click.stop="deleteProfile(profile.id)"
                >
                  <SgIcon icon="pi pi-trash" />
                </button>
              </div>
            </div>
          </div>

          <!-- Clear network session data per profile. -->
          <div
            v-if="clearCookiesProfileId"
            class="clear-cookies-section"
          >
            <div class="clear-cookies-header">
              <SgIcon icon="pi pi-trash" />
              <span>{{ $t('profile.clear_cookies_header', { name: profilesStore.profiles.find(p => p.id === clearCookiesProfileId)?.name }) }}</span>
              <button
                class="sheet-close-btn"
                style="margin-left:auto;"
                @click="clearCookiesProfileId = null"
              >
                <SgIcon icon="pi pi-times" />
              </button>
            </div>
            <div class="clear-cookies-list">
              <button
                v-for="nw in webviewNetworks"
                :key="nw.id"
                class="clear-cookie-row"
                @click="clearNetworkCookies(nw.id)"
              >
                <ThreadsIcon
                  v-if="nw.id === 'threads'"
                  size="0.9rem"
                  class="clear-cookie-icon"
                />
                <SnapchatIcon
                  v-else-if="nw.id === 'snapchat'"
                  size="0.9rem"
                  class="clear-cookie-icon"
                />
                <NextdoorIcon
                  v-else-if="nw.id === 'nextdoor'"
                  size="0.9rem"
                  class="clear-cookie-icon"
                />
                <QuoraIcon
                  v-else-if="nw.id === 'quora'"
                  size="0.9rem"
                  class="clear-cookie-icon"
                />
                <SgIcon
                  v-else
                  :icon="nw.icon"
                  class="clear-cookie-icon"
                />
                <span class="clear-cookie-label">{{ nw.label }}</span>
                <span
                  v-if="clearedNetworks[`${clearCookiesProfileId}:${nw.id}`]"
                  class="clear-cookie-done"
                >
                  <SgIcon icon="pi pi-check" />
                </span>
                <SgIcon
                  v-else
                  icon="pi pi-eraser clear-cookie-action"
                />
              </button>
            </div>
          </div>

          <!-- Add new profile -->
          <div class="sheet-footer">
            <div
              v-if="addingNew"
              class="add-profile-form"
            >
              <input
                :ref="el => { if (el) addInputRef = el as HTMLInputElement }"
                v-model="newProfileName"
                class="name-edit-input"
                placeholder="Nom du profil…"
                @keydown.enter="confirmAdd"
                @keydown.escape="cancelAdd"
              />
              <button
                class="add-confirm-btn"
                @click="confirmAdd"
              >
                <SgIcon icon="pi pi-check" />
              </button>
              <button
                class="add-cancel-btn"
                @click="cancelAdd"
              >
                <SgIcon icon="pi pi-times" />
              </button>
            </div>
            <button
              v-else
              class="add-profile-btn"
              @click="startAdd"
            >
              <SgIcon icon="pi pi-plus" />
              <span>{{ $t('profile.add_new_button') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Hidden file input for avatar upload -->
  <input
    ref="avatarFileInput"
    type="file"
    accept="image/*"
    style="display: none"
    @change="handleAvatarChange"
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted, watch } from 'vue'
import { COMMUNITYGLOWS_PROFILE_PICKED_EVENT } from '@/lib/communityGlowsDeepLinks'
import { useProfilesStore } from '@/stores/profiles'
import { useWebviewStore, WEBVIEW_URLS } from '@/stores/webviewState'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import type { Profile } from '@/stores/profiles'
import ThreadsIcon from './icons/ThreadsIcon.vue'
import SnapchatIcon from './icons/SnapchatIcon.vue'
import NextdoorIcon from './icons/NextdoorIcon.vue'
import QuoraIcon from './icons/QuoraIcon.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const profilesStore = useProfilesStore()
const webviewStore = useWebviewStore()

// ─── Rename state ─────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editName = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// ─── Add profile state ────────────────────────────────────────
const addingNew = ref(false)
const newProfileName = ref('')
const addInputRef = ref<HTMLInputElement | null>(null)

// ─── Avatar state ─────────────────────────────────────────────
const avatarFileInput = ref<HTMLInputElement | null>(null)
const pendingAvatarProfileId = ref<string | null>(null)

// ─── Clear network session per profile ────────────────────────
const clearCookiesProfileId = ref<string | null>(null)
const clearedNetworks = ref<Record<string, boolean>>({})

const webviewNetworks = computed(() => {
  const socialNetworkById = new Map(
    builtInSocialNetworks.map((network) => [network.id, network]),
  )

  return Object.keys(WEBVIEW_URLS).map(id => ({
    id,
    icon: socialNetworkById.get(id)?.icon ?? 'pi pi-globe',
    label: socialNetworkById.get(id)?.label ?? id,
  }))
})

function clearNetworkCookies(networkId: string) {
  const profileId = clearCookiesProfileId.value
  if (!profileId) return
  const key = `${profileId}:${networkId}`
  clearedNetworks.value[key] = true
  import('@tauri-apps/api/core').then(({ invoke }) => {
    const p = webviewStore.activeUrl
      ? invoke('close_webview', { profileId, networkId }).catch(() => {})
      : Promise.resolve()
    return p.then(() => invoke('delete_network_session', { profileId, networkId }))
  }).catch(e => {
    console.error('Failed to clear network session:', e)
  })
}

// ─── Sheet actions ────────────────────────────────────────────
function closeSheet() {
  emit('update:modelValue', false)
  clearCookiesProfileId.value = null
  clearedNetworks.value = {}
  cancelEdit()
  cancelAdd()
}

const sheetRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const isDragging = ref(false)
const activePointerId = ref<number | null>(null)
const dragTargetRef = ref<HTMLElement | null>(null)
const dragStartY = ref(0)
const dragStartTime = ref(0)
let dragResetTimer: number | null = null

const sheetStyle = computed(() => ({
  '--sheet-drag-offset': `${dragOffset.value}px`,
  transition: isDragging.value ? 'none' : 'var(--sg-mobile-sheet-drag-motion)',
}))

function clearDragResetTimer() {
  if (dragResetTimer !== null) {
    window.clearTimeout(dragResetTimer)
    dragResetTimer = null
  }
}

function scheduleDragReset() {
  clearDragResetTimer()
  dragResetTimer = window.setTimeout(() => {
    dragOffset.value = 0
    isDragging.value = false
    activePointerId.value = null
    dragTargetRef.value = null
  }, 250)
}

function getDismissThreshold() {
  const sheetHeight = sheetRef.value?.offsetHeight ?? window.innerHeight * 0.5
  return Math.min(140, Math.max(72, sheetHeight * 0.2))
}

function shouldIgnoreDragStart(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('button, a, input, textarea, select, label, [role="button"], [data-no-sheet-drag]'))
}

function detachWindowDragListeners() {
  window.removeEventListener('pointermove', onWindowDragMove)
  window.removeEventListener('pointerup', onWindowDragEnd)
  window.removeEventListener('pointercancel', onWindowDragCancel)
}

function attachWindowDragListeners() {
  detachWindowDragListeners()
  window.addEventListener('pointermove', onWindowDragMove, { passive: false })
  window.addEventListener('pointerup', onWindowDragEnd)
  window.addEventListener('pointercancel', onWindowDragCancel)
}

function onDragStart(event: PointerEvent) {
  if (!props.modelValue || !event.isPrimary) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if (shouldIgnoreDragStart(event.target)) return

  isDragging.value = true
  activePointerId.value = event.pointerId
  dragTargetRef.value = event.currentTarget as HTMLElement | null
  dragStartY.value = event.clientY
  dragStartTime.value = event.timeStamp || performance.now()
  dragOffset.value = 0
  clearDragResetTimer()
  attachWindowDragListeners()

  dragTargetRef.value?.setPointerCapture?.(event.pointerId)
}

function onDragMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== activePointerId.value) return

  const nextOffset = Math.max(0, event.clientY - dragStartY.value)
  dragOffset.value = nextOffset

  if (nextOffset > 0) {
    event.preventDefault()
  }
}

function finishDrag(event?: PointerEvent) {
  if (!isDragging.value) return
  if (event && event.pointerId !== activePointerId.value) return

  const pointerId = activePointerId.value
  if (pointerId !== null && dragTargetRef.value?.hasPointerCapture?.(pointerId)) {
    dragTargetRef.value.releasePointerCapture(pointerId)
  }

  const elapsed = Math.max(1, (event?.timeStamp || performance.now()) - dragStartTime.value)
  const velocity = dragOffset.value / elapsed
  const shouldClose = dragOffset.value >= getDismissThreshold() || velocity >= 0.6

  detachWindowDragListeners()
  isDragging.value = false
  activePointerId.value = null
  dragTargetRef.value = null

  if (shouldClose) {
    closeSheet()
    scheduleDragReset()
    return
  }

  dragOffset.value = 0
}

function onDragEnd(event: PointerEvent) {
  finishDrag(event)
}

function onDragCancel(event: PointerEvent) {
  finishDrag(event)
}

function onWindowDragMove(event: PointerEvent) {
  onDragMove(event)
}

function onWindowDragEnd(event: PointerEvent) {
  onDragEnd(event)
}

function onWindowDragCancel(event: PointerEvent) {
  onDragCancel(event)
}

function selectProfile(profileId: string) {
  window.dispatchEvent(new CustomEvent(COMMUNITYGLOWS_PROFILE_PICKED_EVENT, { detail: { profileId } }))
  profilesStore.setActive(profileId)
  closeSheet()
}

function deleteProfile(profileId: string) {
  profilesStore.remove(profileId)
}

// ─── Rename ───────────────────────────────────────────────────
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

// ─── Add profile ──────────────────────────────────────────────
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

// ─── Avatar upload ────────────────────────────────────────────
function pickAvatar(profileId: string) {
  pendingAvatarProfileId.value = profileId
  avatarFileInput.value?.click()
}

function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pendingAvatarProfileId.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (dataUrl && pendingAvatarProfileId.value) {
      profilesStore.setAvatar(pendingAvatarProfileId.value, dataUrl)
    }
    pendingAvatarProfileId.value = null
  }
  reader.readAsDataURL(file)
  ;(event.target as HTMLInputElement).value = ''
}

watch(() => props.modelValue, (open) => {
  clearDragResetTimer()
  detachWindowDragListeners()

  if (open) {
    dragOffset.value = 0
    isDragging.value = false
    activePointerId.value = null
    dragTargetRef.value = null
    return
  }

  scheduleDragReset()
})

onUnmounted(() => {
  detachWindowDragListeners()
  clearDragResetTimer()
})
</script>

<style scoped>
/* ─── Profile bottom sheet ───────────────────────────────────── */

.sheet-overlay {
  position: fixed;
  inset: 0;
  background: var(--sg-color-scrim-45);
  z-index: var(--sg-layer-1000);
  display: flex;
  align-items: flex-end;
}

.profile-sheet {
  width: var(--sg-size-100pct);
  background: var(--sg-color-surface-raised);
  border-radius: var(--sg-nudge-sheet-radius);
  padding-bottom: env(safe-area-inset-bottom, 16px);
  max-height: var(--sg-nudge-sheet-max-height);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(var(--sheet-drag-offset, 0px));
}

.sheet-handle {
  width: var(--sg-nudge-handle-width);
  height: var(--sg-nudge-handle-height);
  background: var(--sg-color-border);
  border-radius: var(--sg-nudge-handle-radius);
  margin: var(--sg-space-0d75rem) auto 0;
  flex-shrink: 0;
}

.sheet-drag-zone {
  flex-shrink: 0;
  touch-action: none;
  user-select: none;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sg-space-0d75rem-1d25rem-0d5rem);
  flex-shrink: 0;
}

.sheet-title {
  font-size: var(--sg-font-size-1rem);
  font-weight: 700;
  color: var(--sg-color-text);
}

.sheet-close-btn {
  background: var(--sg-color-surface-muted);
  border: none;
  border-radius: var(--sg-radius-50pct);
  width: var(--sg-size-2rem);
  height: var(--sg-size-2rem);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d75rem);
  transition: var(--sg-motion-backgroundneg-color-0d12s);
}

.sheet-close-btn:active {
  background: var(--sg-color-surface-hover);
}

/* Profile list */
.sheet-profiles {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--sg-space-0d75rem);
}

.sheet-profile-row {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d75rem);
  padding: var(--sg-space-0d6rem) var(--sg-space-0d5rem);
  border-radius: var(--sg-radius-12px);
  transition: var(--sg-motion-backgroundneg-color-0d12s);
  margin-bottom: var(--sg-space-0d25rem);
}

.sheet-profile-row:active {
  background: var(--sg-color-surface-hover);
}

.sheet-profile-row--active {
  background: color-mix(in srgb, var(--sg-color-action) 8%, transparent);
}

.sheet-avatar {
  position: relative;
  width: var(--sg-avatar-size-lg);
  height: var(--sg-avatar-size-lg);
  border-radius: var(--sg-radius-50pct);
  background: var(--sg-color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  font-size: var(--sg-font-size-1d4rem);
}

.sheet-avatar-img {
  width: var(--sg-size-100pct);
  height: var(--sg-size-100pct);
  object-fit: cover;
}

.sheet-avatar-emoji {
  font-size: var(--sg-font-size-1d4rem);
  line-height: var(--sg-line-height-1);
}

.sheet-avatar-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--sg-color-action) 75%, transparent);
  color: var(--sg-color-text-on-action);
  font-size: var(--sg-font-size-0d9rem);
  border-radius: var(--sg-radius-50pct);
}

.sheet-profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-0d1rem);
  cursor: pointer;
  overflow: hidden;
}

.sheet-profile-name {
  font-size: var(--sg-font-size-0d95rem);
  font-weight: 600;
  color: var(--sg-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-label {
  font-size: var(--sg-font-size-0d7rem);
  color: var(--sg-color-action);
  font-weight: 600;
}

.name-edit-input {
  flex: 1;
  font-size: var(--sg-font-size-0d9rem);
  background: var(--sg-color-surface-muted);
  border: 1.5px solid var(--sg-color-action);
  border-radius: var(--sg-radius-6px);
  padding: var(--sg-space-0d3rem) var(--sg-space-0d5rem);
  color: var(--sg-color-text);
  outline: none;
  width: var(--sg-size-100pct);
}

/* Action buttons */
.sheet-profile-actions {
  display: flex;
  gap: var(--sg-space-0d15rem);
  flex-shrink: 0;
}

.sheet-action {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--sg-color-text-muted);
  padding: var(--sg-space-0d4rem);
  border-radius: var(--sg-radius-8px);
  display: flex;
  align-items: center;
  font-size: var(--sg-font-size-0d85rem);
  transition: var(--sg-motion-color-0d12s-backgroundneg-color-0d12s);
}

.sheet-action:active {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}

.sheet-action--danger:active {
  color: var(--sg-color-danger);
}

/* Clear cookies section */
.clear-cookies-section {
  border-top: 1px solid var(--sg-color-border);
  padding: var(--sg-space-0d5rem-0d75rem);
}

.clear-cookies-header {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  font-size: var(--sg-font-size-0d8rem);
  font-weight: 600;
  color: var(--sg-color-text);
  padding: var(--sg-space-0d25rem) var(--sg-space-0d25rem) var(--sg-space-0d5rem);
}

.clear-cookies-header i:first-child {
  font-size: var(--sg-font-size-0d85rem);
  color: var(--sg-color-text-muted);
}

.clear-cookies-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sg-space-0d35rem);
}

.clear-cookie-row {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  padding: var(--sg-space-0d5rem) var(--sg-space-0d6rem);
  background: var(--sg-color-surface-muted);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  cursor: pointer;
  transition: var(--sg-motion-backgroundneg-color-0d12s);
}

.clear-cookie-row:active {
  background: var(--sg-color-surface-hover);
}

.clear-cookie-icon {
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text-muted);
}

.clear-cookie-label {
  flex: 1;
  font-size: var(--sg-font-size-0d78rem);
  font-weight: 500;
  color: var(--sg-color-text);
  text-align: left;
}

.clear-cookie-action {
  font-size: var(--sg-font-size-0d75rem);
  color: var(--sg-color-text-muted);
}

.clear-cookie-done {
  color: var(--sg-color-success);
  font-size: var(--sg-font-size-0d8rem);
}

/* Footer */
.sheet-footer {
  border-top: 1px solid var(--sg-color-border);
  padding: var(--sg-space-0d6rem) var(--sg-space-0d75rem);
  flex-shrink: 0;
}

.add-profile-form {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d4rem);
}

.add-profile-btn {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  width: var(--sg-size-100pct);
  padding: var(--sg-space-0d7rem) var(--sg-space-0d75rem);
  background: none;
  border: 1.5px dashed var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  cursor: pointer;
  font-size: var(--sg-font-size-0d9rem);
  color: var(--sg-color-text-muted);
  transition: var(--sg-motion-color-0d12s-backgroundneg-color-0d12s), border-color 0.12s;
}

.add-profile-btn:active {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
  border-color: var(--sg-color-action);
}

.add-confirm-btn,
.add-cancel-btn {
  width: var(--sg-size-2d2rem);
  height: var(--sg-size-2d2rem);
  border-radius: var(--sg-radius-8px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--sg-font-size-0d85rem);
  flex-shrink: 0;
}

.add-confirm-btn {
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
}

.add-cancel-btn {
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
}

/* ─── Sheet transition ───────────────────────────────────────── */

.sheet-enter-active,
.sheet-leave-active {
  transition: var(--sg-motion-opacity-0d25s-ease);
}

.sheet-enter-active .profile-sheet,
.sheet-leave-active .profile-sheet {
  transition: var(--sg-motion-transform-0d25s-ease);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .profile-sheet,
.sheet-leave-to .profile-sheet {
  transform: translateY(calc(100% + var(--sheet-drag-offset, 0px)));
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .profile-sheet,
  .sheet-leave-active .profile-sheet {
    transition: none;
  }
}
</style>
