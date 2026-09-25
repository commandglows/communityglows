import { describe, expect, it } from 'vitest'
import { componentClasses, forwardedComponentAttrs } from './componentAttrs'

describe('component attribute forwarding', () => {
  it('keeps consumer classes in the component class contract', () => {
    const attrs = { class: 'desktop-workspace__layout-select', id: 'scene' }

    expect(componentClasses('sg-select__trigger', attrs)).toEqual([
      'sg-select__trigger',
      'desktop-workspace__layout-select',
    ])
  })

  it('does not duplicate class or style through v-bind', () => {
    expect(
      forwardedComponentAttrs({
        class: 'consumer',
        style: 'display: block',
        id: 'scene',
        'aria-label': 'Charger une scène',
      }),
    ).toEqual({
      id: 'scene',
      'aria-label': 'Charger une scène',
    })
  })
})
