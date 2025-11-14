// Storage operations for blood pressure readings using IndexedDB with Dexie.js

import Dexie from 'dexie';
import { validateAndNormalizeReading } from './helpers/readingValidation.js';

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

// Simple current-user management (no auth): store in localStorage and users table
const CURRENT_USER_KEY = 'bpCurrentUser';

async function getOrCreateUser(username) {
  const existing = await db.users.where('username').equals(username).first();
  if (existing) return existing;
  const id = await db.users.add({ username, created: new Date() });
  return { id, username, created: new Date() };
}

export function getCurrentUserSync() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCurrentUser(username) {
  if (!username || typeof username !== 'string')
    throw new Error('Username required');
  const user = await getOrCreateUser(username.trim());
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({ id: user.id, username: user.username })
  );
  return user;
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function getAllUsers() {
  return await db.users.toArray();
}

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

  // Validate and normalize input (support existing callers using `date`)
  const normalized = validateAndNormalizeReading({
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    pulse: reading.pulse,
    timestamp: reading.timestamp ?? reading.date,
  });

  const readingData = {
    ...normalized,
    category: null, // Will be calculated on display
    userId: (getCurrentUserSync() && getCurrentUserSync().id) || null,
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

  const current = getCurrentUserSync();
  let readings;
  if (current && current.id != null) {
    // Filter by current user
    readings = await db.readings.where('userId').equals(current.id).toArray();
  } else {
    // No user logged in: show only readings with null userId
    readings = await db.readings.filter((r) => r.userId == null).toArray();
  }
  // Order by timestamp desc
  readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
  const current = getCurrentUserSync();
  if (current && current.id != null) {
    return await db.readings.where('userId').equals(current.id).count();
  }
  return await db.readings.count();
}

export async function restoreReading(reading) {
  await ensureInitialized();

  // Validate and normalize before inserting into IndexedDB
  const normalized = validateAndNormalizeReading(reading);

  try {
    await db.readings.add(normalized);
    console.log('Reading restored to IndexedDB:', normalized);
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
