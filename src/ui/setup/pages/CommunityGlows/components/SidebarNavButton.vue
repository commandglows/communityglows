<template>
  <div
    :class="[
      'sidebar-nav-button',
      { 'sidebar-nav-button--compact': compact, 'sidebar-nav-button--active': active },
    ]"
  >
    <SgButton
      :icon="icon"
      :label="label"
      :badge="badge"
      :tooltip="tooltip"
      :aria-label="label"
      :aria-pressed="ariaPressed"
      text
      @click="emit('click')"
    >
      <template
        v-if="$slots.icon"
        #icon
      >
        <slot name="icon" />
      </template>
    </SgButton>
  </div>
</template>

<script setup lang="ts">
import SgButton from './ui/SgButton.vue'

withDefaults(defineProps<{
  label: string
  icon?: string
  badge?: string
  tooltip?: string
  compact?: boolean
  active?: boolean
  ariaPressed?: boolean
}>(), {
  icon: undefined,
  badge: undefined,
  tooltip: undefined,
  compact: false,
  active: false,
  ariaPressed: undefined,
})

const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.sidebar-nav-button {
  width: var(--sg-sidebar-fill-size);
}

.sidebar-nav-button :deep(.sg-button) {
  width: var(--sg-sidebar-fill-size);
  min-height: max(
    var(--sg-sidebar-network-row-height),
    calc(var(--sg-sidebar-effective-icon-size) + 1rem)
  );
  justify-content: flex-start;
  padding-inline: var(--sg-sidebar-network-row-padding-inline);
  overflow: hidden;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.sidebar-nav-button :deep(.sg-button)::before {
  content: '';
  position: absolute;
  inset-block: 20%;
  inset-inline-start: 0;
  width: var(--sg-sidebar-active-indicator-width);
  border-radius: 0 var(--sg-radius-pill) var(--sg-radius-pill) 0;
  background: var(--sg-color-action);
  opacity: 0;
  transform: scaleY(0.5);
  transition: var(--sg-motion-opacity-180ms-ease), var(--sg-motion-transform-180ms-ease);
}

.sidebar-nav-button--active :deep(.sg-button) {
  background: var(--sg-color-surface-hover);
}

.sidebar-nav-button--active :deep(.sg-button)::before {
  opacity: 1;
  transform: scaleY(1);
}

.sidebar-nav-button--compact :deep(.sg-button) {
  justify-content: center;
  padding-inline: 0;
}

.sidebar-nav-button :deep(.sg-button__content) {
  width: var(--sg-sidebar-fill-size);
  min-width: 0;
  justify-content: inherit;
}

.sidebar-nav-button--compact :deep(.sg-button__content) {
  gap: 0;
}

.sidebar-nav-button :deep(.sg-icon),
.sidebar-nav-button :deep(.network-brand-icon) {
  flex: 0 0 auto;
  width: var(--sg-sidebar-effective-icon-size);
  height: var(--sg-sidebar-effective-icon-size);
  transition: var(--sg-sidebar-icon-size-transition);
}

.sidebar-nav-button :deep(.sg-button__label) {
  max-width: var(--sg-size-20rem);
  overflow: hidden;
  opacity: 1;
  transform: translateX(0);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: var(--sg-sidebar-label-transition);
}

.sidebar-nav-button--compact :deep(.sg-button__label) {
  max-width: 0;
  opacity: 0;
  transform: translateX(-0.35rem);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-nav-button,
  .sidebar-nav-button :deep(.sg-button),
  .sidebar-nav-button :deep(.sg-button)::before,
  .sidebar-nav-button :deep(.sg-icon),
  .sidebar-nav-button :deep(.network-brand-icon) {
    transition: none;
  }

  .sidebar-nav-button :deep(.sg-button__label) {
    transition: none;
  }
}
</style>
