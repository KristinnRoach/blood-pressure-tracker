export class ReadingInfoModal {
  constructor() {
    this.modal = null;
    this.numReadings = 0;
    this.currentDateKey = null; // track which date the modal is showing
    this.init();
    this.isOpen = () => {
      return this.modal.classList.contains('active');
    };
  }

  init() {
    const modalHTML = `
      <div class="modal-overlay" id="reading-modal">
        <div class="modal-content">
          <button class="modal-close" aria-label="Close modal">&times;</button>
          <div class="modal-body">
            <!-- Reading details will be populated here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('reading-modal');

    this.attachCloseListeners();
  }

  attachCloseListeners() {
    // Close button click
    const closeButton = this.modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => this.close());

    // Click outside modal (on overlay) to close
    this.modal.addEventListener('click', (e) => {
      if (!this.isOpen()) return;

      if (e.target === this.modal) {
        this.close();
      }
    });

    // ESC or Enter key to close
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;

      if (e.key === 'Escape' || e.key === 'Enter') {
        if (this.modal.classList.contains('active')) {
          this.close();
        }
      }
    });
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
        systolic: Math.round(this.calculateMedian(systolicValues)),
        diastolic: Math.round(this.calculateMedian(diastolicValues)),
        pulse: Math.round(this.calculateMedian(pulseValues)),
      };
    }

    // Shared date variable reused for grouped and single-reading modes.
    // For grouped readings we use the first reading's date (date-only),
    // and for a single reading we overwrite this with the full locale string.
    let date = null;
    if (readings[0] && readings[0].date) {
      // store a date-only key for the modal so updates can filter to this date
      this.currentDateKey = this.getDateKey(readings[0].date);
      if (readings.length > 1) {
        date = new Date(readings[0].date).toLocaleDateString();
      }
    }

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
        groupedSummary = `${month} ${day}${ordinalSuffix(day)} - ${
          readings.length
        } saved readings: `;
      } else {
        groupedSummary = `${readings.length} saved readings: `;
      }
    }

    // Get category for display (use median if multiple, otherwise first reading)
    const displayReading = medianReading || readings[0];
    const categoryClass = this.getCategoryClass(
      displayReading.systolic,
      displayReading.diastolic
    );
    const categoryText = this.getCategoryText(categoryClass);
    const categoryColor = `var(--color-${categoryClass})`;

    // Determine which values are abnormal
    const abnormalFlags = this.getAbnormalFlags(
      displayReading.systolic,
      displayReading.diastolic,
      displayReading.pulse
    );

    // Get individual statuses
    const statuses = this.getIndividualStatuses(
      displayReading.systolic,
      displayReading.diastolic,
      displayReading.pulse
    );

    let html = '<div class="reading-details">';

    // Show median summary if multiple readings
    if (readings.length > 1) {
      html += `
    <div class="median-label">Median</div>
        <div class="reading-main">
          <div class="reading-bp">
            <span class="${abnormalFlags.systolic ? 'abnormal' : ''}">${
        medianReading.systolic
      }</span>/<span class="${abnormalFlags.diastolic ? 'abnormal' : ''}">${
        medianReading.diastolic
      }</span>
          </div>
          <div class="reading-pulse ${abnormalFlags.pulse ? 'abnormal' : ''}">${
        medianReading.pulse
      } bpm</div>
        </div>
        <div class="reading-status-details">
          <div>Systolic: <span class="${statuses.systolicClass}">${
        statuses.systolicStatus
      }</span></div>
          <div>Diastolic: <span class="${statuses.diastolicClass}">${
        statuses.diastolicStatus
      }</span></div>
          <div>Pulse: <span class="${statuses.pulseClass}">${
        statuses.pulseStatus
      }</span></div>
        </div>

      `;

      // Show individual readings in compact format
      if (readings.length > 1) {
        html += `<div class="individual-readings">
                  <div style="text-align: center; margin-bottom: 1rem" class="readings-day-label">
                    ${
                      groupedSummary
                        ? `<div class="reading-summary">${groupedSummary}</div>`
                        : `<div class="reading-count-label">${readings.length} readings</div>`
                    }
                  </div>
                `;
        readings.forEach((reading) => {
          const time = new Date(reading.date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const flags = this.getAbnormalFlags(
            reading.systolic,
            reading.diastolic,
            reading.pulse
          );
          const systolicClass = flags.systolic ? 'abnormal-value' : '';
          const diastolicClass = flags.diastolic ? 'abnormal-value' : '';
          const pulseClass = flags.pulse ? 'abnormal-value' : '';

          html += `
            <div class="reading-item" data-id="${reading.id}">
              <span class="reading-time">${time}</span>
              <span class="reading-values-compact">
                <span class="${systolicClass}">${reading.systolic}</span>/<span class="${diastolicClass}">${reading.diastolic}</span>, <span class="${pulseClass}">${reading.pulse}</span>
              </span>
              <button class="delete" onclick="window.deleteReadingById(${reading.id})">Delete</button>
            </div>
          `;
        });
        html += '</div>';
      }
    } else {
      // Single reading - show large and clear
      const reading = readings[0];
      // Overwrite shared `date` with a full localized date/time string
      date = new Date(reading.date).toLocaleString();
      html += `
        <div class="reading-main">
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
          <div>Pulse: <span class="${statuses.pulseClass}">${
        statuses.pulseStatus
      }</span></div>
        </div>
        <div style="margin-top:12px">
          <button class="delete" onclick="window.deleteReadingById(${
            reading.id
          })">Delete</button>
        </div>
      `;
    }

    html += '</div>';
    modalBody.innerHTML = html;

    // Show modal by adding active class
    this.modal.classList.add('active');

    // Set focus to modal for accessibility
    this.modal.setAttribute('tabindex', '-1');
    this.modal.focus();
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
            (r) =>
              r && r.date && this.getDateKey(r.date) === this.currentDateKey
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
    this.modal.classList.remove('active');
    this.currentDateKey = null;
  }

  getDateKey(date) {
    try {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (e) {
      return null;
    }
  }

  calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  getAbnormalFlags(systolic, diastolic, pulse) {
    return {
      systolic: systolic >= 120,
      diastolic: diastolic >= 80,
      pulse: pulse < 60 || pulse > 100,
    };
  }

  getCategoryClass(systolic, diastolic) {
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
    let systolicStatus = 'Normal';
    let systolicClass = 'status-normal';
    if (systolic >= 180) {
      systolicStatus = 'Critical';
      systolicClass = 'status-critical';
    } else if (systolic >= 140) {
      systolicStatus = 'High';
      systolicClass = 'status-high';
    } else if (systolic >= 130) {
      systolicStatus = 'Elevated';
      systolicClass = 'status-elevated';
    } else if (systolic >= 120) {
      systolicStatus = 'Elevated';
      systolicClass = 'status-elevated';
    }

    let diastolicStatus = 'Normal';
    let diastolicClass = 'status-normal';
    if (diastolic >= 120) {
      diastolicStatus = 'Critical';
      diastolicClass = 'status-critical';
    } else if (diastolic >= 90) {
      diastolicStatus = 'High';
      diastolicClass = 'status-high';
    } else if (diastolic >= 80) {
      diastolicStatus = 'Elevated';
      diastolicClass = 'status-elevated';
    }

    let pulseStatus = 'Normal';
    let pulseClass = 'status-normal';
    if (pulse < 60) {
      pulseStatus = 'Low';
      pulseClass = 'status-low';
    } else if (pulse > 100) {
      pulseStatus = 'High';
      pulseClass = 'status-high';
    }

    return {
      systolicStatus,
      systolicClass,
      diastolicStatus,
      diastolicClass,
      pulseStatus,
      pulseClass,
    };
  }
}
