/**
 * JSON format handler for blood pressure readings export/import
 * @module formats/json
 */

const FORMAT_VERSION = '1.0';
const SUPPORTED_VERSIONS = ['1.0'];

/**
 * Serializes readings to JSON format
 * @param {Array} readings - Array of reading objects
 * @param {Object} metadata - Additional metadata to include
 * @returns {string} JSON string
 */
function serialize(readings, metadata = {}) {
  const exportData = {
    version: FORMAT_VERSION,
    format: 'json',
    exportDate: new Date().toISOString(),
    metadata: {
      appVersion: metadata.appVersion || '1.0.0',
      userId: metadata.userId || null,
      readingCount: readings.length,
      ...metadata,
    },
    readings: readings.map((reading) => ({
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      pulse: reading.pulse,
      timestamp:
        reading.timestamp instanceof Date
          ? reading.timestamp.toISOString()
          : reading.timestamp,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Deserializes JSON format to readings array
 * @param {string} content - JSON string content
 * @returns {{readings: Array, metadata: Object}} Deserialized data
 * @throws {Error} If JSON is invalid or format is unsupported
 */
function deserialize(content) {
  let data;

  // Parse JSON
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  // Validate structure
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid format: expected JSON object');
  }

  // Check format version
  if (!data.version) {
    throw new Error('Invalid format: missing version field');
  }

  if (!SUPPORTED_VERSIONS.includes(data.version)) {
    throw new Error(
      `Unsupported format version: ${data.version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
    );
  }

  // Check readings array
  if (!Array.isArray(data.readings)) {
    throw new Error('Invalid format: readings must be an array');
  }

  // Extract metadata
  const metadata = {
    version: data.version,
    format: data.format || 'json',
    exportDate: data.exportDate,
    ...data.metadata,
  };

  return {
    readings: data.readings,
    metadata,
  };
}

/**
 * JSON format handler
 */
export const jsonFormat = {
  serialize,
  deserialize,
  fileExtension: 'json',
  mimeType: 'application/json',
};

// Format constants for external use
export const JSON_MIME_TYPE = 'application/json';
export const JSON_FILE_EXTENSION = 'json';
