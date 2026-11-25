import { getCategory, getPulseStatus } from '../analysis/bloodPressure.js';
import { getThresholdsSync } from '../storage.js';
import { calculateMedian } from '../helpers/calculateMedian.js';
import { AddReadingModal } from './addReadingModal.js';
import { configureReadingDialog, readingDialogTag } from './readingDialog.js';

export class ReadingInfoModal {
  constructor() {
    this.modal = null;
    this.numReadings = 0;
    this.currentDateKey = null; // track which date the modal is showing
    this.init();
  }

  init() {
    const modalHTML = `
      <${readingDialogTag} class="reading-dialog" id="reading-modal" aria-label="Reading details" closedby="any">
        <div class="modal-content">
          <button type="button" class="modal-close" aria-label="Close reading details" autofocus>&times;</button>
          <div class="modal-body"></div>
        </div>
      </${readingDialogTag}>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('reading-modal');
    this.dialogControls = configureReadingDialog(this.modal);
    this.closeButton = this.modal.querySelector('.modal-close');
    this.closeButton.addEventListener('click', () => this.close());
  }

  isOpen() {
    return this.modal.hasAttribute('open');
  }

  open(readingOrReadings) {
    const modalBody = this.modal.querySelector('.modal-body');

    // Check if it's an array of readings or single reading
    const isArray = Array.isArray(readingOrReadings);
    const readings = isArray ? readingOrReadings : [readingOrReadings];

    const count = isArray ? readings.length : 1;
    this.numReadings = count;

    if (readings.length === 0) return;

    // Calculate median if multiple readings
    let medianReading = null;
    if (readings.length > 1) {
      const systolicValues = readings.map((r) => r.systolic);
      const diastolicValues = readings.map((r) => r.diastolic);
      const pulseValues = readings.map((r) => r.pulse);

      medianReading = {
        systolic: Math.round(calculateMedian(systolicValues)),
        diastolic: Math.round(calculateMedian(diastolicValues)),
        pulse: Math.round(calculateMedian(pulseValues)),
      };
    }

    // Keep the day selected when the details are refreshed.
    this.currentDateKey = readings[0].date ? this.getDateKey(readings[0].date) : null;

    // Helper for ordinal suffixes (1st, 2nd, 3rd, 4th...)
    const ordinalSuffix = (n) => {
      const s = n % 100;
      if (s >= 11 && s <= 13) return 'th';
      switch (n % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };

    // Build a compact one-line summary for grouped readings like
    // "November 5th: 3 saved readings". If date is missing, just show the count.
    let groupedSummary = null;
    if (readings.length > 1) {
      if (readings[0] && readings[0].date) {
        const d = new Date(readings[0].date);
        const month = d.toLocaleString(undefined, { month: 'long' });
        const day = d.getDate();
        groupedSummary = `${month} ${day}${ordinalSuffix(day)} - ${readings.length} saved readings`;
      } else {
        groupedSummary = `${readings.length} saved readings`;
      }
    }

    // Get category for display (use median if multiple, otherwise first reading)
    const displayReading = medianReading || readings[0];
    const category = getCategory(displayReading.systolic, displayReading.diastolic);
    const categoryClass = category.class;
    const categoryText = category.text || this.getCategoryText(categoryClass);
    const categoryColor = `var(--color-${categoryClass})`;

    // Determine which values are abnormal
    const abnormalFlags = this.getAbnormalFlags(
      displayReading.systolic,
      displayReading.diastolic,
      displayReading.pulse,
    );

    // Get individual statuses (pulse uses analysis helper)
    const statuses = this.getIndividualStatuses(
      displayReading.systolic,
      displayReading.diastolic,
      displayReading.pulse,
    );

    let html = '<div class="reading-details">';

    if (readings.length === 1) {
      // Single reading - show large and clear
      const reading = readings[0];
      const date = new Date(reading.date).toLocaleString();
      html += `
        <div class="reading-single">
          <div class="reading-bp">
            <span class="${abnormalFlags.systolic ? 'abnormal' : ''}">${
              reading.systolic
            }</span>/<span class="${abnormalFlags.diastolic ? 'abnormal' : ''}">${
              reading.diastolic
            }</span>
          </div>
          <div class="reading-pulse ${abnormalFlags.pulse ? 'abnormal' : ''}">${
            reading.pulse
          } bpm</div>
          <div class="reading-time-single">${date}</div>
        </div>
        <div class="reading-status-details">
          <div>Systolic: <span class="${statuses.systolicClass}">${
            statuses.systolicStatus
          }</span></div>
          <div>Diastolic: <span class="${statuses.diastolicClass}">${
            statuses.diastolicStatus
          }</span></div>
          <div>Pulse: <span class="${statuses.pulseClass}">${statuses.pulseStatus}</span></div>
        </div>
          <div class="add-delete-btns">
            <button class="add-reading-btn" type="button">Add</button>
            <button class="delete-reading-btn" onclick="window.deleteReadingById(${
              reading.id
            })">Delete</button>
        </div>
      `;
    }

    // Show individual readings in compact format
    if (readings.length > 1) {
      html += `<div class="individual-readings">
                  <div class="readings-day-top">
                    ${
                      groupedSummary
                        ? `<div class="readings-day-header">${groupedSummary}</div>`
                        : `<div class="reading-count-label">${readings.length} readings</div>`
                    }
                    <div style="margin-top:12px">
                      <button class="add-reading-btn" type="button">Add</button>
                    </div>
                  </div>
                `;
      readings.forEach((reading) => {
        const time = new Date(reading.date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const flags = this.getAbnormalFlags(reading.systolic, reading.diastolic, reading.pulse);
        const systolicClass = flags.systolic ? 'abnormal-value' : '';
        const diastolicClass = flags.diastolic ? 'abnormal-value' : '';
        const pulseClass = flags.pulse ? 'abnormal-value' : '';

        html += `
            <div class="reading-item" data-id="${reading.id}">
              <span class="reading-time">${time}</span>
              <span class="reading-values-compact">
                <span class="${systolicClass}">${reading.systolic}</span>/<span class="${diastolicClass}">${reading.diastolic}</span>, <span class="${pulseClass}">${reading.pulse}</span>
              </span>
              <button class="delete-reading-btn" onclick="window.deleteReadingById(${reading.id})">Delete</button>
            </div>
          `;
      });
      html += '</div>';

      // Separator
      html += '<hr class="reading-separator" />';

      // Show median summary if multiple readings
      html += `
      <div class="reading-summary-section">
        <div class="reading-summary-label">Summary (median)</div>
        <div class="reading-summary-content">
        
        <div class="reading-summary-values">
        <div class="reading-bp">
              <span class="${abnormalFlags.systolic ? 'abnormal' : ''}">${
                medianReading.systolic
              }</span>/<span class="${abnormalFlags.diastolic ? 'abnormal' : ''}">${
                medianReading.diastolic
              }</span>
            </div>
            <div class="reading-pulse ${
              abnormalFlags.pulse ? 'abnormal' : ''
            }">${medianReading.pulse} bpm</div>
      </div>
      
      <div class="reading-status-details">
            <div>Systolic: <span class="${statuses.systolicClass}">${
              statuses.systolicStatus
            }</span></div>
            <div>Diastolic: <span class="${statuses.diastolicClass}">${
              statuses.diastolicStatus
            }</span></div>
            <div>Pulse: <span class="${statuses.pulseClass}">${statuses.pulseStatus}</span></div>
          </div>
        </div>
     </div>
      `;
    }

    html += '</div>';
    const hadFocus = modalBody.contains(document.activeElement);
    modalBody.innerHTML = html;
    modalBody.querySelector('.add-reading-btn')?.addEventListener('click', () => {
      AddReadingModal(this.currentDateKey);
    });

    if (!this.isOpen()) this.dialogControls.open();
    else if (hadFocus) this.closeButton.focus();
  }

  // Refresh modal contents when readings change
  updateReadings(readings) {
    if (!this.modal || !this.isOpen()) return;

    // If the modal is open, re-render with the new readings. If there
    // are no readings, close the modal so UI stays consistent.
    try {
      if (Array.isArray(readings)) {
        // If the modal is currently showing a specific date, filter incoming
        // readings to only those matching that date. This keeps the modal
        // focused on the date the user interacted with (e.g. added a reading).
        let filtered = readings;
        if (this.currentDateKey) {
          filtered = readings.filter(
            (r) => r && r.date && this.getDateKey(r.date) === this.currentDateKey,
          );
        }

        if (filtered.length === 0) {
          this.close();
        } else {
          this.open(filtered);
        }
      } else if (readings) {
        this.open(readings);
      }
    } catch (e) {
      console.error('ReadingInfoModal.updateReadings error', e);
    }
  }

  close() {
    this.dialogControls.close();
    this.currentDateKey = null;
  }

  getDateKey(date) {
    try {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (e) {
      return null;
    }
  }

  getAbnormalFlags(systolic, diastolic, pulse) {
    const thresholds = getThresholdsSync();
    const sMax = thresholds?.systolic?.max ?? 120;
    const sMin = thresholds?.systolic?.min ?? 90;
    const dMax = thresholds?.diastolic?.max ?? 80;
    const dMin = thresholds?.diastolic?.min ?? 60;
    const pMax = thresholds?.pulse?.max ?? 100;
    const pMin = thresholds?.pulse?.min ?? 60;

    return {
      // Treat configured `min`/`max` as inclusive bounds for 'normal', so
      // values strictly below `min` or strictly above `max` are abnormal.
      systolic: systolic > sMax || systolic < sMin,
      diastolic: diastolic > dMax || diastolic < dMin,
      pulse: pulse < pMin || pulse > pMax,
    };
  }

  getCategoryClass(systolic, diastolic) {
    // Keep fallback behaviour for callers that still use this helper
    if (systolic >= 180 || diastolic >= 120) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'high2';
    if (systolic >= 130 || diastolic >= 80) return 'high1';
    if (systolic >= 120) return 'elevated';
    return 'normal';
  }

  getCategoryText(categoryClass) {
    const texts = {
      normal: 'Normal',
      elevated: 'Elevated',
      high1: 'High Blood Pressure (Stage 1)',
      high2: 'High Blood Pressure (Stage 2)',
      critical: 'Hypertensive Crisis',
    };
    return texts[categoryClass] || 'Unknown';
  }

  getIndividualStatuses(systolic, diastolic, pulse) {
    const thresholds = getThresholdsSync();
    const sMax = thresholds?.systolic?.max ?? 140;
    const sMin = thresholds?.systolic?.min ?? 90;
    const dMax = thresholds?.diastolic?.max ?? 90;
    const dMin = thresholds?.diastolic?.min ?? 60;

    let systolicStatus = 'Normal';
    let systolicClass = 'status-normal';
    if (systolic > sMax) {
      systolicStatus = 'High';
      systolicClass = 'status-high';
    } else if (systolic < sMin) {
      systolicStatus = 'Low';
      systolicClass = 'status-low';
    }

    let diastolicStatus = 'Normal';
    let diastolicClass = 'status-normal';
    if (diastolic > dMax) {
      diastolicStatus = 'High';
      diastolicClass = 'status-high';
    } else if (diastolic < dMin) {
      diastolicStatus = 'Low';
      diastolicClass = 'status-low';
    }

    const pulseStatusText = getPulseStatus(pulse);
    let pulseClass = 'status-normal';
    // TODO: Review pulse severity handling. `getPulseStatus` currently returns
    // simple 'Low'/'Normal'/'High'. The regex below also looks for 'Very' and
    // 'CRITICAL' keywords which are not currently returned. Either restore
    // granular messages in `getPulseStatus` or change this UI to derive severity
    // from numeric pulse thresholds directly.
    if (/CRITICAL|Very High|High/i.test(pulseStatusText)) pulseClass = 'status-high';
    if (/Low|Very Low/i.test(pulseStatusText)) pulseClass = 'status-low';

    return {
      systolicStatus,
      systolicClass,
      diastolicStatus,
      diastolicClass,
      pulseStatus: pulseStatusText,
      pulseClass,
    };
  }
}
