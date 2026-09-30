<script setup lang="ts">
import { navigateHierarchy } from "../utils/keyboardHierarchy"
import { vSidebarPointerDrag } from "../directives/sidebarPointerDrag"
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue"
import { useI18n } from "vue-i18n"
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "reka-ui"
import type {
  BentoSidebarCommand,
  BentoSidebarGroup,
  BentoSidebarSnapshot,
} from "./bentoSidebarBridge"
const props = defineProps<{
  snapshot: BentoSidebarSnapshot
  compact?: boolean
}>()
const emit = defineEmits<{ command: [command: BentoSidebarCommand] }>()
const { t } = useI18n()
const drag = ref<{ panelId?: string; paneId: string; groupId: string } | null>(
  null,
)
const over = ref("")
const openMenus = ref(new Set<string>())
let overlayActive = false
function setMenuOpen(id: string, open: boolean) {
  const next = new Set(openMenus.value)
  if (open) {
    next.clear()
    next.add(id)
  } else {
    next.delete(id)
  }
  openMenus.value = next
  syncOverlay()
}
function openMenu(id: string) {
  setMenuOpen(id, true)
}
function endDrag() {
  drag.value = null
  over.value = ""
}
function handleKeydown(event: KeyboardEvent) {
  if (
    event.key === "Escape" &&
    (edit.value || drag.value || openMenus.value.size)
  ) {
    cancel()
    event.preventDefault()
    event.stopPropagation()
    return
  }
  navigateHierarchy(event)
}
function syncOverlay() {
  const active = openMenus.value.size > 0 || !!drag.value
  if (active === overlayActive) return
  overlayActive = active
  window.dispatchEvent(
    new CustomEvent("communityglows-webview-overlay-state", {
      detail: { active },
    }),
  )
}
watch(drag, syncOverlay, { flush: "sync" })
function closeMenus() {
  openMenus.value = new Set()
  syncOverlay()
}
const folded = ref(new Set<string>())
const edit = ref<{ panelId?: string; paneId: string; groupId: string } | null>(
  null,
)
const name = ref("")
const nameInput = ref<HTMLInputElement | null>(null)
const key = (group: BentoSidebarGroup) => `${group.paneId}:${group.blockId}`
function cancel() {
  drag.value = null
  over.value = ""
  edit.value = null
  closeMenus()
}
watch(() => `${props.snapshot.profileId}:${props.snapshot.sceneId}`, cancel)
watch(
  () => props.snapshot,
  (snapshot) => {
    const valid = new Set(
      snapshot.groups.flatMap((group) => [
        key(group),
        ...group.tabs.map((tab) => tab.id),
      ]),
    )
    for (const id of openMenus.value)
      if (!valid.has(id)) openMenus.value.delete(id)
    syncOverlay()
  },
)
function visibilityChange() {
  if (document.hidden) cancel()
}
onMounted(() => {
  window.addEventListener("blur", cancel)
  document.addEventListener("visibilitychange", visibilityChange)
})
onUnmounted(() => {
  closeMenus()
  window.removeEventListener("blur", cancel)
  document.removeEventListener("visibilitychange", visibilityChange)
})
function send(command: Omit<BentoSidebarCommand, "profileId">) {
  emit("command", {
    ...command,
    profileId: props.snapshot.profileId,
    sceneId: props.snapshot.sceneId,
  } as BentoSidebarCommand)
}
function start(event: DragEvent, value: NonNullable<typeof drag.value>) {
  drag.value = value
  event.dataTransfer?.setData(
    "application/x-communityglows-bento",
    JSON.stringify(value),
  )
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
}
function insertion(event: DragEvent, group: BentoSidebarGroup, id = "") {
  if (!id || !(event.currentTarget instanceof HTMLElement)) return id
  const rect = event.currentTarget.getBoundingClientRect()
  return event.clientY < rect.top + rect.height / 2
    ? id
    : (group.tabs[group.tabs.findIndex((tab) => tab.id === id) + 1]?.id ?? "")
}
function enter(event: DragEvent, group: BentoSidebarGroup, beforeId = "") {
  if (
    !drag.value ||
    (drag.value.panelId && !group.id) ||
    (!drag.value.panelId && (!group.id || drag.value.paneId !== group.paneId))
  )
    return
  event.preventDefault()
  event.stopPropagation()
  over.value = `${key(group)}:${insertion(event, group, beforeId)}`
}
function enterBoundary(event: DragEvent, paneId: string, beforeId = "") {
  if (!drag.value?.panelId) return
  event.preventDefault()
  event.stopPropagation()
  over.value = `boundary:${paneId}:${beforeId || "end"}`
}
function dropBoundary(event: DragEvent, paneId: string, beforeId = "") {
  if (!drag.value?.panelId) return
  event.preventDefault()
  event.stopPropagation()
  send({
    action: "move",
    panelId: drag.value.panelId,
    paneId,
    groupId: "",
    beforeId: beforeId || undefined,
  } as Omit<BentoSidebarCommand, "profileId">)
  endDrag()
}
function drop(event: DragEvent, group: BentoSidebarGroup, beforeId?: string) {
  if (!drag.value || (drag.value.panelId && !group.id)) return
  event.preventDefault()
  event.stopPropagation()
  if (drag.value.panelId)
    send({
      action: "move",
      panelId: drag.value.panelId,
      paneId: group.paneId,
      groupId: group.id,
      beforeId: insertion(event, group, beforeId) || undefined,
    } as Omit<BentoSidebarCommand, "profileId">)
  else if (group.id && drag.value.paneId === group.paneId)
    send({
      action: "reorder-group",
      paneId: group.paneId,
      groupId: drag.value.groupId,
      index: props.snapshot.groups
        .filter((item) => item.paneId === group.paneId && item.id)
        .findIndex((item) => item.id === group.id),
    } as Omit<BentoSidebarCommand, "profileId">)
  if (drag.value.panelId) folded.value.delete(key(group))
  drag.value = null
  over.value = ""
}
async function rename(group: BentoSidebarGroup, panelId?: string) {
  edit.value = { paneId: group.paneId, groupId: group.id, panelId }
  name.value = panelId ? "" : group.title
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}
function save() {
  if (!edit.value || !name.value.trim()) return
  send({
    ...edit.value,
    action: edit.value.panelId ? "create" : "rename",
    name: name.value,
  } as Omit<BentoSidebarCommand, "profileId">)
  edit.value = null
}
function shift(group: BentoSidebarGroup, panelId: string, offset: -1 | 1) {
  const index = group.tabs.findIndex((tab) => tab.id === panelId)
  if (!group.id) {
    const blocks = props.snapshot.groups.filter(
      (item) => item.paneId === group.paneId,
    )
    const blockIndex = blocks.findIndex((item) => key(item) === key(group))
    if (blockIndex + offset < 0 || blockIndex + offset >= blocks.length) return
    const beforeBlock =
      offset < 0 ? blocks[blockIndex - 1] : blocks[blockIndex + 2]
    send({
      action: "move",
      panelId,
      paneId: group.paneId,
      groupId: "",
      beforeId: beforeBlock?.tabs[0]?.id,
    } as Omit<BentoSidebarCommand, "profileId">)
    return
  }
  if (index + offset < 0 || index + offset >= group.tabs.length) return
  send({
    action: "move",
    panelId,
    paneId: group.paneId,
    groupId: group.id,
    beforeId: group.tabs[index + (offset < 0 ? -1 : 2)]?.id,
  } as Omit<BentoSidebarCommand, "profileId">)
}
function canShift(group: BentoSidebarGroup, index: number, offset: -1 | 1) {
  if (group.id) return index + offset >= 0 && index + offset < group.tabs.length
  const blocks = props.snapshot.groups.filter(
    (item) => item.paneId === group.paneId,
  )
  const blockIndex = blocks.findIndex((item) => key(item) === key(group))
  return blockIndex + offset >= 0 && blockIndex + offset < blocks.length
}
function shiftGroup(group: BentoSidebarGroup, offset: number) {
  const groups = props.snapshot.groups.filter(
    (item) => item.paneId === group.paneId && item.id,
  )
  send({
    action: "reorder-group",
    paneId: group.paneId,
    groupId: group.id,
    index: Math.max(
      0,
      Math.min(
        groups.length - 1,
        groups.findIndex((item) => item.id === group.id) + offset,
      ),
    ),
  } as Omit<BentoSidebarCommand, "profileId">)
}
function isLastBlockInPane(index: number, group: BentoSidebarGroup) {
  return props.snapshot.groups[index + 1]?.paneId !== group.paneId
}
</script>

<template>
  <section
    v-sidebar-pointer-drag
    class="bento-sidebar-tabs"
    data-keyboard-node="bento-tabs"
    tabindex="0"
    :aria-label="t('sidebarTabs.title')"
    @keydown="handleKeydown"
    @dragend="endDrag"
    @contextmenu.stop
  >
    <h3>{{ compact ? "Bento" : t("sidebarTabs.title") }}</h3>
    <p v-if="!snapshot.groups.some((group) => group.tabs.length)">
      {{ t("sidebarTabs.empty") }}
    </p>
    <form
      v-if="edit"
      class="bento-sidebar-tabs__edit"
      @submit.prevent="save"
    >
      <input
        ref="nameInput"
        v-model="name"
        :aria-label="t('sidebarTabs.name')"
        :placeholder="t('sidebarTabs.name')"
        maxlength="64"
      />
      <button type="submit">{{ t("sidebarTabs.save") }}</button>
      <button
        type="button"
        @click="edit = null"
      >
        {{ t("sidebarTabs.cancel") }}
      </button>
    </form>
    <template
      v-for="(group, groupIndex) in snapshot.groups"
      :key="key(group)"
    >
      <div
        v-if="drag?.panelId"
        class="bento-sidebar-tabs__boundary"
        :class="{
          'bento-sidebar-tabs__boundary--active':
            over === `boundary:${group.paneId}:${group.tabs[0]?.id}`,
        }"
        :aria-label="t('sidebar.organization.drop_root')"
        @dragover="enterBoundary($event, group.paneId, group.tabs[0]?.id)"
        @drop="dropBoundary($event, group.paneId, group.tabs[0]?.id)"
      />
      <div
        class="bento-sidebar-tabs__group"
        :data-keyboard-node="group.id ? `bento-group:${key(group)}` : undefined"
        :aria-label="group.title || t('sidebarTabs.ungrouped')"
        tabindex="-1"
      >
        <div
          v-if="group.id"
          :data-sidebar-motion-key="`group:${key(group)}`"
          class="bento-sidebar-tabs__row"
          :class="{
            'bento-sidebar-tabs__destination': over === `${key(group)}:`,
          }"
          draggable="false"
          :data-sidebar-draggable="!!group.id"
          @keydown.alt.up.prevent="shiftGroup(group, -1)"
          @keydown.alt.down.prevent="shiftGroup(group, 1)"
          @keydown.shift.f10.prevent.stop="openMenu(key(group))"
          @contextmenu.prevent.stop="openMenu(key(group))"
          @dragstart="
            start($event, { paneId: group.paneId, groupId: group.id })
          "
          @dragover="enter($event, group)"
          @drop="drop($event, group)"
        >
          <button
            class="bento-sidebar-tabs__label"
            :aria-expanded="!folded.has(key(group))"
            :title="group.title || t('sidebarTabs.ungrouped')"
            @click="
              folded.has(key(group))
                ? folded.delete(key(group))
                : folded.add(key(group))
            "
          >
            {{ folded.has(key(group)) ? "▸" : "▾" }}
            {{ group.title || t("sidebarTabs.ungrouped") }}
          </button>
          <DropdownMenuRoot
            v-if="group.id"
            :open="openMenus.has(key(group))"
            @update:open="setMenuOpen(key(group), $event)"
          >
            <DropdownMenuTrigger
              class="bento-sidebar-tabs__more"
              :aria-label="t('sidebarTabs.actions', { name: group.title })"
            >
              ⋯
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                class="bento-sidebar-menu"
                :side-offset="4"
              >
                <DropdownMenuItem @select="shiftGroup(group, -1)">
                  {{ t("sidebarTabs.up") }}
                </DropdownMenuItem>
                <DropdownMenuItem @select="shiftGroup(group, 1)">
                  {{ t("sidebarTabs.down") }}
                </DropdownMenuItem>
                <DropdownMenuItem @select="rename(group)">
                  {{ t("sidebarTabs.rename") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  @select="
                    send({
                      action: 'dissolve',
                      paneId: group.paneId,
                      groupId: group.id,
                    } as Omit<BentoSidebarCommand, 'profileId'>)
                  "
                >
                  {{ t("sidebarTabs.dissolve") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>
        <template v-if="!group.id || !folded.has(key(group))">
          <div
            v-for="(tab, index) in group.tabs"
            :key="tab.id"
            :data-sidebar-motion-key="`tab:${tab.id}`"
            :data-keyboard-node="`bento-tab:${tab.id}`"
            :aria-label="tab.title"
            tabindex="-1"
            class="bento-sidebar-tabs__row"
            :data-ungrouped-tab="!group.id || undefined"
            :class="{
              'bento-sidebar-tabs__tab': !!group.id,
              'bento-sidebar-tabs__active': tab.active,
              'bento-sidebar-tabs__before': over === `${key(group)}:${tab.id}`,
              'bento-sidebar-tabs__after':
                index === group.tabs.length - 1 && over === `${key(group)}:`,
            }"
            draggable="false"
            data-sidebar-draggable="true"
            @dragstart.stop="
              start($event, {
                panelId: tab.id,
                paneId: group.paneId,
                groupId: group.id,
              })
            "
            @dragover="enter($event, group, tab.id)"
            @drop="drop($event, group, tab.id)"
            @keydown.alt.up.prevent="shift(group, tab.id, -1)"
            @keydown.alt.down.prevent="shift(group, tab.id, 1)"
            @keydown.shift.f10.prevent.stop="openMenu(tab.id)"
            @contextmenu.prevent.stop="openMenu(tab.id)"
          >
            <button
              class="bento-sidebar-tabs__label"
              :title="tab.title"
              :aria-current="tab.active ? 'page' : undefined"
              @click="
                send({ action: 'activate', panelId: tab.id } as Omit<
                  BentoSidebarCommand,
                  'profileId'
                >)
              "
            >
              {{ compact ? tab.title.slice(0, 2) : tab.title }}
            </button>
            <DropdownMenuRoot
              :open="openMenus.has(tab.id)"
              @update:open="setMenuOpen(tab.id, $event)"
            >
              <DropdownMenuTrigger
                class="bento-sidebar-tabs__more"
                :aria-label="t('sidebarTabs.actions', { name: tab.title })"
              >
                ⋯
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  class="bento-sidebar-menu"
                  :side-offset="4"
                >
                  <DropdownMenuItem
                    :disabled="!canShift(group, index, -1)"
                    @select="shift(group, tab.id, -1)"
                  >
                    {{ t("sidebarTabs.up") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    :disabled="!canShift(group, index, 1)"
                    @select="shift(group, tab.id, 1)"
                  >
                    {{ t("sidebarTabs.down") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="tab.canDuplicate"
                    @select="
                      send({ action: 'duplicate', panelId: tab.id } as Omit<
                        BentoSidebarCommand,
                        'profileId'
                      >)
                    "
                  >
                    {{ t("sidebar.duplicate") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @select="rename(group, tab.id)">
                    {{ t("sidebarTabs.create") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="group.id"
                    @select="
                      send({ action: 'ungroup', panelId: tab.id } as Omit<
                        BentoSidebarCommand,
                        'profileId'
                      >)
                    "
                  >
                    {{ t("sidebarTabs.ungroup") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-for="target in snapshot.groups.filter(
                      (item) => item.id && key(item) !== key(group),
                    )"
                    :key="key(target)"
                    @select="
                      send({
                        action: 'move',
                        panelId: tab.id,
                        paneId: target.paneId,
                        groupId: target.id,
                      } as Omit<BentoSidebarCommand, 'profileId'>)
                    "
                  >
                    {{ t("sidebarTabs.moveTo", { name: target.title }) }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
          </div>
        </template>
      </div>
      <div
        v-if="drag?.panelId && isLastBlockInPane(groupIndex, group)"
        class="bento-sidebar-tabs__boundary"
        :class="{
          'bento-sidebar-tabs__boundary--active':
            over === `boundary:${group.paneId}:end`,
        }"
        :aria-label="t('sidebar.organization.drop_root')"
        @dragover="enterBoundary($event, group.paneId)"
        @drop="dropBoundary($event, group.paneId)"
      />
    </template>
  </section>
</template>

<style scoped>
.bento-sidebar-tabs {
  padding: var(--sg-space-2);
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
}
.bento-sidebar-tabs h3 {
  font-size: var(--sg-font-size-0d85rem);
  margin: var(--sg-space-2) 0;
}
.bento-sidebar-tabs__row {
  display: flex;
  align-items: center;
  border-radius: var(--sg-radius-sm);
}
.bento-sidebar-tabs__boundary {
  min-height: var(--sg-space-3);
  margin-block: calc(-1 * var(--sg-space-1));
  position: relative;
  z-index: var(--sg-layer-decoration);
}
.bento-sidebar-tabs__boundary::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: var(--sg-position-50pct);
  border-top: var(--sg-border-2px) solid transparent;
  transform: translateY(-50%);
}
.bento-sidebar-tabs__boundary--active::after {
  border-color: var(--sg-color-action);
}
.bento-sidebar-tabs__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
.bento-sidebar-tabs button {
  padding: var(--sg-space-2);
  background: transparent;
  color: inherit;
  border: 0;
  cursor: pointer;
}
.bento-sidebar-tabs__tab {
  margin-left: var(--sg-space-2);
}
.bento-sidebar-tabs__active,
.bento-sidebar-tabs__row:hover {
  background: var(--sg-color-surface-hover);
}
.bento-sidebar-tabs__more {
  opacity: 0;
}
.bento-sidebar-tabs__row:hover .bento-sidebar-tabs__more,
.bento-sidebar-tabs__row:focus-within .bento-sidebar-tabs__more {
  opacity: 1;
}
.bento-sidebar-tabs__destination {
  outline: var(--sg-focus-ring);
  outline-offset: calc(-1 * var(--sg-focus-offset));
}
.bento-sidebar-tabs__before {
  box-shadow: 0 calc(-1 * var(--sg-border-2px)) var(--sg-color-action);
}
.bento-sidebar-tabs__after {
  box-shadow: 0 var(--sg-border-2px) var(--sg-color-action);
}
.bento-sidebar-tabs__edit {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-1);
}
.bento-sidebar-tabs__edit input {
  width: var(--sg-size-full);
  min-width: 0;
  color: inherit;
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
}
:global(.bento-sidebar-menu) {
  z-index: var(--sg-layer-modal);
  max-height: calc(var(--sg-size-100vh) - var(--sg-space-4));
  overflow: auto;
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  padding: var(--sg-space-1);
}
:global(.bento-sidebar-menu [role="menuitem"]) {
  padding: var(--sg-space-2);
  border-radius: var(--sg-radius-sm);
  cursor: pointer;
}
:global(.bento-sidebar-menu [data-highlighted]) {
  background: var(--sg-color-surface-hover);
  outline: none;
}
:global(.bento-sidebar-menu [data-disabled]) {
  opacity: var(--sg-opacity-disabled);
}
@media (hover: none) {
  .bento-sidebar-tabs__more {
    opacity: 1;
  }
}
</style>
