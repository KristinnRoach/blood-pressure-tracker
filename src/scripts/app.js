// app.js

import {
  deleteReadingById,
  setCurrentUser,
  clearCurrentUser,
  getCurrentUserSync,
} from './storage.js';
import { initializeVisualScales } from './ui/visualScales.js';
import { initializeCharts } from './ui/chart.js';
import { initializePWA, setupOfflineHandling } from './pwa.js';
import {
  generateDummyData,
  shouldGenerateDummyData,
} from './helpers/dummyData.js';
import { initTheme } from './ui/theme.js';
import { Calendar } from './ui/calendar.js';
import { HistoryList } from './ui/historyList.js';
import { ReadingInfoModal } from './ui/modal.js';
import { UndoRedoManager } from './helpers/UndoRedoManager.js';
import { AddReadingModal } from './ui/addReadingModal.js';

// Create calendar and modal instances
let calendar = null;
let modal = null;
let historyList = null;
let chart = null;

// Create undo / redo manager
const undoRedo = new UndoRedoManager(null);

// Make functions available globally for onclick handlers
window.deleteReadingById = deleteReadingByIdHandler;
window.generateDummyDataHandler = generateDummyDataHandler;

export async function deleteReadingByIdHandler(id) {
  try {
    //  if (!confirm('Delete this reading? This action cannot be undone.')) return;

    // Update UndoRedoManager: snapshot the reading being deleted so we can restore it
    try {
      const { getReadingById } = await import('./storage.js');
      const deletedReading = await getReadingById(id);
      if (deletedReading) {
        // Clone to avoid accidental mutation
        let snapshot;
        try {
          snapshot =
            typeof structuredClone === 'function'
              ? structuredClone(deletedReading)
              : JSON.parse(JSON.stringify(deletedReading));
        } catch (e) {
          snapshot = JSON.parse(JSON.stringify(deletedReading));
        }
        // Clear undo stack and set the deleted reading as current (one-level undo only)
        undoRedo.undoStack.length = 0;
        undoRedo.redoStack.length = 0;
        undoRedo.current = snapshot;
      }
    } catch (e) {
      console.warn('Failed to snapshot reading for undo:', e);
    }

    await deleteReadingById(id);

    document.dispatchEvent(new CustomEvent('readings-updated')); // Notify all ui components to refresh

    document.dispatchEvent(
      // Notify UI that a specific reading was deleted so modals can close if needed
      new CustomEvent('reading-deleted', { detail: { id } })
    );
  } catch (error) {
    console.error('Error deleting reading by id:', error);
    alert('Error deleting reading. Please try again.');
  }
}

async function updateUIReadings() {
  const { getReadings } = await import('./storage.js');
  const updatedReadings = await getReadings();

  // Update snapshot only if current is not a single-reading pending undo
  // (A single reading has `id`, `systolic`, etc.; an array does not)
  const current = undoRedo.get();
  if (!current || Array.isArray(current)) {
    undoRedo.setSnapshot(updatedReadings);
  }

  if (historyList && typeof historyList.updateReadings === 'function') {
    await historyList.updateReadings(updatedReadings);
  }

  if (calendar && typeof calendar.updateReadings === 'function') {
    await calendar.updateReadings(updatedReadings);
  }

  if (modal && typeof modal.updateReadings === 'function') {
    modal.updateReadings(updatedReadings);
  }

  const { updateCharts } = await import('./ui/chart.js');
  updateCharts && updateCharts(updatedReadings);
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

  modal = new ReadingInfoModal();

  calendar = new Calendar('calendar-container');
  await calendar.init(modal);

  historyList = new HistoryList('history-list');
  await historyList.init();

  // Default the date picker to today. Format is YYYY-MM-DD which matches <input type="date">.
  const readingDateInput = document.getElementById('reading-date');
  if (readingDateInput && !readingDateInput.value) {
    readingDateInput.value = new Date().toISOString().slice(0, 10);
  }

  await updateUIReadings(); // Fetch initial readings and update UI

  // User select dropdown
  const userSelect = document.getElementById('user-select');
  const addUserBtn = document.getElementById('add-user-btn');

  async function populateUserSelect() {
    const { getAllUsers } = await import('./storage.js');
    const users = await getAllUsers();
    const current = getCurrentUserSync();

    // Clear existing options except the first one (No User)
    while (userSelect.options.length > 1) {
      userSelect.remove(1);
    }

    // Add existing users
    users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.username;
      userSelect.appendChild(option);
    });

    // Set current selection
    if (current && current.id != null) {
      userSelect.value = current.id;
    } else {
      userSelect.value = '';
    }
  }

  await populateUserSelect();

  userSelect.addEventListener('change', async (e) => {
    const value = e.target.value;

    if (value === '') {
      // No user selected
      clearCurrentUser();
      document.dispatchEvent(new CustomEvent('readings-updated'));
    } else {
      // Select existing user
      const { getAllUsers } = await import('./storage.js');
      const users = await getAllUsers();
      const user = users.find((u) => u.id === parseInt(value));
      if (user) {
        await setCurrentUser(user.username);
        document.dispatchEvent(new CustomEvent('readings-updated'));
      }
    }
  });

  addUserBtn.addEventListener('click', async () => {
    const name = prompt('Enter username');
    if (name && name.trim()) {
      try {
        await setCurrentUser(name.trim());
        await populateUserSelect();
        document.dispatchEvent(new CustomEvent('readings-updated'));
      } catch (err) {
        console.error('Failed to set current user', err);
      }
    }
  });

  let readingFormModal = null;

  const newReadingBtn = document.getElementById('new-reading-btn');
  newReadingBtn.addEventListener('click', () => {
    // Create and open the add-reading modal; it will handle saving and dispose-on-close
    readingFormModal = AddReadingModal();
  });

  document.addEventListener('readings-updated', async () => {
    await updateUIReadings();
  });

  // When an individual reading is added, open the ReadingInfoModal with that reading
  document.addEventListener('reading-added', (e) => {
    const reading = e?.detail;
    if (reading && modal && typeof modal.open === 'function') {
      modal.open(reading);
    }
  });

  document.addEventListener('reading-deleted', () => {
    if (modal && typeof modal.close === 'function') {
      if (modal.numReadings <= 1) modal.close(); // Close modal if this was the only reading
    }
  });

  // Minimal undo via keyboard: Cmd/Ctrl+Z restores the last-popped reading by calling restoreReading
  document.addEventListener('keydown', async (e) => {
    // Skip if user is typing in an input/textarea or contenteditable
    const target = e.target;
    if (
      target &&
      (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      return;
    }

    // Determine modifier: metaKey on Mac, ctrlKey elsewhere
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (!modifier) return;

    const key = e.key && e.key.toLowerCase();
    if (key !== 'z') return;

    // Prevent default browser undo
    e.preventDefault();

    try {
      // Get the current deleted reading snapshot
      const snapshot = undoRedo.get();
      if (!snapshot || Array.isArray(snapshot)) return;

      // Restore the deleted reading
      const { restoreReading } = await import('./storage.js');
      if (typeof restoreReading === 'function') {
        await restoreReading(snapshot);
        // Clear the snapshot after restoring
        undoRedo.current = null;
        // Notify UI to refresh
        document.dispatchEvent(new CustomEvent('readings-updated'));
      } else {
        console.warn('restoreReading not available on storage module');
      }
    } catch (err) {
      console.error('Undo via keyboard failed', err);
    }
  });
});

async function generateDummyDataHandler() {
  console.log('Generating dummy data...');

  try {
    const count = await generateDummyData();

    document.dispatchEvent(new CustomEvent('readings-updated')); // Notify all ui components to refresh

    alert(
      `Successfully added ${count} dummy readings for development testing!`
    );
    console.log('Dummy data generation completed');
  } catch (error) {
    console.error('Error generating dummy data:', error);
    alert('Error generating dummy data. Check console for details.');
  }
}
