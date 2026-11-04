# Accessibility

Target: **WCAG 2.1/2.2 AA for the checks listed below**, verified against the
rendered app rather than source classes alone.

## Automated evidence

`e2e-tests/accessibility.test.ts` runs in Chromium against the real dev server and
walks the rendered DOM on:

- lesson catalog
- vocabulary notebook
- analytics
- settings dialog
- exercise runner initial flashcard
- quiz answer-feedback state
- speaking exercise screen

in **both light and dark themes**. Post-answer states for word reorder,
listening cloze, dialogue, and the completion card are **not** in the automated
scan. For every element that owns visible text it:

1. converts Tailwind 4 `oklch()` / `rgb()` / hex colours to sRGB,
2. composites translucent background layers from the outermost ancestor inward,
3. applies the WCAG AA thresholds (4.5:1 normal text, 3:1 for ≥24 px or
   ≥18.66 px bold),
4. fails with route, theme, ratio, colour, size, weight, text, and classes.

Current result: **passes with zero findings** (16/16 Playwright tests green,
including this audit, on both the dev server and the production preview build). The audit found and drove fixes such as
`text-slate-400 → text-slate-500` on light surfaces, `dark:text-slate-500 →
dark:text-slate-400`, amber text darkened on slate backgrounds, and emerald
buttons/text moved from `emerald-600` to `emerald-700`.

### Gradient surfaces

Text placed on translucent gradients (hero card, roadmap nodes, image overlay)
cannot be composited reliably from computed styles, so the automated pass skips
elements inside a `background-image` ancestor. Those surfaces were checked
manually: high-contrast white/near-white text on indigo/emerald/slate gradients,
with dark overlays under hero imagery. This is a documented manual check, not
machine-verified.

## Keyboard and focus

Covered by Playwright:

- quiz options are reachable and selectable with keyboard only
- settings dialog moves focus inside, keeps Tab/Shift+Tab inside, closes on
  `Escape`, and restores focus to the trigger
- all primary navigation and controls are native `<button>` / labelled controls
- exercise runner close control has a title/accessible name
- flashcard flip and speaking start/stop controls have `aria-label`s

Modals use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`; the
overlay is `role="presentation"`. Custom practice and streak details use the same
focus-trap helper (`src/utils/useDialogA11y.ts`).

## Motion and feedback

- `prefers-reduced-motion: reduce` disables confetti in JavaScript and collapses
  CSS animation/transition durations (`src/index.css`).
- Feedback is not colour-only: correct/incorrect states include text and icons.
- Sound effects are optional; the app is fully usable muted.

## Forms, labels, and language

- Inputs have associated labels or accessible names.
- `html lang` and theme `color-scheme` are set.
- Vietnamese is the interface language; English learning content is marked by
  context and typography, not colour alone.
- Touch targets for primary actions are at least ~40 px; the mobile journey runs
  at 390×844 and asserts no horizontal overflow in the catalog or runner.

## Not verified (honest gaps)

1. **No screen-reader session** (VoiceOver/NVDA/TalkBack). ARIA is present and
   reviewed, but not confirmed with a real assistive-technology user.
2. **No 200% zoom / 320 px reflow audit.** 390 px is tested; 320 px is not.
3. **No formal WCAG 2.2 audit** of focus-not-obscured, dragging, target size
   exceptions, or cognitive criteria.
4. **No colour-blind simulation** or contrast check for non-text UI boundaries.
5. **No real-device accessibility testing** on iOS/Android with system font
   scaling or reduced motion enabled.
6. **Charts** have textual summaries and empty states, but the analytics chart
   itself is not a full accessible data table.
7. **Audio-only content** has text equivalents (sentence + options), but the
   listening exercise still depends on hearing TTS or reading the transcript.

These are tracked as IN_PROGRESS/BLOCKED in
[`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md); they must not be reported as passed.
