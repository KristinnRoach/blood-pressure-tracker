/**
 * Duplicate detection utility for blood pressure readings
 * @module utils/duplicateDetector
 */

/**
 * Creates a unique key for a reading based on its core fields
 * @param {Object} reading - The reading object
 * @returns {string} Unique key in format "timestamp|systolic|diastolic|pulse"
 */
export function createReadingKey(reading) {
  // Normalize timestamp to ISO string if it's a Date object
  const timestamp =
    reading.timestamp instanceof Date
      ? reading.timestamp.toISOString()
      : reading.timestamp;

  return `${timestamp}|${reading.systolic}|${reading.diastolic}|${reading.pulse}`;
}

/**
 * Detects duplicate readings by comparing against existing readings
 * @param {Array} newReadings - Array of new readings to check
 * @param {Array} existingReadings - Array of existing readings to compare against
 * @returns {{unique: Array, duplicates: Array}} Object with separated unique and duplicate readings
 */
export function detectDuplicates(newReadings, existingReadings = []) {
  // Create a Set of existing reading keys for O(1) lookup
  const existingKeys = new Set(existingReadings.map(createReadingKey));

  const unique = [];
  const duplicates = [];

  for (const reading of newReadings) {
    const key = createReadingKey(reading);
    if (existingKeys.has(key)) {
      duplicates.push(reading);
    } else {
      unique.push(reading);
      // Add to set to prevent duplicates within the new readings array
      existingKeys.add(key);
    }
  }

  return { unique, duplicates };
}
