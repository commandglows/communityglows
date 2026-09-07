import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'
import { watch } from 'vue'
import { syncSettingsPatch } from '@/lib/cloudSettings'

const savedLocale = localStorage.getItem('user-locale') ?? 'fr'

export const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
})

export function setLocale(locale: string, sync = true) {
  if (locale !== 'fr' && locale !== 'en') return
  localStorage.setItem('user-locale', locale)
  i18n.global.locale.value = locale
  if (sync) {
    syncSettingsPatch({ language: locale })
  }
}

watch(i18n.global.locale, locale => { document.documentElement.lang = locale }, { immediate: true })
window.addEventListener('storage', event => {
  if (event.key === 'user-locale' && (event.newValue === 'fr' || event.newValue === 'en')) i18n.global.locale.value = event.newValue
})
