/**
 * Validates blood pressure reading data
 * @module validators/readingValidator
 */

/**
 * Validates a single reading object
 * @param {Object} reading - The reading to validate
 * @param {number} reading.systolic - Systolic pressure
 * @param {number} reading.diastolic - Diastolic pressure
 * @param {number} reading.pulse - Pulse rate
 * @param {string|Date} reading.timestamp - Reading timestamp
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateReading(reading) {
  const errors = [];

  // Check if reading is an object
  if (
    typeof reading !== 'object' ||
    reading === null ||
    Array.isArray(reading)
  ) {
    return { valid: false, errors: ['Reading must be an object'] };
  }

  // Check required fields
  const requiredFields = ['systolic', 'diastolic', 'pulse', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in reading)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // If required fields are missing, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate systolic (0-300 range)
  const systolic = Number(reading.systolic);
  if (Number.isNaN(systolic)) {
    errors.push('Systolic must be a valid number');
  } else if (systolic < 0 || systolic > 300) {
    errors.push('Systolic must be between 0 and 300');
  }

  // Validate diastolic (0-200 range)
  const diastolic = Number(reading.diastolic);
  if (Number.isNaN(diastolic)) {
    errors.push('Diastolic must be a valid number');
  } else if (diastolic < 0 || diastolic > 200) {
    errors.push('Diastolic must be between 0 and 200');
  }

  // Validate pulse (0-300 range)
  const pulse = Number(reading.pulse);
  if (Number.isNaN(pulse)) {
    errors.push('Pulse must be a valid number');
  } else if (pulse < 0 || pulse > 300) {
    errors.push('Pulse must be between 0 and 300');
  }

  // Validate timestamp (ISO 8601 string or Date object)
  const timestamp = reading.timestamp;
  if (timestamp instanceof Date) {
    if (Number.isNaN(timestamp.getTime())) {
      errors.push('Timestamp is an invalid Date object');
    }
  } else if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      errors.push('Timestamp must be a valid ISO 8601 date string');
    }
  } else {
    errors.push('Timestamp must be a Date object or ISO 8601 string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
