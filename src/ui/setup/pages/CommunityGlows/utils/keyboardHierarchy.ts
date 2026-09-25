const nodeSelector = '[data-keyboard-node]'
const controls = 'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'
const remembered = new WeakMap<HTMLElement, HTMLElement>()

/** Navigate structural levels without taking over text editing or native controls. */
export function navigateHierarchy(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
  const root = event.currentTarget as HTMLElement
  const target = event.target as HTMLElement
  if (!root.contains(target) || target.closest('[role="menu"], [role="dialog"], [role="listbox"]')) return
  const nodes = [root, ...root.querySelectorAll<HTMLElement>(nodeSelector)]
    .filter(el => el.getClientRects().length && !el.closest('[inert]'))
  const parent = (el: HTMLElement): HTMLElement | undefined => {
    if (el === root) return undefined
    const id = el.dataset.keyboardParent
    if (id) return nodes.find(n => n.dataset.keyboardNode === id) ?? root
    return el.parentElement?.closest<HTMLElement>(nodeSelector) ?? root
  }
  const current = target.closest<HTMLElement>(nodeSelector) ?? root
  const focus = (el: HTMLElement) => {
    if (parent(current) === el || (current === el && target !== current)) remembered.set(el, target)
    if (!el.matches(controls)) el.tabIndex = -1
    el.focus()
    event.preventDefault()
    event.stopPropagation()
  }
  if (event.key === 'Escape') {
    const destination = target === current ? parent(current) : current
    if (destination) focus(destination)
    return
  }
  // Arrow keys and Enter retain their native meaning within editable/action controls.
  if (target !== current) return
  const children = nodes.filter(n => n !== current && parent(n) === current)
  if (event.key === 'Enter') {
    const last = remembered.get(current)
    const child = last && nodes.includes(last) && parent(last) === current ? last : children[0]
    const control = [...current.querySelectorAll<HTMLElement>(controls)]
      .find(el => el.getClientRects().length && el.closest(nodeSelector) === current)
    const destination = child ?? control
    if (destination) focus(destination)
  } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    const siblings = nodes.filter(n => parent(n) === parent(current))
    const index = siblings.indexOf(current)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? siblings.length - 1
      : index + (['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1)
    const destination = siblings[Math.max(0, Math.min(next, siblings.length - 1))]
    if (destination) focus(destination)
  }
}
