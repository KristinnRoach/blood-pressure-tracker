import { getCategory } from '../analysis/bloodPressure.js';
import { calculateMedian } from '../helpers/calculateMedian.js';
import { getLocalDateKey } from '../helpers/localDate.js';
import { AddReadingModal } from './addReadingModal.js';

export class Calendar {
  constructor(containerId, modal) {
    this.container = document.getElementById(containerId);
    this.currentMonth = new Date();
    this.readingsByDate = new Map();
    this.modal = modal;
    this.selectedDate = getLocalDateKey(this.currentMonth);
    this.container.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;

      if (button.dataset.date) {
        this.handleDayClick(button);
      } else if (button.id === 'prev-month' || button.id === 'next-month') {
        if (button.id === 'prev-month') this.prevMonth();
        else this.nextMonth();
        this.container.querySelector(`#${button.id}`).focus();
      }
    });
  }

  updateReadings(readings) {
    const focusedDate = this.container.querySelector('button[data-date]:focus')?.dataset.date;

    // Group readings by date (YYYY-MM-DD format) - store arrays of readings
    this.readingsByDate = new Map();
    readings.forEach((reading) => {
      const dateKey = getLocalDateKey(new Date(reading.date));

      // Push reading into array for this date
      if (!this.readingsByDate.has(dateKey)) {
        this.readingsByDate.set(dateKey, []);
      }
      this.readingsByDate.get(dateKey).push(reading);
    });
    this.render();
    if (focusedDate) {
      this.container.querySelector(`button[data-date="${focusedDate}"]`)?.focus();
    }
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
        <button type="button" class="calendar-nav-btn" id="prev-month" aria-label="Previous month">&lt;</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button type="button" class="calendar-nav-btn" id="next-month" aria-label="Next month">&gt;</button>
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
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
        2,
        '0',
      )}`;
      const isFuture = new Date(`${dateKey}T00:00:00`) > todayMidnight;
      const futureClass = isFuture ? ' future' : '';
      const futureAttr = isFuture ? ' disabled' : '';
      const readings = this.readingsByDate.get(dateKey);
      const count = readings?.length ?? 0;
      const dateLabel = `${monthNames[month]} ${day}, ${year}`;
      const actionLabel = count
        ? `${dateLabel}, ${count} saved ${count === 1 ? 'reading' : 'readings'}`
        : `${dateLabel}, add reading`;
      const buttonAttrs = `type="button" data-date="${dateKey}" aria-label="${actionLabel}"${futureAttr}`;

      if (readings && readings.length > 0) {
        // Calculate median values for color coding
        const medianReading = this.getMedianReading(readings);
        const category = getCategory(medianReading.systolic, medianReading.diastolic);
        const categoryClass =
          category && category.class
            ? category.class
            : this.getCategoryClass(medianReading.systolic, medianReading.diastolic);

        // Show count if multiple readings
        const countBadge =
          readings.length > 1 ? `<span class="reading-count">${readings.length}</span>` : '';

        const activeClass = this.selectedDate === dateKey ? ' active' : '';
        html += `
          <button class="calendar-day has-reading${activeClass}${futureClass}" ${buttonAttrs} data-category="${categoryClass}" style="background-color: var(--color-${categoryClass})">
            <span class="day-number">${day}</span>
            ${countBadge}
          </button>
        `;
      } else {
        // Always include a data-date on actual month days so they can be clicked
        const activeClass = this.selectedDate === dateKey ? ' active' : '';
        html += `
          <button class="calendar-day${activeClass}${futureClass}" ${buttonAttrs}>
            <span class="day-number">${day}</span>
          </button>
        `;
      }
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  getMedianReading(readings) {
    if (readings.length === 0) return null;
    if (readings.length === 1) return readings[0];

    const systolicValues = readings.map((r) => r.systolic);
    const diastolicValues = readings.map((r) => r.diastolic);
    const pulseValues = readings.map((r) => r.pulse);

    return {
      systolic: Math.round(calculateMedian(systolicValues)),
      diastolic: Math.round(calculateMedian(diastolicValues)),
      pulse: Math.round(calculateMedian(pulseValues)),
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

  handleDayClick(button) {
    const dateKey = button.dataset.date;
    const readings = this.readingsByDate.get(dateKey);

    this.container.querySelector('.calendar-day.active')?.classList.remove('active');
    this.selectedDate = dateKey;
    button.classList.add('active');
    button.focus();

    if (readings?.length) this.modal.open(readings);
    else AddReadingModal(dateKey);
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1,
    );
    this.render();
  }

  prevMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1,
    );
    this.render();
  }
}
