/**
 * End-to-end integration tests for export/import with app integration
 * These tests verify the full flow from app data to export and back
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertToExportFormat,
  convertFromExportFormat,
  prepareExportMetadata,
  extractImportSettings,
} from '../adapters/appDataAdapter.js';
import { exportReadings, importReadings } from '../index.js';
import { jsonFormat } from '../formats/json.js';

describe('End-to-End Integration', () => {
  describe('Full export-import cycle', () => {
    it('should preserve data through complete export-import cycle', async () => {
      // Simulate app readings (with id and date fields)
      const appReadings = [
        {
          id: 1,
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          date: '2026-01-25T10:00:00.000Z',
        },
        {
          id: 2,
          systolic: 130,
          diastolic: 85,
          pulse: 75,
          date: '2026-01-25T11:00:00.000Z',
        },
      ];

      // Step 1: Convert to export format
      const exportData = convertToExportFormat(appReadings);

      // Step 2: Prepare metadata
      const metadata = prepareExportMetadata({
        appVersion: '1.0.0',
        user: { id: 1, username: 'testuser' },
        thresholds: {
          systolic: { min: 90, max: 140 },
          diastolic: { min: 60, max: 90 },
          pulse: { min: 50, max: 100 },
        },
      });

      // Step 3: Serialize to JSON
      const jsonString = jsonFormat.serialize(exportData, metadata);

      // Step 4: Deserialize JSON
      const { readings: importedReadings, metadata: importedMetadata } =
        jsonFormat.deserialize(jsonString);

      // Step 5: Convert back to app format
      const finalAppReadings = convertFromExportFormat(importedReadings);

      // Verify data integrity (excluding id which is database-specific)
      expect(finalAppReadings).toHaveLength(2);
      expect(finalAppReadings[0].systolic).toBe(appReadings[0].systolic);
      expect(finalAppReadings[0].diastolic).toBe(appReadings[0].diastolic);
      expect(finalAppReadings[0].pulse).toBe(appReadings[0].pulse);
      expect(finalAppReadings[0].date).toBe(appReadings[0].date);

      // Verify metadata preservation
      const settings = extractImportSettings(importedMetadata);
      expect(settings.username).toBe('testuser');
      expect(settings.thresholds).toBeDefined();
      expect(settings.thresholds.systolic).toEqual({ min: 90, max: 140 });
    });

    it('should handle empty readings array', () => {
      const appReadings = [];
      const exportData = convertToExportFormat(appReadings);
      const jsonString = jsonFormat.serialize(exportData, {});
      const { readings } = jsonFormat.deserialize(jsonString);
      const finalAppReadings = convertFromExportFormat(readings);

      expect(finalAppReadings).toEqual([]);
    });

    it('should handle readings without optional metadata', () => {
      const appReadings = [
        {
          id: 1,
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          date: '2026-01-25T10:00:00.000Z',
        },
      ];

      const exportData = convertToExportFormat(appReadings);
      const metadata = prepareExportMetadata({}); // No user or thresholds
      const jsonString = jsonFormat.serialize(exportData, metadata);
      const { readings, metadata: importedMetadata } =
        jsonFormat.deserialize(jsonString);

      const settings = extractImportSettings(importedMetadata);
      expect(settings.username).toBeUndefined();
      expect(settings.thresholds).toBeUndefined();
    });
  });

  describe('Import with duplicate detection', () => {
    it('should detect duplicates across existing and imported readings', async () => {
      // Existing app readings
      const existingAppReadings = [
        {
          id: 1,
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          date: '2026-01-25T10:00:00.000Z',
        },
      ];

      // Import file with one duplicate and one new reading
      const importFileReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z', // Duplicate
        },
        {
          systolic: 130,
          diastolic: 85,
          pulse: 75,
          timestamp: '2026-01-25T11:00:00.000Z', // New
        },
      ];

      // Convert existing to export format for comparison
      const existingExportFormat = convertToExportFormat(existingAppReadings);

      // Create import file
      const jsonString = jsonFormat.serialize(importFileReadings, {});
      const file = new File([jsonString], 'test.json', {
        type: 'application/json',
      });

      // Import with duplicate detection
      const result = await importReadings(file, {
        format: 'json',
        skipDuplicates: true,
        existingReadings: existingExportFormat,
      });

      expect(result.success).toBe(true);
      expect(result.totalReadings).toBe(2);
      expect(result.imported).toBe(1); // Only the new reading
      expect(result.skipped).toBe(1); // The duplicate
      expect(result.failed).toBe(0);
    });

    it('should detect intra-file duplicates', async () => {
      // Import file with duplicates within itself
      const importFileReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z', // Duplicate
        },
        {
          systolic: 130,
          diastolic: 85,
          pulse: 75,
          timestamp: '2026-01-25T11:00:00.000Z',
        },
      ];

      const jsonString = jsonFormat.serialize(importFileReadings, {});
      const file = new File([jsonString], 'test.json', {
        type: 'application/json',
      });

      // Import with no existing readings
      const result = await importReadings(file, {
        format: 'json',
        skipDuplicates: true,
        existingReadings: [],
      });

      expect(result.success).toBe(true);
      expect(result.totalReadings).toBe(3);
      expect(result.imported).toBe(2); // Two unique readings
      expect(result.skipped).toBe(1); // One intra-file duplicate
    });
  });

  describe('Error handling', () => {
    it('should handle invalid readings in import file', async () => {
      const invalidReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
        {
          systolic: 'invalid', // Invalid
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T11:00:00.000Z',
        },
        {
          systolic: 500, // Out of range
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T12:00:00.000Z',
        },
      ];

      const jsonString = jsonFormat.serialize(invalidReadings, {});
      const file = new File([jsonString], 'test.json', {
        type: 'application/json',
      });

      const result = await importReadings(file, {
        format: 'json',
        skipDuplicates: true,
        existingReadings: [],
      });

      expect(result.success).toBe(true);
      expect(result.totalReadings).toBe(3);
      expect(result.imported).toBe(1); // Only the valid reading
      expect(result.failed).toBe(2); // Two invalid readings
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle corrupted JSON file', async () => {
      const file = new File(['{ invalid json }'], 'test.json', {
        type: 'application/json',
      });

      const result = await importReadings(file, {
        format: 'json',
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON');
    });

    it('should handle unknown format', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      const result = await importReadings(file, {
        format: 'unknown-format',
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('not registered');
    });
  });
});
