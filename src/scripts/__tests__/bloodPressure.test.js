// Minimal tests for blood pressure categorization
import { describe, it, expect } from 'vitest';
import { getCategory, getPulseStatus } from '../bloodPressure.js';

describe('Blood Pressure Categorization', () => {
  it('should categorize normal blood pressure correctly', () => {
    const result = getCategory(110, 70);
    expect(result.class).toBe('normal');
    expect(result.text).toBe('Normal Blood Pressure');
  });

  it('should categorize crisis blood pressure correctly', () => {
    const result = getCategory(190, 130);
    expect(result.class).toBe('crisis');
    expect(result.text).toBe('CRISIS - Seek immediate medical attention');
  });

  it('should categorize pulse status correctly', () => {
    expect(getPulseStatus(50)).toBe('Low');
    expect(getPulseStatus(80)).toBe('Normal');
    expect(getPulseStatus(120)).toBe('High');
  });
});
