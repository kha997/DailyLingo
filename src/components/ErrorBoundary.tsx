import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  /** Optional action rendered next to the recovery button. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Keeps a render crash in one screen from blanking the whole app. Local-first
 * data stays untouched; the learner can retry rendering or reload the page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error ?? ''),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Local diagnostics only. Nothing leaves the device.
    console.error('DailyLingo render error', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 p-6 sm:p-8 text-center shadow-xs"
      >
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {this.props.fallbackTitle ?? 'Đã xảy ra lỗi hiển thị'}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {this.props.fallbackMessage ??
            'Dữ liệu học tập của bạn vẫn được giữ nguyên trên thiết bị này.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Tải lại trang
          </button>
          {this.props.onReset && (
            <button
              type="button"
              onClick={this.props.onReset}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Về màn hình chính
            </button>
          )}
        </div>
        {this.state.errorMessage && (
          <details className="mt-4 text-left text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer font-medium">Chi tiết kỹ thuật (chỉ trên thiết bị)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.errorMessage}</pre>
          </details>
        )}
      </div>
    );
  }
}
