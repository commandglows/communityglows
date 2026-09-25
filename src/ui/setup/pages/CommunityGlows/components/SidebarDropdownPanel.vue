<template>
  <div class="sidebar-dropdown-panel"><slot /></div>
</template>

<style scoped>
.sidebar-dropdown-panel {
  position: absolute;
  top: var(--sg-position-calc-100pct-4px);
  left: var(--sg-position-0d5rem);
  right: var(--sg-position-0d5rem);
  background: var(--sg-color-surface-raised);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-10px);
  box-shadow: var(--sg-shadow-modal);
  z-index: var(--sg-layer-modal);
  overflow: auto;
  max-height: var(--sg-sidebar-dropdown-max-height);
}
</style>
