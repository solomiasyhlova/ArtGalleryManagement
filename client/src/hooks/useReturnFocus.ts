import { useRef, type RefObject } from 'react';

/**
 * Focus handlers for a Radix dialog opened from state rather than a `Dialog.Trigger` (Radix
 * returns focus only to its own trigger). The element focused when the dialog opened gets focus
 * back on close, or `fallback` when that element is gone (e.g. the card that was just deleted).
 */
export function useReturnFocus(fallback?: RefObject<HTMLElement | null>) {
  const returnTo = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: () => {
      returnTo.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      const target = returnTo.current?.isConnected ? returnTo.current : fallback?.current;
      returnTo.current = null;
      target?.focus();
    },
  };
}
