import createComponent from '../helpers/dom/component';
import { saveReading } from '../storage.js';
import { getCategory, getPulseStatus } from '../analysis/bloodPressure.js';

const template = `
  <div class="modal-overlay" id="add-reading-modal">
    <div class="modal-content">
      <button class="modal-close" aria-label="Close modal">&times;</button>
      <div class="modal-body">
        <form id="reading-form" class="input-group">
          <div class="input-with-scale">
            <input type="number" id="systolic" placeholder="Systolic" />
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
            <input type="number" id="diastolic" placeholder="Diastolic" />
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
            <input type="number" id="pulse" placeholder="Pulse" />
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
            <input type="date" id="reading-date" aria-label="Reading date" />
          </div>
          <div class="reading-form-modal-btns">
            <button type="button">Cancel</button>
            <button type="submit">OK</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;

export const AddReadingModal = () =>
  createComponent({
    initialProps: { systolic: '', diastolic: '', pulse: '', date: '' },
    template,
    // handlers: { onSubmit },
    parent: document.body, // Optional: parent element
    containerTag: 'div', // Optional: default 'div'
    className: 'add-reading-modal', // Optional: CSS class
    onMount: (el) => {
      /* runs once after initial render (after append if autoAppend) */
      const form = el.querySelector('form');
      const overlay = el.querySelector('.modal-overlay');
      const closeBtn = el.querySelector('.modal-close');
      const cancelBtn = el.querySelector('button[type="button"]');

      const submitHandler = async (e) => {
        e.preventDefault();
        try {
          // Read values from the form inside the modal
          const get = (sel) => overlay.querySelector(sel);
          const sysVal = parseInt(get('#systolic')?.value);
          const diaVal = parseInt(get('#diastolic')?.value);
          const pulseVal = parseInt(get('#pulse')?.value);
          if (!sysVal || !diaVal || !pulseVal) {
            alert('Please enter systolic, diastolic and pulse values');
            return;
          }

          // Determine date (preserve time-of-day if a date is provided)
          const dateInput = get('#reading-date')?.value;
          const now = new Date();
          let readingDateIso;
          if (dateInput) {
            const d = new Date(dateInput);
            d.setHours(
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
              now.getMilliseconds()
            );
            readingDateIso = d.toISOString();
          } else {
            readingDateIso = now.toISOString();
          }

          const category = getCategory(sysVal, diaVal);

          const reading = {
            systolic: sysVal,
            diastolic: diaVal,
            pulse: pulseVal,
            date: readingDateIso,
            category,
          };

          // Save reading
          await saveReading(reading);

          // Notify the app that readings changed and provide the added reading
          document.dispatchEvent(new CustomEvent('readings-updated'));
          document.dispatchEvent(
            new CustomEvent('reading-added', { detail: reading })
          );
          // Close (and dispose) after successful save
          el.close && el.close();
        } catch (err) {
          console.error('AddReadingModal submit error', err);
          alert('Error saving reading. See console for details.');
        }
      };

      const closeHandler = () => overlay && overlay.classList.remove('active');
      const openHandler = (dateArg) => {
        if (!overlay) return;
        // Save previously focused element to restore later
        el._previouslyFocused = document.activeElement;
        overlay.classList.add('active');

        // Set date input to today by default
        const dateInput = overlay.querySelector('#reading-date');
        if (dateInput) {
          // If caller provided a date (YYYY-MM-DD), use it; otherwise default to today
          if (dateArg) dateInput.value = dateArg;
          else dateInput.valueAsDate = new Date();
        }

        // Prefer focusing the first input (systolic) so the user can type immediately
        const systInput = overlay.querySelector('#systolic');
        if (
          systInput &&
          !systInput.disabled &&
          systInput.offsetParent !== null
        ) {
          systInput.focus();
        }
      };

      const overlayClickHandler = (e) => {
        if (e.target === overlay) closeHandler();
      };

      const keyHandler = (e) => {
        // If modal isn't active, ignore
        if (!overlay || !overlay.classList.contains('active')) return;

        // Close on Escape
        if (e.key === 'Escape') {
          closeHandler();
          return;
        }

        // Minimal focus trap for Tab / Shift+Tab
        if (e.key === 'Tab') {
          const focusable = Array.from(
            overlay.querySelectorAll(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null);
          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            // Tab
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      // Attach listeners
      form && form.addEventListener('submit', submitHandler);
      closeBtn && closeBtn.addEventListener('click', closeHandler);
      cancelBtn && cancelBtn.addEventListener('click', closeHandler);
      overlay && overlay.addEventListener('click', overlayClickHandler);
      document.addEventListener('keydown', keyHandler);

      // Expose open/close API on the component element
      el.open = openHandler;
      el.close = () => {
        // remove active class and restore focus
        if (overlay && overlay.classList.contains('active')) {
          overlay.classList.remove('active');
          if (
            el._previouslyFocused &&
            typeof el._previouslyFocused.focus === 'function'
          ) {
            el._previouslyFocused.focus();
          }
        }

        // Dispose after a short delay to allow any close transitions
        setTimeout(() => {
          try {
            el.dispose();
          } catch (e) {
            console.warn('Error disposing modal', e);
          }
        }, 140);
      };

      // Open immediately so calling AddReadingModal() shows the modal by default
      openHandler();

      // Store cleanup function references on the element for onCleanup
      el._cleanup = () => {
        form && form.removeEventListener('submit', submitHandler);
        closeBtn && closeBtn.removeEventListener('click', closeHandler);
        cancelBtn && cancelBtn.removeEventListener('click', closeHandler);
        overlay && overlay.removeEventListener('click', overlayClickHandler);
        document.removeEventListener('keydown', keyHandler);
      };
    },
    onCleanup: (el) => {
      /* runs on dispose() */
      if (el && typeof el._cleanup === 'function') el._cleanup();
    },
    autoAppend: true, // Optional: default true
    preserveInputState: true, // Optional: default true
  });
