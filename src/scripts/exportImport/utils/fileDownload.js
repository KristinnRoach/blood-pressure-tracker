/**
 * File download utility for browser-based file downloads
 * @module utils/fileDownload
 */

/**
 * Generates a filename with timestamp
 * @param {string} prefix - Filename prefix (e.g., 'bp-readings')
 * @param {string} extension - File extension (e.g., 'json')
 * @returns {string} Filename with timestamp (e.g., 'bp-readings-2026-01-25-143022.json')
 */
export function generateFilename(prefix, extension) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${prefix}-${year}-${month}-${day}-${hours}${minutes}${seconds}.${extension}`;
}

/**
 * Triggers a browser download of the given content
 * @param {string} content - File content to download
 * @param {string} filename - Name of the file to download
 * @param {string} mimeType - MIME type of the file (e.g., 'application/json')
 * @throws {Error} If download fails
 */
export function downloadFile(content, filename, mimeType) {
  try {
    // Create a Blob from the content
    const blob = new Blob([content], { type: mimeType });

    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Clean up the object URL after a short delay
    // (immediate cleanup can prevent download in some browsers)
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}
