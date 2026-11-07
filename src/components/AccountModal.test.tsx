import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AccountModal } from './AccountModal.tsx';
import { AuthSession, loadAuthSession, saveAuthSession } from '../utils/auth.ts';

let container: HTMLDivElement;
let root: Root;

const session: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: Date.now() + 3_600_000,
  user: { id: 'user-1', email: 'ban@example.com' },
};

const tokenPayload = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  user: { id: 'user-1', email: 'ban@example.com' },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const findButton = (label: string) =>
  Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === label
  );

const findSubmit = () =>
  container.querySelector('form button[type="submit"]') as HTMLButtonElement | null;

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const renderModal = async (props: Partial<React.ComponentProps<typeof AccountModal>> = {}) => {
  const defaults = {
    session: null,
    onAuthenticated: vi.fn(),
    onSignedOut: vi.fn(),
    onClose: vi.fn(),
  };
  await act(async () => {
    root.render(<AccountModal {...defaults} {...props} />);
  });
  return { ...defaults, ...props };
};

const fillCredentials = async (email: string, password: string) => {
  const emailInput = container.querySelector('#account-email') as HTMLInputElement;
  const passwordInput = container.querySelector('#account-password') as HTMLInputElement;
  await act(async () => {
    setInputValue(emailInput, email);
    setInputValue(passwordInput, password);
  });
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('AccountModal', () => {
  it('explains when the build has no Supabase configuration', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await renderModal();

    expect(container.textContent).toContain('Đăng ký chưa được bật trên bản này');
    expect(container.querySelector('#account-email')).toBeNull();
  });

  it('validates the password before calling the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await renderModal();
    await fillCredentials('ban@example.com', '123');

    await act(async () => {
      findSubmit()?.click();
    });

    expect(container.textContent).toContain('ít nhất 8 ký tự');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates an account and hands the session to the app', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(tokenPayload)));
    const { onAuthenticated } = await renderModal();
    await fillCredentials('ban@example.com', 'matkhau123');

    await act(async () => {
      findSubmit()?.click();
    });

    expect(onAuthenticated).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 'user-1', email: 'ban@example.com' } })
    );
  });

  it('shows the email confirmation step when Supabase requires it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ id: 'user-1', email: 'ban@example.com' }))
    );
    await renderModal();
    await fillCredentials('ban@example.com', 'matkhau123');

    await act(async () => {
      findSubmit()?.click();
    });

    expect(container.textContent).toContain('Kiểm tra email của bạn');
    expect(container.textContent).toContain('ban@example.com');
  });

  it('shows login errors from Supabase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400)
      )
    );
    const { onAuthenticated } = await renderModal();
    await act(async () => {
      findButton('Đăng nhập')?.click();
    });
    await fillCredentials('ban@example.com', 'sai-mat-khau');

    await act(async () => {
      findSubmit()?.click();
    });

    expect(container.textContent).toContain('Email hoặc mật khẩu không đúng');
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('shows the signed-in account and signs out', async () => {
    saveAuthSession(session);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const { onSignedOut } = await renderModal({ session });

    expect(container.textContent).toContain('ban@example.com');
    expect(container.textContent).toContain('Đã đăng nhập');

    await act(async () => {
      findButton('Đăng xuất')?.click();
    });

    expect(onSignedOut).toHaveBeenCalled();
    expect(loadAuthSession()).toBeNull();
  });
});
