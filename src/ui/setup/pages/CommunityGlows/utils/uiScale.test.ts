import { describe, expect, it, vi } from 'vitest'
import {
  UI_SCALE_DEFAULT,
  createUiScaleWheelHandler,
  normalizeUiScaleLevel,
} from './uiScale'

describe('UI scale normalization', () => {
  it('keeps the app scale within its independent range', () => {
    expect(normalizeUiScaleLevel(Number.NaN)).toBe(UI_SCALE_DEFAULT)
    expect(normalizeUiScaleLevel(70)).toBe(75)
    expect(normalizeUiScaleLevel(112)).toBe(110)
    expect(normalizeUiScaleLevel(153)).toBe(150)
  })
})

describe('Ctrl + wheel app zoom', () => {
  function wheel(overrides: Partial<WheelEvent> = {}) {
    return { ctrlKey: true, deltaY: -120, timeStamp: 100, preventDefault: vi.fn(), ...overrides } as unknown as WheelEvent
  }

  it('zooms in and out while suppressing the browser default', () => {
    let level = 100
    const handler = createUiScaleWheelHandler(() => level, next => { level = next })
    const up = wheel()
    handler(up)
    expect(level).toBe(105)
    expect(up.preventDefault).toHaveBeenCalledOnce()
    handler(wheel({ deltaY: 120, timeStamp: 200 }))
    expect(level).toBe(100)
  })

  it('preserves normal scrolling and other modifier combinations', () => {
    const update = vi.fn()
    const handler = createUiScaleWheelHandler(() => 100, update)
    for (const overrides of [{ ctrlKey: false }, { altKey: true }, { shiftKey: true }, { metaKey: true }, { deltaY: 0 }, { defaultPrevented: true }]) {
      const event = wheel(overrides)
      handler(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    }
    expect(update).not.toHaveBeenCalled()
  })

  it('clamps both bounds without issuing redundant updates or native zoom', () => {
    const update = vi.fn()
    for (const [level, deltaY] of [[75, 120], [150, -120]]) {
      const event = wheel({ deltaY })
      createUiScaleWheelHandler(() => level, update)(event)
      expect(event.preventDefault).toHaveBeenCalledOnce()
    }
    expect(update).not.toHaveBeenCalled()
  })

  it('limits trackpad bursts and accepts a subsequent gesture', () => {
    const update = vi.fn()
    const handler = createUiScaleWheelHandler(() => 100, update)
    handler(wheel({ timeStamp: 0 }))
    const burst = wheel({ timeStamp: 10 })
    handler(burst)
    expect(burst.preventDefault).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledTimes(1)
    handler(wheel({ timeStamp: 80 }))
    expect(update).toHaveBeenCalledTimes(2)
  })
})
