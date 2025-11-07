// Main application logic

import { saveReading } from './storage.js';
import { showStatus, loadHistory, deleteReadingHandler } from './ui.js';
import { initializeVisualScales, clearIndicators } from './visualScales.js';
import { initializeCharts } from './charts.js';
import { initializePWA, setupOfflineHandling } from './pwa.js';
import { generateDummyData, shouldGenerateDummyData } from './dummyData.js';
import { initTheme } from './theme.js';

// Make functions available globally for onclick handlers
window.addReading = addReading;
window.deleteReadingHandler = deleteReadingHandler;
window.generateDummyDataHandler = generateDummyDataHandler;

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

async function generateDummyDataHandler() {
  console.log('Generating dummy data...');

  try {
    const count = await generateDummyData();

    // Refresh the UI to show new data
    await loadHistory();

    alert(
      `Successfully added ${count} dummy readings for development testing!`
    );
    console.log('Dummy data generation completed');
  } catch (error) {
    console.error('Error generating dummy data:', error);
    alert('Error generating dummy data. Check console for details.');
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Blood Pressure Tracker initialized');

  // Initialize theme first (before any UI rendering)
  initTheme();

  // Show dummy data button only in development
  if (shouldGenerateDummyData()) {
    const dummyDataBtn = document.getElementById('dev-dummy-data-btn');
    if (dummyDataBtn) {
      dummyDataBtn.style.display = 'inline-block';
      console.log('Development mode: Dummy data button enabled');
    }
  }

  // Initialize PWA features
  initializePWA();
  setupOfflineHandling();

  // Initialize app components
  initializeVisualScales();
  initializeCharts();
  await loadHistory();
});
