import { afterEach, expect, test, vi } from 'vitest';
import { saveReading } from '../storage.js';

vi.mock('../storage.js', () => ({
  saveReading: vi.fn(),
  getThresholdsSync: vi.fn(),
}));

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('keeps focus in the legacy form during a failed save and allows retry', async () => {
  vi.resetModules();
  vi.stubGlobal('HTMLDialogElement', undefined);
  const { AddReadingModal } = await import('../ui/addReadingModal.js');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const alert = vi.fn();
  vi.stubGlobal('alert', alert);
  let failSave;
  saveReading.mockReset().mockImplementationOnce(
    () => new Promise((_, reject) => {
      failSave = reject;
    }),
  );

  AddReadingModal();
  const dialog = document.getElementById('add-reading-modal');
  const form = dialog.querySelector('form');
  const submit = form.querySelector('button[type="submit"]');
  form.elements.systolic.value = '124';
  form.elements.diastolic.value = '78';
  form.elements.pulse.value = '64';

  submit.focus();
  submit.click();
  expect(submit.getAttribute('aria-disabled')).toBe('true');
  expect(document.activeElement).toBe(submit);
  submit.click();
  expect(saveReading).toHaveBeenCalledTimes(1);
  const closeButton = dialog.querySelector('.modal-close');
  closeButton.click();
  dialog.querySelector('.reading-cancel').click();
  submit.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  expect(dialog.hasAttribute('open')).toBe(true);

  const tab = new KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  submit.dispatchEvent(tab);
  expect(document.activeElement).toBe(closeButton);

  failSave(new Error('Synthetic write failure'));
  await vi.waitFor(() => expect(alert).toHaveBeenCalledOnce());
  expect(submit.hasAttribute('aria-disabled')).toBe(false);
  expect(form.elements.pulse.value).toBe('64');

  saveReading.mockResolvedValueOnce(undefined);
  submit.click();
  await vi.waitFor(() => expect(dialog.isConnected).toBe(false));
  expect(saveReading).toHaveBeenLastCalledWith(
    expect.objectContaining({ systolic: 124, diastolic: 78, pulse: 64 }),
  );
});
