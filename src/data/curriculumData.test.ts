import { describe, it, expect, vi } from 'vitest';
import { computeNextReviewDate } from './curriculumData.ts';

describe('computeNextReviewDate', () => {
  // Use a fixed date far enough in the past that "past/today" logic
  // always schedules forward, making tests deterministic
  const TEST_REFERENCE_DATE = '2026-01-15';

  // Helper: compute what the function would return with a given today date
  // by temporarily overriding Date
  const withToday = (todayStr: string, fn: () => unknown) => {
    const originalDate = globalThis.Date;
    ;(globalThis.Date as any) = class extends Date {
      constructor() {
        super();
        if (arguments.length === 0) {
          return new originalDate(todayStr);
        }
        if (arguments.length === 1 && typeof arguments[0] === 'string') {
          return new originalDate(arguments[0]);
        }
        return new originalDate();
      }
    } as any;
    try {
      return fn();
    } finally {
      globalThis.Date = originalDate;
    }
  };

  it('schedules 30 days ahead for high mastery (>=80) and >=3 review counts', () => {
    // baseDays=30, reviewCount=5 -> intervalFactor=min(2, 1+5*0.2)=2, finalDays=60
    // From Jan 15, +60 days = Mar 16
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 90, 5);
    expect(result).toBe('2026-03-16');
  });

  it('schedules 14 days ahead for medium mastery (>=70)', () => {
    // mastery=75 -> baseDays=14, reviewCount=2 -> intervalFactor=min(2, 1+2*0.2)=1.4, finalDays=round(19.6)=20
    // From Jan 15, +20 days = Feb 4
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 75, 2);
    expect(result).toBe('2026-02-04');
  });

  it('schedules 7 days ahead for baseline mastery (>=50)', () => {
    // mastery=60 -> baseDays=7, reviewCount=1 -> intervalFactor=min(2, 1+1*0.2)=1.2, finalDays=round(8.4)=8
    // From Jan 15, +8 days = Jan 23
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 60, 1);
    expect(result).toBe('2026-01-23');
  });

  it('schedules 3 days for lower mastery (>=30)', () => {
    // mastery=40 -> baseDays=3, reviewCount=1 -> intervalFactor=min(2, 1+1*0.2)=1.2, finalDays=round(3.6)=4
    // From Jan 15, +4 days = Jan 19
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 40, 1);
    expect(result).toBe('2026-01-19');
  });

  it('schedules 1 day for very low mastery (<30)', () => {
    // mastery=20 -> baseDays=1, reviewCount=1 -> intervalFactor=min(2, 1+1*0.2)=1.2, finalDays=round(1.2)=1
    // From Jan 15, +1 day = Jan 16
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 20, 1);
    expect(result).toBe('2026-01-16');
  });

  it('increases interval with review count factor', () => {
    // mastery=60, reviewCount=3 -> baseDays=7, intervalFactor=min(2, 1+3*0.2)=min(2, 1.6)=1.6, finalDays=round(11.2)=11
    // From Jan 15, +11 days = Jan 26
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 60, 3);
    expect(result).toBe('2026-01-26');
  });

  it('returns date in YYYY-MM-DD format', () => {
    const result = computeNextReviewDate(TEST_REFERENCE_DATE, 50, 1);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});