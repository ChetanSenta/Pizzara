import { useLayoutEffect, useRef } from 'react';

const focusable = 'a[href], button, input, select, textarea, [tabindex]';

export default function useModalFocus(open, onClose, { busy = false, initialFocus, fallbackFocus, returnFocus } = {}) {
  const dialog = useRef(null);
  const options = useRef(null);

  useLayoutEffect(() => {
    options.current = { onClose, busy, initialFocus, fallbackFocus, returnFocus };
  });

  useLayoutEffect(() => {
    if (!open || !dialog.current) return;
    const panel = dialog.current;
    const trigger = options.current.returnFocus?.current || document.activeElement;
    const overflow = document.body.style.overflow;
    const getControls = () => Array.from(panel.querySelectorAll(focusable)).filter(
      (control) => !control.matches(':disabled') && control.tabIndex >= 0 && control.getClientRects().length,
    );

    document.body.style.overflow = 'hidden';
    (panel.querySelector(options.current.initialFocus || '[data-initial-focus]') || getControls()[0] || panel).focus();

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!options.current.busy) options.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = getControls();
      const index = controls.indexOf(document.activeElement);
      const edge = event.shiftKey ? 0 : controls.length - 1;
      if (index < 0 || index === edge) {
        event.preventDefault();
        (controls.at(event.shiftKey ? -1 : 0) || panel).focus();
      }
    };

    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = overflow;
      const returnTarget = options.current.returnFocus?.current || trigger;
      const target = returnTarget !== document.body && returnTarget?.isConnected
        ? returnTarget
        : document.querySelector(options.current.fallbackFocus || '[data-modal-fallback]');
      target?.focus();
    };
  }, [open]);

  return dialog;
}
