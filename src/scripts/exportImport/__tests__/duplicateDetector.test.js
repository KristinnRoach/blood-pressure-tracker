import { describe, it, expect } from 'vitest';
import {
  createReadingKey,
  detectDuplicates,
} from '../utils/duplicateDetector.js';

describe('duplicateDetector', () => {
  describe('createReadingKey', () => {
    it('should create key from reading with string timestamp', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const key = createReadingKey(reading);

      expect(key).toBe('2026-01-25T10:00:00.000Z|120|80|72');
    });

    it('should create key from reading with Date timestamp', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: new Date('2026-01-25T10:00:00.000Z'),
      };

      const key = createReadingKey(reading);

      expect(key).toBe('2026-01-25T10:00:00.000Z|120|80|72');
    });

    it('should create different keys for different readings', () => {
      const reading1 = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const reading2 = {
        systolic: 130,
        diastolic: 85,
        pulse: 75,
        timestamp: '2026-01-25T11:00:00.000Z',
      };

      const key1 = createReadingKey(reading1);
      const key2 = createReadingKey(reading2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect identical readings as duplicates', () => {
      const newReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const existingReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toEqual([]);
      expect(result.duplicates).toEqual(newReadings);
    });

    it('should not flag unique readings as duplicates', () => {
      const newReadings = [
        {
          systolic: 130,
          diastolic: 85,
          pulse: 75,
          timestamp: '2026-01-25T11:00:00.000Z',
        },
      ];

      const existingReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toEqual(newReadings);
      expect(result.duplicates).toEqual([]);
    });

    it('should detect partial duplicates (different timestamp)', () => {
      const newReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T11:00:00.000Z', // Different time
        },
      ];

      const existingReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toEqual(newReadings);
      expect(result.duplicates).toEqual([]);
    });

    it('should handle empty new readings array', () => {
      const newReadings = [];
      const existingReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it('should handle empty existing readings array', () => {
      const newReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];
      const existingReadings = [];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toEqual(newReadings);
      expect(result.duplicates).toEqual([]);
    });

    it('should handle mixed unique and duplicate readings', () => {
      const newReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
        {
          systolic: 130,
          diastolic: 85,
          pulse: 75,
          timestamp: '2026-01-25T11:00:00.000Z',
        },
        {
          systolic: 125,
          diastolic: 82,
          pulse: 70,
          timestamp: '2026-01-25T12:00:00.000Z',
        },
      ];

      const existingReadings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toHaveLength(2);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0]).toEqual(newReadings[0]);
    });

    it('should prevent duplicates within new readings array', () => {
      const newReadings = [
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
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const existingReadings = [];

      const result = detectDuplicates(newReadings, existingReadings);

      expect(result.unique).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should handle large datasets efficiently', () => {
      const newReadings = Array.from({ length: 1000 }, (_, i) => ({
        systolic: 120 + i,
        diastolic: 80,
        pulse: 72,
        timestamp: `2026-01-25T${String(i % 24).padStart(2, '0')}:00:00.000Z`,
      }));

      const existingReadings = Array.from({ length: 500 }, (_, i) => ({
        systolic: 120 + i,
        diastolic: 80,
        pulse: 72,
        timestamp: `2026-01-25T${String(i % 24).padStart(2, '0')}:00:00.000Z`,
      }));

      const startTime = Date.now();
      const result = detectDuplicates(newReadings, existingReadings);
      const endTime = Date.now();

      expect(result.unique.length + result.duplicates.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
});
