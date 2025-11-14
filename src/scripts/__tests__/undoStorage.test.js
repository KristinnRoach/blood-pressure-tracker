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
import { UndoRedoManager } from '../helpers/UndoRedoManager.js';

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

  it('should work with UndoRedoManager (app-level undo flow)', async () => {
    const undoRedo = new UndoRedoManager(null);
    const nowIso = new Date().toISOString();
    
    // Save a reading
    await saveReading({
      systolic: 130,
      diastolic: 85,
      pulse: 75,
      date: nowIso,
    });

    let readings = await getReadings();
    expect(readings.length).toBe(1);
    
    // Simulate initial UI update
    undoRedo.setSnapshot(readings);
    
    const id = readings[0].id;
    const deletedReading = await getReadingById(id);

    // Simulate delete handler: clear stacks and set deleted reading as current
    undoRedo.undoStack.length = 0;
    undoRedo.redoStack.length = 0;
    undoRedo.current = deletedReading;

    await deleteReadingById(id);
    readings = await getReadings();
    expect(readings.length).toBe(0);

    // Simulate undo: get current snapshot
    const snapshot = undoRedo.get();
    expect(snapshot).toBeTruthy();
    expect(snapshot.systolic).toBe(130);
    expect(Array.isArray(snapshot)).toBe(false);

    // Restore the reading
    await restoreReading(snapshot);

    readings = await getReadings();
    expect(readings.length).toBe(1);
    expect(readings[0].systolic).toBe(130);
  });
});
