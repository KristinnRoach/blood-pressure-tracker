import { saveReading } from '../storage.js';
import { getCategory } from '../analysis/bloodPressure.js';
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
            <input type="number" inputmode="numeric" id="systolic" min="50" max="300" step="1" autofocus />
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
            <input type="number" inputmode="numeric" id="diastolic" min="30" max="200" step="1" />
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
            <input type="number" inputmode="numeric" id="pulse" min="20" max="250" step="1" />
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
  const { open, close } = configureReadingDialog(dialog, () => dialog.remove());
  const submitButton = form.querySelector('button[type="submit"]');

  const dateInput = form.elements['reading-date'];
  if (date) dateInput.value = date;
  else dateInput.valueAsDate = new Date();

  dialog.querySelector('.modal-close').addEventListener('click', close);
  dialog.querySelector('.reading-cancel').addEventListener('click', close);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    const systolic = Number(form.elements.systolic.value);
    const diastolic = Number(form.elements.diastolic.value);
    const pulse = Number(form.elements.pulse.value);
    if (![systolic, diastolic, pulse].every(Number.isFinite)) {
      alert('Please enter valid numbers for systolic, diastolic and pulse.');
      return;
    }

    submitButton.disabled = true;
    try {
      const now = new Date();
      const readingDate = dateInput.value ? new Date(dateInput.value) : now;
      readingDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds(),
      );
      const reading = {
        systolic,
        diastolic,
        pulse,
        date: readingDate.toISOString(),
        category: getCategory(systolic, diastolic),
      };

      await saveReading(reading);
      close();
      document.dispatchEvent(new CustomEvent('readings-updated'));
      document.dispatchEvent(new CustomEvent('reading-added', { detail: reading }));
    } catch (error) {
      submitButton.disabled = false;
      console.error('AddReadingModal submit error', error);
      alert('Error saving reading. See console for details.');
    }
  });

  initializeVisualScales();
  open();
}
