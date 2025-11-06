// Main application logic

import { saveReading } from './storage.js';
import { showStatus, loadHistory, deleteReadingHandler } from './ui.js';

// Make functions available globally for onclick handlers
window.addReading = addReading;
window.deleteReadingHandler = deleteReadingHandler;

function addReading() {
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

  console.log('Saving reading:', reading);
  saveReading(reading);

  // Clear input fields
  document.getElementById('systolic').value = '';
  document.getElementById('diastolic').value = '';
  document.getElementById('pulse').value = '';

  console.log('Updating UI...');
  showStatus(sys, dia, pulse);
  loadHistory();
  console.log('Reading added successfully');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('Blood Pressure Tracker initialized');
  loadHistory();
});
