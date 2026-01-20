// Visual feedback scales for blood pressure measurements

// Scale configurations with ranges and positioning
export const scaleConfigs = {
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

// Optional custom thresholds (set by SettingsModal). Not required for indicator positioning
let customThresholds = null;

export function setCustomThresholds(thresholds) {
  customThresholds = thresholds;
  // Update any visible scales so the UI reflects the user's thresholds.
  // This keeps the stored thresholds useful for consumers that call this
  // function (for example `app.js` listens for the event and calls it).
  try {
    applyThresholdMarkers();
  } catch (e) {
    console.warn('Failed to apply custom thresholds to visual scales', e);
  }
  // Consumers can still listen for `thresholds-updated` to react if needed
}

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

  // Apply any currently-set custom thresholds to the scales
  applyThresholdMarkers();

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

  // Also hide threshold markers if present
  ['systolic', 'diastolic', 'pulse'].forEach((t) => {
    const low = document.getElementById(`${t}-threshold-low`);
    const high = document.getElementById(`${t}-threshold-high`);
    if (low) low.style.display = 'none';
    if (high) high.style.display = 'none';
  });
}

// Render or update threshold marker elements inside each scale based on
// `customThresholds`. This keeps a minimal, non-invasive visual indicator
// of the user's configured min/max values without changing existing
// segmentation logic.
function applyThresholdMarkers() {
  if (!customThresholds || typeof document === 'undefined') return;

  ['systolic', 'diastolic', 'pulse'].forEach((type) => {
    const scaleEl = document.getElementById(`${type}-scale`);
    if (!scaleEl) return;

    const config = scaleConfigs[type];
    if (!config) return;

    const lowVal = customThresholds[type] && customThresholds[type].min;
    const highVal = customThresholds[type] && customThresholds[type].max;

    const ensureMarker = (idSuffix, className) => {
      const id = `${type}-${idSuffix}`;
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.className = `scale-threshold ${className}`;
        // position absolute relative to scale container; styles should be
        // provided in CSS (graceful fallback to inline left below)
        el.setAttribute('aria-hidden', 'true');
        scaleEl.appendChild(el);
      }
      return el;
    };

    const lowEl = ensureMarker('threshold-low', 'threshold-low');
    const highEl = ensureMarker('threshold-high', 'threshold-high');

    if (typeof lowVal === 'number') {
      lowEl.style.left = `${calculatePosition(lowVal, config)}%`;
      lowEl.style.display = '';
    } else {
      lowEl.style.display = 'none';
    }

    if (typeof highVal === 'number') {
      highEl.style.left = `${calculatePosition(highVal, config)}%`;
      highEl.style.display = '';
    } else {
      highEl.style.display = 'none';
    }
  });
}
