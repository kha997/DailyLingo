import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour for a modal dialog:
 * - moves focus inside on open,
 * - keeps Tab/Shift+Tab inside,
 * - closes on Escape,
 * - restores focus to the trigger on unmount.
 *
 * `onClose` is read through a ref so an inline callback does not re-run the
 * effect (and steal focus) on every keystroke in the dialog.
 */
export function useDialogA11y<T extends HTMLElement>(
  dialogRef: RefObject<T | null>,
  onClose: () => void
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0
      );

    const first = focusable()[0];
    (first ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === firstItem || active === dialog)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    // Pointer focus (or a stray programmatic focus) can land outside an
    // aria-modal dialog. Pull it back so the modal is never a visual lie.
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (dialog.contains(target)) return;
      const items = focusable();
      (items[0] ?? dialog).focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      previouslyFocused?.focus?.();
    };
  }, [dialogRef]);
}
