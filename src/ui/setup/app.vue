<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
</script>

<template>
  <div class="min-h-screen" style="background: var(--sg-color-background); color: var(--sg-color-text)">
    <RouterView />
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style lang="scss"></style>
