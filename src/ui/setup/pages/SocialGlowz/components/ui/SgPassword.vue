<template>
  <span class="sg-password">
    <input
      v-bind="$attrs"
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      class="sg-password__input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <button
      v-if="toggleMask"
      type="button"
      class="sg-password__toggle"
      :disabled="disabled"
      :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <i
        :class="visible ? 'pi pi-eye-slash' : 'pi pi-eye'"
        aria-hidden="true"
      />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ modelValue?: string; toggleMask?: boolean }>(), {
  modelValue: '',
  toggleMask: false,
})
defineEmits<{ 'update:modelValue': [value: string] }>()
const attrs = useAttrs()
const visible = ref(false)
const disabled = computed(() => attrs.disabled === '' || attrs.disabled === true || attrs.disabled === 'disabled')
</script>

<style scoped>
.sg-password { position: relative; display: inline-flex; width: var(--sg-size-full); }
.sg-password__input { width: var(--sg-size-full); min-height: var(--sg-field-min-height); padding: var(--sg-field-padding); padding-inline-end: var(--sg-password-toggle-space); border: 1px solid var(--sg-color-border); border-radius: var(--sg-radius-sm); background: var(--sg-color-surface-raised); color: var(--sg-color-text); font: inherit; }
.sg-password__input:focus-visible, .sg-password__toggle:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sg-password__input:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
.sg-password__toggle { position: absolute; inset-block: 0; inset-inline-end: 0; width: var(--sg-password-toggle-space); border: 0; background: transparent; color: var(--sg-color-text-muted); cursor: pointer; }
.sg-password__toggle:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }
</style>
