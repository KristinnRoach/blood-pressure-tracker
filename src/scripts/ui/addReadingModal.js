import { saveReading } from '../storage.js';
import { getCategory } from '../analysis/bloodPressure.js';
import { getLocalDateKey } from '../helpers/localDate.js';
import { configureReadingDialog, readingDialogTag } from './readingDialog.js';
import { initializeVisualScales } from './visualScales.js';

const template = `
  <${readingDialogTag} class="reading-dialog add-reading-modal" id="add-reading-modal" aria-label="Add reading" closedby="any">
    <div class="modal-content">
      <button type="button" class="modal-close" aria-label="Close add reading">&times;</button>
      <div class="modal-body">
        <form id="reading-form" class="input-group">
          <div class="input-with-scale">
            <label for="systolic">Systolic</label>
            <input type="number" inputmode="numeric" id="systolic" min="50" max="300" step="1" required autofocus />
            <div class="visual-scale" id="systolic-scale">
              <div class="scale-track">
                <div class="scale-segment normal"></div>
                <div class="scale-segment elevated"></div>
                <div class="scale-segment high1"></div>
                <div class="scale-segment high2"></div>
                <div class="scale-segment crisis"></div>
              </div>
              <div class="scale-indicator" id="systolic-indicator"></div>
            </div>
          </div>

          <div class="input-with-scale">
            <label for="diastolic">Diastolic</label>
            <input type="number" inputmode="numeric" id="diastolic" min="30" max="200" step="1" required />
            <div class="visual-scale" id="diastolic-scale">
              <div class="scale-track">
                <div class="scale-segment normal"></div>
                <div class="scale-segment high1"></div>
                <div class="scale-segment high2"></div>
                <div class="scale-segment crisis"></div>
              </div>
              <div class="scale-indicator" id="diastolic-indicator"></div>
            </div>
          </div>

          <div class="input-with-scale">
            <label for="pulse">Pulse</label>
            <input type="number" inputmode="numeric" id="pulse" min="20" max="250" step="1" required />
            <div class="visual-scale" id="pulse-scale">
              <div class="scale-track">
                <div class="scale-segment low"></div>
                <div class="scale-segment normal"></div>
                <div class="scale-segment high"></div>
              </div>
              <div class="scale-indicator" id="pulse-indicator"></div>
            </div>
          </div>

          <!-- Optional date picker for adding past readings -->
          <div class="input-with-scale">
            <label for="reading-date">Reading date</label>
            <input type="date" id="reading-date" />
          </div>
          <div class="reading-form-modal-btns">
            <button type="button" class="reading-cancel">Cancel</button>
            <button type="submit">OK</button>
          </div>
        </form>
      </div>
    </div>
  </${readingDialogTag}>`;

export function AddReadingModal(date) {
  document.body.insertAdjacentHTML('beforeend', template);
  const dialog = document.body.lastElementChild;
  const form = dialog.querySelector('form');
  let saving = false;
  const { open, close, dismiss } = configureReadingDialog(dialog, {
    onClose: () => dialog.remove(),
    canDismiss: () => !saving,
  });
  const submitButton = form.querySelector('button[type="submit"]');
  const closeButton = dialog.querySelector('.modal-close');
  const cancelButton = dialog.querySelector('.reading-cancel');

  const dateInput = form.elements['reading-date'];
  dateInput.value = date || getLocalDateKey(new Date());

  closeButton.addEventListener('click', dismiss);
  cancelButton.addEventListener('click', dismiss);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving) return;

    const systolic = form.elements.systolic.valueAsNumber;
    const diastolic = form.elements.diastolic.valueAsNumber;
    const pulse = form.elements.pulse.valueAsNumber;
    if (![systolic, diastolic, pulse].every(Number.isFinite)) {
      alert('Please enter valid numbers for systolic, diastolic and pulse.');
      return;
    }

    saving = true;
    for (const button of [submitButton, closeButton, cancelButton]) {
      button.setAttribute('aria-disabled', 'true');
    }
    submitButton.textContent = 'Saving…';
    dialog.setAttribute('closedby', 'none');
    try {
      const readingDate = new Date();
      if (dateInput.value && dateInput.value !== getLocalDateKey(readingDate)) {
        const [year, month, day] = dateInput.value.split('-').map(Number);
        readingDate.setFullYear(year, month - 1, day);
      }
      const reading = {
        systolic,
        diastolic,
        pulse,
        date: readingDate.toISOString(),
        category: getCategory(systolic, diastolic),
      };

      await saveReading(reading);
      close();
      document.dispatchEvent(new CustomEvent('reading-added', { detail: reading }));
    } catch (error) {
      console.error('AddReadingModal submit error', error);
      alert('Error saving reading. See console for details.');
    } finally {
      saving = false;
      for (const button of [submitButton, closeButton, cancelButton]) {
        button.removeAttribute('aria-disabled');
      }
      submitButton.textContent = 'OK';
      dialog.setAttribute('closedby', 'any');
    }
  });

  initializeVisualScales();
  open();
}
