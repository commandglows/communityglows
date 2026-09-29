<script setup lang="ts">
import SgIcon from './ui/SgIcon.vue'

withDefaults(defineProps<{
  label: string
  icon?: string
  selection: 'all' | 'some' | 'none'
  count: number
  total: number
  selecting?: boolean
  expanded?: boolean
  compact?: boolean
}>(), { icon: 'pi pi-folder', selecting: true, expanded: true, compact: false })
const emit = defineEmits<{ toggle: []; collapse: [] }>()
</script>

<template>
  <div
    class="network-group-header"
    :class="{ 'network-group-header--compact': compact }"
  >
    <button
      type="button"
      class="network-group-header__main"
      :class="{ 'network-group-header__main--selected': selecting && selection === 'all' }"
      :aria-label="selecting ? $t('networkGroups.toggle', { name: label, count, total }) : label"
      :aria-pressed="selecting ? (selection === 'some' ? 'mixed' : selection === 'all') : undefined"
      :aria-expanded="selecting ? undefined : expanded"
      :title="compact ? label : undefined"
      @click="selecting ? emit('toggle') : emit('collapse')"
    >
      <SgIcon :icon="icon" />
      <span
        v-if="!compact"
        class="network-group-header__label"
      ><slot name="label">{{ label }}</slot></span>
      <span
        v-if="!compact"
        class="network-group-header__count"
      >{{ count }}/{{ total }}</span>
      <SgIcon
        v-if="selecting"
        :icon="selection === 'all' ? 'pi pi-eye' : selection === 'some' ? 'pi pi-minus' : 'pi pi-eye-slash'"
      />
      <SgIcon
        v-else
        :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
      />
    </button>
    <button
      v-if="selecting"
      type="button"
      class="network-group-header__fold"
      :aria-label="$t(expanded ? 'networkGroups.collapse' : 'networkGroups.expand', { name: label })"
      :aria-expanded="expanded"
      @click="emit('collapse')"
    >
      <SgIcon :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
    </button>
  </div>
</template>

<style scoped>
.network-group-header { display: flex; align-items: stretch; gap: var(--sg-space-1); margin-block: var(--sg-space-2); }
.network-group-header__main, .network-group-header__fold { display: flex; align-items: center; gap: var(--sg-space-2); border: 0; border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-hover); color: var(--sg-color-text-muted); font: inherit; min-height: var(--sg-button-min-height); padding: var(--sg-button-padding); cursor: pointer; }
.network-group-header__main { flex: 1; min-width: 0; text-align: start; }
.network-group-header__main:hover, .network-group-header__fold:hover { color: var(--sg-color-text); }
.network-group-header__main--selected { color: var(--sg-color-action); }
.network-group-header__label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.network-group-header__count { font-size: var(--sg-font-size-0d75rem); white-space: nowrap; }
.network-group-header__main:focus-visible, .network-group-header__fold:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.network-group-header--compact .network-group-header__main { justify-content: center; padding-inline: 0; flex-wrap: wrap; }
.network-group-header--compact { flex-direction: column; }
.network-group-header--compact .network-group-header__fold { justify-content: center; padding-inline: 0; }
</style>
