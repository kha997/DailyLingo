import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SettingsModal } from './SettingsModal.tsx';
import { INITIAL_USER_STATS } from '../utils/storage.ts';

let container: HTMLDivElement;
let root: Root;

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const renderModal = async (overrides: Partial<React.ComponentProps<typeof SettingsModal>> = {}) => {
  const props: React.ComponentProps<typeof SettingsModal> = {
    userStats: { ...INITIAL_USER_STATS },
    savedWordsCount: 3,
    storageUsageBytes: 2048,
    onUpdateStats: vi.fn(),
    onImportData: vi.fn(),
    onResetAllData: vi.fn(() => true),
    onClose: vi.fn(),
    ...overrides,
  };
  await act(async () => {
    root.render(<SettingsModal {...props} />);
  });
  return props;
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

describe('SettingsModal', () => {
  it('opens local diagnostics without uploading anything', async () => {
    await renderModal();

    const toggle = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Xem chẩn đoán cục bộ')
    );
    expect(toggle).toBeDefined();

    await act(async () => {
      toggle?.click();
    });

    expect(container.textContent).toContain('Chẩn đoán chỉ nằm trên thiết bị');
    expect(container.textContent).toContain('không có từ vựng, câu trả lời, âm thanh');
    expect(container.textContent).toContain('Sao chép chẩn đoán');
    expect(container.textContent).toContain('Tải tệp chẩn đoán');
    expect(container.textContent).toContain('Góp ý cho bản Beta');
  });

  it('keeps destructive reset disabled until the learner types XOA', async () => {
    const props = await renderModal();

    const open = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Đặt lại toàn bộ dữ liệu')
    );
    await act(async () => {
      open?.click();
    });

    const confirm = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Đồng ý xóa tất cả')
    ) as HTMLButtonElement;
    const input = container.querySelector<HTMLInputElement>('#reset-confirm');
    expect(confirm.disabled).toBe(true);
    expect(input).not.toBeNull();

    await act(async () => {
      setInputValue(input!, 'xoa');
    });
    expect(confirm.disabled).toBe(false);
    expect(props.onResetAllData).not.toHaveBeenCalled();

    await act(async () => {
      confirm.click();
    });
    expect(props.onResetAllData).toHaveBeenCalledTimes(1);
  });

  it('does not claim success when the browser refuses to clear storage', async () => {
    await renderModal({ onResetAllData: vi.fn(() => false) });

    const open = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Đặt lại toàn bộ dữ liệu')
    );
    await act(async () => {
      open?.click();
    });

    const input = container.querySelector<HTMLInputElement>('#reset-confirm');
    await act(async () => {
      setInputValue(input!, 'XOA');
    });

    const confirm = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Đồng ý xóa tất cả')
    ) as HTMLButtonElement;
    await act(async () => {
      confirm.click();
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Không thể xóa dữ liệu');
    // The confirmation panel stays open so the learner can retry or cancel.
    expect(input).not.toBeNull();
  });

  it('does not reset when the confirmation text is wrong', async () => {
    const props = await renderModal();

    const open = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Đặt lại toàn bộ dữ liệu')
    );
    await act(async () => {
      open?.click();
    });

    const input = container.querySelector<HTMLInputElement>('#reset-confirm');
    await act(async () => {
      setInputValue(input!, 'KHONG');
    });

    const confirm = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Đồng ý xóa tất cả')
    ) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await act(async () => {
      confirm.click();
    });
    expect(props.onResetAllData).not.toHaveBeenCalled();
  });
});
