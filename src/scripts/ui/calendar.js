export class Calendar {
  constructor(containerId = 'calendar-container') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentMonth = new Date();
    this.readings = [];
    this.readingsByDate = new Map();
    this.modal = null;
    this.selectedDate = null;
  }

  async init(modal) {
    this.modal = modal;
    await this.loadReadings();
    this.render();
  }

  async loadReadings(readingsOverride = null) {
    if (readingsOverride) {
      this.readings = readingsOverride;
    } else {
      // Import storage dynamically to avoid circular dependencies
      const { getReadings } = await import('../storage.js');
      this.readings = await getReadings();
    }

    // Group readings by date (YYYY-MM-DD format) - store arrays of readings
    this.readingsByDate = new Map();
    this.readings.forEach((reading) => {
      const date = new Date(reading.date);
      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // Push reading into array for this date
      if (!this.readingsByDate.has(dateKey)) {
        this.readingsByDate.set(dateKey, []);
      }
      this.readingsByDate.get(dateKey).push(reading);
    });
  }

  async updateReadings(updatedReadings) {
    await this.loadReadings(updatedReadings);
    this.render();
  }

  render() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Build calendar HTML
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    let html = `
      <div class="calendar-header">
        <button class="calendar-nav" id="prev-month">&lt;</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button class="calendar-nav" id="next-month">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-header">Sun</div>
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
    `;

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const readings = this.readingsByDate.get(dateKey);

      if (readings && readings.length > 0) {
        // Calculate median values for color coding
        const medianReading = this.getMedianReading(readings);
        const categoryClass = this.getCategoryClass(
          medianReading.systolic,
          medianReading.diastolic
        );

        // Show count if multiple readings
        const countBadge =
          readings.length > 1
            ? `<span class="reading-count">${readings.length}</span>`
            : '';

        const activeClass = this.selectedDate === dateKey ? ' active' : '';
        html += `
          <div class="calendar-day has-reading${activeClass}" data-date="${dateKey}" style="background-color: var(--color-${categoryClass})">
            <span class="day-number">${day}</span>
            ${countBadge}
          </div>
        `;
      } else {
        // Always include a data-date on actual month days so they can be clicked
        const activeClass = this.selectedDate === dateKey ? ' active' : '';
        html += `
          <div class="calendar-day${activeClass}" data-date="${dateKey}">
            <span class="day-number">${day}</span>
          </div>
        `;
      }
    }

    html += '</div>';
    this.container.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners();
  }

  calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  getMedianReading(readings) {
    if (readings.length === 0) return null;
    if (readings.length === 1) return readings[0];

    const systolicValues = readings.map((r) => r.systolic);
    const diastolicValues = readings.map((r) => r.diastolic);
    const pulseValues = readings.map((r) => r.pulse);

    return {
      systolic: Math.round(this.calculateMedian(systolicValues)),
      diastolic: Math.round(this.calculateMedian(diastolicValues)),
      pulse: Math.round(this.calculateMedian(pulseValues)),
    };
  }

  getCategoryClass(systolic, diastolic) {
    // Simple category determination for MVP
    if (systolic >= 180 || diastolic >= 120) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'high2';
    if (systolic >= 130 || diastolic >= 80) return 'high1';
    if (systolic >= 120) return 'elevated';
    return 'normal';
  }

  attachEventListeners() {
    // Navigation buttons
    document
      .getElementById('prev-month')
      ?.addEventListener('click', () => this.prevMonth());
    document
      .getElementById('next-month')
      ?.addEventListener('click', () => this.nextMonth());

    // Day clicks - include all actual month days (those with a data-date attribute)
    document.querySelectorAll('.calendar-day[data-date]').forEach((dayEl) => {
      dayEl.addEventListener('click', (e) => {
        const date = e.currentTarget.dataset.date;
        this.handleDayClick(date);
      });
    });
  }

  async handleDayClick(dateKey) {
    const readings = this.readingsByDate.get(dateKey);
    console.log('handleDayClick', dateKey, readings, this.modal);

    // pre-fill any existing date input (if present in DOM)
    const dateInputEl = document.getElementById('reading-date');
    if (dateInputEl) dateInputEl.value = dateKey;

    // Update selection
    this.selectedDate = dateKey;
    // Re-render to update active visuals (safe because the container is replaced and listeners re-attached)
    this.render();

    if (readings && readings.length > 0 && this.modal) {
      // Pass all readings to modal (existing reading info display)
      this.modal.open(readings);
    } else {
      // No readings on this day — open AddReadingModal with the clicked date prefilled
      try {
        const { AddReadingModal } = await import('./addReadingModal.js');
        const newModal = AddReadingModal();
        if (newModal && typeof newModal.open === 'function') {
          newModal.open(dateKey);
        }
      } catch (err) {
        console.error('Error opening AddReadingModal for date:', dateKey, err);
      }
    }
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

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.render();
  }

  prevMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.render();
  }
}
