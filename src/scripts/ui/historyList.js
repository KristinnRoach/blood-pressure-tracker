// UI update functions for status display and history

import { getPulseStatus } from '../analysis/bloodPressure.js';

const MAX_NUM_READINGS_TO_RENDER = 50;

export class HistoryList {
  constructor(containerId = 'history-list') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('History list container not found');
      return;
    }

    this.containerEl = container;
  }

  updateReadings(updatedReadings) {
    if (!this.containerEl) return;

    if (updatedReadings.length === 0) {
      this.containerEl.innerHTML = '<p class="empty">No readings yet</p>';
      return;
    }

    const numReadings = Math.min(
      updatedReadings.length,
      MAX_NUM_READINGS_TO_RENDER,
    );

    const readingsToShow = updatedReadings.slice(-numReadings).reverse();

    this.containerEl.innerHTML = readingsToShow
      .map((reading) => {
        const date = new Date(reading.date);
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
