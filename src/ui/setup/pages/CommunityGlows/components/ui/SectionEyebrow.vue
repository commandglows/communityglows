<template>
  <p class="section-eyebrow">
    <slot />
  </p>
</template>

<style scoped>
.section-eyebrow {
  margin: 0;
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d8rem);
  text-transform: uppercase;
  letter-spacing: var(--sg-letter-spacing-0d08em);
}
</style>
