export const readingDialogTag =
  typeof globalThis.HTMLDialogElement?.prototype.showModal === 'function'
    ? 'dialog'
    : 'div';

export function configureReadingDialog(
  dialog,
  { onClose, canDismiss } = {},
) {
  const legacy = readingDialogTag === 'div';
  let invoker;
  const close = () => {
    if (!legacy) {
      dialog.close();
    } else if (dialog.hasAttribute('open')) {
      dialog.removeAttribute('open');
      invoker?.focus();
      onClose?.();
    }
  };
  const dismiss = () => {
    if (!canDismiss || canDismiss()) close();
  };

  if (legacy) {
    dialog.classList.add('modal-overlay', 'legacy-reading-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    attachBackdropDismiss(dialog, dialog.querySelector('.modal-content'), dismiss);
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') dismiss();
      if (event.key !== 'Tab') return;

      const controls = dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled)',
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && event.target === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && event.target === last) {
        event.preventDefault();
        first.focus();
      }
    });

    return {
      open() {
        invoker = document.activeElement;
        dialog.setAttribute('open', '');
        dialog.querySelector('[autofocus]').focus();
      },
      close,
      dismiss,
    };
  }

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    attachBackdropDismiss(dialog, dialog, dismiss);
  }

  if (canDismiss) {
    dialog.addEventListener('cancel', (event) => {
      if (!canDismiss()) event.preventDefault();
    });
  }

  if (onClose) dialog.addEventListener('close', onClose);
  return {
    open: () => dialog.showModal(),
    close,
    dismiss,
  };
}

function attachBackdropDismiss(dialog, panel, dismiss) {
  const outside = ({ clientX, clientY }) => {
    const { left, right, top, bottom } = panel.getBoundingClientRect();
    return (
      clientX < left || clientX > right || clientY < top || clientY > bottom
    );
  };
  let backdropPointer = null;

  dialog.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    backdropPointer = outside(event) ? event.pointerId : null;
    // A backdrop press should not move focus out of the panel.
    if (backdropPointer !== null) event.preventDefault();
  });
  dialog.addEventListener('pointerup', (event) => {
    if (event.pointerId !== backdropPointer) return;
    backdropPointer = null;
    if (outside(event)) dismiss();
  });
  dialog.addEventListener('pointercancel', (event) => {
    if (event.pointerId === backdropPointer) backdropPointer = null;
  });
}
