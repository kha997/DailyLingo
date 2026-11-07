/**
 * Email + password accounts backed by Supabase Auth's REST API.
 *
 * This deliberately talks to the REST endpoints with `fetch` instead of pulling
 * the Supabase SDK into the bundle: the account screen is secondary, and the
 * Beta budget leaves little room for a vendor SDK. Only the public anon key is
 * used; it is safe in a client bundle because row-level security protects data.
 * Never put the service_role key in a VITE_ variable.
 */

const SESSION_STORAGE_KEY = 'dailylingo_auth_session';
const BANNER_STORAGE_KEY = 'dailylingo_account_banner_dismissed';
const REQUEST_TIMEOUT_MS = 15_000;

export const MIN_PASSWORD_LENGTH = 8;
export const AUTH_CONFIG_MISSING_MESSAGE =
  'Đăng ký chưa được bật trên bản này vì chưa có cấu hình Supabase.';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface AuthConfig {
  url: string;
  anonKey: string;
}

export type SignUpResult =
  | { status: 'session'; session: AuthSession }
  | { status: 'confirm-email'; email: string };

interface SupabaseErrorBody {
  error_code?: string;
  msg?: string;
  message?: string;
  error_description?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getAuthConfig(): AuthConfig | null {
  const env = import.meta.env as Record<string, string | undefined>;
  const url = (env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anonKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !anonKey) return null;

  const isHttpsOrigin = /^https:\/\/[^\s/]+$/.test(url);
  const isLocalOrigin = /^http:\/\/localhost(:\d+)?$/.test(url);
  if (!isHttpsOrigin && !isLocalOrigin) return null;

  return { url, anonKey };
}

export function validateAuthFields(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Email chưa đúng định dạng. Hãy kiểm tra lại.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  return null;
}

function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;
}

async function authRequest(
  config: AuthConfig,
  path: string,
  init: RequestInit
): Promise<Response> {
  try {
    return await fetch(`${config.url}${path}`, {
      ...init,
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: timeoutSignal(),
    });
  } catch (error) {
    const name = isRecord(error) && typeof error.name === 'string' ? error.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new Error('Máy chủ đăng nhập không phản hồi. Hãy thử lại sau ít phút.');
    }
    throw new Error('Không kết nối được máy chủ đăng nhập. Hãy kiểm tra mạng rồi thử lại.');
  }
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  let body: SupabaseErrorBody | null = null;
  try {
    body = (await response.json()) as SupabaseErrorBody;
  } catch {
    body = null;
  }

  const raw = body?.msg ?? body?.message ?? body?.error_description ?? '';
  const code = body?.error_code ?? '';

  if (code === 'user_already_exists' || /already registered/i.test(raw)) {
    return 'Email này đã có tài khoản. Hãy chuyển sang Đăng nhập.';
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(raw)) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(raw)) {
    return 'Hãy xác nhận email trong hộp thư rồi đăng nhập lại.';
  }
  if (code === 'weak_password' || /password should be/i.test(raw)) {
    return 'Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự.';
  }
  if (response.status === 429) {
    return 'Bạn thao tác quá nhanh. Hãy chờ một lát rồi thử lại.';
  }
  return fallback;
}

function toSession(payload: unknown): AuthSession | null {
  if (!isRecord(payload)) return null;

  const accessToken = typeof payload.access_token === 'string' ? payload.access_token : '';
  const refreshToken = typeof payload.refresh_token === 'string' ? payload.refresh_token : '';
  const user = isRecord(payload.user) ? payload.user : null;
  const id = user && typeof user.id === 'string' ? user.id : '';
  const email = user && typeof user.email === 'string' ? user.email : '';

  if (!accessToken || !refreshToken || !id || !email) return null;

  const expiresAt =
    typeof payload.expires_at === 'number'
      ? payload.expires_at * 1000
      : Date.now() +
        (typeof payload.expires_in === 'number' ? payload.expires_in * 1000 : 3_600_000);

  return { accessToken, refreshToken, expiresAt, user: { id, email } };
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const config = getAuthConfig();
  if (!config) throw new Error(AUTH_CONFIG_MISSING_MESSAGE);

  const normalizedEmail = email.trim();
  const response = await authRequest(config, '/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Không thể tạo tài khoản lúc này. Vui lòng thử lại.')
    );
  }

  const session = toSession(await response.json());
  if (session) return { status: 'session', session };
  return { status: 'confirm-email', email: normalizedEmail };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSession> {
  const config = getAuthConfig();
  if (!config) throw new Error(AUTH_CONFIG_MISSING_MESSAGE);

  const response = await authRequest(config, '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Không thể đăng nhập lúc này. Vui lòng thử lại.')
    );
  }

  const session = toSession(await response.json());
  if (!session) {
    throw new Error('Máy chủ trả về phiên đăng nhập không hợp lệ. Hãy thử lại.');
  }
  return session;
}

export async function refreshAuthSession(session: AuthSession): Promise<AuthSession | null> {
  const config = getAuthConfig();
  if (!config) return null;

  try {
    const response = await authRequest(config, '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    if (!response.ok) return null;
    return toSession(await response.json());
  } catch {
    return null;
  }
}

/**
 * Revoking the refresh token is best effort: the local session is cleared even
 * when the network call fails, so "Đăng xuất" always signs this browser out.
 */
export async function signOutSession(session: AuthSession | null): Promise<void> {
  clearAuthSession();
  const config = getAuthConfig();
  if (!config || !session) return;

  try {
    await fetch(`${config.url}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
      },
      signal: timeoutSignal(),
    });
  } catch {
    // The local sign-out already happened; nothing else to do.
  }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value) || !isRecord(value.user)) return false;
  return (
    typeof value.accessToken === 'string' &&
    typeof value.refreshToken === 'string' &&
    typeof value.expiresAt === 'number' &&
    typeof value.user.id === 'string' &&
    typeof value.user.email === 'string'
  );
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be blocked or full. The session still works in this tab.
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing else can be done.
  }
}

export function isAccountBannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissAccountBanner(): void {
  try {
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
  } catch {
    // Dismissal only lasts for this visit when storage is unavailable.
  }
}
