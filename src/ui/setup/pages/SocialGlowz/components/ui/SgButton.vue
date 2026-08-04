<template>
  <button
    v-bind="$attrs"
    :type="type"
    class="sg-button"
    :class="[
      { 'sg-button--text': text, 'sg-button--outlined': outlined, 'sg-button--rounded': rounded },
      `sg-button--${severity}`,
      `sg-button--${size}`,
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="resolvedAriaLabel"
    :title="tooltip"
  >
    <span
      v-if="loading"
      class="sg-button__spinner"
      aria-hidden="true"
    />
    <span
      class="sg-button__content"
      :class="{ 'sg-button__content--loading': loading }"
    >
      <slot name="icon">
        <SgIcon
          v-if="icon"
          :icon="icon"
        />
      </slot>
      <span
        v-if="label"
        class="sg-button__label"
      >{{ label }}</span>
      <slot />
      <span
        v-if="badge"
        class="sg-button__badge"
      >{{ badge }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import SgIcon from './SgIcon.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  label?: string
  icon?: string
  badge?: string
  tooltip?: string
  text?: boolean
  outlined?: boolean
  rounded?: boolean
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger'
  size?: 'small' | 'medium' | 'large'
}>(), {
  label: '', icon: '', badge: '', tooltip: '', text: false, outlined: false,
  rounded: false, disabled: false, loading: false, type: 'button', severity: 'primary', size: 'medium',
})

const attrs = useAttrs()
const resolvedAriaLabel = computed(() => {
  const suppliedLabel = attrs['aria-label']
  if (typeof suppliedLabel === 'string' && suppliedLabel) return suppliedLabel
  if (props.loading && props.label) return props.label
  return !props.label && props.tooltip ? props.tooltip : undefined
})
</script>

<style scoped>
.sg-button { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: var(--sg-button-gap); min-height: var(--sg-button-min-height); padding: var(--sg-button-padding); border: 1px solid var(--sg-color-action); border-radius: var(--sg-radius-sm); background: var(--sg-color-action); color: var(--sg-color-text-on-action); font: inherit; font-weight: 600; cursor: pointer; transition: var(--sg-motion-colors); }
.sg-button:hover { background: var(--sg-color-action-hover); }
.sg-button--text { border-color: transparent; background: transparent; color: var(--sg-color-text-muted); }
.sg-button--text:hover { background: var(--sg-color-surface-hover); color: var(--sg-color-text); }
.sg-button--outlined { background: transparent; color: var(--sg-color-action); }
.sg-button--rounded { border-radius: var(--sg-radius-pill); }
.sg-button--small { min-height: var(--sg-control-height-sm); padding: var(--sg-control-padding-sm); }
.sg-button--large { min-height: var(--sg-control-height-lg); }
.sg-button--success:not(.sg-button--text, .sg-button--outlined) { border-color: var(--sg-color-success); background: var(--sg-color-success); }
.sg-button--info:not(.sg-button--text, .sg-button--outlined) { border-color: var(--sg-color-info); background: var(--sg-color-info); }
.sg-button--warning:not(.sg-button--text, .sg-button--outlined) { border-color: var(--sg-color-warning); background: var(--sg-color-warning); }
.sg-button--danger:not(.sg-button--text, .sg-button--outlined) { border-color: var(--sg-color-danger); background: var(--sg-color-danger); }
.sg-button--success:is(.sg-button--text, .sg-button--outlined) { color: var(--sg-color-success); }
.sg-button--info:is(.sg-button--text, .sg-button--outlined) { color: var(--sg-color-info); }
.sg-button--warning:is(.sg-button--text, .sg-button--outlined) { color: var(--sg-color-warning); }
.sg-button--help:is(.sg-button--text, .sg-button--outlined) { color: var(--sg-color-action); }
.sg-button--danger:is(.sg-button--text, .sg-button--outlined) { color: var(--sg-color-danger-text); }
.sg-button:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
.sg-button:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-button__content { display: inline-flex; align-items: center; justify-content: center; gap: var(--sg-button-gap); }
.sg-button__content--loading { opacity: 0; }
.sg-button__badge { min-width: var(--sg-button-badge-size); height: var(--sg-button-badge-size); padding: 0 var(--sg-button-badge-padding); border-radius: var(--sg-radius-pill); background: var(--sg-color-danger); color: var(--sg-color-text-on-action); font-size: var(--sg-button-badge-font-size); line-height: var(--sg-button-badge-size); }
.sg-button__spinner { position: absolute; width: var(--sg-button-spinner-size); height: var(--sg-button-spinner-size); border: var(--sg-spinner-border) solid currentColor; border-inline-end-color: transparent; border-radius: var(--sg-radius-pill); animation: sg-button-spin var(--sg-spinner-duration) linear infinite; }
@keyframes sg-button-spin { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .sg-button__spinner { animation: none; } }
</style>
