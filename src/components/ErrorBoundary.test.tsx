import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary.tsx';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  // React only silences its "not wrapped in act" warning when this is set.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

const Boom = () => {
  throw new Error('render exploded');
};

describe('ErrorBoundary', () => {
  it('keeps the screen usable and shows local-only recovery actions', async () => {
    await act(async () => {
      root.render(
        <ErrorBoundary fallbackTitle="Không tải được phần này">
          <Boom />
        </ErrorBoundary>
      );
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Không tải được phần này');
    expect(alert?.textContent).toContain('Thử lại');
    expect(alert?.textContent).toContain('Tải lại trang');
    expect(alert?.textContent).toContain('Chi tiết kỹ thuật');
    expect(alert?.textContent).toContain('render exploded');
  });

  it('renders children normally when nothing throws', async () => {
    await act(async () => {
      root.render(
        <ErrorBoundary>
          <p>Nội dung an toàn</p>
        </ErrorBoundary>
      );
    });

    expect(container.textContent).toContain('Nội dung an toàn');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('offers the optional reset action only when a handler is provided', async () => {
    const onReset = vi.fn();
    await act(async () => {
      root.render(
        <ErrorBoundary onReset={onReset}>
          <Boom />
        </ErrorBoundary>
      );
    });

    const reset = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Về màn hình chính')
    );
    expect(reset).toBeDefined();
    await act(async () => {
      reset?.click();
    });
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
