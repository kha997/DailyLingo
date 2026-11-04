import { describe, it, expect, vi, afterEach } from 'vitest';
import { prefersReducedMotion } from './motion.ts';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
  it('returns true when the media query matches', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('matchMedia', matchMedia);
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('returns false when the media query does not match', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false when matchMedia is unavailable or throws', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);

    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('unsupported');
      })
    );
    expect(prefersReducedMotion()).toBe(false);
  });
});
