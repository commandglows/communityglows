import { i18n } from '@/utils/i18n'

function activeLocale() {
  return i18n.global.locale.value.toLowerCase().startsWith('fr') ? 'fr-FR' : 'en-US'
}

function relative(value: number, singularFr: string, pluralFr: string, singularEn: string) {
  if (activeLocale() === 'fr-FR') {
    return `Il y a ${value} ${value > 1 ? pluralFr : singularFr}`
  }
  return `${value} ${singularEn}${value > 1 ? 's' : ''} ago`
}

export function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return activeLocale() === 'fr-FR' ? 'À l’instant' : 'Just now'
  }

  if (minutes < 60) {
    return relative(minutes, 'min', 'min', 'min')
  }

  if (hours < 24) {
    return relative(hours, 'h', 'h', 'h')
  }

  if (days < 7) {
    return relative(days, 'jour', 'jours', 'day')
  }

  return new Intl.DateTimeFormat(activeLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
