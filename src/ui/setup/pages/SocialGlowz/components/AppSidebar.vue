<template>
  <template v-if="modelValue">
    <SplitterGroup
      direction="horizontal"
      @layout="handleResize"
    >
      <SplitterPanel
        ref="sidebarPanel"
        :default-size="SIDEBAR_EXPANDED_SIZE"
        :min-size="5"
        class="sidebar"
        :class="{ 'icons-only': iconsOnly }"
      >
        <div
          class="sidebar-content"
          :class="{ 'content-centered': iconsOnly }"
        >
          <div class="sidebar-main">
            <div
              class="sidebar-header"
              :class="{ 'justify-content-center': iconsOnly, 'justify-content-between': !iconsOnly }"
            >
              <Button
                v-sg-tooltip.right="'Toggle left sidebar'"
                icon="pi pi-bars"
                text
                aria-label="Toggle left sidebar"
                @click="toggleSidebar"
              />
              <h1
                v-if="!iconsOnly"
                class="app-title"
              >
                SocialGlowz
              </h1>
            </div>

            <!-- Réseaux sociaux -->
            <div class="menu-section">
              <div
                v-if="!iconsOnly"
                class="section-header"
              >
                <h3>{{ $t('sidebar.networks_section') }}</h3>
              </div>
              <div class="menu-items">
                <div
                  v-for="item in menuItems"
                  :key="item.id"
                  class="menu-item-group"
                >
                  <div
                    class="network-row"
                    :class="{ active: isNetworkActive(item) }"
                  >
                    <Button
                      :icon="undefined"
                      :label="iconsOnly ? undefined : item.label"
                      :tooltip="iconsOnly ? item.label : undefined"
                      :tooltip-options="{ position: 'right' }"
                      text
                      :class="[
                        'network-btn',
                        iconsOnly ? 'justify-content-center' : 'justify-content-start',
                        { 'network-btn--active': isNetworkActive(item) }
                      ]"
                      @click="navigateToNetwork(item)"
                    >
                      <template #icon>
                        <NetworkBrandIcon
                          :network-id="item.route.slice(1)"
                          :fallback-icon="item.icon"
                        />
                      </template>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filtre Amis -->
            <div class="friends-section friends-section--hidden">
              <div
                v-if="!iconsOnly"
                class="section-header"
              >
                <h3>{{ $t('sidebar.friends_section') }}</h3>
                <Button
                  v-sg-tooltip.right="$t('friends_filter.manage_tooltip')"
                  icon="pi pi-users"
                  text
                  size="small"
                  :aria-label="$t('friends_filter.manage_button')"
                  @click="showFriendsPanel = true"
                />
              </div>
              <div
                class="friends-toggle"
                :class="{ 'friends-toggle--centered': iconsOnly }"
              >
                <Button
                  v-sg-tooltip.right="iconsOnly ? (filterEnabled ? $t('friends_filter.filter_active') : $t('friends_filter.filter_inactive')) : undefined"
                  :label="iconsOnly ? undefined : (filterEnabled ? $t('friends_filter.friends_only') : $t('friends_filter.see_all'))"
                  :aria-label="iconsOnly ? (filterEnabled ? $t('friends_filter.filter_active') : $t('friends_filter.filter_inactive')) : undefined"
                  :icon="filterEnabled ? 'pi pi-filter-fill' : 'pi pi-filter'"
                  :aria-pressed="filterEnabled"
                  class="friends-filter-button"
                  @click="setFilterEnabled"
                />
                <Button
                  v-if="iconsOnly"
                  v-sg-tooltip.right="$t('friends_filter.manage_tooltip')"
                  icon="pi pi-users"
                  text
                  size="small"
                  class="friends-manage-btn"
                  :aria-label="$t('friends_filter.manage_button')"
                  @click="showFriendsPanel = true"
                />
              </div>
            </div>

            <FriendsPanel
              v-model="showFriendsPanel"
              :network-id="webviewStore.activeNetworkId ?? 'twitter'"
            />

            <!-- Custom Links -->
            <div
              v-if="customLinkItems.length || !iconsOnly"
              class="custom-links-section"
            >
              <div
                v-if="!iconsOnly"
                class="section-header"
              >
                <h3>{{ $t('sidebar.custom_links_section') }}</h3>
                <Button
                  v-sg-tooltip.right="$t('links.add_tooltip')"
                  icon="pi pi-plus"
                  text
                  size="small"
                  :aria-label="$t('links.add_button')"
                  @click="showAddLinkDialog = true"
                />
              </div>
              <div
                v-if="customLinkItems.length"
                class="menu-items"
              >
                <div
                  v-for="item in customLinkItems"
                  :key="item.id"
                  class="menu-item-group"
                >
                  <div
                    class="network-row"
                    :class="{ active: isNetworkActive(item) }"
                  >
                    <Button
                      :icon="item.icon"
                      :label="iconsOnly ? undefined : item.label"
                      :tooltip="iconsOnly ? item.label : undefined"
                      :tooltip-options="{ position: 'right' }"
                      text
                      :class="[
                        'network-btn',
                        iconsOnly ? 'justify-content-center' : 'justify-content-start',
                        { 'network-btn--active': isNetworkActive(item) }
                      ]"
                      @click="navigateToNetwork(item)"
                    />
                    <Button
                      v-if="!iconsOnly"
                      icon="pi pi-times"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      class="custom-link-delete"
                      :aria-label="$t('common.delete')"
                      @click="removeCustomLink(item.route.slice(1))"
                    />
                  </div>
                </div>
              </div>
              <Button
                v-if="iconsOnly"
                v-sg-tooltip.right="$t('links.add_tooltip')"
                icon="pi pi-plus"
                text
                size="small"
                class="custom-link-add-icon"
                :aria-label="$t('links.add_button')"
                @click="showAddLinkDialog = true"
              />
            </div>

            <SgDialog
              v-model="showAddLinkDialog"
              :title="$t('links.add_dialog_title')"
              variant="sidebar"
            >
              <div class="add-link-form">
                <input
                  v-model="newLinkLabel"
                  :placeholder="$t('links.name_placeholder')"
                  class="add-link-input"
                  @keydown.enter="addCustomLink"
                >
                <input
                  v-model="newLinkUrl"
                  type="url"
                  :placeholder="$t('links.url_placeholder')"
                  class="add-link-input"
                  @keydown.enter="addCustomLink"
                >
                <Button
                  :label="$t('common.add')"
                  icon="pi pi-plus"
                  :disabled="!newLinkLabel.trim() || !newLinkUrl.trim()"
                  @click="addCustomLink"
                />
              </div>
            </SgDialog>

            <!-- Kanban Columns -->
            <div
              v-if="!iconsOnly"
              class="kanban-section"
            >
              <div class="kanban-columns">
                <div 
                  v-for="column in kanbanStore.columns" 
                  :key="column.id"
                  class="kanban-column"
                  @dragover.prevent
                  @drop="handleDrop($event, column.id)"
                >
                  <div class="column-header">
                    <span class="column-title">{{ $t(column.title) }}</span>
                    <span class="column-count">{{ getColumnItems(column.id).length }}</span>
                  </div>
                  <div class="column-content">
                    <TransitionGroup
                      name="list"
                      tag="div"
                    >
                      <div
                        v-for="item in getColumnItems(column.id)"
                        :key="item.id"
                        class="kanban-item"
                        :class="[
                          `type-${item.type}`,
                          { 'is-dragging': isDragging(item) }
                        ]"
                        draggable="true"
                        @dragstart="handleDragStart($event, item)"
                        @dragend="handleDragEnd"
                      >
                        <div class="item-header">
                          <i :class="getItemIcon(item.type)"></i>
                          <span class="item-title">{{ item.title }}</span>
                          <Button
                            icon="pi pi-times"
                            :aria-label="`Supprimer ${item.title}`"
                            text
                            rounded
                            size="small"
                            severity="danger"
                            @click="deleteKanbanItem(item.id)"
                          />
                        </div>
                      </div>
                    </TransitionGroup>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile switcher (global — one profile = all networks) -->
          <ProfileSwitcher
            :icons-only="iconsOnly"
            menu-direction="up"
            class="profile-switcher-bottom"
          />
        </div>
      </SplitterPanel>
      <SplitterResizeHandle class="sidebar-resize-handle" />
      <SplitterPanel :default-size="100 - SIDEBAR_EXPANDED_SIZE">
        <slot></slot>
      </SplitterPanel>
    </SplitterGroup>
  </template>
  <template v-else>
    <Button
      v-sg-tooltip.right="'Ouvrir le panneau gauche'"
      icon="pi pi-bars"
      text
      aria-label="Ouvrir le panneau gauche"
      class="sidebar-reopen sidebar-reopen--left"
      @click="toggleSidebar"
    />
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { useRouter, useRoute } from 'vue-router'
import { useKanbanStore } from '@/stores/kanban'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useCustomLinksStore } from '@/stores/customLinks'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import type { MenuItem } from '../types'
import type { KanbanItem, KanbanColumnId } from '@/services/kanbanService'
import Button from './ui/SgButton.vue'
import SgDialog from './ui/SgDialog.vue'
import ProfileSwitcher from './ProfileSwitcher.vue'
import FriendsPanel from './FriendsPanel.vue'
import NetworkBrandIcon from './NetworkBrandIcon.vue'
import { isCompactSidebarSize, sidebarSizeForMode, SIDEBAR_EXPANDED_SIZE } from './sidebarLayout'

const router = useRouter()
const route = useRoute()
const kanbanStore = useKanbanStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const filterStore = useFriendsFilterStore()
const customLinksStore = useCustomLinksStore()

const showFriendsPanel = ref(false)
const showAddLinkDialog = ref(false)
const newLinkLabel = ref('')
const newLinkUrl = ref('')

const filterEnabled = computed(() => filterStore.enabled)

const setFilterEnabled = () => filterStore.toggle()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'network-selected': [network: MenuItem]
}>()

const iconsOnly = ref(false)
const sidebarPanel = ref<{ resize: (size: number) => void } | null>(null)

watch(iconsOnly, async compact => {
  await nextTick()
  sidebarPanel.value?.resize(sidebarSizeForMode(compact))
})

const totalKanbanItems = computed(() => {
  return kanbanStore.columns.reduce((total, column) => total + column.items.length, 0)
})

const getColumnItems = (columnId: KanbanColumnId) => {
  return kanbanStore.getColumnItems(columnId)
}

const isDragging = (item: KanbanItem) => {
  return kanbanStore.draggedItem?.id === item.id
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'email':
      return 'pi pi-envelope'
    case 'task':
      return 'pi pi-check-square'
    case 'note':
      return 'pi pi-file'
    default:
      return 'pi pi-file'
  }
}

const handleDragStart = (event: DragEvent, item: KanbanItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
  }
  kanbanStore.startDragging(item)
}

const handleDragEnd = () => {
  kanbanStore.endDragging()
}

const handleDrop = (event: DragEvent, columnId: KanbanColumnId) => {
  const itemId = event.dataTransfer?.getData('text/plain')
  if (itemId) {
    kanbanStore.moveItem(itemId, columnId)
  }
}

const deleteKanbanItem = (itemId: string) => {
  kanbanStore.deleteItem(itemId)
}

const toggleSidebar = () => emit('update:modelValue', !props.modelValue)

const handleResize = (sizes: number[]) => {
  const newSize = sizes[0]
  if (typeof newSize !== 'number') return

  iconsOnly.value = isCompactSidebarSize(newSize)
}

const builtinMenuItems = builtInSocialNetworks.map((network, index) => ({
  id: index + 1,
  label: network.label,
  icon: network.icon,
  route: network.route,
}))

const menuItems = ref<MenuItem[]>([
  ...builtinMenuItems,
  { id: builtinMenuItems.length + 1, label: 'CRM', icon: 'pi pi-briefcase', route: '/crm' },
  { id: builtinMenuItems.length + 2, label: 'Tâches', icon: 'pi pi-check-square', route: '/tasks' },
])

const customLinkItems = computed<MenuItem[]>(() => {
  const profileId = profilesStore.activeProfileId ?? ''
  return customLinksStore.getLinks(profileId).map((link, i) => ({
    id: 1000 + i,
    label: link.label,
    icon: link.icon,
    route: `/${link.id}`,
  }))
})

const isNetworkActive = (item: MenuItem): boolean =>
  item.route === '/crm'
    ? route.path === '/crm' || route.path === '/gmail'
    : item.route === '/tasks'
      ? route.path === '/tasks'
    : webviewStore.activeNetworkId === item.route.slice(1)

const navigateToNetwork = (network: MenuItem): void => {
  const networkId = network.route.slice(1) // '/twitter' → 'twitter'

  if (networkId.startsWith('custom-')) {
    const profileId = profilesStore.activeProfileId ?? ''
    const link = customLinksStore.getLinks(profileId).find(l => l.id === networkId)
    if (link) {
      profilesStore.ensureDefault()
      webviewStore.selectCustom(link.id, link.url)
    }
  } else if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }

  emit('network-selected', network)
}

const addCustomLink = () => {
  if (!newLinkLabel.value.trim() || !newLinkUrl.value.trim()) return
  const profileId = profilesStore.activeProfileId ?? ''
  customLinksStore.addLink(profileId, newLinkLabel.value, newLinkUrl.value)
  newLinkLabel.value = ''
  newLinkUrl.value = ''
  showAddLinkDialog.value = false
}

const removeCustomLink = (linkId: string) => {
  const profileId = profilesStore.activeProfileId ?? ''
  customLinksStore.removeLink(profileId, linkId)
}

onMounted(() => {
  kanbanStore.initialize()
})
</script>

<style scoped>
.sidebar {
  background-color: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  height: var(--sg-sidebar-viewport-height);
  margin-top: 0;
  transition: var(--sg-sidebar-transition);
}

.sidebar-reopen {
  position: fixed;
  top: var(--sg-sidebar-control-padding);
  z-index: var(--sg-sidebar-overlay-z-index, 1100);
  color: var(--text-color);
  background: transparent;
}

.sidebar-reopen--left {
  left: var(--sg-sidebar-control-padding);
}

.sidebar-reopen:hover {
  background: var(--surface-hover);
}

.sidebar.icons-only {
  min-width: var(--sg-sidebar-compact-width);
  max-width: var(--sg-sidebar-compact-width);
}

.sidebar:not(.icons-only) {
  min-width: var(--sg-sidebar-expanded-min-width);
}

.sidebar-content {
  height: var(--sg-sidebar-fill-size);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-main {
  flex: 1;
  min-height: 0;
  width: var(--sg-sidebar-fill-size);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-control-gap);
  min-height: var(--sg-sidebar-header-height);
  padding: var(--sg-sidebar-control-padding);
}

.app-title {
  margin: 0;
  color: var(--text-color);
  font-size: var(--sg-sidebar-app-title-size);
  white-space: nowrap;
}

.content-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-centered .menu-items {
  width: var(--sg-sidebar-fill-size);
}

.flex.align-items-center.mb-3 {
  padding: var(--sg-sidebar-control-padding);
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item-group {
  display: flex;
  flex-direction: column;
}

.network-row {
  display: flex;
  align-items: center;
  position: relative;
}

.network-row.active {
  background-color: var(--surface-hover);
  border-left: var(--sg-sidebar-active-indicator-width) solid var(--primary-color);
}

.network-btn {
  flex: 1;
  border-radius: 0;
  height: var(--sg-sidebar-network-row-height);
}

.network-btn {
  width: var(--sg-sidebar-fill-size);
  border-radius: 0;
  height: var(--sg-sidebar-network-row-height);
}

.network-btn.justify-content-start {
  padding: 0 var(--sg-sidebar-network-row-padding-inline);
}

.network-btn.justify-content-center {
  padding: 0;
}

.network-btn:hover,
.network-row:hover {
  background-color: var(--surface-hover);
}


.menu-section {
  margin-bottom: var(--sg-sidebar-section-spacing);
}

.section-header {
  padding: var(--sg-sidebar-section-padding-block) var(--sg-sidebar-section-padding-inline);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: var(--sg-sidebar-section-title-size);
  color: var(--text-color-secondary);
}

.friends-section {
  margin-bottom: var(--sg-sidebar-subsection-spacing);
  border-top: 1px solid var(--surface-border);
  padding-top: var(--sg-sidebar-subsection-spacing);
}

.friends-section--hidden {
  display: none;
}

.friends-toggle {
  display: flex;
  flex-direction: column;
}

.friends-toggle--centered {
  align-items: center;
  padding: var(--sg-sidebar-compact-control-spacing) 0;
}

.friends-manage-btn {
  margin-top: var(--sg-sidebar-compact-control-spacing);
}

.custom-links-section {
  border-top: 1px solid var(--surface-border);
  padding-top: var(--sg-sidebar-subsection-spacing);
  margin-bottom: var(--sg-sidebar-subsection-spacing);
}

.custom-link-delete {
  position: absolute;
  right: var(--sg-sidebar-compact-control-spacing);
}

.custom-link-add-icon {
  margin: var(--sg-sidebar-compact-control-spacing) auto;
  display: block;
}

.add-link-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
}

.friends-filter-button { width: var(--sg-sidebar-fill-size); min-height: var(--sg-sidebar-filter-height); border-radius: 0; }

.add-link-input {
  width: var(--sg-sidebar-fill-size);
}

.kanban-columns {
  padding: var(--sg-sidebar-kanban-padding);
}

.kanban-column {
  margin-bottom: var(--sg-sidebar-section-spacing);
  background: var(--surface-ground);
  border-radius: var(--sg-sidebar-kanban-column-radius);
}

.column-header {
  padding: var(--sg-sidebar-kanban-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--surface-border);
}

.column-title {
  font-weight: bold;
  font-size: var(--sg-sidebar-kanban-title-size);
}

.column-count {
  background: var(--surface-hover);
  color: var(--text-color);
  padding: var(--sg-sidebar-kanban-count-padding-block) var(--sg-sidebar-kanban-count-padding-inline);
  border-radius: var(--sg-sidebar-kanban-count-radius);
  font-size: var(--sg-sidebar-kanban-count-size);
}

.column-content {
  padding: var(--sg-sidebar-kanban-padding);
  max-height: var(--sg-sidebar-kanban-content-max-height);
  overflow-y: auto;
}

.kanban-item {
  background: var(--surface-card);
  border-radius: var(--sg-sidebar-kanban-item-radius);
  padding: var(--sg-sidebar-kanban-padding);
  margin-bottom: var(--sg-sidebar-subsection-spacing);
  cursor: move;
  box-shadow: var(--sg-sidebar-kanban-item-shadow);
  transition: var(--sg-sidebar-kanban-item-transition);
}

.kanban-item:hover {
  transform: translateX(var(--sg-sidebar-kanban-item-hover-offset));
  box-shadow: var(--sg-sidebar-kanban-item-hover-shadow);
}

.kanban-item.is-dragging {
  opacity: 0.5;
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-subsection-spacing);
}

.item-title {
  flex: 1;
  font-size: var(--sg-sidebar-kanban-title-size);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-email {
  border-left: var(--sg-sidebar-active-indicator-width) solid var(--blue-500);
}

.type-task {
  border-left: var(--sg-sidebar-active-indicator-width) solid var(--green-500);
}

.type-note {
  border-left: var(--sg-sidebar-active-indicator-width) solid var(--yellow-500);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: var(--sg-sidebar-list-transition);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(var(--sg-sidebar-list-enter-offset));
}

.list-leave-active {
  position: absolute;
}

@media (prefers-reduced-motion: reduce) {
  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: none;
  }

  .sidebar,
  .kanban-item {
    transition: none;
  }

  .sidebar-resize-handle {
    transition: none;
  }
}

.sidebar-resize-handle { width: var(--sg-sidebar-resize-handle-width); background: var(--surface-border); transition: var(--sg-sidebar-gutter-transition); }
.sidebar-resize-handle:hover { background: var(--primary-color); }
.sidebar-resize-handle:focus-visible { background: var(--primary-color); outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
</style> 
