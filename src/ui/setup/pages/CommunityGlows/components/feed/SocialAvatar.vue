<template>
  <div
    class="social-avatar"
    :style="avatarBorderVariables"
  >
    <Avatar 
      :image="avatarUrl" 
      :size="avatarSize"
      :shape="shape"
      @error="handleAvatarError"
    />
    <SgBadge
      v-if="showBadge" 
      :value="badgeContent" 
      :severity="badgeSeverity"
      class="avatar-badge"
    >
      <SgIcon
        v-if="badgeIcon"
        :icon="badgeIcon"
      />
    </SgBadge>
    <div
      v-if="showStatus"
      :class="['status-indicator', user.status]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../ui/SgAvatar.vue'
import SgBadge from '../ui/SgBadge.vue'

interface Props {
  user: {
    username?: string
    name?: string
    network?: string
    avatar?: string
    status?: 'online' | 'offline' | 'idle' | 'busy' | string
  }
  size?: 'normal' | 'large' | 'xlarge'
  shape?: 'square' | 'circle'
  showBadge?: boolean
  badgeContent?: string | number
  badgeIcon?: string
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger' | 'secondary'
  showStatus?: boolean
  borderColor?: string
  borderWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'normal',
  shape: 'circle',
  showBadge: false,
  badgeContent: undefined,
  badgeIcon: undefined,
  badgeSeverity: 'secondary',
  showStatus: false,
  borderColor: 'var(--sg-color-border)',
  borderWidth: '0px'
})

const avatarSize = computed<'normal' | 'large' | 'xlarge'>(() => {
  return props.size
})

const avatarBorderVariables = computed(() => ({
  '--social-avatar-border-color': props.borderColor,
  '--social-avatar-border-width': props.borderWidth,
}))

const fallbackAvatar = ref<string | null>(null)

const identity = computed(() => props.user.username || props.user.name || 'default')

const avatarUrl = computed(() => {
  if (fallbackAvatar.value) return fallbackAvatar.value
  if (props.user.avatar) return props.user.avatar
  
  if (identity.value && props.user.network) {
    return `https://unavatar.io/${props.user.network}/${identity.value}`
  }
  
  return `https://unavatar.io/fallback/${identity.value}`
})

const handleAvatarError = () => {
  fallbackAvatar.value = `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity.value}`
}
</script>

<style scoped>
.social-avatar {
  position: relative;
  display: inline-flex;
}

.social-avatar :deep(.sg-avatar) {
  border: var(--social-avatar-border-width) solid var(--social-avatar-border-color);
}

:deep(.avatar-badge) {
  position: absolute;
  bottom: 0;
  right: 0;
  border-radius: var(--sg-radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sg-space-1);
  border: var(--sg-badge-border) solid var(--sg-color-surface-raised);
}

.status-indicator {
  position: absolute;
  bottom: var(--sg-avatar-status-inset);
  right: var(--sg-avatar-status-inset);
  width: var(--sg-avatar-status-size);
  height: var(--sg-avatar-status-size);
  border-radius: var(--sg-radius-pill);
  border: var(--sg-badge-border) solid var(--sg-color-surface-raised);
}

.status-indicator.online {
  background-color: var(--sg-color-success);
}

.status-indicator.offline {
  background-color: var(--sg-color-text-muted);
}

.status-indicator.idle {
  background-color: var(--sg-color-warning);
}

.status-indicator.busy {
  background-color: var(--sg-color-danger);
}
</style> 
