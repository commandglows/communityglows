const STORAGE_KEY = 'communityglows-prefer-local-kanban'

export function rememberLocalKanban(): void {
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* Storage may be unavailable. */ }
}

export function prefersLocalKanban(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}
