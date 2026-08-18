import { computed, nextTick, onMounted, onUnmounted, ref, type Ref } from 'vue'
import {
  readIconScaleLevel,
  resolveSidebarPresentation,
} from '../utils/iconScale'

export function useSidebarSizing(sidebarElement: Ref<HTMLElement | null>) {
  const width = ref(0)
  const requestedIconSize = ref(readIconScaleLevel())
  let observer: ResizeObserver | null = null

  const presentation = computed(() => (
    resolveSidebarPresentation(requestedIconSize.value, width.value)
  ))
  const compact = computed(() => presentation.value.compact)
  const style = computed(() => ({
    '--sg-sidebar-effective-icon-size': `${presentation.value.iconSize}px`,
  }))

  const measure = () => {
    width.value = sidebarElement.value?.getBoundingClientRect().width ?? 0
  }
  const onIconScaleChanged = (event: Event) => {
    const level = Number((event as CustomEvent<{ level?: number }>).detail?.level)
    if (Number.isFinite(level)) requestedIconSize.value = level
  }

  onMounted(async () => {
    await nextTick()
    measure()
    observer = new ResizeObserver(measure)
    if (sidebarElement.value) observer.observe(sidebarElement.value)
    window.addEventListener('communityglows-icon-scale-changed', onIconScaleChanged)
  })

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('communityglows-icon-scale-changed', onIconScaleChanged)
  })

  return { compact, style, width }
}
