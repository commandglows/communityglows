<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from "vue"
import {
  managedNetworkCommand,
  type NetworkTabsState,
  type NetworkTarget,
} from "@/platform/managedNetworkTabs"
import { currentExtensionWindowId } from "@/platform/webExtensionApi"
import InlineSidebarLabel from "./InlineSidebarLabel.vue"
import type { NetworkCommand } from "@/background/networkTabGroup"
const props = defineProps<{ targets: NetworkTarget[]; profileId: string }>()
const emit = defineEmits<{ activateProfile: [id: string] }>()
const state = ref<NetworkTabsState>({ entries: [], groups: [] })
const windowId = ref<number>()
watch(
  () =>
    state.value.entries.find(
      (entry) => entry.active && entry.windowId === windowId.value,
    )?.tabId,
  () => {
    const active = state.value.entries.find(
      (entry) => entry.active && entry.windowId === windowId.value,
    )
    if (active && active.profileId !== props.profileId)
      emit("activateProfile", active.profileId)
  },
)
const chosen = ref("")
const error = ref("")
const busy = ref(false)
const editing = ref<number>()
const entries = computed(() =>
  state.value.entries
    .filter((entry) => entry.profileId === props.profileId)
    .sort((a, b) => a.windowId - b.windowId || a.index - b.index),
)
const groups = computed(() =>
  state.value.groups.filter((group) =>
    entries.value.some((entry) => !entry.closed && entry.groupId === group.id),
  ),
)
const loose = computed(() =>
  entries.value.filter((entry) => entry.closed || entry.groupId === -1),
)
async function act(command: NetworkCommand) {
  error.value = ""
  busy.value = true
  try {
    state.value = await managedNetworkCommand(command)
  } catch (failure) {
    error.value =
      failure instanceof Error ? failure.message : "tab_creation_failed"
  } finally {
    busy.value = false
  }
}
async function refresh() {
  try {
    const next = await managedNetworkCommand({ action: "snapshot" })
    if (!disposed) state.value = next
  } catch {
    error.value = "tab_creation_failed"
  }
}
function storageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area === "session" && changes["communityglows.network-tabs.v2"]?.newValue)
    state.value = changes["communityglows.network-tabs.v2"].newValue
}
let disposed = false
onMounted(async () => {
  chrome.storage.onChanged.addListener(storageChanged)
  try {
    windowId.value = await currentExtensionWindowId()
    await refresh()
  } catch {
    error.value = "tab_creation_failed"
  }
})
onScopeDispose(() => {
  disposed = true
  chrome.storage.onChanged.removeListener(storageChanged)
})
async function adopt() {
  const target = props.targets.find(
    (target) => target.networkId === chosen.value,
  )
  if (target && windowId.value !== undefined)
    await act({ action: "adopt", target, windowId: windowId.value })
}
function rename(groupId: number, title: string) {
  editing.value = undefined
  void act({ action: "rename", groupId, title })
}
</script>

<template>
  <section
    class="ext-parity-grid"
    :aria-label="$t('extension.managed.title')"
  >
    <h2 class="ext-parity-section-title">
      {{ $t("extension.managed.title") }}
    </h2>
    <p>{{ $t("extension.managed.sessions") }}</p>
    <p>{{ $t("extension.managed.restart") }}</p>
    <div class="ext-parity-grid">
      <label for="managed-adopt-network">
        {{ $t("extension.managed.target") }}
      </label>
      <select
        id="managed-adopt-network"
        v-model="chosen"
        class="ext-select"
      >
        <option value="">{{ $t("extension.managed.choose") }}</option>
        <option
          v-for="target in targets"
          :key="target.networkId"
          :value="target.networkId"
        >
          {{ target.label }}
        </option>
      </select>
      <button
        class="ext-btn ext-btn--outline"
        :disabled="busy || !chosen || windowId === undefined"
        @click="adopt"
      >
        {{ $t("extension.managed.adopt") }}
      </button>
      <button
        class="ext-btn ext-btn--outline"
        :disabled="busy || windowId === undefined"
        @click="act({ action: 'gather', windowId: windowId! })"
      >
        {{ $t("extension.managed.gather") }}
      </button>
    </div>
    <section
      v-for="group in groups"
      :key="group.id"
      class="ext-parity-grid"
    >
      <div class="managed-group-heading">
        <button
          class="ext-btn ext-btn--small ext-btn--outline"
          :aria-label="group.title || $t('extension.managed.untitled')"
          :aria-expanded="!group.collapsed"
          :disabled="busy || group.mixed || group.active"
          @click="
            act({
              action: 'collapse',
              groupId: group.id,
              collapsed: !group.collapsed,
            })
          "
        >
          {{ group.collapsed ? "▸" : "▾" }}
        </button>
        <InlineSidebarLabel
          :label="group.title || $t('extension.managed.untitled')"
          :editing="editing === group.id"
          @save="rename(group.id, $event)"
          @cancel="editing = undefined"
        />
        <button
          class="ext-btn ext-btn--xs ext-btn--outline managed-group-action"
          :disabled="busy || group.mixed"
          @click="editing = group.id"
        >
          {{ $t("extension.repair.edit") }}
        </button>
      </div>
      <p v-if="group.mixed">{{ $t("extension.managed.mixed") }}</p>
      <div
        v-show="!group.collapsed"
        class="ext-parity-grid"
      >
        <div
          v-for="entry in entries.filter(
            (item) => !item.closed && item.groupId === group.id,
          )"
          :key="entry.networkId"
          class="ext-parity-grid"
        >
          <button
            class="ext-btn ext-btn--small ext-btn--left"
            :class="entry.active ? 'ext-btn--primary' : 'ext-btn--outline'"
            :aria-current="entry.active ? 'page' : undefined"
            :disabled="busy"
            @click="act({ action: 'open', target: entry, windowId: windowId! })"
          >
            {{ entry.label }}
          </button>
          <button
            v-if="entry.windowId !== windowId"
            class="ext-btn ext-btn--xs ext-btn--outline"
            :disabled="busy"
            @click="
              act({
                action: 'gather',
                tabId: entry.tabId!,
                windowId: windowId!,
              })
            "
          >
            {{ $t("extension.managed.bring") }}
          </button>
        </div>
      </div>
    </section>
    <div
      v-for="entry in loose"
      :key="entry.networkId"
      class="ext-parity-grid"
    >
      <button
        class="ext-btn ext-btn--small ext-btn--outline"
        :aria-current="entry.active ? 'page' : undefined"
        :disabled="busy"
        @click="
          act({
            action: 'open',
            target: entry,
            windowId: windowId!,
            reopen: entry.recovery,
          })
        "
      >
        {{ entry.label }} ·
        {{
          $t(
            entry.recovery
              ? "extension.managed.reopen"
              : entry.closed
                ? "extension.managed.closed"
                : "extension.managed.ungrouped",
          )
        }}
      </button>
      <button
        v-if="!entry.closed && entry.windowId !== windowId"
        class="ext-btn ext-btn--xs ext-btn--outline"
        :disabled="busy"
        @click="
          act({ action: 'gather', tabId: entry.tabId!, windowId: windowId! })
        "
      >
        {{ $t("extension.managed.bring") }}
      </button>
    </div>
    <p v-if="!entries.length">{{ $t("extension.managed.empty") }}</p>
    <p
      v-if="error"
      class="ext-alert ext-alert--error"
      role="alert"
    >
      {{ $t("extension.managed.errors." + error) }}
    </p>
  </section>
</template>

<style scoped>
.managed-group-heading {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d5rem);
  min-width: 0;
}
.managed-group-heading > span {
  overflow-wrap: anywhere;
}
@media (hover: hover) {
  .managed-group-action {
    opacity: 0;
  }
  .managed-group-heading:hover .managed-group-action,
  .managed-group-heading:focus-within .managed-group-action {
    opacity: 1;
  }
}
</style>
