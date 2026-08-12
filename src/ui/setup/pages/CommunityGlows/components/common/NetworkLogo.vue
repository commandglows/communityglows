<template>
  <img 
    :src="logoUrl" 
    :alt="`Logo ${domain}`"
    :class="['network-logo', size]"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLogoCacheStore } from '@/stores/logoCache'

const props = defineProps<{
  domain: string
  size?: 'small' | 'medium' | 'large'
}>()

const logoUrl = ref('')
const logoStore = useLogoCacheStore()

onMounted(async () => {
  logoUrl.value = await logoStore.getLogoUrl(props.domain)
})

const handleError = () => {
  // En cas d'erreur, on peut utiliser une image par défaut
  logoUrl.value = '/default-logo.png'
}
</script>

<style scoped>
.network-logo {
  object-fit: contain;
  border-radius: var(--sg-radius-8px);
}

.small {
  width: var(--sg-size-1d5rem);
  height: var(--sg-size-1d5rem);
}

.medium {
  width: var(--sg-size-2rem);
  height: var(--sg-size-2rem);
}

.large {
  width: var(--sg-size-3rem);
  height: var(--sg-size-3rem);
}
</style> 
