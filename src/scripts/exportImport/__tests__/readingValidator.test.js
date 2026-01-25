import { describe, it, expect } from 'vitest';
import { validateReading } from '../validators/readingValidator.js';

describe('readingValidator', () => {
  describe('validateReading', () => {
    it('should validate a correct reading', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate reading with Date object timestamp', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: new Date('2026-01-25T10:00:00.000Z'),
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject non-object reading', () => {
      const result = validateReading(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Reading must be an object');
    });

    it('should reject reading with missing systolic', () => {
      const reading = {
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: systolic');
    });

    it('should reject reading with missing diastolic', () => {
      const reading = {
        systolic: 120,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: diastolic');
    });

    it('should reject reading with missing pulse', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: pulse');
    });

    it('should reject reading with missing timestamp', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: timestamp');
    });

    it('should reject systolic below range', () => {
      const reading = {
        systolic: -1,
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Systolic must be between 0 and 300');
    });

    it('should reject systolic above range', () => {
      const reading = {
        systolic: 301,
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Systolic must be between 0 and 300');
    });

    it('should reject diastolic below range', () => {
      const reading = {
        systolic: 120,
        diastolic: -1,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Diastolic must be between 0 and 200');
    });

    it('should reject diastolic above range', () => {
      const reading = {
        systolic: 120,
        diastolic: 201,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Diastolic must be between 0 and 200');
    });

    it('should reject pulse below range', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: -1,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pulse must be between 0 and 300');
    });

    it('should reject pulse above range', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 301,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pulse must be between 0 and 300');
    });

    it('should reject non-numeric systolic', () => {
      const reading = {
        systolic: 'invalid',
        diastolic: 80,
        pulse: 72,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Systolic must be a valid number');
    });

    it('should reject invalid timestamp string', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: 'not-a-date',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Timestamp must be a valid ISO 8601 date string',
      );
    });

    it('should reject invalid Date object', () => {
      const reading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        timestamp: new Date('invalid'),
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Timestamp is an invalid Date object');
    });

    it('should accept boundary values', () => {
      const reading = {
        systolic: 0,
        diastolic: 0,
        pulse: 0,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(true);
    });

    it('should accept maximum boundary values', () => {
      const reading = {
        systolic: 300,
        diastolic: 200,
        pulse: 300,
        timestamp: '2026-01-25T10:00:00.000Z',
      };

      const result = validateReading(reading);

      expect(result.valid).toBe(true);
    });
  });
});
