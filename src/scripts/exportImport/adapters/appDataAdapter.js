/**
 * Data adapter for converting between app format and export/import format
 * This is the only module that knows about both the app's data structure
 * and the export/import module's data structure.
 *
 * @module adapters/appDataAdapter
 */

/**
 * Convert app readings to export format
 * App format: { systolic, diastolic, pulse, date, id }
 * Export format: { systolic, diastolic, pulse, timestamp }
 *
 * @param {Array} appReadings - Readings in app format
 * @returns {Array} Readings in export format
 */
export function convertToExportFormat(appReadings) {
  return appReadings.map((reading) => ({
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    pulse: reading.pulse,
    // Convert 'date' field to 'timestamp'
    timestamp: reading.date || reading.timestamp,
    // Note: 'id' field is intentionally omitted (database-specific)
  }));
}

/**
 * Convert imported readings to app format
 * Export format: { systolic, diastolic, pulse, timestamp }
 * App format: { systolic, diastolic, pulse, date }
 *
 * @param {Array} exportReadings - Readings in export format
 * @returns {Array} Readings in app format (without id, will be assigned by database)
 */
export function convertFromExportFormat(exportReadings) {
  return exportReadings.map((reading) => ({
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    pulse: reading.pulse,
    // Convert 'timestamp' field to 'date' for app compatibility
    date: reading.timestamp || reading.date,
    // Note: 'id' will be assigned by the database when saved
  }));
}

/**
 * Prepare metadata for export
 * Includes user settings, thresholds, and other relevant data
 *
 * @param {Object} options - Metadata options
 * @param {string} options.appVersion - Application version
 * @param {Object} options.user - Current user info { id, username }
 * @param {Object} options.thresholds - User's threshold settings
 * @returns {Object} Metadata object for export
 */
export function prepareExportMetadata(options = {}) {
  const metadata = {
    appVersion: options.appVersion || '1.0.0',
    userId: options.user?.id || null,
    username: options.user?.username || null,
  };

  // Include thresholds if provided
  if (options.thresholds) {
    metadata.thresholds = {
      systolic: { ...options.thresholds.systolic },
      diastolic: { ...options.thresholds.diastolic },
      pulse: { ...options.thresholds.pulse },
    };
  }

  return metadata;
}

/**
 * Extract user settings from import metadata
 * Returns settings that can be applied to the app
 *
 * @param {Object} metadata - Import metadata
 * @returns {Object} Extracted settings { thresholds, username }
 */
export function extractImportSettings(metadata) {
  const settings = {};

  // Extract thresholds if present
  if (metadata.thresholds) {
    settings.thresholds = {
      systolic: { ...metadata.thresholds.systolic },
      diastolic: { ...metadata.thresholds.diastolic },
      pulse: { ...metadata.thresholds.pulse },
    };
  }

  // Extract username if present
  if (metadata.username) {
    settings.username = metadata.username;
  }

  return settings;
}
