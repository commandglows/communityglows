import { describe, expect, it } from 'vitest'
import { reserveFilesWithinLimit } from './fileSelection'

describe('file selection limits', () => {
  it('reserves only the slots available before asynchronous reads begin', () => {
    expect(reserveFilesWithinLimit(3, 4, ['a', 'b', 'c', 'd'])).toEqual(['a'])
  })

  it('accepts no files when the limit is already reached', () => {
    expect(reserveFilesWithinLimit(4, 4, ['a'])).toEqual([])
  })
})
