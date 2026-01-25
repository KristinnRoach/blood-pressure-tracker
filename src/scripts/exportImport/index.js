/**
 * Main export/import API for blood pressure readings
 * @module exportImport
 */

import {
  getFormat,
  registerFormat as regFormat,
  getSupportedFormats as getFormats,
} from './formats/formatRegistry.js';
import { jsonFormat } from './formats/json.js';
import { downloadFile, generateFilename } from './utils/fileDownload.js';

// Register default formats
regFormat('json', jsonFormat);

/**
 * Export readings to a downloadable file
 * @param {Array} readings - Array of reading objects
 * @param {Object} options - Export options
 * @param {string} [options.format='json'] - Format name (default: 'json')
 * @param {Object} [options.metadata={}] - Additional metadata to include
 * @param {string} [options.filename] - Custom filename (optional, auto-generated if not provided)
 * @returns {Promise<void>}
 * @throws {Error} If export fails
 *
 * @example
 * const readings = [
 *   { systolic: 120, diastolic: 80, pulse: 72, timestamp: '2026-01-25T10:00:00.000Z' }
 * ];
 * await exportReadings(readings, { format: 'json' });
 */
export async function exportReadings(readings, options = {}) {
  try {
    // Validate inputs
    if (!Array.isArray(readings)) {
      throw new Error('Readings must be an array');
    }

    const format = options.format || 'json';
    const metadata = options.metadata || {};

    // Get format handler
    const handler = getFormat(format);

    // Serialize readings
    const content = handler.serialize(readings, metadata);

    // Generate filename
    const filename =
      options.filename ||
      generateFilename('bp-readings', handler.fileExtension);

    // Trigger download
    downloadFile(content, filename, handler.mimeType);
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
}

import { validateReading } from './validators/readingValidator.js';
import { detectDuplicates } from './utils/duplicateDetector.js';

/**
 * Import readings from a file
 * @param {File} file - File object from input element
 * @param {Object} options - Import options
 * @param {string} [options.format='json'] - Format name (default: 'json')
 * @param {boolean} [options.skipDuplicates=true] - Skip duplicate readings (default: true)
 * @param {Array} [options.existingReadings=[]] - Existing readings for duplicate detection
 * @returns {Promise<ImportResult>} Import result with statistics and valid readings
 *
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import was successful
 * @property {number} totalReadings - Total readings in file
 * @property {number} imported - Number of readings ready to import
 * @property {number} skipped - Number of duplicate readings skipped
 * @property {number} failed - Number of invalid readings
 * @property {string[]} errors - Array of error messages
 * @property {Array} readings - Valid, non-duplicate readings ready to save
 *
 * @example
 * const result = await importReadings(file, {
 *   format: 'json',
 *   skipDuplicates: true,
 *   existingReadings: await getReadings()
 * });
 * console.log(`Imported ${result.imported} readings, skipped ${result.skipped} duplicates`);
 */
export async function importReadings(file, options = {}) {
  const result = {
    success: false,
    totalReadings: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    readings: [],
  };

  try {
    // Validate file input
    if (!(file instanceof File)) {
      throw new Error('Invalid file: expected File object');
    }

    const format = options.format || 'json';
    const skipDuplicates = options.skipDuplicates !== false; // Default true
    const existingReadings = options.existingReadings || [];

    // Get format handler
    const handler = getFormat(format);

    // Read file content
    const content = await readFileContent(file);

    // Deserialize content
    const { readings: rawReadings, metadata } = handler.deserialize(content);

    result.totalReadings = rawReadings.length;

    // Validate each reading
    const validReadings = [];
    for (let i = 0; i < rawReadings.length; i++) {
      const reading = rawReadings[i];
      const validation = validateReading(reading);

      if (validation.valid) {
        validReadings.push(reading);
      } else {
        result.failed++;
        result.errors.push(`Reading ${i + 1}: ${validation.errors.join(', ')}`);
      }
    }

    // Detect duplicates if enabled
    let finalReadings = validReadings;
    if (skipDuplicates && existingReadings.length > 0) {
      const { unique, duplicates } = detectDuplicates(
        validReadings,
        existingReadings,
      );
      finalReadings = unique;
      result.skipped = duplicates.length;
    }

    result.imported = finalReadings.length;
    result.readings = finalReadings;
    result.success = true;

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Read file content as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content as string
 * @private
 */
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Register a custom format handler
 * @param {string} name - Format name
 * @param {Object} handler - Format handler object
 * @throws {Error} If registration fails
 *
 * @example
 * registerFormat('csv', {
 *   serialize: (readings, metadata) => { ... },
 *   deserialize: (content) => { ... },
 *   fileExtension: 'csv',
 *   mimeType: 'text/csv'
 * });
 */
export function registerFormat(name, handler) {
  regFormat(name, handler);
}

/**
 * Get list of supported export/import formats
 * @returns {string[]} Array of format names
 *
 * @example
 * const formats = getSupportedFormats();
 * console.log('Supported formats:', formats); // ['json']
 */
export function getSupportedFormats() {
  return getFormats();
}
