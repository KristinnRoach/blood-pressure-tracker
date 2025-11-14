// Visual feedback scales for blood pressure measurements

// Scale configurations with ranges and positioning
const scaleConfigs = {
  systolic: {
    ranges: [
      { min: 0, max: 120, class: 'normal' },
      { min: 120, max: 130, class: 'elevated' },
      { min: 130, max: 140, class: 'high1' },
      { min: 140, max: 180, class: 'high2' },
      { min: 180, max: 250, class: 'critical' },
    ],
    totalRange: { min: 0, max: 250 },
  },
  diastolic: {
    ranges: [
      { min: 0, max: 80, class: 'normal' },
      { min: 80, max: 90, class: 'high1' },
      { min: 90, max: 120, class: 'high2' },
      { min: 120, max: 150, class: 'critical' },
    ],
    totalRange: { min: 0, max: 150 },
  },
  pulse: {
    ranges: [
      { min: 30, max: 60, class: 'low' },
      { min: 60, max: 100, class: 'normal' },
      { min: 100, max: 200, class: 'high' },
    ],
    totalRange: { min: 30, max: 200 },
  },
};

// Calculate position percentage for a value within a scale
function calculatePosition(value, config) {
  const { min, max } = config.totalRange;
  const clampedValue = Math.max(min, Math.min(max, value));
  return ((clampedValue - min) / (max - min)) * 100;
}

// Update indicator position for a specific scale
function updateIndicator(type, value) {
  const indicator = document.getElementById(`${type}-indicator`);
  const config = scaleConfigs[type];

  if (!indicator || !config || !value || isNaN(value)) {
    indicator?.classList.remove('active');
    return;
  }

  const position = calculatePosition(value, config);
  indicator.style.left = `${position}%`;
  indicator.classList.add('active');
}

// Initialize visual scales with event listeners
export function initializeVisualScales() {
  // Add input event listeners for real-time updates
  const systolicInput = document.getElementById('systolic');
  const diastolicInput = document.getElementById('diastolic');
  const pulseInput = document.getElementById('pulse');

  if (systolicInput) {
    systolicInput.addEventListener('input', (e) => {
      updateIndicator('systolic', parseInt(e.target.value));
    });
  }

  if (diastolicInput) {
    diastolicInput.addEventListener('input', (e) => {
      updateIndicator('diastolic', parseInt(e.target.value));
    });
  }

  if (pulseInput) {
    pulseInput.addEventListener('input', (e) => {
      updateIndicator('pulse', parseInt(e.target.value));
    });
  }

  console.log('Visual scales initialized');
}

// Clear all indicators (used when form is reset)
export function clearIndicators() {
  const indicators = [
    'systolic-indicator',
    'diastolic-indicator',
    'pulse-indicator',
  ];
  indicators.forEach((id) => {
    const indicator = document.getElementById(id);
    if (indicator) {
      indicator.classList.remove('active');
    }
  });
}
