// UI update functions for status display and history

import { getCategory, getPulseStatus } from './bloodPressure.js';
import { getReadings, deleteReading } from './storage.js';

export function showStatus(sys, dia, pulse) {
  const category = getCategory(sys, dia);
  const pulseStatus = getPulseStatus(pulse);
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'status ' + category.class;
  statusDiv.innerHTML = `
    <strong>${category.text}</strong><br>
    ${sys}/${dia} mmHg<br>
    Pulse: ${pulse} bpm (${pulseStatus})
  `;
}

export async function loadHistory() {
  try {
    const history = await getReadings();
    const historyDiv = document.getElementById('history');

    if (history.length === 0) {
      historyDiv.innerHTML = '<p>No readings yet</p>';
      return;
    }

    historyDiv.innerHTML = history
      .map((reading, index) => {
        const date = new Date(reading.date);
        const category = getCategory(reading.systolic, reading.diastolic);
        return `
          <div class="entry">
            <div>
              <strong>${reading.systolic}/${reading.diastolic}</strong> mmHg, ${
          reading.pulse
        } bpm<br>
              <small>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</small>
            </div>
            <button class="delete" onclick="window.deleteReadingHandler(${index})">Delete</button>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Error loading history:', error);
    document.getElementById('history').innerHTML =
      '<p>Error loading readings</p>';
  }
}

export async function deleteReadingHandler(index) {
  try {
    await deleteReading(index);
    await loadHistory();
  } catch (error) {
    console.error('Error deleting reading:', error);
    alert('Error deleting reading. Please try again.');
  }
}
