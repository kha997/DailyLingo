/**
 * True when the operating system/browser asks for reduced motion. Decorative
 * animation (confetti, bouncing icons) should be skipped in that case; the
 * feedback text and sound still communicate the result.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
