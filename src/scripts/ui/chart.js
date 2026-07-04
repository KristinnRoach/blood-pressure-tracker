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
  Legend,
);

let combinedChart = null;
let currentReadings = [];
let allReadings = [];
let selectedRangeDays = 30;

export function initializeCharts() {
  // Create chart containers if they don't exist
  createChartContainer();

  const chartTextColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--text-secondary')
      .trim() || '#666';

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
          ticks: {
            color: chartTextColor,
          },
          title: {
            display: false,
          },
        },
        x: {
          display: true,
          ticks: {
            color: chartTextColor,
          },
          title: {
            display: false,
          },
        },
      },
    },
  });

  // Set up filter event listeners
  setupFilterListeners();
  setupRangeListeners();
}

function createChartContainer() {
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
      <div class="chart-range-filters" aria-label="Chart time period">
        <button type="button" class="range-filter-label" data-range-days="7">Week</button>
        <button type="button" class="range-filter-label active" data-range-days="30">Month</button>
        <button type="button" class="range-filter-label" data-range-days="365">Year</button>
        <button type="button" class="range-filter-label" data-range-days="">All</button>
      </div>
    `;

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

function setupRangeListeners() {
  const labels = document.querySelectorAll('.range-filter-label');
  labels.forEach((label) => {
    label.addEventListener('click', (e) => {
      selectedRangeDays = e.target.dataset.rangeDays
        ? Number(e.target.dataset.rangeDays)
        : null;

      labels.forEach((currentLabel) => currentLabel.classList.remove('active'));
      e.target.classList.add('active');
      updateCharts(allReadings);
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

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function filterDailyMedians(dailyMedians, rangeDays = selectedRangeDays) {
  if (!rangeDays || dailyMedians.length === 0) return dailyMedians;

  const lastDate = new Date(
    `${dailyMedians[dailyMedians.length - 1].date}T00:00:00`,
  );
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - rangeDays + 1);

  const cutoffKey = getDateKey(cutoff);
  return dailyMedians.filter((reading) => reading.date >= cutoffKey);
}

function isRangeAvailable(dailyMedians, rangeDays) {
  if (!rangeDays) return dailyMedians.length >= 2;

  return filterDailyMedians(dailyMedians, rangeDays).length >= 2;
}

function updateRangeAvailability(dailyMedians) {
  const labels = document.querySelectorAll('.range-filter-label');
  labels.forEach((label) => {
    const rangeDays = label.dataset.rangeDays
      ? Number(label.dataset.rangeDays)
      : null;

    label.disabled = !isRangeAvailable(dailyMedians, rangeDays);
  });

  if (!isRangeAvailable(dailyMedians, selectedRangeDays)) {
    const fallback = Array.from(labels).find((label) => !label.disabled);
    if (!fallback) return;

    selectedRangeDays = fallback.dataset.rangeDays
      ? Number(fallback.dataset.rangeDays)
      : null;

    labels.forEach((label) => label.classList.remove('active'));
    fallback.classList.add('active');
  }
}

export function updateCharts(readings) {
  console.log('Updating charts with', readings.length, 'readings');
  allReadings = readings;
  const chartSection = document.getElementById('chart-section');
  if (!chartSection) return;

  if (readings.length < 2) {
    chartSection.style.display = 'none';
    return;
  }

  chartSection.style.display = 'block';

  // Group readings by date and calculate median for each day
  const readingsByDate = new Map();
  readings.forEach((reading) => {
    const date = new Date(reading.date);
    const dateKey = getDateKey(date);

    if (!readingsByDate.has(dateKey)) {
      readingsByDate.set(dateKey, []);
    }
    readingsByDate.get(dateKey).push(reading);
  });

  // Require readings from at least 2 different dates to show chart
  if (readingsByDate.size < 2) {
    chartSection.style.display = 'none';
    return;
  }

  // Calculate median for each day and sort by date
  const allDailyMedians = Array.from(readingsByDate.entries())
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

  updateRangeAvailability(allDailyMedians);
  const dailyMedians = filterDailyMedians(allDailyMedians);

  if (dailyMedians.length < 2) {
    chartSection.style.display = 'none';
    return;
  }

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
