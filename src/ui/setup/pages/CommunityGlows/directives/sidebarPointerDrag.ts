import type { ObjectDirective } from 'vue'
import { createSidebarDropMotion } from './sidebarDropMotion'

const cleanups = new WeakMap<HTMLElement, () => void>()

/** Reuse sidebar drop rules without starting an OS drag session or its cursor badges. */
export const vSidebarPointerDrag: ObjectDirective<HTMLElement> = {
  mounted(root) {
    const dropMotion = createSidebarDropMotion(root)
    let source: HTMLElement | null = null
    let target: Element | null = null
    let transfer: DataTransfer | null = null
    let pointerId = -1
    let startX = 0
    let startY = 0
    let x = 0
    let y = 0
    let accepted = false
    let targetOffsetX = 0
    let targetOffsetY = 0
    let frame = 0
    let suppressClick = false
    let previousCursor = ''
    let previousSelection = ''
    let ghost: HTMLElement | null = null
    let grabX = 0
    let grabY = 0
    function moveGhost() {
      if (!ghost) return
      const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1
      ghost.style.left = `${(x - grabX) / zoom}px`
      ghost.style.top = `${(y - grabY) / zoom}px`
    }
    function createGhost(row: HTMLElement) {
      const rect = row.getBoundingClientRect()
      const copy = row.cloneNode(true) as HTMLElement
      const originals = [row, ...row.querySelectorAll('*')]
      const copies = [copy, ...copy.querySelectorAll('*')]
      originals.forEach((original, index) => {
        const clone = copies[index] as HTMLElement | SVGElement
        const style = getComputedStyle(original)
        for (const property of style) clone.style.setProperty(property, style.getPropertyValue(property))
        for (const attribute of [...clone.attributes]) {
          if (attribute.name === 'id' || attribute.name.startsWith('data-sidebar') || attribute.name.startsWith('data-drop')) clone.removeAttribute(attribute.name)
        }
        clone.style.pointerEvents = 'none'
      })
      copy.style.margin = '0'
      copy.style.position = 'relative'
      copy.style.transform = 'none'
      ghost = document.createElement('div')
      ghost.dataset.sidebarDragGhost = ''
      ghost.inert = true
      ghost.setAttribute('aria-hidden', 'true')
      Object.assign(ghost.style, {
        position: 'fixed', pointerEvents: 'none', zIndex: 'var(--sg-layer-10000)',
        opacity: 'var(--sg-opacity-muted)', borderRadius: 'var(--sg-radius-sm)',
        background: 'var(--sg-color-surface-raised)', boxShadow: 'var(--sg-shadow-control)',
      })
      ghost.append(copy)
      document.body.append(ghost)
      grabX = Math.max(0, Math.min(rect.width, startX - rect.left))
      grabY = Math.max(0, Math.min(rect.height, startY - rect.top))
      moveGhost()
    }
    const dispatch = (element: Element, type: string, relatedTarget: EventTarget | null = null, point = { x, y }) => {
      const event = new DragEvent(type, { bubbles: true, cancelable: true, clientX: point.x, clientY: point.y, dataTransfer: transfer, relatedTarget })
      element.dispatchEvent(event)
      return event.defaultPrevented
    }
    function retainedPoint() {
      const rect = target!.getBoundingClientRect()
      return { x: rect.left + targetOffsetX, y: rect.top + targetOffsetY }
    }
    function hover() {
      const next = document.elementFromPoint(x, y)
      if (next && root.contains(next) && dispatch(next, 'dragover')) {
        if (next !== target && target) {
          dispatch(target, 'dragleave', next)
          dispatch(next, 'dragover')
        }
        target = next
        const rect = target.getBoundingClientRect()
        targetOffsetX = x - rect.left
        targetOffsetY = y - rect.top
        accepted = true
      } else {
        // Invalid space keeps the last valid boundary, including its before/after side.
        accepted = !!target?.isConnected && root.contains(target) && dispatch(target, 'dragover', null, retainedPoint())
        if (!accepted) target = null
      }
    }
    function scroll() {
      if (!transfer) return
      let element: HTMLElement | null = target instanceof HTMLElement ? target : root
      while (element && element !== document.body) {
        if (element.scrollHeight > element.clientHeight && /auto|scroll/.test(getComputedStyle(element).overflowY)) {
          const rect = element.getBoundingClientRect()
          const edge = 32
          const speed = x < rect.left || x > rect.right ? 0 : y < rect.top + edge ? -8 : y > rect.bottom - edge ? 8 : 0
          if (speed) { element.scrollTop += speed; hover() }
          break
        }
        element = element.parentElement
      }
      frame = requestAnimationFrame(scroll)
    }
    function finish(drop = false) {
      const active = !!transfer
      if (active) {
        if (drop && accepted && target?.isConnected && source) {
          const settle = dropMotion.prepare(source, ghost)
          dispatch(target, 'drop', null, retainedPoint())
          void settle()
        }
        if (source) dispatch(source, 'dragend')
        document.documentElement.style.cursor = previousCursor
        document.documentElement.style.userSelect = previousSelection
        suppressClick = true
      }
      cancelAnimationFrame(frame)
      ghost?.remove(); ghost = null
      if (root.hasPointerCapture(pointerId)) root.releasePointerCapture(pointerId)
      source = null; target = null; transfer = null; pointerId = -1; accepted = false
    }
    function down(event: PointerEvent) {
      if (event.button !== 0 || !event.isPrimary || event.pointerType === 'touch') return
      suppressClick = false
      const hit = event.target instanceof Element ? event.target : null
      if (hit?.closest('input, textarea, [contenteditable="true"], [role="menu"]')) return
      const row = hit?.closest<HTMLElement>('[data-sidebar-draggable="true"]')
      if (!row || !root.contains(row)) return
      dropMotion.clear()
      source = row; pointerId = event.pointerId
      startX = x = event.clientX; startY = y = event.clientY
    }
    function move(event: PointerEvent) {
      if (!source || event.pointerId !== pointerId) return
      x = event.clientX; y = event.clientY
      if (!transfer) {
        if (Math.hypot(x - startX, y - startY) < 5) return
        transfer = new DataTransfer()
        previousCursor = document.documentElement.style.cursor
        previousSelection = document.documentElement.style.userSelect
        if (dispatch(source, 'dragstart')) { finish(); return }
        createGhost(source)
        root.setPointerCapture(pointerId)
        document.documentElement.style.cursor = 'default'
        document.documentElement.style.userSelect = 'none'
        frame = requestAnimationFrame(scroll)
      }
      event.preventDefault()
      moveGhost()
      hover()
    }
    function up(event: PointerEvent) {
      if (event.pointerId !== pointerId) return
      if (transfer) { x = event.clientX; y = event.clientY; hover(); event.preventDefault() }
      finish(true)
    }
    function cancel() { finish(); dropMotion.clear() }
    function lostCapture() { if (transfer) cancel() }
    function visibility() { if (document.hidden) cancel() }
    function key(event: KeyboardEvent) { if (event.key === 'Escape') cancel() }
    function click(event: MouseEvent) {
      if (!suppressClick) return
      suppressClick = false
      event.preventDefault(); event.stopImmediatePropagation()
    }
    function nativeDrag(event: DragEvent) { if (event.isTrusted) { event.preventDefault(); event.stopImmediatePropagation() } }
    document.addEventListener('pointerdown', down)
    root.addEventListener('lostpointercapture', lostCapture)
    root.addEventListener('dragstart', nativeDrag, true)
    document.addEventListener('pointermove', move, { passive: false })
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', cancel)
    document.addEventListener('keydown', key)
    document.addEventListener('click', click, true)
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', visibility)
    cleanups.set(root, () => {
      finish()
      dropMotion.clear()
      document.removeEventListener('pointerdown', down)
      root.removeEventListener('lostpointercapture', lostCapture)
      root.removeEventListener('dragstart', nativeDrag, true)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', cancel)
      document.removeEventListener('keydown', key)
      document.removeEventListener('click', click, true)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', visibility)
    })
  },
  beforeUnmount(root) { cleanups.get(root)?.(); cleanups.delete(root) },
}
