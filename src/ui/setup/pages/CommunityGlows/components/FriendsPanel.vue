<template>
  <SgDialog
    v-model="visible"
    :title="$t('friends_filter.dialog_title', { network: networkLabel })"
    variant="friends"
  >
    <p class="hint">
      {{ $t('friends_filter.hint_text', { network: networkLabel }) }}
    </p>

    <!-- Add friend input -->
    <div class="add-row">
      <input
        v-model="newFriend"
        placeholder="Nom ou @pseudo"
        class="add-input"
        autofocus
        @keydown.enter="addFriend"
      >
      <Button
        icon="pi pi-plus"
        :disabled="!newFriend.trim()"
        :aria-label="$t('common.add')"
        @click="addFriend"
      />
    </div>

    <!-- Friends list -->
    <div
      v-if="friends.length"
      class="friends-list"
    >
      <div
        v-for="friend in friends"
        :key="friend"
        class="friend-row"
      >
        <SgIcon icon="pi pi-user friend-icon" />
        <span class="friend-name">{{ friend }}</span>
        <Button
          icon="pi pi-times"
          text
          rounded
          size="small"
          severity="danger"
          :aria-label="$t('common.delete')"
          @click="removeFriend(friend)"
        />
      </div>
    </div>

    <div
      v-else
      class="empty-state"
    >
      <SgIcon icon="pi pi-users empty-state-icon" />
      <p>{{ $t('friends_filter.empty_state') }}</p>
      <p class="hint">{{ $t('friends_filter.empty_hint') }}</p>
    </div>

    <div class="footer-note">
      <SgIcon icon="pi pi-info-circle" />
      {{ $t('friends_filter.footer_note') }}
    </div>
  </SgDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from './ui/SgButton.vue'
import SgDialog from './ui/SgDialog.vue'
import { useFriendsFilterStore } from '@/stores/friendsFilter'

const props = defineProps<{
  networkId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const filterStore = useFriendsFilterStore()
const newFriend = ref('')

const NETWORK_LABELS: Record<string, string> = {
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  threads: 'Threads',
  discord: 'Discord',
  reddit: 'Reddit',
  quora: 'Quora',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  nextdoor: 'Nextdoor',
  patreon: 'Patreon',
  theresanaiforthat: "There's An AI For That",
  industrysocial: 'Industry Social',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  substack: 'Substack',
  'ko-fi': 'Ko-fi',
  buymeacoffee: 'Buy Me a Coffee',
  producthunt: 'Product Hunt',
  indiehackers: 'Indie Hackers',
  hackernews: 'Hacker News / Show HN',
  folloverse: 'Folloverse',
  'industrysocial-waitlist': 'Industry Social Waitlist',
  koru: 'Koru',
  medium: 'Medium',
}

const networkLabel = computed(() => NETWORK_LABELS[props.networkId] ?? props.networkId)
const friends = computed(() => filterStore.getFriends(props.networkId))

const addFriend = () => {
  if (!newFriend.value.trim()) return
  filterStore.addFriend(props.networkId, newFriend.value)
  newFriend.value = ''
}

const removeFriend = (name: string) => {
  filterStore.removeFriend(props.networkId, name)
}
</script>

<style scoped>
.hint {
  font-size: var(--sg-friends-hint-size);
  color: var(--sg-color-text-muted);
  margin: 0 0 var(--sg-space-4);
  line-height: var(--sg-friends-hint-line-height);
}

.add-row {
  display: flex;
  gap: var(--sg-space-2);
  margin-bottom: var(--sg-space-4);
}

.add-input {
  flex: 1;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-1);
  max-height: var(--sg-friends-list-max-height);
  overflow-y: auto;
}

.friend-row {
  display: flex;
  align-items: center;
  gap: var(--sg-space-3);
  padding: var(--sg-friends-row-padding);
  border-radius: var(--sg-friends-row-radius);
  transition: var(--sg-motion-colors);
}

.friend-row:hover {
  background: var(--sg-color-surface-hover);
}

.friend-icon {
  color: var(--sg-color-text-muted);
  font-size: var(--sg-friends-icon-size);
}

.friend-name {
  flex: 1;
  font-size: var(--sg-friends-name-size);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sg-friends-empty-padding);
  color: var(--sg-color-text-muted);
  gap: var(--sg-space-2);
  text-align: center;
}

.empty-state p {
  margin: 0;
}

.empty-state-icon { font-size: var(--sg-friends-empty-icon-size); opacity: var(--sg-friends-empty-icon-opacity); }

.footer-note {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  font-size: var(--sg-friends-footer-size);
  color: var(--sg-color-text-muted);
}
</style>
