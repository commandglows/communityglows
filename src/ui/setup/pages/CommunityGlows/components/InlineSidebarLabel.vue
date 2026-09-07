<template>
  <span
    ref="element"
    :contenteditable="editing ? 'plaintext-only' : undefined"
    :role="editing ? 'textbox' : undefined"
    :aria-label="editing ? label : undefined"
    :tabindex="editing ? 0 : undefined"
    :class="{ 'inline-sidebar-label--editing': editing }"
    @click="editing && $event.stopPropagation()"
    @keydown="handleKey"
    @keyup="editing && $event.stopPropagation()"
    @blur="editing && emit('cancel')"
  >{{ label }}</span>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
const props = defineProps<{ label: string; editing: boolean }>()
const emit = defineEmits<{ save: [value: string]; cancel: [] }>()
const element = ref<HTMLElement>()
watch(() => props.editing, async (editing) => {
  await nextTick()
  if (!element.value) return
  element.value.textContent = props.label
  if (!editing) return
  element.value.focus()
  const range = document.createRange()
  range.selectNodeContents(element.value)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
})
function handleKey(event: KeyboardEvent) {
  if (!props.editing) return
  event.stopPropagation()
  if (event.isComposing) return
  if (event.key === 'Enter') {
    event.preventDefault()
    const value = element.value?.textContent?.trim().slice(0, 64)
    window.getSelection()?.removeAllRanges()
    if (value) emit('save', value)
    else emit('cancel')
    element.value?.blur()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    window.getSelection()?.removeAllRanges()
    emit('cancel')
    element.value?.blur()
  }
}
</script>

<style scoped>
.inline-sidebar-label--editing {
  display: inline-block;
  min-width: 1ch;
  max-width: 100%;
  outline: none;
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
  white-space: nowrap;
  overflow: hidden;
  vertical-align: bottom;
}
.inline-sidebar-label--editing::selection {
  background: var(--sg-color-action);
  color: var(--sg-color-text-on-action);
}
</style>
