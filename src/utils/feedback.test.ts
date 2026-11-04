import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FEEDBACK_EMAIL,
  FEEDBACK_STORAGE_KEY,
  MAX_FEEDBACK_ENTRIES,
  MAX_MAILTO_BODY,
  buildFeedbackMailtoUrl,
  buildFeedbackReport,
  createFeedbackEntry,
  loadFeedbackEntries,
  saveFeedbackEntry,
  validateFeedbackDraft,
  FeedbackDraft,
} from './feedback.ts';

const draft = (overrides: Partial<FeedbackDraft> = {}): FeedbackDraft => ({
  category: 'bug',
  message: 'Nút Kiểm Tra không phản hồi khi tôi chọn đủ từ.',
  contact: '',
  includeDiagnostics: false,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildFeedbackReport', () => {
  it('includes category, message and optional contact', () => {
    const report = buildFeedbackReport(
      draft({ category: 'feature', contact: 'beta@example.com' }),
      new Date('2026-11-04T10:00:00.000Z')
    );

    expect(report).toContain('DailyLingo · Góp ý bản Beta');
    expect(report).toContain('Loại: Đề xuất tính năng');
    expect(report).toContain('2026-11-04T10:00:00.000Z');
    expect(report).toContain('Nút Kiểm Tra không phản hồi');
    expect(report).toContain('Liên hệ: beta@example.com');
    expect(report).not.toContain('--- Chẩn đoán kỹ thuật');
  });

  it('omits empty contact and diagnostics unless requested', () => {
    const report = buildFeedbackReport(draft());
    expect(report).not.toContain('Liên hệ:');
    expect(report).not.toContain('Chẩn đoán kỹ thuật');
  });

  it('embeds the privacy-scoped diagnostics report when opted in', () => {
    const report = buildFeedbackReport(draft({ includeDiagnostics: true }));
    expect(report).toContain('--- Chẩn đoán kỹ thuật');
    expect(report).toContain('"includesSavedWordText": false');
    expect(report).toContain('"automaticallyUploaded": false');
  });
});

describe('buildFeedbackMailtoUrl', () => {
  it('addresses the Beta inbox with the report prefilled', () => {
    const entry = createFeedbackEntry(
      draft({ contact: 'beta@example.com' }),
      new Date('2026-11-04T10:00:00.000Z')
    );
    const url = buildFeedbackMailtoUrl(entry);
    const [address, query] = url.replace('mailto:', '').split('?');

    expect(address).toBe(FEEDBACK_EMAIL);
    expect(decodeURIComponent(query)).toContain('subject=[DailyLingo Beta] Báo lỗi');
    expect(decodeURIComponent(query)).toContain('Nút Kiểm Tra không phản hồi');
    expect(url).not.toContain('\n');
  });

  it('caps very long reports and points the learner to the copy button', () => {
    const entry = createFeedbackEntry(
      draft({ message: 'Lỗi rất dài. '.repeat(200) }),
      new Date('2026-11-04T10:00:00.000Z')
    );
    const body = decodeURIComponent(buildFeedbackMailtoUrl(entry).split('&body=')[1]);

    expect(body.length).toBeLessThan(MAX_MAILTO_BODY + 200);
    expect(body).toContain('[Nội dung đầy đủ đã lưu trên thiết bị.');
  });
});

describe('validateFeedbackDraft', () => {
  it('rejects messages that are too short', () => {
    expect(validateFeedbackDraft(draft({ message: '  lỗi  ' }))).toContain('ít nhất');
  });

  it('rejects oversized messages and contacts', () => {
    expect(validateFeedbackDraft(draft({ message: 'a'.repeat(2001) }))).toContain('tối đa');
    expect(validateFeedbackDraft(draft({ contact: 'a'.repeat(201) }))).toContain('quá dài');
  });

  it('accepts a normal report', () => {
    expect(validateFeedbackDraft(draft())).toBeNull();
  });
});

describe('feedback storage', () => {
  it('creates a trimmed entry with an embedded report', () => {
    const entry = createFeedbackEntry(
      draft({ message: '  Câu này bị lặp từ.  ' }),
      new Date('2026-11-04T10:00:00.000Z')
    );

    expect(entry.id).toBe(`fb-${new Date('2026-11-04T10:00:00.000Z').getTime()}`);
    expect(entry.message).toBe('Câu này bị lặp từ.');
    expect(entry.report).toContain('Câu này bị lặp từ.');
  });

  it('saves newest first and loads them back', () => {
    const first = createFeedbackEntry(draft({ message: 'Góp ý thứ nhất đủ dài' }));
    const second = createFeedbackEntry(draft({ message: 'Góp ý thứ hai đủ dài' }));

    expect(saveFeedbackEntry(first)).toBe(true);
    expect(saveFeedbackEntry(second)).toBe(true);
    const loaded = loadFeedbackEntries();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].message).toBe('Góp ý thứ hai đủ dài');
  });

  it(`keeps at most ${MAX_FEEDBACK_ENTRIES} entries`, () => {
    for (let index = 0; index < MAX_FEEDBACK_ENTRIES + 3; index += 1) {
      saveFeedbackEntry(createFeedbackEntry(draft({ message: `Góp ý đủ dài số ${index}` })));
    }
    expect(loadFeedbackEntries()).toHaveLength(MAX_FEEDBACK_ENTRIES);
  });

  it('returns an empty list for corrupt or non-array payloads', () => {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, '{not json');
    expect(loadFeedbackEntries()).toEqual([]);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, '{"message":"x"}');
    expect(loadFeedbackEntries()).toEqual([]);
  });

  it('drops invalid entries and fills missing fields', () => {
    localStorage.setItem(
      FEEDBACK_STORAGE_KEY,
      JSON.stringify([
        { message: '   ' },
        { message: 'Góp ý hợp lệ đủ dài', category: 'feature' },
        { message: 'Mục không hợp lệ', category: 'other' },
      ])
    );
    const loaded = loadFeedbackEntries();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].category).toBe('feature');
    expect(loaded[0].contact).toBe('');
    expect(loaded[1].category).toBe('bug');
  });

  it('reports failure when the browser refuses to write', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(saveFeedbackEntry(createFeedbackEntry(draft()))).toBe(false);
    spy.mockRestore();
  });
});
