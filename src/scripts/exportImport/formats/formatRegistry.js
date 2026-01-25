/**
 * Format registry for managing export/import format handlers
 * @module formats/formatRegistry
 */

/**
 * Registry for format handlers
 */
class FormatRegistry {
  constructor() {
    this.formats = new Map();
  }

  /**
   * Register a format handler
   * @param {string} name - Format name (e.g., 'json', 'csv')
   * @param {Object} handler - Format handler object
   * @param {Function} handler.serialize - Serialization function
   * @param {Function} handler.deserialize - Deserialization function
   * @param {string} handler.fileExtension - File extension (e.g., 'json')
   * @param {string} handler.mimeType - MIME type (e.g., 'application/json')
   * @throws {Error} If handler is invalid or format already registered
   */
  register(name, handler) {
    if (!name || typeof name !== 'string') {
      throw new Error('Format name must be a non-empty string');
    }

    if (!handler || typeof handler !== 'object') {
      throw new Error('Format handler must be an object');
    }

    // Validate handler interface
    const requiredMethods = ['serialize', 'deserialize'];
    for (const method of requiredMethods) {
      if (typeof handler[method] !== 'function') {
        throw new Error(`Format handler must implement ${method}() method`);
      }
    }

    const requiredProps = ['fileExtension', 'mimeType'];
    for (const prop of requiredProps) {
      if (typeof handler[prop] !== 'string') {
        throw new Error(`Format handler must have ${prop} property`);
      }
    }

    if (this.formats.has(name)) {
      throw new Error(`Format '${name}' is already registered`);
    }

    this.formats.set(name, handler);
  }

  /**
   * Get a format handler by name
   * @param {string} name - Format name
   * @returns {Object} Format handler
   * @throws {Error} If format not found
   */
  get(name) {
    const handler = this.formats.get(name);
    if (!handler) {
      throw new Error(`Format '${name}' is not registered`);
    }
    return handler;
  }

  /**
   * List all registered format names
   * @returns {string[]} Array of format names
   */
  list() {
    return Array.from(this.formats.keys());
  }

  /**
   * Check if a format is registered
   * @param {string} name - Format name
   * @returns {boolean} True if format is registered
   */
  has(name) {
    return this.formats.has(name);
  }
}

// Create singleton instance
const registry = new FormatRegistry();

/**
 * Register a format handler
 * @param {string} name - Format name
 * @param {Object} handler - Format handler object
 */
export function registerFormat(name, handler) {
  registry.register(name, handler);
}

/**
 * Get a format handler
 * @param {string} name - Format name
 * @returns {Object} Format handler
 */
export function getFormat(name) {
  return registry.get(name);
}

/**
 * Get list of supported formats
 * @returns {string[]} Array of format names
 */
export function getSupportedFormats() {
  return registry.list();
}

/**
 * Check if a format is supported
 * @param {string} name - Format name
 * @returns {boolean} True if format is supported
 */
export function isFormatSupported(name) {
  return registry.has(name);
}
