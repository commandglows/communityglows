import type { Directive, DirectiveBinding } from 'vue'

type TooltipSide = 'left' | 'right' | 'bottom' | 'top'
type TooltipState = {
  cleanup: () => void
  label: string
  side: TooltipSide
  tooltip: HTMLSpanElement
}
type TooltipElement = HTMLElement & { __sgTooltipState?: TooltipState }
let tooltipSequence = 0

function valueOf(binding: DirectiveBinding<unknown>) {
  return typeof binding.value === 'string' ? binding.value.trim() : ''
}

function sideOf(binding: DirectiveBinding<unknown>): TooltipSide {
  return (['left', 'right', 'bottom', 'top'] as const).find(key => binding.modifiers[key]) ?? 'top'
}

function removeDescribedBy(element: TooltipElement, id: string) {
  const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(value => value && value !== id)
  if (ids.length) element.setAttribute('aria-describedby', ids.join(' '))
  else element.removeAttribute('aria-describedby')
}

function mountTooltip(element: TooltipElement, binding: DirectiveBinding<unknown>) {
  const label = valueOf(binding)
  if (!label) return

  const tooltip = document.createElement('span')
  const id = `sg-tooltip-${++tooltipSequence}`
  const side = sideOf(binding)
  tooltip.id = id
  tooltip.className = `sg-tooltip sg-tooltip--${side}`
  tooltip.role = 'tooltip'
  tooltip.textContent = label
  tooltip.hidden = true
  document.body.append(tooltip)
  const describedBy = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  element.setAttribute('aria-describedby', [...new Set([...describedBy, id])].join(' '))

  const position = () => {
    const rect = element.getBoundingClientRect()
    tooltip.style.setProperty('--sg-tooltip-anchor-left', `${rect.left + rect.width / 2}px`)
    tooltip.style.setProperty('--sg-tooltip-anchor-top', `${rect.top + rect.height / 2}px`)
    tooltip.style.setProperty('--sg-tooltip-anchor-width', `${rect.width}px`)
    tooltip.style.setProperty('--sg-tooltip-anchor-height', `${rect.height}px`)
  }
  const show = () => { position(); tooltip.hidden = false }
  const hide = () => { tooltip.hidden = true }
  const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') hide() }
  element.addEventListener('mouseenter', show)
  element.addEventListener('mouseleave', hide)
  element.addEventListener('focusin', show)
  element.addEventListener('focusout', hide)
  element.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
  const cleanup = () => {
    removeDescribedBy(element, id)
    tooltip.remove()
    element.removeEventListener('mouseenter', show)
    element.removeEventListener('mouseleave', hide)
    element.removeEventListener('focusin', show)
    element.removeEventListener('focusout', hide)
    element.removeEventListener('keydown', onKeydown)
    window.removeEventListener('scroll', hide, true)
    window.removeEventListener('resize', hide)
  }
  element.__sgTooltipState = { cleanup, label, side, tooltip }
}

function updateTooltip(element: TooltipElement, binding: DirectiveBinding<unknown>) {
  const label = valueOf(binding)
  const side = sideOf(binding)
  const state = element.__sgTooltipState
  if (!label) {
    state?.cleanup()
    delete element.__sgTooltipState
    return
  }
  if (!state) {
    mountTooltip(element, binding)
    return
  }
  if (state.label === label && state.side === side) return
  state.label = label
  state.tooltip.textContent = label
  if (state.side !== side) {
    state.tooltip.classList.remove(`sg-tooltip--${state.side}`)
    state.tooltip.classList.add(`sg-tooltip--${side}`)
    state.side = side
  }
}

export const sgTooltip: Directive<TooltipElement, string | undefined> = {
  mounted: mountTooltip,
  updated: updateTooltip,
  beforeUnmount(element) {
    element.__sgTooltipState?.cleanup()
    delete element.__sgTooltipState
  },
}
