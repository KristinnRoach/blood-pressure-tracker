// Test storage delete + restore (undo) flow using fake-indexeddb
import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';

// Provide a minimal localStorage shim used by storage.js migration logic
global.localStorage = global.localStorage || {
  getItem: () => null,
  removeItem: () => {},
};

import {
  saveReading,
  getReadings,
  getReadingById,
  deleteReadingById,
  restoreReading,
} from '../storage.js';

describe('Storage undo (delete -> restore) flow', () => {
  beforeEach(async () => {
    // Clear DB by deleting all readings via getReadings + delete
    const existing = await getReadings();
    for (const r of existing) {
      await deleteReadingById(r.id);
    }
  });

  it('should delete a reading and restore it (simulate undo)', async () => {
    const nowIso = new Date().toISOString();
    const reading = {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      date: nowIso,
    };

    await saveReading(reading);

    let readings = await getReadings();
    expect(readings.length).toBe(1);

    const id = readings[0].id;

    // Snapshot the DB record before delete
    const snapshot = await getReadingById(id);
    expect(snapshot).toBeTruthy();
    // Delete
    await deleteReadingById(id);

    readings = await getReadings();
    expect(readings.length).toBe(0);

    // Restore using the snapshot (simulate undo)
    await restoreReading(snapshot);

    readings = await getReadings();
    expect(readings.length).toBe(1);
    const restored = readings[0];
    expect(restored.systolic).toBe(120);
    expect(restored.diastolic).toBe(80);
    expect(restored.pulse).toBe(70);
    // date is stored as ISO string in getReadings
    expect(new Date(restored.date).toISOString().slice(0, 10)).toBe(
      nowIso.slice(0, 10)
    );
  });
});
