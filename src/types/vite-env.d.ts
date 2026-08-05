/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

// Put your variables here:

declare const __VERSION__: string
declare const __NAME__: string
declare const __DISPLAY_NAME__: string
declare const __CHANGELOG__: string
declare const __GIT_COMMIT__: string
declare const __BUILD_ID__: string
declare const __BUILD_AT_PARIS__: string
declare const __BUILD_AT_UTC__: string
declare const __GITHUB_URL__: string

interface Window {
  __communityglowsAutoThemeTimeout: number | null
  __communityglowsAutoThemeMedia: MediaQueryList | null
  __communityglowsAutoThemeMediaListener: ((event: MediaQueryListEvent) => void) | null
  __communityglowsAutoThemeVisibilityListener: (() => void) | null
}
