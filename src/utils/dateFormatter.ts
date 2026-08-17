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

export function formatDate(date: string | number | Date): string {
  const dateObj = new Date(date)
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days === 0) {
    if (hours === 0) {
      if (minutes === 0) {
        return activeLocale() === 'fr-FR' ? 'À l’instant' : 'Just now'
      }
      return relative(minutes, 'minute', 'minutes', 'minute')
    }
    return relative(hours, 'heure', 'heures', 'hour')
  }

  if (days === 1) {
    return activeLocale() === 'fr-FR' ? 'Hier' : 'Yesterday'
  }

  if (days < 7) {
    return relative(days, 'jour', 'jours', 'day')
  }

  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString(activeLocale(), {
      day: 'numeric',
      month: 'long',
    })
  }

  return dateObj.toLocaleDateString(activeLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
