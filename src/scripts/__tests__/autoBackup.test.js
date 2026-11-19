import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';

import { saveReading } from '../storage.js';
import { backupFileName, writeBackup } from '../autoBackup.js';

describe('autoBackup', () => {
  it('names files per user and strips unsafe characters', () => {
    expect(backupFileName(null)).toBe('bp-backup.json');
    expect(backupFileName({ id: 3, username: 'a/b c' })).toBe(
      'bp-backup-3-a_b_c.json',
    );
  });

  it('writes export JSON to the directory handle', async () => {
    await saveReading({
      systolic: 121,
      diastolic: 79,
      pulse: 66,
      date: new Date().toISOString(),
    });

    const files = {};
    const dir = {
      getFileHandle: async (name) => ({
        createWritable: async () => ({
          write: async (data) => (files[name] = data),
          close: async () => {},
        }),
      }),
    };

    await writeBackup(dir);

    const parsed = JSON.parse(files['bp-backup.json']);
    expect(parsed.readings.some((r) => r.systolic === 121)).toBe(true);
    expect(parsed.metadata.thresholds).toBeTruthy();
  });
});
