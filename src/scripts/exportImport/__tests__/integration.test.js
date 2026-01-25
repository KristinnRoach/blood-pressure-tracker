import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertToExportFormat,
  convertFromExportFormat,
  prepareExportMetadata,
  extractImportSettings,
} from '../adapters/appDataAdapter.js';

describe('Data Adapter Integration', () => {
  describe('convertToExportFormat', () => {
    it('should convert app readings to export format', () => {
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

      const exportReadings = convertToExportFormat(appReadings);

      expect(exportReadings).toHaveLength(2);
      expect(exportReadings[0]).toEqual({
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      });
      expect(exportReadings[0].id).toBeUndefined();
    });
  });

  describe('convertFromExportFormat', () => {
    it('should convert export readings to app format', () => {
      const exportReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const appReadings = convertFromExportFormat(exportReadings);

      expect(appReadings).toHaveLength(1);
      expect(appReadings[0]).toEqual({
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        date: '2026-01-25T10:00:00.000Z',
      });
      expect(appReadings[0].id).toBeUndefined();
    });
  });

  describe('roundtrip conversion', () => {
    it('should preserve data through export and import cycle', () => {
      const originalAppReadings = [
        {
          id: 1,
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          date: '2026-01-25T10:00:00.000Z',
        },
      ];

      // Export
      const exportReadings = convertToExportFormat(originalAppReadings);

      // Import
      const importedAppReadings = convertFromExportFormat(exportReadings);

      // Compare (excluding id which is database-specific)
      expect(importedAppReadings[0].systolic).toBe(
        originalAppReadings[0].systolic,
      );
      expect(importedAppReadings[0].diastolic).toBe(
        originalAppReadings[0].diastolic,
      );
      expect(importedAppReadings[0].pulse).toBe(originalAppReadings[0].pulse);
      expect(importedAppReadings[0].date).toBe(originalAppReadings[0].date);
    });
  });

  describe('prepareExportMetadata', () => {
    it('should prepare metadata with all fields', () => {
      const metadata = prepareExportMetadata({
        appVersion: '1.0.0',
        user: { id: 1, username: 'testuser' },
        thresholds: {
          systolic: { min: 90, max: 140 },
          diastolic: { min: 60, max: 90 },
          pulse: { min: 50, max: 100 },
        },
      });

      expect(metadata.appVersion).toBe('1.0.0');
      expect(metadata.userId).toBe(1);
      expect(metadata.username).toBe('testuser');
      expect(metadata.thresholds).toBeDefined();
      expect(metadata.thresholds.systolic).toEqual({ min: 90, max: 140 });
    });

    it('should handle missing optional fields', () => {
      const metadata = prepareExportMetadata({});

      expect(metadata.appVersion).toBe('1.0.0');
      expect(metadata.userId).toBeNull();
      expect(metadata.username).toBeNull();
      expect(metadata.thresholds).toBeUndefined();
    });
  });

  describe('extractImportSettings', () => {
    it('should extract thresholds from metadata', () => {
      const metadata = {
        thresholds: {
          systolic: { min: 90, max: 140 },
          diastolic: { min: 60, max: 90 },
          pulse: { min: 50, max: 100 },
        },
        username: 'testuser',
      };

      const settings = extractImportSettings(metadata);

      expect(settings.thresholds).toBeDefined();
      expect(settings.thresholds.systolic).toEqual({ min: 90, max: 140 });
      expect(settings.username).toBe('testuser');
    });

    it('should handle empty metadata', () => {
      const settings = extractImportSettings({});

      expect(settings.thresholds).toBeUndefined();
      expect(settings.username).toBeUndefined();
    });
  });
});
