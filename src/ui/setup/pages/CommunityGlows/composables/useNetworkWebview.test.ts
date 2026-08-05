import { ref } from 'vue'

import { createSerialTaskQueue, measureWebviewHost } from './useNetworkWebview'

const createHost = (width: number, height: number) => ({
  getBoundingClientRect: () => ({
    x: 120,
    y: 64,
    width,
    height,
  }),
}) as HTMLElement

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
