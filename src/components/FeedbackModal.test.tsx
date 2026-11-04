import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FeedbackModal } from './FeedbackModal.tsx';
import { FEEDBACK_STORAGE_KEY, loadFeedbackEntries } from '../utils/feedback.ts';

let container: HTMLDivElement;
let root: Root;

const setTextareaValue = (textarea: HTMLTextAreaElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
};

const findButton = (label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === label
  );

const renderModal = async () => {
  await act(async () => {
    root.render(<FeedbackModal onClose={vi.fn()} />);
  });
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe('FeedbackModal', () => {
  it('requires a concrete description before saving', async () => {
    await renderModal();
    const submit = findButton('Lưu góp ý');
    expect(submit).toBeDefined();

    await act(async () => {
      submit?.click();
    });

    expect(container.textContent).toContain('Hãy mô tả cụ thể hơn');
    expect(localStorage.getItem(FEEDBACK_STORAGE_KEY)).toBeNull();
  });

  it('saves the feedback locally and never claims to send it', async () => {
    await renderModal();
    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    await act(async () => {
      setTextareaValue(textarea as HTMLTextAreaElement, 'Nút Kiểm Tra không phản hồi.');
    });
    await act(async () => {
      findButton('Lưu góp ý')?.click();
    });

    expect(container.textContent).toContain('Đã lưu góp ý trên thiết bị này');
    expect(container.textContent).toContain('không tự gửi đi đâu');

    const stored = loadFeedbackEntries();
    expect(stored).toHaveLength(1);
    expect(stored[0].category).toBe('bug');
    expect(stored[0].report).toContain('Loại: Báo lỗi');
    expect(stored[0].report).toContain('Nút Kiểm Tra không phản hồi.');
    expect(stored[0].report).toContain('Chẩn đoán kỹ thuật');
  });

  it('records the selected category and honours the diagnostics opt-out', async () => {
    await renderModal();

    await act(async () => {
      findButton('Đề xuất tính năng')?.click();
    });
    expect(findButton('Đề xuất tính năng')?.getAttribute('aria-pressed')).toBe('true');

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    await act(async () => {
      checkbox.click();
    });

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    await act(async () => {
      setTextareaValue(textarea, 'Mong có chế độ nghe chậm từng câu.');
    });
    await act(async () => {
      findButton('Lưu góp ý')?.click();
    });

    const stored = loadFeedbackEntries();
    expect(stored[0].category).toBe('feature');
    expect(stored[0].report).toContain('Loại: Đề xuất tính năng');
    expect(stored[0].report).not.toContain('Chẩn đoán kỹ thuật');
  });

  it('opens a prefilled email to the Beta inbox', async () => {
    await renderModal();
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    await act(async () => {
      setTextareaValue(textarea, 'Màn hình Thư Viện cần thêm bộ lọc B1.');
    });
    await act(async () => {
      findButton('Lưu góp ý')?.click();
    });

    const link = container.querySelector('a[href^="mailto:"]') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Gửi qua email');

    const href = decodeURIComponent(link.href);
    expect(href.startsWith('mailto:khafibo@yahoo.com?')).toBe(true);
    expect(href).toContain('subject=[DailyLingo Beta] Báo lỗi');
    expect(href).toContain('Màn hình Thư Viện cần thêm bộ lọc B1.');
    expect(container.textContent).toContain('khafibo@yahoo.com');
  });

  it('copies the prepared report to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await renderModal();
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    await act(async () => {
      setTextareaValue(textarea, 'Trang Tiến Độ hiển thị sai số phút.');
    });
    await act(async () => {
      findButton('Lưu góp ý')?.click();
    });

    const copyButton = findButton('Sao chép');
    expect(copyButton).toBeDefined();
    await act(async () => {
      copyButton?.click();
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(String(writeText.mock.calls[0][0])).toContain('Trang Tiến Độ hiển thị sai số phút.');
    expect(container.textContent).toContain('Đã sao chép');
  });
});
