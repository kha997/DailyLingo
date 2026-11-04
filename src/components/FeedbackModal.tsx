import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Copy,
  Download,
  Lightbulb,
  Mail,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useDialogA11y } from '../utils/useDialogA11y.ts';
import { soundFX } from '../utils/speech.ts';
import { copyTextToClipboard } from '../utils/diagnostics.ts';
import {
  buildFeedbackMailtoUrl,
  createFeedbackEntry,
  FEEDBACK_CATEGORY_LABEL,
  FEEDBACK_EMAIL,
  loadFeedbackEntries,
  MAX_FEEDBACK_CONTACT,
  MAX_FEEDBACK_MESSAGE,
  saveFeedbackEntry,
  validateFeedbackDraft,
  FeedbackCategory,
  FeedbackEntry,
} from '../utils/feedback.ts';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<FeedbackEntry | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [storedCount, setStoredCount] = useState(() => loadFeedbackEntries().length);
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogA11y(dialogRef, onClose);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const draft = { category, message, contact, includeDiagnostics };
    const validationError = validateFeedbackDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    const nextEntry = createFeedbackEntry(draft);
    const saved = saveFeedbackEntry(nextEntry);
    setEntry(nextEntry);
    setSaveFailed(!saved);
    setStoredCount((count) => (saved ? Math.min(count + 1, 50) : count));
    setError(null);
    setCopyStatus(null);
    if (saved) soundFX.playCorrect();
  };

  const handleCopy = async () => {
    if (!entry) return;
    soundFX.playClick();
    const ok = await copyTextToClipboard(entry.report);
    setCopyStatus(
      ok
        ? `Đã sao chép. Hãy dán vào email gửi ${FEEDBACK_EMAIL}.`
        : 'Trình duyệt chặn sao chép. Hãy tải tệp .txt thay thế.'
    );
  };

  const handleDownload = () => {
    if (!entry) return;
    soundFX.playClick();
    try {
      const stamp = entry.createdAt.slice(0, 10);
      const blob = new Blob([entry.report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dailylingo-gop-y-${stamp}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setCopyStatus('Đã tải tệp góp ý. Bạn quyết định có chia sẻ tệp này hay không.');
    } catch {
      setCopyStatus('Không thể tạo tệp trên trình duyệt này. Hãy dùng nút sao chép.');
    }
  };

  const startNewDraft = () => {
    setEntry(null);
    setMessage('');
    setContact('');
    setIncludeDiagnostics(true);
    setCopyStatus(null);
    setError(null);
    setSaveFailed(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors focus:outline-none max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3
              id="feedback-title"
              className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Góp ý cho DailyLingo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phát hiện lỗi hoặc muốn thêm tính năng? Cho chúng tôi biết.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng hộp góp ý"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {entry ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-semibold">
                  {saveFailed
                    ? 'Đã tạo góp ý nhưng chưa lưu được vào bộ nhớ trình duyệt.'
                    : 'Đã lưu góp ý trên thiết bị này.'}
                </p>
                <p className="mt-1 leading-relaxed">
                  DailyLingo không có máy chủ nhận góp ý và không tự gửi đi đâu. Bấm
                  &ldquo;Gửi qua email&rdquo; để mở ứng dụng thư với nội dung điền sẵn, hoặc
                  sao chép / tải tệp để gửi thủ công.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <a
                href={buildFeedbackMailtoUrl(entry)}
                onClick={() => soundFX.playClick()}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Gửi qua email
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Sao chép
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Tải .txt
              </button>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Gửi tới <span className="font-semibold">{FEEDBACK_EMAIL}</span>. Nếu ứng dụng thư
              cắt ngắn nội dung, hãy dùng &ldquo;Sao chép&rdquo; để gửi bản đầy đủ.
            </p>

            {copyStatus && (
              <p role="status" className="text-[11px] text-slate-600 dark:text-slate-400">
                {copyStatus}
              </p>
            )}

            <details className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                Xem trước nội dung sẽ gửi
              </summary>
              <pre className="px-3 pb-3 text-[10px] leading-relaxed whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300 max-h-44 overflow-y-auto">
                {entry.report}
              </pre>
            </details>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={startNewDraft}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Viết góp ý khác
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
                Loại góp ý
              </span>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Loại góp ý">
                {(
                  [
                    { id: 'bug', label: FEEDBACK_CATEGORY_LABEL.bug, icon: Bug },
                    { id: 'feature', label: FEEDBACK_CATEGORY_LABEL.feature, icon: Lightbulb },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const selected = category === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setCategory(option.id);
                        setError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="feedback-message"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5"
              >
                Nội dung *
              </label>
              <textarea
                id="feedback-message"
                aria-required="true"
                rows={4}
                maxLength={MAX_FEEDBACK_MESSAGE}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Bạn đang ở màn hình nào, thao tác gì, điều gì xảy ra? Với tính năng mới, mong muốn của bạn là gì?"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Không nhập từ vựng riêng tư hay thông tin nhạy cảm.</span>
                <span className="font-mono tabular-nums">
                  {message.length}/{MAX_FEEDBACK_MESSAGE}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="feedback-contact"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5"
              >
                Email liên hệ (không bắt buộc)
              </label>
              <input
                id="feedback-contact"
                type="text"
                maxLength={MAX_FEEDBACK_CONTACT}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Để chúng tôi phản hồi nếu cần"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(event) => setIncludeDiagnostics(event.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Gửi kèm chẩn đoán kỹ thuật
                </span>
                Chỉ gồm trình duyệt, kích thước màn hình và tình trạng bộ nhớ. Không gồm từ vựng,
                câu trả lời hay âm thanh của bạn.
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {storedCount > 0
                  ? `${storedCount} góp ý đã lưu trên thiết bị này`
                  : 'Chưa có góp ý nào trên thiết bị này'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Lưu góp ý
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
