<template>
  <AvatarRoot
    class="sg-avatar"
    :class="[`sg-avatar--${size}`, { 'sg-avatar--circle': shape === 'circle' }]"
  >
    <AvatarImage
      v-if="image"
      :src="image"
      :alt="alt"
      class="sg-avatar__image"
      @error="$emit('error', $event)"
    />
    <AvatarFallback class="sg-avatar__fallback">{{ label }}</AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'

withDefaults(defineProps<{
  image?: string
  label?: string
  alt?: string
  size?: 'small' | 'normal' | 'large' | 'xlarge'
  shape?: 'circle' | 'square'
}>(), { image: '', label: '', alt: '', size: 'normal', shape: 'circle' })
defineEmits<{ error: [event: Event] }>()
</script>

<style scoped>
.sg-avatar { display: inline-flex; width: var(--sg-avatar-size); height: var(--sg-avatar-size); overflow: hidden; border-radius: var(--sg-radius-pill); background: var(--sg-color-surface-muted); vertical-align: middle; }
.sg-avatar--small { width: var(--sg-avatar-size-sm); height: var(--sg-avatar-size-sm); }
.sg-avatar--normal { width: var(--sg-avatar-size-md); height: var(--sg-avatar-size-md); }
.sg-avatar--large { width: var(--sg-avatar-size-lg); height: var(--sg-avatar-size-lg); }
.sg-avatar--xlarge { width: var(--sg-avatar-size-xl); height: var(--sg-avatar-size-xl); }
.sg-avatar--circle { border-radius: var(--sg-radius-pill); }
.sg-avatar__image { width: var(--sg-sidebar-fill-size); height: var(--sg-sidebar-fill-size); object-fit: cover; }
.sg-avatar__fallback { display: grid; width: var(--sg-sidebar-fill-size); height: var(--sg-sidebar-fill-size); place-items: center; font-size: var(--sg-avatar-fallback-size); }
</style>
