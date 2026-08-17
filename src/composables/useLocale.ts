import { computed } from "vue"
import { i18n, setLocale } from "@/utils/i18n"

export type SupportedLocale = "fr" | "en"

function normalizeLocale(locale: string): SupportedLocale {
  return locale.toLowerCase().startsWith("fr") ? "fr" : "en"
}

export function useLocale() {
  return computed<SupportedLocale>({
    get: () => normalizeLocale(i18n.global.locale.value),
    set: (locale) => setLocale(locale),
  })
}
