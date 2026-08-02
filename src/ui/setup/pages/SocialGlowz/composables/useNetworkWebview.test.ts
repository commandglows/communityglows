import { ref } from 'vue'

import { measureWebviewHost } from './useNetworkWebview'

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
