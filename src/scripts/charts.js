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
  createChartContainers();

  // Initialize combined chart
  const chartCtx = document.getElementById('combined-chart').getContext('2d');
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
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'mmHg',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'bpm',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
      },
    },
  });

  // Set up filter event listeners
  setupFilterListeners();
}

function createChartContainers() {
  // Find the history section
  const historySection = document.querySelector('.history');

  // Check if charts section already exists
  if (!document.getElementById('charts-section')) {
    // Create charts section
    const chartsSection = document.createElement('div');
    chartsSection.id = 'charts-section';
    chartsSection.className = 'charts';
    chartsSection.innerHTML = `
      <div class="chart-filters">
        <span class="filter-label active" data-dataset="0">Systolic</span>
        <span class="filter-label active" data-dataset="1">Diastolic</span>
        <span class="filter-label active" data-dataset="2">Pulse</span>
      </div>
      <div id="insufficient-data" class="insufficient-data" style="display: none;">
        <p>Add at least 2 readings to see trend charts</p>
      </div>
      <div class="chart-container">
        <canvas id="combined-chart"></canvas>
      </div>
    `;

    // Insert before history section
    historySection.parentNode.insertBefore(chartsSection, historySection);
  }
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

export function updateCharts(readings) {
  console.log('Updating charts with', readings.length, 'readings');

  // Store current readings for filter operations
  currentReadings = readings;

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

  // Sort readings by date (oldest first for chart display)
  const sortedReadings = [...readings].reverse();

  // Prepare data for charts
  const labels = sortedReadings.map((reading) => {
    const date = new Date(reading.date);
    return date.toLocaleDateString();
  });

  const systolicData = sortedReadings.map((reading) => reading.systolic);
  const diastolicData = sortedReadings.map((reading) => reading.diastolic);
  const pulseData = sortedReadings.map((reading) => reading.pulse);

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
