// Minimal tests for blood pressure categorization
import { describe, it, expect } from 'vitest';
import { getCategory, getPulseStatus } from '../bloodPressure.js';

describe('Blood Pressure Categorization', () => {
  it('should categorize normal blood pressure correctly', () => {
    const result = getCategory(110, 70);
    expect(result.class).toBe('normal');
    expect(result.text).toBe('Normal BP');
  });

  it('should categorize low blood pressure correctly', () => {
    const result = getCategory(85, 55);
    expect(result.class).toBe('low');
    expect(result.text).toBe('Low BP');
  });

  it('should categorize critically low blood pressure correctly', () => {
    const result = getCategory(65, 45);
    expect(result.class).toBe('critical');
    expect(result.text).toBe('CRITICALLY LOW BP!');
  });

  it('should categorize critically high blood pressure correctly', () => {
    const result = getCategory(190, 130);
    expect(result.class).toBe('critical');
    expect(result.text).toBe('CRITICALLY HIGH BP!');
  });

  it('should categorize pulse status correctly', () => {
    expect(getPulseStatus(35)).toBe(
      'CRITICAL - Seek immediate medical attention'
    );
    expect(getPulseStatus(45)).toBe('Very Low - Consult doctor');
    expect(getPulseStatus(55)).toBe('Low');
    expect(getPulseStatus(80)).toBe('Normal');
    expect(getPulseStatus(110)).toBe('High');
    expect(getPulseStatus(130)).toBe('Very High - Consult doctor');
    expect(getPulseStatus(160)).toBe(
      'CRITICAL - Seek immediate medical attention'
    );
  });
});
