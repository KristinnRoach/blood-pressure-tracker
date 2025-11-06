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

  await db.readings.add(readingData);
  console.log('Reading saved to IndexedDB:', readingData);
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

export async function deleteReading(index) {
  await ensureInitialized();

  // Get all readings to find the one at the specified index
  const readings = await getReadings();
  if (index >= 0 && index < readings.length) {
    const readingToDelete = readings[index];
    await db.readings.delete(readingToDelete.id);
    console.log('Reading deleted from IndexedDB:', readingToDelete.id);
  }
}

export async function clearReadings() {
  await ensureInitialized();
  await db.readings.clear();
  console.log('All readings cleared from IndexedDB');
}
