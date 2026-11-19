export const readingDialogTag =
  typeof globalThis.HTMLDialogElement?.prototype.showModal === 'function'
    ? 'dialog'
    : 'div';

export function configureReadingDialog(dialog, onClose) {
  const firstControl = dialog.querySelector('[autofocus]');

  if (readingDialogTag === 'div') {
    dialog.classList.add('modal-overlay', 'legacy-reading-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    let invoker;

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
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

    function close() {
      if (!dialog.hasAttribute('open')) return;
      dialog.removeAttribute('open');
      invoker?.focus();
      onClose?.();
    }

    return {
      open() {
        invoker = document.activeElement;
        dialog.setAttribute('open', '');
        firstControl.focus();
      },
      close,
    };
  }

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = ({ clientX, clientY }) => {
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      return (
        clientX < left || clientX > right || clientY < top || clientY > bottom
      );
    };
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (event) => {
      pressedOutside = outside(event);
    });
    dialog.addEventListener('pointerup', (event) => {
      if (pressedOutside && outside(event)) dialog.close();
      pressedOutside = false;
    });
  }

  if (onClose) dialog.addEventListener('close', onClose);
  return {
    open: () => dialog.showModal(),
    close: () => dialog.close(),
  };
}
