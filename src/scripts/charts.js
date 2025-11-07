// Chart rendering and updates using Chart.js

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
);

let combinedChart = null;
let currentReadings = [];

export function initializeCharts() {
  // Create chart containers if they don't exist
  createChartContainer();

  // Initialize combined chart
  const chartCtx = document.getElementById('chart-canvas').getContext('2d');
  combinedChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Systolic',
          data: [],
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.1,
          hidden: false,
        },
        {
          label: 'Diastolic',
          data: [],
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.1,
          hidden: false,
        },
        {
          label: 'Pulse',
          data: [],
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.1,
          hidden: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              // Use the stored full date from currentReadings
              const index = context[0].dataIndex;
              if (currentReadings[index]) {
                const date = new Date(currentReadings[index].date);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }
              return context[0].label;
            },
          },
        },
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: false,
          },
        },
        x: {
          display: true,
          title: {
            display: false,
          },
        },
      },
    },
  });

  // Set up filter event listeners
  setupFilterListeners();
}

function createChartContainer() {
  // Find the chart container
  const chartContainer = document.getElementById('chart-container');
  if (!chartContainer) {
    console.error('Chart container not found!');
    return false;
  }

  chartContainer.innerHTML = `
      <div class="chart-filters">
        <span class="filter-label active" data-dataset="0">Systolic</span>
        <span class="filter-label active" data-dataset="1">Diastolic</span>
        <span class="filter-label active" data-dataset="2">Pulse</span>
      </div>
      <div id="insufficient-data" class="insufficient-data" style="display: none;">
        <p>Add at least 2 readings to see trend charts</p>
      </div>
      <div class="chart-canvas-wrapper">
        <canvas id="chart-canvas"></canvas>
      </div>
    `;

  // // Insert before history section
  // historySection.parentNode.insertBefore(chartsSection, historySection);
  return true;
}

function setupFilterListeners() {
  const labels = document.querySelectorAll('.filter-label');
  labels.forEach((label) => {
    label.addEventListener('click', (e) => {
      const datasetIndex = parseInt(e.target.dataset.dataset);
      const isActive = e.target.classList.contains('active');

      // Toggle active state
      e.target.classList.toggle('active');

      if (combinedChart && combinedChart.data.datasets[datasetIndex]) {
        combinedChart.data.datasets[datasetIndex].hidden = isActive;
        combinedChart.update('active');
        console.log(`Dataset ${datasetIndex} visibility:`, !isActive);
      }
    });
  });
}

function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function updateCharts(readings) {
  console.log('Updating charts with', readings.length, 'readings');

  // Handle insufficient data case
  const insufficientDataDiv = document.getElementById('insufficient-data');
  const chartContainer = document.querySelector('.chart-container');
  const chartFilters = document.querySelector('.chart-filters');

  if (readings.length < 2) {
    console.log('Insufficient data for charts');
    insufficientDataDiv.style.display = 'block';
    if (chartContainer) chartContainer.style.display = 'none';
    if (chartFilters) chartFilters.style.display = 'none';
    return;
  }

  // Show charts and hide insufficient data message
  insufficientDataDiv.style.display = 'none';
  if (chartContainer) chartContainer.style.display = 'block';
  if (chartFilters) chartFilters.style.display = 'flex';

  // Group readings by date and calculate median for each day
  const readingsByDate = new Map();
  readings.forEach((reading) => {
    const date = new Date(reading.date);
    const dateKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!readingsByDate.has(dateKey)) {
      readingsByDate.set(dateKey, []);
    }
    readingsByDate.get(dateKey).push(reading);
  });

  // Calculate median for each day and sort by date
  const dailyMedians = Array.from(readingsByDate.entries())
    .map(([dateKey, dayReadings]) => {
      const systolicValues = dayReadings.map((r) => r.systolic);
      const diastolicValues = dayReadings.map((r) => r.diastolic);
      const pulseValues = dayReadings.map((r) => r.pulse);

      return {
        date: dateKey,
        systolic: Math.round(calculateMedian(systolicValues)),
        diastolic: Math.round(calculateMedian(diastolicValues)),
        pulse: Math.round(calculateMedian(pulseValues)),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Store for tooltip access
  currentReadings = dailyMedians;

  // Prepare data for charts
  const labels = dailyMedians.map((reading, index) => {
    const [year, month, day] = reading.date.split('-');
    const date = new Date(year, month - 1, day);
    const dayNum = date.getDate();

    // Show month abbreviation when month changes or for first entry
    if (index === 0 || month !== dailyMedians[index - 1].date.split('-')[1]) {
      const monthAbbr = date.toLocaleDateString('en-US', { month: 'short' });
      return `${monthAbbr}: ${dayNum}`;
    }

    return dayNum.toString();
  });

  const systolicData = dailyMedians.map((reading) => reading.systolic);
  const diastolicData = dailyMedians.map((reading) => reading.diastolic);
  const pulseData = dailyMedians.map((reading) => reading.pulse);

  // Update combined chart
  if (combinedChart) {
    // Store daily medians for tooltip access
    currentReadings = dailyMedians;

    combinedChart.data.labels = labels;
    combinedChart.data.datasets[0].data = systolicData;
    combinedChart.data.datasets[1].data = diastolicData;
    combinedChart.data.datasets[2].data = pulseData;
    combinedChart.update();
    console.log('Combined chart updated');
  }
}

export function destroyCharts() {
  if (combinedChart) {
    combinedChart.destroy();
    combinedChart = null;
  }
}
