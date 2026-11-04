import { buildDiagnosticsReport, formatDiagnosticsReport } from './diagnostics.ts';

export const FEEDBACK_STORAGE_KEY = 'dailylingo_feedback';
export const FEEDBACK_EMAIL = 'khafibo@yahoo.com';
/**
 * mailto URLs above roughly 2,000 characters are truncated by some desktop
 * mail clients, so the body is capped and the learner is told to copy the
 * full report when it does not fit.
 */
export const MAX_MAILTO_BODY = 1800;
export const MAX_FEEDBACK_ENTRIES = 50;
export const MAX_FEEDBACK_MESSAGE = 2000;
export const MAX_FEEDBACK_CONTACT = 200;
export const MIN_FEEDBACK_MESSAGE = 10;

export type FeedbackCategory = 'bug' | 'feature';

export interface FeedbackDraft {
  category: FeedbackCategory;
  message: string;
  contact: string;
  includeDiagnostics: boolean;
}

export interface FeedbackEntry extends FeedbackDraft {
  id: string;
  createdAt: string;
  /** Self-contained text the learner can copy, download or paste into email. */
  report: string;
}

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: 'Báo lỗi',
  feature: 'Đề xuất tính năng',
};

export function validateFeedbackDraft(draft: FeedbackDraft): string | null {
  const message = draft.message.trim();
  if (message.length < MIN_FEEDBACK_MESSAGE) {
    return `Hãy mô tả cụ thể hơn (ít nhất ${MIN_FEEDBACK_MESSAGE} ký tự).`;
  }
  if (message.length > MAX_FEEDBACK_MESSAGE) {
    return `Nội dung góp ý tối đa ${MAX_FEEDBACK_MESSAGE.toLocaleString('vi-VN')} ký tự.`;
  }
  if (draft.contact.trim().length > MAX_FEEDBACK_CONTACT) {
    return 'Thông tin liên hệ quá dài.';
  }
  return null;
}

/**
 * Builds the exact text the learner will send. Diagnostics are opt-in and never
 * include saved words, typed answers or audio (see diagnostics.ts).
 */
export function buildFeedbackReport(draft: FeedbackDraft, now = new Date()): string {
  const lines = [
    'DailyLingo · Góp ý bản Beta',
    `Loại: ${FEEDBACK_CATEGORY_LABEL[draft.category]}`,
    `Thời điểm: ${now.toISOString()}`,
    '',
    draft.message.trim(),
  ];

  const contact = draft.contact.trim();
  if (contact) lines.push('', `Liên hệ: ${contact}`);
  if (draft.includeDiagnostics) {
    lines.push(
      '',
      '--- Chẩn đoán kỹ thuật (không gồm từ vựng, câu trả lời hay âm thanh) ---',
      formatDiagnosticsReport(buildDiagnosticsReport())
    );
  }
  return lines.join('\n');
}

/** Opens the learner's mail app with the report prefilled. */
export function buildFeedbackMailtoUrl(
  entry: Pick<FeedbackEntry, 'category' | 'report'>
): string {
  const subject = `[DailyLingo Beta] ${FEEDBACK_CATEGORY_LABEL[entry.category]}`;
  let body = entry.report;
  if (body.length > MAX_MAILTO_BODY) {
    body =
      `${body.slice(0, MAX_MAILTO_BODY)}\n\n` +
      '[Nội dung đầy đủ đã lưu trên thiết bị. Nếu email bị cắt ngắn, hãy dùng nút "Sao chép".]';
  }
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function createFeedbackEntry(draft: FeedbackDraft, now = new Date()): FeedbackEntry {
  return {
    ...draft,
    message: draft.message.trim(),
    contact: draft.contact.trim(),
    id: `fb-${now.getTime()}`,
    createdAt: now.toISOString(),
    report: buildFeedbackReport(draft, now),
  };
}

function sanitizeEntry(input: unknown, index: number): FeedbackEntry | null {
  if (typeof input !== 'object' || input === null) return null;
  const record = input as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  if (!message) return null;

  const category: FeedbackCategory = record.category === 'feature' ? 'feature' : 'bug';
  return {
    id: typeof record.id === 'string' && record.id ? record.id : `fb-recovered-${index}`,
    createdAt:
      typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    category,
    message,
    contact: typeof record.contact === 'string' ? record.contact : '',
    includeDiagnostics: record.includeDiagnostics === true,
    report: typeof record.report === 'string' ? record.report : message,
  };
}

export function loadFeedbackEntries(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => sanitizeEntry(item, index))
      .filter((item): item is FeedbackEntry => item !== null)
      .slice(0, MAX_FEEDBACK_ENTRIES);
  } catch {
    return [];
  }
}

/** Persist locally. Returns false when the browser refuses to write. */
export function saveFeedbackEntry(entry: FeedbackEntry): boolean {
  try {
    const entries = [entry, ...loadFeedbackEntries()].slice(0, MAX_FEEDBACK_ENTRIES);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}
