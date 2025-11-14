// Reusable validation and normalization for blood pressure readings

export function validateAndNormalizeReading(reading) {
  if (typeof reading !== 'object' || reading === null) {
    throw new Error('Invalid reading: expected an object');
  }

  const requiredFields = ['systolic', 'diastolic', 'pulse', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in reading)) {
      throw new Error(`Invalid reading: missing '${field}'`);
    }
  }

  const normalized = { ...reading };

  // Coerce numeric fields
  for (const field of ['systolic', 'diastolic', 'pulse']) {
    const val = normalized[field];
    const numVal = typeof val === 'string' ? Number(val) : val;
    if (typeof numVal !== 'number' || Number.isNaN(numVal)) {
      throw new Error(`Invalid reading: '${field}' must be a number`);
    }
    normalized[field] = numVal;
  }

  // Normalize timestamp to Date
  const ts = normalized.timestamp;
  if (ts instanceof Date) {
    if (Number.isNaN(ts.getTime())) {
      throw new Error('Invalid reading: timestamp is an invalid Date');
    }
  } else if (typeof ts === 'string' || typeof ts === 'number') {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) {
      throw new Error(
        'Invalid reading: timestamp must be a valid ISO string, number, or Date'
      );
    }
    normalized.timestamp = d;
  } else {
    throw new Error(
      'Invalid reading: timestamp must be a Date, ISO string, or number'
    );
  }

  return normalized;
}
