// UI update functions for status display and history

import { getCategory, getPulseStatus } from '../analysis/bloodPressure.js';

export class HistoryList {
  constructor(containerId = 'history-list') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('History list container not found');
      return;
    }

    this.containerEl = container;
    this.containerId = containerId;
    this.readings = [];
  }

  async init(readings) {
    this.readings = readings || [];
    await this.updateReadings(this.readings);
  }

  async updateReadings(updatedReadings) {
    if (!this.containerEl) return;

    if (updatedReadings.length === 0) {
      this.containerEl.innerHTML = '<p>No readings yet</p>';
      return;
    }

    this.containerEl.innerHTML = updatedReadings
      .map((reading) => {
        const date = new Date(reading.date);
        const category = getCategory(reading.systolic, reading.diastolic);
        const pulseStatus = getPulseStatus(reading.pulse);
        return `
          <div class="entry">
            <div>
              <strong>${reading.systolic}/${reading.diastolic}</strong> mmHg, ${
          reading.pulse
        } bpm (${pulseStatus})<br>
              <small>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</small>
            </div>
            <button class="delete" onclick="window.deleteReadingById(${
              reading.id
            })">Delete</button>
          </div>
        `;
      })
      .join('');
  }
}
