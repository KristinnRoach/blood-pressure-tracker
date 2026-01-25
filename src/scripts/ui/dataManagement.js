/**
 * Data management handlers for export/import functionality
 * This module bridges the app's storage layer with the export/import module
 *
 * @module ui/dataManagement
 */

import { exportReadings, importReadings } from '../exportImport/index.js';
import {
  convertToExportFormat,
  convertFromExportFormat,
  prepareExportMetadata,
  extractImportSettings,
} from '../exportImport/adapters/appDataAdapter.js';
import {
  getReadings,
  saveReading,
  getThresholds,
  getCurrentUserSync,
} from '../storage.js';

/**
 * Handle export operation
 * Fetches all readings and user settings, then triggers export
 *
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function handleExport() {
  try {
    // Fetch all data
    const appReadings = await getReadings();
    const thresholds = await getThresholds();
    const user = getCurrentUserSync();

    // Convert to export format
    const exportData = convertToExportFormat(appReadings);

    // Prepare metadata
    const metadata = prepareExportMetadata({
      appVersion: '1.0.0', // TODO: Get from package.json or config
      user,
      thresholds,
    });

    // Trigger export
    await exportReadings(exportData, {
      format: 'json',
      metadata,
    });

    return {
      success: true,
      message: `Successfully exported ${exportData.length} readings`,
    };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      message: `Export failed: ${error.message}`,
    };
  }
}

/**
 * Handle import operation
 * Imports readings from file, detects duplicates, and saves to storage
 *
 * @param {File} file - File to import
 * @returns {Promise<ImportResult>}
 *
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import was successful
 * @property {string} message - Summary message
 * @property {number} totalReadings - Total readings in file
 * @property {number} imported - Number of readings imported
 * @property {number} skipped - Number of duplicates skipped
 * @property {number} failed - Number of invalid readings
 * @property {string[]} errors - Array of error messages
 * @property {Object} settings - Extracted settings from import (thresholds, username)
 */
export async function handleImport(file) {
  try {
    // Fetch existing readings for duplicate detection
    const existingAppReadings = await getReadings();
    const existingExportReadings = convertToExportFormat(existingAppReadings);

    // Import the file
    const importResult = await importReadings(file, {
      format: 'json',
      skipDuplicates: true,
      existingReadings: existingExportReadings,
    });

    if (!importResult.success) {
      return {
        ...importResult,
        message: `Import failed: ${importResult.errors.join(', ')}`,
        settings: {},
      };
    }

    // Convert imported readings to app format
    const appReadings = convertFromExportFormat(importResult.readings);

    // Save each reading to storage
    let savedCount = 0;
    const saveErrors = [];

    for (const reading of appReadings) {
      try {
        await saveReading(reading);
        savedCount++;
      } catch (error) {
        saveErrors.push(`Failed to save reading: ${error.message}`);
      }
    }

    // Extract settings from metadata (for future use)
    const settings = extractImportSettings(importResult.metadata || {});

    // Build result message
    const parts = [`Imported ${savedCount} readings`];

    if (importResult.skipped > 0) {
      parts.push(`${importResult.skipped} duplicates skipped`);
    }

    if (importResult.failed > 0) {
      parts.push(`${importResult.failed} invalid readings`);
    }

    if (saveErrors.length > 0) {
      parts.push(`${saveErrors.length} failed to save`);
    }

    return {
      success: savedCount > 0 || importResult.skipped > 0,
      message: parts.join(', '),
      totalReadings: importResult.totalReadings,
      imported: savedCount,
      skipped: importResult.skipped,
      failed: importResult.failed + saveErrors.length,
      errors: [...importResult.errors, ...saveErrors],
      settings,
    };
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      message: `Import failed: ${error.message}`,
      totalReadings: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [error.message],
      settings: {},
    };
  }
}

/**
 * Show user feedback message
 * Can be replaced with a toast/notification system
 *
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success', 'error', 'info'
 */
export function showFeedback(message, type = 'info') {
  // Simple alert for now - can be replaced with toast notifications
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`ℹ️ ${message}`);
  }
}
