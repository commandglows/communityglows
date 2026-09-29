import { ref } from 'vue'
import { describe, expect, it } from 'vitest'

import {
  createFrameCoalescedTask,
  createSerialTaskQueue,
  measureWebviewHost,
  toNativeLogicalBounds,
} from './useNetworkWebview'

const createHost = (width: number, height: number) =>
  ({
    getBoundingClientRect: () => ({
      x: 120,
      y: 64,
      width,
      height,
    }),
  }) as HTMLElement

describe('native WebView coordinates', () => {
  const bounds = { x: 268, y: 40, width: 840, height: 800 }

  it.each([1, 1.25, 1.5, 2])('accounts for 130%% shell zoom at OS scale %s', (dpi) => {
    const actual = toNativeLogicalBounds(bounds, 1.3 * dpi, dpi)
    expect(actual.x).toBeCloseTo(348.4)
    expect(actual.y).toBeCloseTo(52)
    expect(actual.width).toBeCloseTo(1092)
    expect(actual.height).toBeCloseTo(1040)
  })

  it('keeps 100% shell geometry unchanged on a high-DPI monitor', () => {
    expect(toNativeLogicalBounds(bounds, 1.5, 1.5)).toEqual(bounds)
  })

  it('supports zooming the shell out without rounding positions', () => {
    expect(toNativeLogicalBounds(bounds, 0.75, 1)).toEqual({
      x: 201, y: 30, width: 630, height: 600,
    })
  })

  it.each([0, -1, NaN, Infinity])('rejects invalid scale %s', (scale) => {
    expect(() => toNativeLogicalBounds(bounds, scale, 1)).toThrow('coordinate scale')
    expect(() => toNativeLogicalBounds(bounds, 1, scale)).toThrow('coordinate scale')
  })
})

describe('measureWebviewHost', () => {
  it('waits for the host ref to be mounted before reading native bounds', async () => {
    const hostEl = ref<HTMLElement | null>(null)
    const measurement = measureWebviewHost(hostEl)

    hostEl.value = createHost(960, 680)

    const bounds = await measurement

    expect(bounds.x).toBe(120)
    expect(bounds.y).toBe(64)
    expect(bounds.width).toBeGreaterThan(0)
    expect(bounds.height).toBeGreaterThan(0)
  })

  it('rejects zero-size bounds instead of creating an invisible native WebView', async () => {
    const hostEl = ref<HTMLElement | null>(createHost(0, 0))

    await expect(measureWebviewHost(hostEl)).rejects.toThrow(
      'Network WebView host is not visible',
    )
  })
})

describe('createSerialTaskQueue', () => {
  it('keeps rapid native transitions in click order after a failure', async () => {
    const enqueue = createSerialTaskQueue()
    const events: string[] = []

    const first = enqueue(async () => {
      events.push('first:start')
      throw new Error('native creation failed')
    })
    const second = enqueue(async () => {
      events.push('second:start')
      events.push('second:done')
    })

    await expect(first).rejects.toThrow('native creation failed')
    await second

    expect(events).toEqual(['first:start', 'second:start', 'second:done'])
  })
})

describe('createFrameCoalescedTask', () => {
  it('keeps only the latest value scheduled within one frame', async () => {
    const callbacks: FrameRequestCallback[] = []
    const values: number[] = []
    const scheduler = createFrameCoalescedTask<number>(
      async (value) => {
        values.push(value)
      },
      (callback) => {
        callbacks.push(callback)
        return callbacks.length
      },
      () => undefined,
    )

    scheduler.schedule(1)
    scheduler.schedule(2)
    scheduler.schedule(3)
    expect(callbacks).toHaveLength(1)

    callbacks.shift()?.(0)
    await Promise.resolve()

    expect(values).toEqual([3])
  })

  it('serializes native work and retains the latest pending frame', async () => {
    const callbacks: FrameRequestCallback[] = []
    const releases: Array<() => void> = []
    const values: number[] = []
    const scheduler = createFrameCoalescedTask<number>(
      async (value) => {
        values.push(value)
        await new Promise<void>((resolve) => releases.push(resolve))
      },
      (callback) => {
        callbacks.push(callback)
        return callbacks.length
      },
      () => undefined,
    )

    scheduler.schedule(1)
    callbacks.shift()?.(0)
    scheduler.schedule(2)
    scheduler.schedule(3)
    expect(callbacks).toHaveLength(0)

    releases.shift()?.()
    await Promise.resolve()
    await Promise.resolve()
    expect(callbacks).toHaveLength(1)
    callbacks.shift()?.(1)
    await Promise.resolve()

    expect(values).toEqual([1, 3])
    releases.shift()?.()
  })
})
