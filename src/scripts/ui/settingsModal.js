import createComponent from '../helpers/dom/component.js';
import { getThresholds, setThresholds } from '../storage.js';

const template = `
  <div class="modal-overlay" id="settings-modal">
    <div class="modal-content">
      <button class="modal-close" aria-label="Close modal">&times;</button>
      <div class="modal-body">
        <form id="settings-form" class="input-group">
          <section class="settings-section">
            <h3>Scale thresholds</h3>
            <br />

            <div class="input-with-scale">
              <label>Systolic</label>
              <div class="slider-values">Min: <span id="systolic-min">—</span> — Max: <span id="systolic-max">—</span></div>

              <two-thumb-slider id="systolic-slider" min="50" max="250" step="1" minimum-gap="1"></two-thumb-slider>
            </div>

            <div class="input-with-scale">
              <label>Diastolic</label>
              <div class="slider-values">Min: <span id="diastolic-min">—</span> — Max: <span id="diastolic-max">—</span></div>

              <two-thumb-slider id="diastolic-slider" min="30" max="150" step="1" minimum-gap="1"></two-thumb-slider>
            </div>

            <div class="input-with-scale">
              <label>Pulse</label>
              <div class="slider-values">Min: <span id="pulse-min">—</span> — Max: <span id="pulse-max">—</span></div>

              <two-thumb-slider id="pulse-slider" min="30" max="200" step="1" minimum-gap="1"></two-thumb-slider>
            </div>

          </section>

          <!-- Auto-save on slider change; buttons removed -->
        </form>
      </div>
    </div>
  </div>`;

export const SettingsModal = () =>
  createComponent({
    initialProps: {},
    template,
    parent: document.body,
    containerTag: 'div',
    className: 'add-reading-modal',
    onMount: (el) => {
      const form = el.querySelector('form');
      const overlay = el.querySelector('.modal-overlay');
      const closeBtn = el.querySelector('.modal-close');
      const cancelBtn = el.querySelector('button[type="button"]');

      const populate = async () => {
        try {
          // Ensure slider component is loaded (defines custom element and styles)
          try {
            await import('./slider/TwoThumbSlider.js');
          } catch (e) {
            // If import fails, continue — component may already be registered
          }

          const t = await getThresholds();

          const systSlider = overlay.querySelector('#systolic-slider');
          const diaSlider = overlay.querySelector('#diastolic-slider');
          const pulseSlider = overlay.querySelector('#pulse-slider');

          if (systSlider && typeof systSlider.setValues === 'function') {
            systSlider.setValues(t.systolic.min, t.systolic.max);
          } else if (systSlider) {
            systSlider.setAttribute('value-min', t.systolic.min);
            systSlider.setAttribute('value-max', t.systolic.max);
          }

          if (diaSlider && typeof diaSlider.setValues === 'function') {
            diaSlider.setValues(t.diastolic.min, t.diastolic.max);
          } else if (diaSlider) {
            diaSlider.setAttribute('value-min', t.diastolic.min);
            diaSlider.setAttribute('value-max', t.diastolic.max);
          }

          if (pulseSlider && typeof pulseSlider.setValues === 'function') {
            pulseSlider.setValues(t.pulse.min, t.pulse.max);
          } else if (pulseSlider) {
            pulseSlider.setAttribute('value-min', t.pulse.min);
            pulseSlider.setAttribute('value-max', t.pulse.max);
          }

          // Update numeric displays
          const updateDisplays = () => {
            const sMin =
              systSlider?.valueMin ?? overlay.querySelector('#systolic-min');
            const sMax =
              systSlider?.valueMax ?? overlay.querySelector('#systolic-max');
            const dMin =
              diaSlider?.valueMin ?? overlay.querySelector('#diastolic-min');
            const dMax =
              diaSlider?.valueMax ?? overlay.querySelector('#diastolic-max');
            const pMin =
              pulseSlider?.valueMin ?? overlay.querySelector('#pulse-min');
            const pMax =
              pulseSlider?.valueMax ?? overlay.querySelector('#pulse-max');

            overlay.querySelector('#systolic-min').textContent =
              systSlider?.valueMin ?? t.systolic.min;
            overlay.querySelector('#systolic-max').textContent =
              systSlider?.valueMax ?? t.systolic.max;
            overlay.querySelector('#diastolic-min').textContent =
              diaSlider?.valueMin ?? t.diastolic.min;
            overlay.querySelector('#diastolic-max').textContent =
              diaSlider?.valueMax ?? t.diastolic.max;
            overlay.querySelector('#pulse-min').textContent =
              pulseSlider?.valueMin ?? t.pulse.min;
            overlay.querySelector('#pulse-max').textContent =
              pulseSlider?.valueMax ?? t.pulse.max;
          };

          // Listen for slider changes to update displays and schedule save
          const onRangeChange = (e) => {
            const target = e.currentTarget || e.target;
            if (!target) return;
            const id = target.id;
            if (id === 'systolic-slider') {
              overlay.querySelector('#systolic-min').textContent =
                target.valueMin;
              overlay.querySelector('#systolic-max').textContent =
                target.valueMax;
            } else if (id === 'diastolic-slider') {
              overlay.querySelector('#diastolic-min').textContent =
                target.valueMin;
              overlay.querySelector('#diastolic-max').textContent =
                target.valueMax;
            } else if (id === 'pulse-slider') {
              overlay.querySelector('#pulse-min').textContent = target.valueMin;
              overlay.querySelector('#pulse-max').textContent = target.valueMax;
            }

            // schedule auto-save (debounced)
            scheduleSave();
          };

          el._sliderListeners = el._sliderListeners || [];
          if (systSlider) {
            systSlider.addEventListener('range-change', onRangeChange);
            el._sliderListeners.push({
              node: systSlider,
              handler: onRangeChange,
            });
          }
          if (diaSlider) {
            diaSlider.addEventListener('range-change', onRangeChange);
            el._sliderListeners.push({
              node: diaSlider,
              handler: onRangeChange,
            });
          }
          if (pulseSlider) {
            pulseSlider.addEventListener('range-change', onRangeChange);
            el._sliderListeners.push({
              node: pulseSlider,
              handler: onRangeChange,
            });
          }

          updateDisplays();
        } catch (e) {
          console.warn('Failed to populate settings form', e);
        }
      };

      // Auto-save helpers: read values and persist
      let _saveTimeout = null;
      const scheduleSave = () => {
        if (_saveTimeout) clearTimeout(_saveTimeout);
        _saveTimeout = setTimeout(async () => {
          try {
            const systSlider = overlay.querySelector('#systolic-slider');
            const diaSlider = overlay.querySelector('#diastolic-slider');
            const pulseSlider = overlay.querySelector('#pulse-slider');

            const sMin =
              systSlider?.valueMin ??
              parseInt(overlay.querySelector('#systolic-min')?.textContent);
            const sMax =
              systSlider?.valueMax ??
              parseInt(overlay.querySelector('#systolic-max')?.textContent);
            const dMin =
              diaSlider?.valueMin ??
              parseInt(overlay.querySelector('#diastolic-min')?.textContent);
            const dMax =
              diaSlider?.valueMax ??
              parseInt(overlay.querySelector('#diastolic-max')?.textContent);
            const pMin =
              pulseSlider?.valueMin ??
              parseInt(overlay.querySelector('#pulse-min')?.textContent);
            const pMax =
              pulseSlider?.valueMax ??
              parseInt(overlay.querySelector('#pulse-max')?.textContent);

            if (
              [sMin, sMax, dMin, dMax, pMin, pMax].some((v) => Number.isNaN(v))
            ) {
              console.warn('Skipping save: invalid threshold values');
              return;
            }

            const thresholds = {
              systolic: { min: Number(sMin), max: Number(sMax) },
              diastolic: { min: Number(dMin), max: Number(dMax) },
              pulse: { min: Number(pMin), max: Number(pMax) },
            };

            await setThresholds(thresholds);
            document.dispatchEvent(
              new CustomEvent('thresholds-updated', { detail: thresholds }),
            );
          } catch (err) {
            console.error('Auto-save failed', err);
          }
        }, 400);
      };

      const openHandler = () => {
        el._previouslyFocused = document.activeElement;
        overlay.classList.add('active');
        const first = overlay.querySelector('input');
        first && first.focus();
      };

      const overlayClickHandler = (e) => {
        if (e.target === overlay) el.close();
      };

      const keyHandler = (e) => {
        if (!overlay || !overlay.classList.contains('active')) return;
        if (e.key === 'Escape') {
          el.close();
          return;
        }
      };

      const cleanup = () => {
        closeBtn && closeBtn.removeEventListener('click', el.close);
        // cancelBtn removed — nothing to remove
        overlay && overlay.removeEventListener('click', overlayClickHandler);
        document.removeEventListener('keydown', keyHandler);
        // remove slider listeners if any
        if (el._sliderListeners && Array.isArray(el._sliderListeners)) {
          el._sliderListeners.forEach(({ node, handler }) => {
            try {
              node.removeEventListener('range-change', handler);
            } catch (e) {}
          });
          el._sliderListeners.length = 0;
        }
        if (typeof _saveTimeout !== 'undefined' && _saveTimeout) {
          clearTimeout(_saveTimeout);
          _saveTimeout = null;
        }
      };

      // No submit button — auto-save on slider change
      // Fix close button: ensure we call the element's close method when clicked
      closeBtn &&
        closeBtn.addEventListener('click', () => el.close && el.close());
      overlay && overlay.addEventListener('click', overlayClickHandler);
      document.addEventListener('keydown', keyHandler);

      el.open = openHandler;
      el.close = () => {
        if (overlay && overlay.classList.contains('active')) {
          overlay.classList.remove('active');
          if (
            el._previouslyFocused &&
            typeof el._previouslyFocused.focus === 'function'
          ) {
            el._previouslyFocused.focus();
          }
        }
        setTimeout(() => {
          try {
            el.dispose();
          } catch (e) {
            console.warn('Error disposing settings modal', e);
          }
        }, 140);
      };

      // populate and open
      populate();
      openHandler();

      el._cleanup = cleanup;
    },
    onCleanup: (el) => {
      if (el && typeof el._cleanup === 'function') el._cleanup();
    },
    autoAppend: true,
    preserveInputState: true,
  });
