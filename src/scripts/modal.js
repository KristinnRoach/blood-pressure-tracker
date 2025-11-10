export class ReadingInfoModal {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    // Create modal DOM structure
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

    // Add modal to document body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('reading-modal');

    // Attach event listeners for close functionality
    this.attachCloseListeners();
  }

  attachCloseListeners() {
    // Close button click
    const closeButton = this.modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => this.hide());

    // Click outside modal (on overlay) to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.hide();
      }
    });
  }

  show(readingOrReadings) {
    const modalBody = this.modal.querySelector('.modal-body');

    // Check if it's an array of readings or single reading
    const isArray = Array.isArray(readingOrReadings);
    const readings = isArray ? readingOrReadings : [readingOrReadings];

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
          <div class="reading-count-label">${readings.length} readings</div>
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
        html += '<div class="individual-readings">';
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
      const time = new Date(reading.date).toLocaleString();
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
          <div class="reading-time-single">${time}</div>
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

  hide() {
    // Hide modal by removing active class
    this.modal.classList.remove('active');
  }
}
