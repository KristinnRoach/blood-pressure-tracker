// Storage operations for blood pressure readings using IndexedDB with Dexie.js

import Dexie from 'dexie';

// Database schema
class BloodPressureDB extends Dexie {
  constructor() {
    super('BloodPressureDB');
    this.version(1).stores({
      readings: '++id, systolic, diastolic, pulse, timestamp, category, userId',
      users: '++id, username, created',
    });
  }
}

const db = new BloodPressureDB();

// Migration function to move localStorage data to IndexedDB
async function migrateFromLocalStorage() {
  try {
    const existingData = localStorage.getItem('bpHistory');
    if (existingData) {
      const readings = JSON.parse(existingData);
      console.log(
        'Migrating',
        readings.length,
        'readings from localStorage to IndexedDB'
      );

      // Convert old format to new format and add to IndexedDB
      for (const reading of readings) {
        await db.readings.add({
          systolic: reading.systolic,
          diastolic: reading.diastolic,
          pulse: reading.pulse,
          timestamp: new Date(reading.date),
          category: null, // Will be calculated on display
          userId: null, // Single user mode for now
        });
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('bpHistory');
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
  }
}

// Initialize database and perform migration if needed
let migrationPromise = null;

async function ensureInitialized() {
  if (!migrationPromise) {
    migrationPromise = migrateFromLocalStorage();
  }
  await migrationPromise;
}

export async function saveReading(reading) {
  await ensureInitialized();

  const readingData = {
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    pulse: reading.pulse,
    timestamp: new Date(reading.date),
    category: null, // Will be calculated on display
    userId: null, // Single user mode for now
  };

  try {
    await db.readings.add(readingData);
    console.log('Reading saved to IndexedDB:', readingData);
  } catch (error) {
    console.error('Error saving reading:', error);

    // Check for quota error (including inner error)
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'AbortError' ||
      (error.inner && error.inner.name === 'QuotaExceededError')
    ) {
      alert(
        'Unable to save: Storage quota exceeded. Try clearing browser data or use a different browser mode.'
      );
    } else {
      alert('Failed to save reading. Please try again.');
    }

    throw error; // Re-throw so caller knows it failed
  }
}

export async function getReadings() {
  await ensureInitialized();

  // Get all readings ordered by timestamp (newest first)
  const readings = await db.readings.orderBy('timestamp').reverse().toArray();

  // Convert back to the format expected by the UI
  return readings.map((reading) => ({
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    pulse: reading.pulse,
    date: reading.timestamp.toISOString(),
    id: reading.id, // Keep the database ID for deletion
  }));
}

export async function getReadingById(id) {
  await ensureInitialized();
  return await db.readings.get(id);
}

export async function deleteReadingById(id) {
  await ensureInitialized();

  if (id == null) {
    console.warn('deleteReadingById called with null/undefined id');
    return;
  }

  try {
    await db.readings.delete(id);
    console.log('Reading deleted from IndexedDB by id:', id);
  } catch (error) {
    console.error('Error deleting reading by id:', error);
    throw error;
  }
}

export async function getReadingCount() {
  await ensureInitialized();
  return await db.readings.count();
}

export async function restoreReading(reading) {
  await ensureInitialized();

  try {
    await db.readings.add(reading);
    console.log('Reading restored to IndexedDB:', reading);
  } catch (error) {
    console.error('Error restoring reading:', error);
    throw error;
  }
}

export async function clearReadings() {
  await ensureInitialized();
  await db.readings.clear();
  console.log('All readings cleared from IndexedDB');
}
