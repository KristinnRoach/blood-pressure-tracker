# Blood Pressure Export/Import Module

A self-contained, extensible module for exporting and importing blood pressure readings. This module is completely isolated from the main application and can be used independently.

## Features

- ✅ Export readings to JSON format
- ✅ Import readings from JSON files
- ✅ Automatic duplicate detection
- ✅ Comprehensive data validation
- ✅ Extensible format system (easy to add CSV, XML, etc.)
- ✅ Zero dependencies on app code
- ✅ Full TypeScript/JSDoc documentation

## Quick Start

### Export Readings

```javascript
import { exportReadings } from './exportImport/index.js';

const readings = [
  {
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    timestamp: '2026-01-25T10:00:00.000Z',
  },
];

// Export to JSON file (triggers browser download)
await exportReadings(readings, {
  format: 'json',
  metadata: {
    appVersion: '1.0.0',
    userId: 'user123',
  },
});
```

### Import Readings

```javascript
import { importReadings } from './exportImport/index.js';

// Get file from input element
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

// Import with duplicate detection
const result = await importReadings(file, {
  format: 'json',
  skipDuplicates: true,
  existingReadings: await getExistingReadings(), // Your existing readings
});

console.log(`Imported: ${result.imported}`);
console.log(`Skipped: ${result.skipped}`);
console.log(`Failed: ${result.failed}`);

// Save the valid readings
for (const reading of result.readings) {
  await saveReading(reading);
}
```

## API Reference

### `exportReadings(readings, options)`

Exports readings to a downloadable file.

**Parameters:**

- `readings` (Array): Array of reading objects
- `options` (Object):
  - `format` (string): Format name (default: 'json')
  - `metadata` (Object): Additional metadata to include
  - `filename` (string): Custom filename (optional)

**Returns:** Promise<void>

### `importReadings(file, options)`

Imports readings from a file.

**Parameters:**

- `file` (File): File object from input element
- `options` (Object):
  - `format` (string): Format name (default: 'json')
  - `skipDuplicates` (boolean): Skip duplicate readings (default: true)
  - `existingReadings` (Array): Existing readings for duplicate detection

**Returns:** Promise<ImportResult>

**ImportResult:**

```javascript
{
  success: boolean,
  totalReadings: number,
  imported: number,
  skipped: number,
  failed: number,
  errors: string[],
  readings: Array // Valid, non-duplicate readings
}
```

### `registerFormat(name, handler)`

Register a custom format handler.

**Parameters:**

- `name` (string): Format name
- `handler` (Object): Format handler with serialize/deserialize methods

### `getSupportedFormats()`

Get list of supported formats.

**Returns:** string[]

## Data Format

### Reading Object

```javascript
{
  systolic: number,    // 0-300
  diastolic: number,   // 0-200
  pulse: number,       // 0-300
  timestamp: string    // ISO 8601 format
}
```

### JSON Export Format (v1.0)

```json
{
  "version": "1.0",
  "format": "json",
  "exportDate": "2026-01-25T14:30:22.000Z",
  "metadata": {
    "appVersion": "1.0.0",
    "userId": null,
    "readingCount": 150
  },
  "readings": [
    {
      "systolic": 120,
      "diastolic": 80,
      "pulse": 72,
      "timestamp": "2026-01-25T10:00:00.000Z"
    }
  ]
}
```

## Validation Rules

The module validates all imported readings:

- **Required fields:** systolic, diastolic, pulse, timestamp
- **Systolic:** 0-300 (number)
- **Diastolic:** 0-200 (number)
- **Pulse:** 0-300 (number)
- **Timestamp:** Valid ISO 8601 string or Date object

Invalid readings are skipped and reported in the import result.

## Duplicate Detection

Duplicates are detected by comparing:

- Timestamp
- Systolic value
- Diastolic value
- Pulse value

If all four fields match, the reading is considered a duplicate and skipped (when `skipDuplicates: true`).

## Adding Custom Formats

You can easily add support for new formats:

```javascript
import { registerFormat } from './exportImport/index.js';

const csvFormat = {
  serialize(readings, metadata) {
    // Convert readings to CSV string
    let csv = 'Systolic,Diastolic,Pulse,Timestamp\n';
    for (const r of readings) {
      csv += `${r.systolic},${r.diastolic},${r.pulse},${r.timestamp}\n`;
    }
    return csv;
  },

  deserialize(content) {
    // Parse CSV string to readings array
    const lines = content.split('\n').slice(1); // Skip header
    const readings = lines
      .filter((line) => line.trim())
      .map((line) => {
        const [systolic, diastolic, pulse, timestamp] = line.split(',');
        return {
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          pulse: Number(pulse),
          timestamp: timestamp.trim(),
        };
      });

    return { readings, metadata: {} };
  },

  fileExtension: 'csv',
  mimeType: 'text/csv',
};

registerFormat('csv', csvFormat);

// Now you can use CSV format
await exportReadings(readings, { format: 'csv' });
```

## Error Handling

The module provides comprehensive error handling:

```javascript
try {
  await exportReadings(readings);
} catch (error) {
  console.error('Export failed:', error.message);
}

const result = await importReadings(file);
if (!result.success) {
  console.error('Import errors:', result.errors);
}
```

## Demo

Open `demo.html` in a browser to see the module in action. The demo shows:

- Exporting sample data
- Importing files
- Duplicate detection
- Error handling
- Validation

## Testing

Run the test suite:

```bash
npm test -- src/scripts/exportImport/__tests__
```

Tests include:

- Unit tests for all modules
- Validation tests
- Duplicate detection tests
- Format handler tests
- Error handling tests

## Module Structure

```text
exportImport/
├── index.js              # Main API
├── formats/
│   ├── formatRegistry.js # Format registration system
│   └── json.js          # JSON format handler
├── validators/
│   └── readingValidator.js # Reading validation
├── utils/
│   ├── fileDownload.js   # Browser file download
│   └── duplicateDetector.js # Duplicate detection
├── __tests__/           # Test files
├── demo.html            # Interactive demo
└── README.md            # This file
```

## Browser Compatibility

Works in all modern browsers that support:

- ES6 modules
- File API
- Blob API
- FileReader API

## License

Part of the Blood Pressure Tracker application.
