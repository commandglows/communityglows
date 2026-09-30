<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'
import type { KanbanContact } from '@/stores/kanbanContacts'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import SgIcon from '../ui/SgIcon.vue'

const props = defineProps<{
  contacts: KanbanContact[]
  search: string
}>()
const emit = defineEmits<{
  edit: [contact: KanbanContact]
  filter: [id: string]
  createTask: [contact: KanbanContact]
  openProfile: [url: string]
  togglePin: [contact: KanbanContact]
}>()
const section = ref<HTMLElement | null>(null)
const normalizedSearch = computed(() => props.search.trim().toLocaleLowerCase())
const filtered = computed(() => props.contacts.filter(contact => [
  contact.name,
  contact.note,
  contact.url,
  contact.avatarUrl,
  contact.nextFollowUp,
  ...contact.profileLinks.flatMap(link => [link.url, networkName(link.networkId)]),
]
  .filter(Boolean)
  .join(' ')
  .toLocaleLowerCase()
  .includes(normalizedSearch.value)))
function initials(contact: KanbanContact) {
  return contact.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toLocaleUpperCase())
    .join('')
}
function networkName(networkId: string) {
  return builtInSocialNetworks.find(network => network.id === networkId)?.label ?? networkId
}
function networkIcon(networkId: string) {
  return builtInSocialNetworks.find(network => network.id === networkId)?.icon ?? 'pi pi-external-link'
}
function networkColor(networkId: string) {
  return builtInSocialNetworks.find(network => network.id === networkId)?.color
}
async function focus(id: string) {
  await nextTick()
  const card = section.value?.querySelector<HTMLElement>(`[data-contact-id="${CSS.escape(id)}"]`)
  card?.querySelector<HTMLButtonElement>('.contact-card__primary')?.focus()
  card?.scrollIntoView({ block: 'nearest' })
}
defineExpose({ focus })
</script>

<template>
  <section
    ref="section"
    class="kanban-contacts"
    :aria-label="$t('crm.contacts')"
  >
    <header class="contacts-toolbar">
      <h2>{{ $t('crm.contacts') }}</h2>
    </header>
    <p v-if="!contacts.length">{{ $t('crm.empty') }}</p>
    <p v-else-if="!filtered.length">{{ $t('crm.no_results') }}</p>
    <div class="contacts-list">
      <article
        v-for="contact in filtered"
        :key="contact.id"
        :data-contact-id="contact.id"
        class="contact-card"
      >
        <ContextMenuRoot>
          <ContextMenuTrigger as-child>
            <button
              type="button"
              class="contact-card__primary"
              :aria-label="$t('crm.open_contact_sheet', { name: contact.name })"
              @click="emit('edit', contact)"
            >
              <span
                class="contact-card__avatar"
                aria-hidden="true"
              >
                <img
                  v-if="contact.avatarUrl"
                  :src="contact.avatarUrl"
                  alt=""
                />
                <span v-else>{{ initials(contact) }}</span>
              </span>
              <span class="contact-card__name">{{ contact.name }}</span>
            </button>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuContent
              class="contact-context-menu"
              :collision-padding="8"
            >
              <ContextMenuItem @select="emit('filter', contact.id)">
                <SgIcon icon="pi pi-filter" />
                {{ $t('crm.filter_tasks') }}
              </ContextMenuItem>
              <ContextMenuItem @select="emit('createTask', contact)">
                <SgIcon icon="pi pi-plus" />
                {{ $t('crm.create_task_for_contact') }}
              </ContextMenuItem>
              <ContextMenuItem
                v-for="link in contact.profileLinks"
                :key="link.id"
                @select="emit('openProfile', link.url)"
              >
                <SgIcon :icon="networkIcon(link.networkId)" />
                {{ $t('crm.open_profile_in', { network: networkName(link.networkId) }) }}
              </ContextMenuItem>
              <ContextMenuSeparator class="contact-context-menu__separator" />
              <ContextMenuItem @select="emit('togglePin', contact)">
                <SgIcon icon="pi pi-thumbtack" />
                {{ $t(contact.pinned ? 'crm.unpin_contact' : 'crm.pin_contact') }}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenuRoot>
        <div
          v-if="contact.nextFollowUp || contact.note || contact.profileLinks.length"
          class="contact-card__meta"
        >
          <p v-if="contact.nextFollowUp"><time :datetime="contact.nextFollowUp">{{ contact.nextFollowUp }}</time></p>
          <div
            v-if="contact.profileLinks.length"
            class="contact-card__profile-links"
            :aria-label="$t('crm.profile_links_count', { count: contact.profileLinks.length })"
          >
            <button
              v-for="link in contact.profileLinks"
              :key="link.id"
              type="button"
              class="contact-card__profile-link"
              :style="{ color: networkColor(link.networkId) }"
              :aria-label="$t('crm.open_profile_in', { network: networkName(link.networkId) })"
              :title="$t('crm.open_profile_in', { network: networkName(link.networkId) })"
              @click="emit('openProfile', link.url)"
            >
              <SgIcon :icon="networkIcon(link.networkId)" />
            </button>
          </div>
          <p
            v-if="contact.note"
            class="contact-note"
          >
            {{ contact.note }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.kanban-contacts { padding: var(--sg-space-3); border: var(--sg-border-1px) solid var(--sg-color-border); border-radius: var(--sg-radius-lg); background: var(--sg-color-surface-raised); }
.contacts-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--sg-space-2); flex-wrap: wrap; }
h2, h3 { margin: 0; font-size: inherit; font-weight: 600; }
p { color: var(--sg-color-text-muted); }
.contacts-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--sg-shortcuts-capture-min-width)), 1fr)); gap: var(--sg-space-3); }
.contact-card__primary:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.contact-card { min-width: 0; padding: var(--sg-space-3); border: var(--sg-border-1px) solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-background); display: grid; gap: var(--sg-space-2); justify-items: center; text-align: center; }
.contact-card__primary { width: 100%; padding: 0; border: 0; background: transparent; color: var(--sg-color-text); font: inherit; display: grid; gap: var(--sg-space-2); justify-items: center; cursor: pointer; }
.contact-card__avatar { display: grid; place-items: center; inline-size: var(--sg-size-56px); block-size: var(--sg-size-56px); overflow: hidden; border-radius: var(--sg-radius-50pct); background: var(--sg-color-surface-muted); color: var(--sg-color-text); font-weight: var(--sg-font-weight-bold); }
.contact-card__avatar img { inline-size: var(--sg-size-100pct); block-size: var(--sg-size-100pct); object-fit: cover; }
.contact-card__name { font-weight: 600; overflow-wrap: anywhere; }
.contact-card__meta { display: grid; gap: var(--sg-space-1); min-width: 0; color: var(--sg-color-text-muted); }
.contact-card__meta p { margin: 0; }
.contact-card__profile-links { display: flex; align-items: center; justify-content: center; gap: var(--sg-space-1); flex-wrap: wrap; }
.contact-card__profile-link { display: grid; place-items: center; inline-size: var(--sg-size-32px); block-size: var(--sg-size-32px); border: var(--sg-border-1px) solid currentColor; border-radius: var(--sg-radius-50pct); background: color-mix(in srgb, currentColor 12%, transparent); color: inherit; cursor: pointer; }
.contact-card__profile-link:hover { background: color-mix(in srgb, currentColor 20%, transparent); }
.contact-card__profile-link:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.contact-note { white-space: pre-wrap; overflow-wrap: anywhere; }
:global(.contact-context-menu) {
  z-index: var(--sg-layer-modal);
  min-inline-size: var(--sg-shortcuts-capture-min-width);
  max-block-size: var(--reka-context-menu-content-available-height);
  overflow-y: auto;
  padding: var(--sg-space-1);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  box-shadow: var(--sg-shadow-control);
}

:global(.contact-context-menu [role^="menuitem"]) {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  inline-size: 100%;
  padding: var(--sg-button-padding);
  border-radius: var(--sg-radius-sm);
  outline: none;
  cursor: pointer;
}

:global(.contact-context-menu [data-highlighted]) {
  background: var(--sg-color-surface-hover);
}

:global(.contact-context-menu__separator) {
  block-size: var(--sg-border-1px);
  margin-block: var(--sg-space-1);
  background: var(--sg-color-border);
}
</style>
