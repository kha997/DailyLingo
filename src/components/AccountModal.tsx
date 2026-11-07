import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useDialogA11y } from '../utils/useDialogA11y.ts';
import {
  AuthSession,
  getAuthConfig,
  MIN_PASSWORD_LENGTH,
  signInWithEmail,
  signOutSession,
  signUpWithEmail,
  validateAuthFields,
} from '../utils/auth.ts';

interface AccountModalProps {
  session: AuthSession | null;
  onAuthenticated: (session: AuthSession) => void;
  onSignedOut: () => void;
  onClose: () => void;
}

type Mode = 'signup' | 'signin';

const inputClass =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors';

const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-300';

export const AccountModal: React.FC<AccountModalProps> = ({
  session,
  onAuthenticated,
  onSignedOut,
  onClose,
}) => {
  const config = useMemo(() => getAuthConfig(), []);
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogA11y(dialogRef, onClose);

  const switchMode = (next: Mode) => {
    if (submitting) return;
    setMode(next);
    setPassword('');
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || submitting) return;

    const fieldError = validateAuthFields(email, password);
    if (fieldError) {
      setError(fieldError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const result = await signUpWithEmail(email, password);
        if (result.status === 'confirm-email') {
          setConfirmationEmail(result.email);
          setPassword('');
          return;
        }
        onAuthenticated(result.session);
      } else {
        onAuthenticated(await signInWithEmail(email, password));
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Đã có lỗi xảy ra. Hãy thử lại sau ít phút.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    await signOutSession(session);
    setSubmitting(false);
    setPassword('');
    onSignedOut();
  };

  const renderBody = () => {
    if (!config) {
      return (
        <div className="mt-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Đăng ký chưa được bật trên bản này.</p>
              <p className="text-xs leading-relaxed">
                Bản dựng chưa có cấu hình Supabase. Quản trị viên cần thêm
                {' '}
                <code className="font-mono">VITE_SUPABASE_URL</code> và
                {' '}
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> khi build.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      );
    }

    if (confirmationEmail) {
      return (
        <div className="mt-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
            Kiểm tra email của bạn
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            DailyLingo đã gửi liên kết xác nhận tới{' '}
            <span className="font-semibold text-slate-900 dark:text-white break-all">
              {confirmationEmail}
            </span>
            . Mở email, bấm xác nhận rồi quay lại đăng nhập.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Không thấy email? Hãy kiểm tra mục Spam hoặc thư rác.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmationEmail(null);
                setMode('signin');
              }}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      );
    }

    if (session) {
      return (
        <div className="mt-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
            <span className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-display text-lg font-bold shrink-0">
              {session.user.email.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-full px-2 py-0.5">
                  Đã đăng nhập
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Tiến độ học vẫn được lưu trên thiết bị này trong bản Beta.</p>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {submitting ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          role="tablist"
          aria-label="Chế độ tài khoản"
          className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => switchMode('signup')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Đăng ký
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => switchMode('signin')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === 'signin'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Đăng nhập
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <div>
            <label htmlFor="account-email" className={labelClass}>
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="account-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-required="true"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ban@email.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="account-password" className={labelClass}>
              Mật khẩu
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="account-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                aria-required="true"
                aria-describedby={mode === 'signup' ? 'account-password-hint' : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p id="account-password-hint" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Dùng ít nhất {MIN_PASSWORD_LENGTH} ký tự. Không dùng lại mật khẩu email.
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 text-xs text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? 'Đang xử lý…'
              : mode === 'signup'
                ? 'Tạo tài khoản miễn phí'
                : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Để sau — tiếp tục học trên máy này
          </button>
        </form>

        <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Tiến độ học vẫn được lưu trên thiết bị này trong bản Beta.
        </p>
      </>
    );
  };

  const title = session
    ? 'Tài khoản của bạn'
    : confirmationEmail
      ? 'Xác nhận email'
      : 'Tài khoản DailyLingo';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors focus:outline-none max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="account-title"
                className="font-display text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                {title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bản Beta · Miễn phí
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderBody()}
      </div>
    </div>
  );
};
