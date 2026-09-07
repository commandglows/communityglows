<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
const props = withDefaults(defineProps<{ hasPendingInput?: boolean }>(), { hasPendingInput: false })
const blocked = ref(false)
watch(() => props.hasPendingInput, value => { if (!value) blocked.value = false })
function beforeLeave(event: MouseEvent) {
 if (!props.hasPendingInput) return
 event.preventDefault()
 blocked.value = true
}
const { locale } = useI18n()
const downloadUrl = computed(() =>
  locale.value === "fr"
    ? "https://communityglows.com/fr/download"
    : "https://communityglows.com/download",
)
const features = ["workspace", "sessions", "backup"] as const
</script>

<template>
  <section class="ext-native-guide">
    <h2 class="ext-parity-section-title">
      {{ $t("extension.native_guide.title") }}
    </h2>
    <p>{{ $t("extension.native_guide.intro") }}</p>
    <details>
      <summary>{{ $t("extension.native_guide.details") }}</summary>
      <dl>
        <template
          v-for="feature in features"
          :key="feature"
        >
          <dt>{{ $t("extension.native_guide." + feature + "_title") }}</dt>
          <dd>{{ $t("extension.native_guide." + feature) }}</dd>
        </template>
      </dl>
    </details>
    <p>{{ $t("extension.native_guide.data_notice") }}</p>
    <a
      class="ext-btn ext-btn--outline"
      :href="downloadUrl"
      target="_blank"
      rel="noopener noreferrer"
      @click="beforeLeave"
    >
      {{ $t("extension.native_guide.action") }}
      <span class="ext-native-guide-target">
        {{ $t("extension.native_guide.new_tab") }}
      </span>
    </a>
    <p
      v-if="blocked"
      role="alert"
    >
      {{ $t("extension.native_guide.pending_input") }}
    </p>
    <p class="ext-native-guide-note">
      {{ $t("extension.native_guide.optional") }}
    </p>
  </section>
</template>

<style scoped>
.ext-native-guide {
  display: grid;
  gap: var(--sg-space-0d75rem);
  padding: var(--sg-space-1rem);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  min-width: 0;
  overflow-wrap: anywhere;
}
.ext-native-guide p {
  margin: 0;
}
.ext-native-guide summary {
  cursor: pointer;
  font-weight: 600;
}
.ext-native-guide summary:focus-visible {
  outline: 2px solid var(--sg-color-action);
  outline-offset: 2px;
}
.ext-native-guide dt {
  margin-top: var(--sg-space-0d75rem);
  font-weight: 600;
}
.ext-native-guide dd {
  margin: 0;
}
.ext-native-guide a {
  flex-wrap: wrap;
  text-align: center;
}
.ext-native-guide-target,
.ext-native-guide-note {
  font-size: var(--sg-crm-secondary-copy-size);
  color: var(--sg-color-text-muted);
}
</style>
