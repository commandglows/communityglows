<template>
  <div
    class="network-two-column-layout"
    :class="{
      'network-two-column-layout--left': sidebarPosition === 'left',
      'network-two-column-layout--single-column': singleColumn,
    }"
    :style="{
      '--network-sidebar-width': sidebarWidth,
      '--network-sidebar-gap': gap,
    }"
  >
    <section class="network-two-column-layout__main">
      <slot name="main" />
    </section>

    <aside class="network-two-column-layout__sidebar">
      <slot name="sidebar" />
    </aside>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    sidebarWidth?: string
    sidebarPosition?: "left" | "right"
    gap?: string
    singleColumn?: boolean
  }>(),
  {
    sidebarWidth: "var(--sg-size-300px)",
    sidebarPosition: "right",
    gap: "var(--sg-space-1rem)",
    singleColumn: false,
  },
)
</script>

<style scoped>
.network-two-column-layout {
  --network-sidebar-width: var(--sg-size-300px);
  --network-sidebar-gap: var(--sg-space-1rem);
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--network-sidebar-width);
  gap: var(--network-sidebar-gap);
}

.network-two-column-layout--left {
  grid-template-columns: var(--network-sidebar-width) minmax(0, 1fr);
}

.network-two-column-layout--single-column {
  grid-template-columns: 1fr;
}

.network-two-column-layout__main,
.network-two-column-layout__sidebar {
  min-width: 0;
}
</style>
