import { captureActiveTabUrl } from './extensionTaskCapture'

describe('captureActiveTabUrl', () => {
  const originalChrome = globalThis.chrome

  afterEach(() => {
    if (originalChrome === undefined) delete (globalThis as { chrome?: unknown }).chrome
    else (globalThis as { chrome?: unknown }).chrome = originalChrome
  })

  it('queries only the active current-window tab and returns its URL', async () => {
    const query = vi.fn((_: unknown, callback: (tabs: Array<{ url?: string }>) => void) => {
      callback([{ url: 'https://x.com/post/1#reply' }])
    })
    ;(globalThis as { chrome?: unknown }).chrome = {
      tabs: { query },
      runtime: {},
    }

    await expect(captureActiveTabUrl()).resolves.toMatchObject({
      ok: true,
      url: 'https://x.com/post/1',
    })
    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function))
  })

  it('does not read a title or page content when no URL is returned', async () => {
    const query = vi.fn((_: unknown, callback: (tabs: Array<{ url?: string; title?: string }>) => void) => {
      callback([{ title: 'Sensitive title' }])
    })
    ;(globalThis as { chrome?: unknown }).chrome = { tabs: { query }, runtime: {} }
    await expect(captureActiveTabUrl()).resolves.toEqual({ ok: false, code: 'active_tab_unavailable' })
  })
})
