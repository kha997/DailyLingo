import React from 'react';
import { UserRound } from 'lucide-react';

interface AccountBannerProps {
  onOpenAccount: () => void;
  onDismiss: () => void;
}

export const AccountBanner: React.FC<AccountBannerProps> = ({
  onOpenAccount,
  onDismiss,
}) => {
  return (
    <div
      role="region"
      aria-label="Tài khoản DailyLingo"
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3 transition-colors"
    >
      <span className="hidden sm:flex w-9 h-9 rounded-lg bg-white dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 items-center justify-center shrink-0">
        <UserRound className="w-5 h-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          Tham gia DailyLingo Beta bằng tài khoản của bạn
        </p>
        <p className="mt-0.5 text-xs text-indigo-700/80 dark:text-indigo-300/80">
          Tiến độ học vẫn được lưu trên thiết bị này.
        </p>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={onOpenAccount}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Tạo tài khoản
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        >
          Để sau
        </button>
      </div>
    </div>
  );
};
