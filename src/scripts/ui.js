// UI update functions for status display and history

import { getCategory, getPulseStatus } from './bloodPressure.js';
import { getReadings, deleteReading } from './storage.js';
import { updateCharts } from './charts.js';
import { ReadingInfoModal } from './modal.js';

// Create modal instance on module load
const modal = new ReadingInfoModal();

export function showStatus(sys, dia, pulse) {
  const category = getCategory(sys, dia);
  const pulseStatus = getPulseStatus(pulse);

  // Prepare reading data for modal
  const reading = {
    systolic: sys,
    diastolic: dia,
    pulse: pulse,
    date: new Date().toISOString(),
    category: category,
  };

  // Show modal with reading data
  modal.show(reading);
}

export async function loadHistory() {
  try {
    const history = await getReadings();
    const historyDiv = document.getElementById('history');

    if (history.length === 0) {
      historyDiv.innerHTML = '<p>No readings yet</p>';
      // Update charts with empty data
      updateCharts([]);
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

    // Update charts with current data
    updateCharts(history);
  } catch (error) {
    console.error('Error loading history:', error);
    document.getElementById('history').innerHTML =
      '<p>Error loading readings</p>';
    // Update charts with empty data on error
    updateCharts([]);
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
