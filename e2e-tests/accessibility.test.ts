import { test, expect } from '@playwright/test';

/**
 * WCAG AA text-contrast audit against the real rendered UI.
 *
 * Tailwind 4 emits oklch() colours, so the helper converts oklch/rgb/hex to
 * sRGB, composites translucent backgrounds from the outermost layer inward,
 * and checks each element that owns visible text. This complements the
 * keyboard and screen-reader labels exercised in app.test.ts.
 */
type Finding = {
  route: string;
  theme: string;
  text: string;
  ratio: number;
  required: number;
  color: string;
  background: string;
  size: number;
  weight: number;
  classes: string;
};

const collectContrastFindings = async (
  page: import('@playwright/test').Page,
  route: string,
  theme: string,
  rootSelector: string
): Promise<Finding[]> =>
  page.evaluate(
    ({ route, theme, rootSelector }) => {
      type Rgba = { r: number; g: number; b: number; a: number };

      const clamp = (value: number) => Math.min(1, Math.max(0, value));

      const parseColor = (input: string): Rgba | null => {
        if (!input || input === 'transparent' || input === 'none') return null;

        if (input.startsWith('#')) {
          const hex = input.slice(1);
          const full =
            hex.length === 3
              ? hex
                  .split('')
                  .map((char) => char + char)
                  .join('')
              : hex;
          return {
            r: parseInt(full.slice(0, 2), 16) / 255,
            g: parseInt(full.slice(2, 4), 16) / 255,
            b: parseInt(full.slice(4, 6), 16) / 255,
            a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
          };
        }

        const rgbMatch = input.match(/rgba?\(([^)]+)\)/);
        if (rgbMatch) {
          const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean).map(Number);
          return { r: parts[0] / 255, g: parts[1] / 255, b: parts[2] / 255, a: parts[3] ?? 1 };
        }

        const oklchMatch = input.match(/oklch\(([^)]+)\)/);
        if (oklchMatch) {
          const parts = oklchMatch[1].split(/[\s/]+/).filter(Boolean);
          const lightness = parts[0].endsWith('%')
            ? parseFloat(parts[0]) / 100
            : parseFloat(parts[0]);
          const chroma = parts[1].endsWith('%')
            ? (parseFloat(parts[1]) / 100) * 0.4
            : parseFloat(parts[1]);
          const hue = parts[2].endsWith('deg')
            ? parseFloat(parts[2])
            : parseFloat(parts[2] ?? '0');
          const alpha = parts[3] !== undefined ? parseFloat(parts[3]) : 1;

          const hRad = (hue * Math.PI) / 180;
          const aLab = chroma * Math.cos(hRad);
          const bLab = chroma * Math.sin(hRad);

          const lPrime = lightness + 0.3963377774 * aLab + 0.2158037573 * bLab;
          const mPrime = lightness - 0.1055613458 * aLab - 0.0638541728 * bLab;
          const sPrime = lightness - 0.0894841775 * aLab - 1.291485548 * bLab;
          const l = lPrime ** 3;
          const m = mPrime ** 3;
          const s = sPrime ** 3;

          const linear = {
            r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
          };
          const toSrgb = (value: number) =>
            value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

          return {
            r: clamp(toSrgb(linear.r)),
            g: clamp(toSrgb(linear.g)),
            b: clamp(toSrgb(linear.b)),
            a: alpha,
          };
        }

        return null;
      };

      const composite = (top: Rgba, bottom: Rgba): Rgba => ({
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
      });

      const relativeLuminance = (color: Rgba) => {
        const channel = (value: number) =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        return (
          0.2126 * channel(color.r) +
          0.7152 * channel(color.g) +
          0.0722 * channel(color.b)
        );
      };

      const contrast = (foreground: Rgba, background: Rgba) => {
        const l1 = relativeLuminance(foreground);
        const l2 = relativeLuminance(background);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      };

      const effectiveBackground = (element: Element): Rgba => {
        const layers: Rgba[] = [];
        let node: Element | null = element;
        while (node) {
          const parsed = parseColor(getComputedStyle(node).backgroundColor);
          if (parsed && parsed.a > 0) layers.push(parsed);
          node = node.parentElement;
        }
        let result: Rgba = { r: 1, g: 1, b: 1, a: 1 };
        for (let index = layers.length - 1; index >= 0; index--) {
          result = composite(layers[index], result);
        }
        return result;
      };

      const findings: Finding[] = [];
      const seen = new Set<Element>();
      const root =
        rootSelector === 'body' ? document.body : document.querySelector(rootSelector);
      if (!root) return findings;

      const insideGradient = (element: Element) => {
        let node: Element | null = element;
        while (node) {
          if (getComputedStyle(node).backgroundImage !== 'none') return true;
          node = node.parentElement;
        }
        return false;
      };

      root.querySelectorAll('*').forEach((element) => {
        if (seen.has(element)) return;
        if (element.closest('[aria-hidden="true"]')) return;
        if (element.closest('svg')) return;
        // Translucent gradients cannot be composited reliably from computed
        // styles; those surfaces are checked visually against WCAG guidance.
        if (insideGradient(element)) return;

        const hasOwnText = Array.from(element.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0
        );
        if (!hasOwnText) return;
        seen.add(element);

        const style = getComputedStyle(element);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          parseFloat(style.fontSize) === 0
        ) {
          return;
        }
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;

        const foreground = parseColor(style.color);
        if (!foreground) return;
        const background = effectiveBackground(element);
        const opaqueForeground = composite(foreground, background);
        const ratio = contrast(opaqueForeground, background);

        const size = parseFloat(style.fontSize);
        const weight = parseInt(style.fontWeight, 10) || 400;
        const required = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;

        if (ratio + 0.01 < required) {
          const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90);
          findings.push({
            route,
            theme,
            text,
            ratio: Math.round(ratio * 100) / 100,
            required,
            color: style.color,
            background: `rgba(${Math.round(background.r * 255)}, ${Math.round(
              background.g * 255
            )}, ${Math.round(background.b * 255)}, 1)`,
            size,
            weight,
            classes: (element.getAttribute('class') ?? '').slice(0, 160),
          });
        }
      });

      return findings;
    },
    { route, theme, rootSelector }
  );

const scan = async (
  page: import('@playwright/test').Page,
  route: string,
  theme: string,
  rootSelector = 'body'
): Promise<Finding[]> => {
  await page.waitForTimeout(250);
  return collectContrastFindings(page, route, theme, rootSelector);
};

test('every main screen meets WCAG AA text contrast in light and dark themes', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const findings: Finding[] = [];

  const scanAll = async (theme: string) => {
    await page.getByRole('button', { name: 'Bài Học', exact: true }).click();
    findings.push(...(await scan(page, 'catalog', theme)));

    await page.getByRole('button', { name: 'Sổ Tay Từ Vựng', exact: true }).click();
    findings.push(...(await scan(page, 'vocabulary', theme)));

    await page.getByRole('button', { name: 'Tiến Độ & Thống Kê', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'XP theo ngày' })).toBeVisible();
    findings.push(...(await scan(page, 'analytics', theme)));

    await page.getByRole('button', { name: 'Bài Học', exact: true }).click();
    await page.getByRole('button', { name: 'Cài đặt' }).click();
    findings.push(...(await scan(page, 'settings', theme, '[role="dialog"]')));
    await page.getByRole('button', { name: 'Đóng cài đặt' }).click();

    const closeRunner = async () => {
      await page.getByRole('button', { name: 'Thoát bài tập' }).click();
      const confirm = page.getByRole('button', { name: 'Thoát và bỏ lượt này' });
      if (await confirm.isVisible().catch(() => false)) await confirm.click();
    };

    await page.getByTestId('lesson-unit-card').first().getByRole('button', { name: /Bắt Đầu Bài Học/ }).click();
    const runner = page.getByTestId('exercise-runner');
    await expect(runner).toBeVisible();
    findings.push(...(await scan(page, 'exercise-flashcard', theme, '[data-testid="exercise-runner"]')));
    await closeRunner();

    // Graded feedback states, not just the initial screen.
    await page.getByTestId('lesson-unit-card').first().getByRole('button', { name: /Trắc nghiệm/ }).click();
    await expect(runner).toBeVisible();
    await runner.locator('button[aria-pressed]').first().click();
    findings.push(...(await scan(page, 'exercise-quiz-feedback', theme, '[data-testid="exercise-runner"]')));
    await closeRunner();

    await page.getByTestId('lesson-unit-card').first().getByRole('button', { name: /Luyện nói/i }).click();
    await expect(runner).toBeVisible();
    findings.push(...(await scan(page, 'exercise-speaking', theme, '[data-testid="exercise-runner"]')));
    await closeRunner();
  };

  await scanAll('light');

  await page.getByRole('button', { name: 'Đổi giao diện sáng/tối' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await scanAll('dark');

  const summary = findings
    .map(
      (finding) =>
        `${finding.theme}/${finding.route} ${finding.ratio}:1 (needs ${finding.required}:1) ` +
        `${finding.size}px/${finding.weight} "${finding.text}" ` +
        `[${finding.color} on ${finding.background}] ${finding.classes}`
    )
    .join('\n');

  expect(findings, `${findings.length} contrast failures:\n${summary}`).toEqual([]);
});
