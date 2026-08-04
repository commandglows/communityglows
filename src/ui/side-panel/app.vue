<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
</script>

<template>
  <div class="ext-root-shell">
    <RouterView />
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style scoped></style>
