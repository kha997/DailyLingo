import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { VocabularyLibrary } from './VocabularyLibrary.tsx';
import type { SavedWord } from '../types/index.ts';

let container: HTMLDivElement;
let root: Root;

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const findButton = (text: string) =>
  Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.trim().startsWith(text)
  );

const buildProps = () => ({
  savedWords: [] as SavedWord[],
  onAddWord: vi.fn(),
  onGoToNotebook: vi.fn(),
  audioAccent: 'en-US' as const,
  audioRate: 1,
});

const renderLibrary = async (props: ReturnType<typeof buildProps>) => {
  await act(async () => {
    root.render(<VocabularyLibrary {...props} />);
  });
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe('VocabularyLibrary', () => {
  it('shows the first page of 300 words and paginates', async () => {
    await renderLibrary(buildProps());

    expect(container.textContent).toContain('300 từ nền tảng A1 – A2');
    expect(container.textContent).toContain('Hiển thị 24 / 300 từ phù hợp');
    expect(container.querySelectorAll('h3')).toHaveLength(24);

    await act(async () => {
      findButton('Xem thêm')?.click();
    });

    expect(container.querySelectorAll('h3')).toHaveLength(48);
  });

  it('searches by meaning and resets to the first page', async () => {
    await renderLibrary(buildProps());

    await act(async () => {
      findButton('Xem thêm')?.click();
    });
    const search = container.querySelector('#library-search') as HTMLInputElement;
    await act(async () => {
      setInputValue(search, 'hộ chiếu');
    });

    expect(container.textContent).toContain('Hiển thị 1 / 1 từ phù hợp');
    expect(container.querySelectorAll('h3')).toHaveLength(1);
    expect(container.querySelector('h3')?.textContent).toBe('passport');
  });

  it('filters by CEFR level and topic together', async () => {
    await renderLibrary(buildProps());

    await act(async () => {
      findButton('A2')?.click();
      findButton('Du lịch')?.click();
    });

    expect(container.textContent).toContain('Hiển thị 24 / 25 từ phù hợp');
    const levelBadges = Array.from(container.querySelectorAll('h3')).map(
      (heading) => heading.parentElement?.textContent ?? ''
    );
    expect(levelBadges.every((text) => text.includes('A2'))).toBe(true);
  });

  it('adds a word to the notebook with every card field', async () => {
    const props = buildProps();
    await renderLibrary(props);

    const search = container.querySelector('#library-search') as HTMLInputElement;
    await act(async () => {
      setInputValue(search, 'passport');
    });

    await act(async () => {
      findButton('Thêm vào sổ tay')?.click();
    });

    expect(props.onAddWord).toHaveBeenCalledWith({
      word: 'passport',
      ipa: '/ˈpæs.pɔːrt/',
      partOfSpeech: 'n',
      meaningVi: 'hộ chiếu',
      exampleEn: 'Do not forget your passport.',
      exampleVi: 'Đừng quên hộ chiếu của bạn.',
      level: 'A2',
      topic: 'travel',
    });
  });

  it('disables the add button for words already in the notebook', async () => {
    const props = buildProps();
    props.savedWords = [
      {
        id: 'w-1',
        word: 'Passport',
        ipa: '/ˈpæs.pɔːrt/',
        partOfSpeech: 'n',
        meaningVi: 'hộ chiếu',
        exampleEn: 'Do not forget your passport.',
        exampleVi: 'Đừng quên hộ chiếu của bạn.',
        level: 'A2',
        topic: 'travel',
        mastered: false,
        reviewCount: 0,
        lastReviewedAt: '2026-11-04',
        nextReviewDate: '2026-11-05',
      },
    ];
    await renderLibrary(props);

    const search = container.querySelector('#library-search') as HTMLInputElement;
    await act(async () => {
      setInputValue(search, 'passport');
    });

    const addButton = findButton('Đã thêm vào sổ tay') as HTMLButtonElement;
    expect(addButton).toBeDefined();
    expect(addButton.disabled).toBe(true);
    addButton.click();
    expect(props.onAddWord).not.toHaveBeenCalled();
  });

  it('links to the notebook and clears filters from the empty state', async () => {
    const props = buildProps();
    await renderLibrary(props);

    await act(async () => {
      findButton('Sổ tay của bạn')?.click();
    });
    expect(props.onGoToNotebook).toHaveBeenCalledTimes(1);

    const search = container.querySelector('#library-search') as HTMLInputElement;
    await act(async () => {
      setInputValue(search, 'zzzz-no-match');
    });
    expect(container.textContent).toContain('Không có từ nào khớp bộ lọc');

    await act(async () => {
      findButton('Xóa bộ lọc')?.click();
    });
    expect(container.textContent).toContain('Hiển thị 24 / 300 từ phù hợp');
  });
});
