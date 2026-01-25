import { describe, it, expect } from 'vitest';
import { jsonFormat } from '../formats/json.js';

describe('jsonFormat', () => {
  describe('serialize', () => {
    it('should serialize readings to JSON', () => {
      const readings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = jsonFormat.serialize(readings);
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('1.0');
      expect(parsed.format).toBe('json');
      expect(parsed.readings).toEqual(readings);
    });

    it('should include metadata in serialized output', () => {
      const readings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const metadata = {
        appVersion: '2.0.0',
        userId: 'user123',
      };

      const result = jsonFormat.serialize(readings, metadata);
      const parsed = JSON.parse(result);

      expect(parsed.metadata.appVersion).toBe('2.0.0');
      expect(parsed.metadata.userId).toBe('user123');
      expect(parsed.metadata.readingCount).toBe(1);
    });

    it('should convert Date timestamps to ISO strings', () => {
      const readings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: new Date('2026-01-25T10:00:00.000Z'),
        },
      ];

      const result = jsonFormat.serialize(readings);
      const parsed = JSON.parse(result);

      expect(parsed.readings[0].timestamp).toBe('2026-01-25T10:00:00.000Z');
    });

    it('should include exportDate', () => {
      const readings = [
        {
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          timestamp: '2026-01-25T10:00:00.000Z',
        },
      ];

      const result = jsonFormat.serialize(readings);
      const parsed = JSON.parse(result);

      expect(parsed.exportDate).toBeDefined();
      expect(new Date(parsed.exportDate).getTime()).not.toBeNaN();
    });

    it('should handle empty readings array', () => {
      const readings = [];

      const result = jsonFormat.serialize(readings);
      const parsed = JSON.parse(result);

      expect(parsed.readings).toEqual([]);
      expect(parsed.metadata.readingCount).toBe(0);
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid JSON', () => {
      const jsonString = JSON.stringify({
        version: '1.0',
        format: 'json',
        exportDate: '2026-01-25T10:00:00.000Z',
        metadata: {
          appVersion: '1.0.0',
          userId: null,
          readingCount: 1,
        },
        readings: [
          {
            systolic: 120,
            diastolic: 80,
            pulse: 72,
            timestamp: '2026-01-25T10:00:00.000Z',
          },
        ],
      });

      const result = jsonFormat.deserialize(jsonString);

      expect(result.readings).toHaveLength(1);
      expect(result.readings[0].systolic).toBe(120);
      expect(result.metadata.version).toBe('1.0');
    });

    it('should throw error for invalid JSON syntax', () => {
      const invalidJson = '{ invalid json }';

      expect(() => jsonFormat.deserialize(invalidJson)).toThrow('Invalid JSON');
    });

    it('should throw error for non-object JSON', () => {
      const jsonString = JSON.stringify('not an object');

      expect(() => jsonFormat.deserialize(jsonString)).toThrow(
        'Invalid format: expected JSON object',
      );
    });

    it('should throw error for missing version field', () => {
      const jsonString = JSON.stringify({
        format: 'json',
        readings: [],
      });

      expect(() => jsonFormat.deserialize(jsonString)).toThrow(
        'Invalid format: missing version field',
      );
    });

    it('should throw error for unsupported version', () => {
      const jsonString = JSON.stringify({
        version: '99.0',
        format: 'json',
        readings: [],
      });

      expect(() => jsonFormat.deserialize(jsonString)).toThrow(
        'Unsupported format version',
      );
    });

    it('should throw error for missing readings array', () => {
      const jsonString = JSON.stringify({
        version: '1.0',
        format: 'json',
      });

      expect(() => jsonFormat.deserialize(jsonString)).toThrow(
        'Invalid format: readings must be an array',
      );
    });

    it('should throw error for non-array readings', () => {
      const jsonString = JSON.stringify({
        version: '1.0',
        format: 'json',
        readings: 'not an array',
      });

      expect(() => jsonFormat.deserialize(jsonString)).toThrow(
        'Invalid format: readings must be an array',
      );
    });

    it('should extract metadata correctly', () => {
      const jsonString = JSON.stringify({
        version: '1.0',
        format: 'json',
        exportDate: '2026-01-25T10:00:00.000Z',
        metadata: {
          appVersion: '2.0.0',
          userId: 'user123',
        },
        readings: [],
      });

      const result = jsonFormat.deserialize(jsonString);

      expect(result.metadata.version).toBe('1.0');
      expect(result.metadata.format).toBe('json');
      expect(result.metadata.exportDate).toBe('2026-01-25T10:00:00.000Z');
      expect(result.metadata.appVersion).toBe('2.0.0');
      expect(result.metadata.userId).toBe('user123');
    });

    it('should handle empty readings array', () => {
      const jsonString = JSON.stringify({
        version: '1.0',
        format: 'json',
        exportDate: '2026-01-25T10:00:00.000Z',
        metadata: {},
        readings: [],
      });

      const result = jsonFormat.deserialize(jsonString);

      expect(result.readings).toEqual([]);
    });
  });

  describe('format properties', () => {
    it('should have correct file extension', () => {
      expect(jsonFormat.fileExtension).toBe('json');
    });

    it('should have correct MIME type', () => {
      expect(jsonFormat.mimeType).toBe('application/json');
    });
  });
});
