export function reserveFilesWithinLimit<T>(currentCount: number, maxFiles: number, files: T[]): T[] {
  const remaining = Math.max(0, maxFiles - currentCount)
  return files.slice(0, remaining)
}
