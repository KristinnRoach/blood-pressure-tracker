export class Calendar {
  constructor(containerId = 'calendar-container') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentMonth = new Date();
    this.readings = [];
    this.readingsByDate = new Map();
    this.modal = null;
  }

  async init(modal) {
    this.modal = modal;
    await this.loadReadings();
    this.render();

    // Update charts with readings data
    const { updateCharts } = await import('./charts.js');
    updateCharts(this.readings);
  }

  async loadReadings() {
    // Import storage dynamically to avoid circular dependencies
    const { getReadings } = await import('./storage.js');
    this.readings = await getReadings();

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

        html += `
          <div class="calendar-day has-reading" data-date="${dateKey}" style="background-color: var(--color-${categoryClass})">
            <span class="day-number">${day}</span>
            ${countBadge}
          </div>
        `;
      } else {
        html += `
          <div class="calendar-day">
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

    // Day clicks
    document.querySelectorAll('.calendar-day.has-reading').forEach((dayEl) => {
      dayEl.addEventListener('click', (e) => {
        const date = e.currentTarget.dataset.date;
        this.handleDayClick(date);
      });
    });
  }

  handleDayClick(dateKey) {
    const readings = this.readingsByDate.get(dateKey);
    if (readings && readings.length > 0 && this.modal) {
      // Pass all readings to modal
      this.modal.show(readings);
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
