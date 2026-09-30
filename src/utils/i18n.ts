import fr from '@/locales/fr.json'
import en from '@/locales/en.json'
import { createI18n } from 'vue-i18n'
import { watch } from 'vue'
import { syncSettingsPatch } from '@/lib/cloudSettings'

const savedLocale = localStorage.getItem('user-locale') ?? 'fr'

export const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { fr, en },
})

if (import.meta.hot) {
  import.meta.hot.accept(['../locales/fr.json', '../locales/en.json'], ([updatedFr, updatedEn]) => {
    if (updatedFr) i18n.global.setLocaleMessage('fr', updatedFr.default)
    if (updatedEn) i18n.global.setLocaleMessage('en', updatedEn.default)
  })
}

watch(i18n.global.locale, (locale) => { document.documentElement.lang = locale }, { immediate: true })

export function setLocale(locale: string, sync = true) {
  if (locale !== 'fr' && locale !== 'en') return
  localStorage.setItem('user-locale', locale)
  i18n.global.locale.value = locale
  if (sync) {
    syncSettingsPatch({ language: locale })
  }
}

window.addEventListener('storage', (event) => {
  if (event.key === 'user-locale' && (event.newValue === 'fr' || event.newValue === 'en')) i18n.global.locale.value = event.newValue
})
