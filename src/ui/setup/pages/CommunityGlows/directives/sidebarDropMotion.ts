import { nextTick } from 'vue'

const selector = '[data-sidebar-network], [data-sidebar-group], [data-sidebar-motion-key]'
const identity = (row: HTMLElement) => row.dataset.sidebarMotionKey
  ?? (row.dataset.sidebarNetwork ? `network:${row.dataset.sidebarNetwork}` : `group:${row.dataset.sidebarGroup}`)

/** Measure across Vue's update: rows can be remounted when their parent changes. */
export function createSidebarDropMotion(root: HTMLElement) {
  const animations = new Set<Animation>()
  let generation = 0
  let arrival: HTMLElement | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  function clear() {
    generation++
    for (const animation of animations) animation.cancel()
    animations.clear()
    arrival?.removeAttribute('data-sidebar-arrived')
    arrival = null
    clearTimeout(timer)
  }
  function rows() {
    return [...root.querySelectorAll<HTMLElement>(selector)]
      .filter(row => row.getClientRects().length && row.getBoundingClientRect().height > 0)
  }
  function prepare(source: HTMLElement, ghost: HTMLElement | null) {
    clear()
    const ticket = generation
    const sourceId = identity(source)
    const before = new Map(rows().map(row => [identity(row), row.getBoundingClientRect()]))
    const released = ghost?.getBoundingClientRect()
    return async () => {
      await nextTick()
      if (ticket !== generation || !root.isConnected) return
      // Batch all geometry reads before applying transforms.
      const after = rows().map(row => {
        const rect = row.getBoundingClientRect()
        return { row, rect, zoom: rect.width / row.offsetWidth || 1 }
      })
      const destination = after.find(({ row }) => identity(row) === sourceId)
      const original = before.get(sourceId)
      const changed = after.some(({ row, rect }) => {
        const old = before.get(identity(row))
        return old && (old.x !== rect.x || old.y !== rect.y)
      })
      if (!destination || !original || !changed) return
      const style = getComputedStyle(root)
      const duration = Number.parseFloat(style.getPropertyValue('--sg-sidebar-drop-duration'))
      const hold = Number.parseFloat(style.getPropertyValue('--sg-sidebar-arrival-duration'))
      const easing = style.getPropertyValue('--sg-sidebar-drop-easing').trim()
      arrival = destination.row
      arrival.dataset.sidebarArrived = ''
      timer = setTimeout(() => { arrival?.removeAttribute('data-sidebar-arrived'); arrival = null }, hold)
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Number.isFinite(duration) || !easing) return
      for (const { row, rect, zoom } of after) {
        const old = identity(row) === sourceId ? released ?? original : before.get(identity(row))
        if (!old || typeof row.animate !== 'function') continue
        // Rects include CSS zoom; transform distances are in the row's local pixels.
        const dx = (old.x - rect.x) / zoom
        const dy = (old.y - rect.y) / zoom
        if (!dx && !dy) continue
        try {
          const animation = row.animate([
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ], { duration, easing })
          animations.add(animation)
          animation.onfinish = () => animations.delete(animation)
        } catch {
          // Animation is an enhancement: final order and arrival remain available.
        }
      }
    }
  }
  return { prepare, clear }
}
