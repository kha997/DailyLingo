import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AUTH_CONFIG_MISSING_MESSAGE,
  MIN_PASSWORD_LENGTH,
  clearAuthSession,
  dismissAccountBanner,
  getAuthConfig,
  isAccountBannerDismissed,
  loadAuthSession,
  refreshAuthSession,
  saveAuthSession,
  signInWithEmail,
  signOutSession,
  signUpWithEmail,
  validateAuthFields,
  AuthSession,
} from './auth.ts';

const SESSION: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: Date.now() + 3_600_000,
  user: { id: 'user-1', email: 'ban@example.com' },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const tokenPayload = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  user: { id: 'user-1', email: 'ban@example.com' },
};

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('getAuthConfig', () => {
  it('returns null when the build has no Supabase settings', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(getAuthConfig()).toBeNull();
  });

  it('normalises the project URL and keeps the anon key', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co/');
    expect(getAuthConfig()).toEqual({
      url: 'https://demo.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('rejects non-https project URLs', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://demo.supabase.co');
    expect(getAuthConfig()).toBeNull();
  });

  it('allows a localhost URL for local testing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
    expect(getAuthConfig()?.url).toBe('http://localhost:54321');
  });
});

describe('validateAuthFields', () => {
  it('rejects a malformed email', () => {
    expect(validateAuthFields('ban@', 'matkhau123')).toContain('Email');
  });

  it('rejects a short password', () => {
    expect(validateAuthFields('ban@example.com', 'a'.repeat(MIN_PASSWORD_LENGTH - 1))).toContain(
      'ít nhất 8 ký tự'
    );
  });

  it('accepts a valid pair', () => {
    expect(validateAuthFields(' ban@example.com ', 'matkhau123')).toBeNull();
  });
});

describe('signUpWithEmail', () => {
  it('returns a session when Supabase confirms the account immediately', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(tokenPayload));
    vi.stubGlobal('fetch', fetchMock);

    const result = await signUpWithEmail('ban@example.com', 'matkhau123');

    expect(result.status).toBe('session');
    if (result.status !== 'session') return;
    expect(result.session.user.email).toBe('ban@example.com');
    expect(result.session.expiresAt).toBeGreaterThan(Date.now());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://demo.supabase.co/auth/v1/signup');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).headers).toMatchObject({
      apikey: 'anon-key',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      email: 'ban@example.com',
      password: 'matkhau123',
    });
  });

  it('asks the user to confirm their email when no session is returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ id: 'user-1', email: 'ban@example.com' }))
    );

    const result = await signUpWithEmail('ban@example.com', 'matkhau123');

    expect(result).toEqual({ status: 'confirm-email', email: 'ban@example.com' });
  });

  it('explains that the email already has an account', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { error_code: 'user_already_exists', msg: 'User already registered' },
            422
          )
        )
    );

    await expect(signUpWithEmail('ban@example.com', 'matkhau123')).rejects.toThrow(
      'đã có tài khoản'
    );
  });

  it('fails closed when Supabase is not configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    await expect(signUpWithEmail('ban@example.com', 'matkhau123')).rejects.toThrow(
      AUTH_CONFIG_MISSING_MESSAGE
    );
  });
});

describe('signInWithEmail', () => {
  it('exchanges credentials for a stored session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(tokenPayload)));

    const session = await signInWithEmail(' ban@example.com ', 'matkhau123');

    expect(session.accessToken).toBe('access-token');
    expect(session.user.id).toBe('user-1');
  });

  it('maps invalid credentials to a friendly message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400)
      )
    );

    await expect(signInWithEmail('ban@example.com', 'sai-mat-khau')).rejects.toThrow(
      'Email hoặc mật khẩu không đúng'
    );
  });

  it('asks the user to confirm their email first', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error_code: 'email_not_confirmed', msg: 'Email not confirmed' }, 400)
      )
    );

    await expect(signInWithEmail('ban@example.com', 'matkhau123')).rejects.toThrow(
      'xác nhận email'
    );
  });

  it('explains rate limiting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 429)));

    await expect(signInWithEmail('ban@example.com', 'matkhau123')).rejects.toThrow('quá nhanh');
  });

  it('handles network failures without leaking the original error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(signInWithEmail('ban@example.com', 'matkhau123')).rejects.toThrow(
      'Không kết nối được máy chủ đăng nhập'
    );
  });

  it('handles request timeouts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    );

    await expect(signInWithEmail('ban@example.com', 'matkhau123')).rejects.toThrow(
      'không phản hồi'
    );
  });
});

describe('refreshAuthSession', () => {
  it('returns a refreshed session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(tokenPayload));
    vi.stubGlobal('fetch', fetchMock);

    const next = await refreshAuthSession(SESSION);

    expect(next?.accessToken).toBe('access-token');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://demo.supabase.co/auth/v1/token?grant_type=refresh_token'
    );
  });

  it('returns null when the refresh token is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(refreshAuthSession(SESSION)).resolves.toBeNull();
  });

  it('returns null when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(refreshAuthSession(SESSION)).resolves.toBeNull();
  });
});

describe('signOutSession', () => {
  it('clears the local session even when the revoke call fails', async () => {
    saveAuthSession(SESSION);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await signOutSession(SESSION);

    expect(loadAuthSession()).toBeNull();
  });

  it('revokes the refresh token with the bearer access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await signOutSession(SESSION);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://demo.supabase.co/auth/v1/logout');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer access-token',
    });
  });
});

describe('local session storage', () => {
  it('round-trips a valid session', () => {
    saveAuthSession(SESSION);
    expect(loadAuthSession()).toEqual(SESSION);
  });

  it('ignores malformed or incomplete data', () => {
    localStorage.setItem('dailylingo_auth_session', '{not json');
    expect(loadAuthSession()).toBeNull();

    localStorage.setItem('dailylingo_auth_session', JSON.stringify({ accessToken: 'x' }));
    expect(loadAuthSession()).toBeNull();
  });

  it('clears the session', () => {
    saveAuthSession(SESSION);
    clearAuthSession();
    expect(loadAuthSession()).toBeNull();
  });

  it('does not throw when storage is blocked', () => {
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => saveAuthSession(SESSION)).not.toThrow();
    blocked.mockRestore();
  });
});

describe('account banner dismissal', () => {
  it('remembers that the banner was dismissed', () => {
    expect(isAccountBannerDismissed()).toBe(false);
    dismissAccountBanner();
    expect(isAccountBannerDismissed()).toBe(true);
  });
});
