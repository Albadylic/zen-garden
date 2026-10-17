// Per-device preferences kept in localStorage. Storage can be unavailable
// (private browsing, blocked site data), so every access is guarded and the
// game works the same without it.

const REDUCE_MOTION_KEY = 'zen-garden:reduce-motion'

function systemPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function loadReduceMotion(): boolean {
  try {
    const stored = localStorage.getItem(REDUCE_MOTION_KEY)
    if (stored !== null) return stored === 'true'
  } catch {
    // Fall back to the system setting.
  }
  return systemPrefersReducedMotion()
}

export function saveReduceMotion(value: boolean): void {
  try {
    localStorage.setItem(REDUCE_MOTION_KEY, String(value))
  } catch {
    // Not remembered, but still applied for this visit.
  }
}
