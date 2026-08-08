import type { Directive } from 'vue'

// Intentionally retained as a no-op so existing templates keep compiling while
// CommunityGlows no longer renders hover or focus tooltips anywhere in the app.
export const sgTooltip: Directive<HTMLElement, string | undefined> = {}
