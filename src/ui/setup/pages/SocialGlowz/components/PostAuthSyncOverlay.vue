<template>
  <Teleport to="body">
    <Transition name="sync-overlay">
      <div
        v-if="feedback.visible"
        class="sync-overlay"
        :class="{ 'is-mobile': isPostAuthSyncNarrow }"
        role="alertdialog"
        aria-modal="true"
        aria-live="polite"
      >
        <div
          class="sync-card"
          :class="`is-${feedback.mode}`"
        >
          <div class="sync-icon-wrap">
            <SgIcon
              class="sync-icon"
              :icon="iconClass"
            />
          </div>

          <p class="sync-kicker">{{ t(`auth_sync.${feedback.mode}_kicker`) }}</p>
          <h2 class="sync-title">{{ t(titleKey) }}</h2>
          <p class="sync-copy">{{ t(messageKey) }}</p>

          <div class="sync-steps">
            <div
              v-for="step in steps"
              :key="step.key"
              class="sync-step"
              :class="`is-${step.status}`"
            >
              <SgIcon
                class="sync-step-icon"
                :icon="step.icon"
              />
              <span>{{ t(step.labelKey) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaQuery } from '@/composables/useMediaQuery'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import {
  postAuthSyncFeedback as feedback,
  type PostAuthSyncStage,
} from "@/lib/postAuthSyncFeedback";

const { t } = useI18n();
const blockingOrder: Array<Exclude<PostAuthSyncStage, "idle" | "ready">> = [
  "waitingServer",
  "dataReceived",
  "dataApplied",
  "restarting",
];

const currentBlockingIndex = computed(() => {
  if (feedback.stage === "ready") return blockingOrder.length - 1;
  return blockingOrder.indexOf(
    feedback.stage as Exclude<PostAuthSyncStage, "idle" | "ready">,
  );
});

const titleKey = computed(() => {
  if (feedback.stage === "ready") return "auth_sync.ready_title";
  return `auth_sync.titles.${feedback.stage}`;
});

const messageKey = computed(() => {
  if (feedback.stage === "ready") return "auth_sync.ready_message";
  return `auth_sync.messages.${feedback.stage}`;
});

const iconClass = computed(() => {
  if (feedback.stage === "ready") return "pi-check-circle";
  if (feedback.stage === "restarting") return "pi-spin pi-refresh";
  return "pi-spin pi-spinner";
});

const steps = computed(() =>
  blockingOrder.map((key, index) => {
    let status: "done" | "current" | "upcoming" = "upcoming";
    if (feedback.stage === "ready" || index < currentBlockingIndex.value) {
      status = "done";
    } else if (index === currentBlockingIndex.value) {
      status = "current";
    }

    const icon =
      status === "done"
        ? "pi-check-circle"
        : status === "current"
          ? "pi-spin pi-spinner"
          : "pi-circle";

    return {
      key,
      labelKey: `auth_sync.steps.${key}`,
      status,
      icon,
    };
  }),
);

const isPostAuthSyncNarrow = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.postAuthSyncCompact}px)`);
</script>

<style scoped>
.sync-overlay {
  --sync-overlay-top-gap: var(--sg-space-1d25rem);
  --sync-overlay-bottom-gap: var(--sg-space-1d25rem);
  --sync-backdrop-tint: var(--sg-color-blue-alpha-20);
  --sync-backdrop-base: var(--sg-color-overlay);
  --sync-card-bg-start: var(--sg-color-translucent-surface);
  --sync-card-bg-end: var(--sg-color-surface-raised);
  --sync-card-border: var(--sg-color-border);
  --sync-card-shadow: var(--sg-shadow-modal);
  --sync-card-glow: var(--sg-color-blue-alpha-20);
  --sync-icon-bg: color-mix(in srgb, var(--sg-color-action) 14%, var(--sg-color-surface-raised) 86%);
  --sync-step-bg: color-mix(in srgb, var(--sg-color-surface-raised) 88%, var(--sg-color-surface-muted) 12%);
  --sync-step-done-bg: color-mix(in srgb, var(--sg-color-action) 6%, var(--sg-color-surface-raised) 94%);
  --sync-step-current-bg: color-mix(in srgb, var(--sg-color-action) 10%, var(--sg-color-surface-raised) 90%);
  --sync-step-border: var(--sg-color-border);
  --sync-step-current-border: color-mix(in srgb, var(--sg-color-action) 30%, var(--sg-color-border) 70%);
  --sync-step-done-border: color-mix(in srgb, var(--sg-color-action) 20%, var(--sg-color-border) 80%);
  position: fixed;
  inset: 0;
  z-index: var(--sg-layer-10050);
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    var(--sync-overlay-top-gap)
    var(--sg-space-1d25rem)
    var(--sync-overlay-bottom-gap);
  background:
    radial-gradient(circle at top, var(--sync-backdrop-tint), transparent 42%),
    var(--sync-backdrop-base);
  backdrop-filter: blur(var(--sg-size-10px));
}

.sync-card {
  position: relative;
  width: var(--sg-size-min-100pct-26rem);
  max-height: min(var(--sg-size-34rem), calc(var(--sg-size-100dvh) - var(--sg-size-2d5rem)));
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--sg-space-1d35rem) var(--sg-space-1d2rem) var(--sg-space-1d15rem);
  border-radius: var(--sg-radius-24px);
  border: var(--sg-border-1px) solid var(--sync-card-border);
  background:
    radial-gradient(circle at top right, var(--sync-card-glow), transparent 42%),
    linear-gradient(180deg, var(--sync-card-bg-start), var(--sync-card-bg-end));
  box-shadow: var(--sync-card-shadow);
  color: var(--sg-color-text);
}

.sync-card.is-success {
  border-color: color-mix(in srgb, var(--sg-color-action) 24%, var(--sg-color-border) 76%);
}

.sync-icon-wrap {
  width: var(--sg-size-3rem);
  height: var(--sg-size-3rem);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sg-radius-999px);
  margin-bottom: var(--sg-space-0d9rem);
  background: var(--sync-icon-bg);
  color: var(--sg-color-action);
}

.sync-icon {
  font-size: var(--sg-font-size-1d3rem);
}

.sync-kicker {
  margin: 0 0 var(--sg-space-0d35rem);
  color: var(--sg-color-action);
  font-size: var(--sg-font-size-0d74rem);
  font-weight: 800;
  letter-spacing: var(--sg-letter-spacing-0d08em);
  text-transform: uppercase;
}

.sync-title {
  margin: 0;
  color: var(--sg-color-text);
  font-size: var(--sg-font-size-1d35rem);
  line-height: var(--sg-line-height-1d15);
}

.sync-copy {
  margin: var(--sg-space-0d55rem) 0 var(--sg-space-1rem);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d92rem);
  line-height: var(--sg-line-height-1d5);
}

.sync-steps {
  display: grid;
  gap: var(--sg-space-0d55rem);
}

.sync-step {
  display: flex;
  align-items: center;
  gap: var(--sg-space-0d65rem);
  padding: var(--sg-space-0d72rem) var(--sg-space-0d8rem);
  border-radius: var(--sg-radius-14px);
  border: var(--sg-border-1px) solid var(--sync-step-border);
  background: var(--sync-step-bg);
  color: var(--sg-color-text-muted);
  font-size: var(--sg-font-size-0d9rem);
  font-weight: 600;
  box-shadow: var(--sg-shadow-inset-0-1px-0-rgba-255-255-255-0d04);
}

.sync-step.is-current {
  border-color: var(--sync-step-current-border);
  background: var(--sync-step-current-bg);
  color: var(--sg-color-text);
}

.sync-step.is-done {
  border-color: var(--sync-step-done-border);
  background: var(--sync-step-done-bg);
  color: var(--sg-color-text);
}

.sync-step-icon {
  font-size: var(--sg-font-size-1rem);
  color: var(--sg-color-action);
}

.sync-overlay-enter-active,
.sync-overlay-leave-active {
  transition: var(--sg-motion-opacity-180ms-ease), var(--sg-motion-transform-180ms-ease);
}

.sync-overlay-enter-from,
.sync-overlay-leave-to {
  opacity: 0;
}

.sync-overlay-enter-from .sync-card,
.sync-overlay-leave-to .sync-card {
  transform: translateY(var(--sg-size-10px)) var(--sg-transform-scale-0d98);
}

.sync-overlay.is-mobile {
  --sync-overlay-top-gap: max(var(--sg-space-1rem), env(safe-area-inset-top));
  --sync-overlay-bottom-gap: max(var(--sg-size-4d75rem), calc(env(safe-area-inset-bottom) + var(--sg-space-1rem)));
  align-items: center;
  padding-inline: var(--sg-space-0d9rem);
}

.sync-overlay.is-mobile .sync-card {
  width: var(--sg-size-100pct);
  max-height: calc(
    var(--sg-size-100dvh)
    - var(--sync-overlay-top-gap)
    - var(--sync-overlay-bottom-gap)
    - var(--sg-size-1d5rem)
  );
  border-radius: var(--sg-radius-24px);
  padding: var(--sg-space-1d15rem) var(--sg-space-1rem) var(--sg-space-1rem);
}

.sync-overlay.is-mobile .sync-title {
  font-size: var(--sg-font-size-1d2rem);
}
</style>
