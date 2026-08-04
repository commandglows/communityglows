import { onBeforeUnmount, onMounted, ref, Ref } from 'vue'

export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const matches = ref(false)

  if (typeof window === 'undefined') {
    return matches
  }

  let mediaQuery: MediaQueryList | null = null
  let unsubscribe = () => {}

  const applyMatch = () => {
    if (!mediaQuery) return
    matches.value = mediaQuery.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(query)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', applyMatch)
      unsubscribe = () => mediaQuery?.removeEventListener('change', applyMatch)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(applyMatch)
      unsubscribe = () => mediaQuery?.removeListener?.(applyMatch)
    }

    applyMatch()
  })

  onBeforeUnmount(() => {
    unsubscribe()
  })

  return matches
}
