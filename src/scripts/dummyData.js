// Development dummy data generator for blood pressure readings

import { saveReading } from './storage.js';

// Generate realistic dummy blood pressure readings for development
export async function generateDummyData() {
  // Only run in development environment
  if (import.meta.env.PROD) {
    console.log('Dummy data generation skipped in production');
    return;
  }

  console.log('Generating dummy blood pressure readings for development...');

  const dummyReadings = [
    // Normal readings
    { systolic: 118, diastolic: 76, pulse: 72 },
    { systolic: 115, diastolic: 74, pulse: 68 },
    { systolic: 112, diastolic: 78, pulse: 75 },

    // Elevated readings
    { systolic: 125, diastolic: 78, pulse: 82 },
    { systolic: 128, diastolic: 76, pulse: 85 },

    // High Stage 1
    { systolic: 135, diastolic: 88, pulse: 88 },
    { systolic: 138, diastolic: 85, pulse: 90 },

    // High Stage 2
    { systolic: 145, diastolic: 95, pulse: 95 },

    // Low readings
    { systolic: 95, diastolic: 65, pulse: 58 },

    // Borderline high pulse
    { systolic: 120, diastolic: 80, pulse: 105 },
  ];

  try {
    // Generate readings spread over the last 30 days
    for (let i = 0; i < dummyReadings.length; i++) {
      const reading = dummyReadings[i];

      // Create dates spread over last 30 days
      const daysAgo = Math.floor((30 / dummyReadings.length) * i);
      const readingDate = new Date();
      readingDate.setDate(readingDate.getDate() - daysAgo);

      // Add some random hours/minutes to make it more realistic
      readingDate.setHours(8 + Math.floor(Math.random() * 12)); // Between 8 AM and 8 PM
      readingDate.setMinutes(Math.floor(Math.random() * 60));

      const readingData = {
        systolic: reading.systolic,
        diastolic: reading.diastolic,
        pulse: reading.pulse,
        date: readingDate.toISOString(),
      };

      await saveReading(readingData);
      console.log(`Added dummy reading ${i + 1}:`, readingData);
    }

    console.log(
      `Successfully generated ${dummyReadings.length} dummy readings`
    );
    return dummyReadings.length;
  } catch (error) {
    console.error('Error generating dummy data:', error);
    throw error;
  }
}

// Function to check if dummy data should be generated (DEV only)
export function shouldGenerateDummyData() {
  return !import.meta.env.PROD;
}
