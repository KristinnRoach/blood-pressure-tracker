// Main application logic

import { saveReading } from './storage.js';
import { showStatus, loadHistory, deleteReadingHandler } from './ui.js';
import { initializeVisualScales, clearIndicators } from './visualScales.js';

// Make functions available globally for onclick handlers
window.addReading = addReading;
window.deleteReadingHandler = deleteReadingHandler;

async function addReading() {
  console.log('Adding reading...'); // Console monitoring for testing

  const sys = parseInt(document.getElementById('systolic').value);
  const dia = parseInt(document.getElementById('diastolic').value);
  const pulse = parseInt(document.getElementById('pulse').value);

  console.log('Input values:', { sys, dia, pulse });

  if (!sys || !dia || !pulse) {
    alert('Please enter all three values');
    console.log('Validation failed: missing values');
    return;
  }

  const reading = {
    systolic: sys,
    diastolic: dia,
    pulse: pulse,
    date: new Date().toISOString(),
  };

  try {
    console.log('Saving reading:', reading);
    await saveReading(reading);

    // Clear input fields
    document.getElementById('systolic').value = '';
    document.getElementById('diastolic').value = '';
    document.getElementById('pulse').value = '';

    // Clear visual indicators
    clearIndicators();

    console.log('Updating UI...');
    showStatus(sys, dia, pulse);
    await loadHistory();
    console.log('Reading added successfully');
  } catch (error) {
    console.error('Error saving reading:', error);
    alert('Error saving reading. Please try again.');
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Blood Pressure Tracker initialized');
  initializeVisualScales();
  await loadHistory();
});
