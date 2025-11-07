# Design Document

## Overview

This design implements a minimal modern CSS design system and two new UI components (ReadingInfoModal and Calendar) for the blood pressure tracker. The approach prioritizes simplicity, keeping only essential CSS custom properties and avoiding over-engineering. The design maintains the existing functionality while enhancing the visual presentation and user interaction patterns.

## Architecture

### Component Structure

```
src/
├── styles/
│   └── main.css (enhanced with design system + new components)
├── scripts/
│   ├── ui.js (updated to use modal instead of status div)
│   ├── modal.js (new - ReadingInfoModal component)
│   └── calendar.js (new - Calendar component)
└── index.html (updated structure)
```

### Design System Approach

The design system will be implemented using CSS custom properties at the `:root` level with a `prefers-color-scheme` media query for automatic theme switching. Only essential variables will be defined:

- Core colors (background, text, accent, borders)
- Category colors (normal, elevated, high1, high2, critical, low)
- Essential spacing values
- Border radius values

## Components and Interfaces

### 1. CSS Design System

**Location:** `src/styles/main.css`

**Custom Properties:**

```css
:root {
  /* Core colors - Light theme */
  --bg-primary: #f8f4de;
  --bg-secondary: rgba(109, 134, 143, 0.879);
  --text-primary: #428fe1;
  --text-secondary: #000;
  --border-color: rgba(38, 45, 52, 0.923);
  --accent-color: #428fe1;

  /* Category colors (shared across themes) */
  --color-normal: #28a745;
  --color-elevated: #ffc107;
  --color-high1: #fd7e14;
  --color-high2: #dc3545;
  --color-critical: #842029;
  --color-low: #17a2b8;

  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #2a2d31;
    --bg-secondary: #1a1d21;
    --text-primary: #e0e0e0;
    --text-secondary: #b0b0b0;
    --border-color: #4a4d51;
    --accent-color: #6badf3;
  }
}
```

**Implementation:**

- Replace hardcoded colors throughout existing CSS with custom properties
- Maintain existing layout and structure
- No container queries needed (keep it simple with standard media queries)

### 2. ReadingInfoModal Component

**Location:** `src/scripts/modal.js`

**Purpose:** Replace the current `#status` div with a modal dialog that displays detailed reading information.

**Interface:**

```javascript
export class ReadingInfoModal {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    // Create modal DOM structure
    // Attach event listeners for close actions
  }

  show(reading) {
    // Display modal with reading data
    // reading: { systolic, diastolic, pulse, date, category }
  }

  hide() {
    // Hide modal
  }
}
```

**DOM Structure:**

```html
<div class="modal-overlay" id="reading-modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div class="modal-body">
      <!-- Reading details populated here -->
    </div>
  </div>
</div>
```

**Styling:**

- Overlay with semi-transparent background
- Centered modal card with border and shadow
- Close button in top-right corner
- Responsive sizing (full-width on mobile, fixed width on desktop)
- Uses design system custom properties

**Behavior:**

- Click outside modal to close
- Click close button to close
- ESC key to close
- Display category with color-coded indicator
- Show all reading details (sys/dia, pulse, timestamp, category text)

### 3. Calendar Component

**Location:** `src/scripts/calendar.js`

**Purpose:** Replace the "History" section with an interactive calendar view showing color-coded readings.

**Interface:**

```javascript
export class Calendar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentMonth = new Date();
    this.readings = [];
    this.modal = null; // Reference to ReadingInfoModal
  }

  async init(modal) {
    // Initialize calendar with modal reference
    this.modal = modal;
    await this.loadReadings();
    this.render();
  }

  async loadReadings() {
    // Load readings from storage
    // Group by date for quick lookup
  }

  render() {
    // Render calendar grid for current month
    // Color-code days with readings
  }

  nextMonth() {
    // Navigate to next month
  }

  prevMonth() {
    // Navigate to previous month
  }

  handleDayClick(date) {
    // Open modal with reading for clicked date
  }

  handleDayHover(date, event) {
    // Show tooltip with reading summary
  }
}
```

**DOM Structure:**

```html
<div class="calendar">
  <div class="calendar-header">
    <button class="calendar-nav prev">&lt;</button>
    <h3 class="calendar-title">Month Year</h3>
    <button class="calendar-nav next">&gt;</button>
  </div>
  <div class="calendar-grid">
    <div class="calendar-day-label">Sun</div>
    <!-- ... other day labels ... -->
    <div class="calendar-day" data-date="YYYY-MM-DD">
      <span class="day-number">1</span>
    </div>
    <!-- ... other days ... -->
  </div>
</div>

<div class="tooltip" id="calendar-tooltip">
  <!-- Tooltip content -->
</div>
```

**Styling:**

- Grid layout (7 columns for days of week)
- Day cells with color-coded backgrounds based on reading category
- Current day highlighted with border
- Days with readings have colored background (using category colors)
- Days without readings have neutral background
- Hover effect on clickable days
- Responsive: smaller cells on mobile

**Behavior:**

- Display current month by default
- Navigation buttons to move between months
- Click on day with reading opens ReadingInfoModal
- Hover on day with reading shows tooltip with summary (e.g., "120/80, 72 bpm")
- Days without readings are not clickable
- Tooltip positioned near cursor, adjusts to stay in viewport

## Data Models

### Reading Object

```javascript
{
  systolic: number,
  diastolic: number,
  pulse: number,
  date: timestamp,
  category: {
    class: string,  // 'normal', 'elevated', 'high1', 'high2', 'critical', 'low'
    text: string    // Display text
  }
}
```

### Calendar Data Structure

```javascript
{
  readingsByDate: Map<string, Reading>,  // Key: 'YYYY-MM-DD', Value: Reading
  currentMonth: Date,
  daysInMonth: Array<CalendarDay>
}

CalendarDay {
  date: Date,
  dayNumber: number,
  hasReading: boolean,
  reading: Reading | null,
  isCurrentMonth: boolean
}
```

## Error Handling

### Modal Component

- If reading data is incomplete, display available fields only
- If modal fails to open, log error to console (fail silently to user)
- Ensure modal can always be closed (multiple close methods)

### Calendar Component

- If readings fail to load, display empty calendar with error message
- If date parsing fails, skip that reading and continue
- If navigation fails, stay on current month and log error
- Tooltip positioning errors should not break calendar functionality

### Design System

- Fallback colors defined for browsers that don't support custom properties (unlikely but safe)
- If dark mode detection fails, default to light theme

## Testing Strategy

### Manual Browser Testing

1. **Design System**

   - Verify light theme colors in browser
   - Switch system to dark mode and verify theme changes
   - Check all components use custom properties correctly

2. **ReadingInfoModal**

   - Add a reading and verify modal opens with correct data
   - Test all close methods (click outside, close button, ESC key)
   - Test on mobile and desktop viewports
   - Verify modal displays all reading details correctly

3. **Calendar Component**
   - Add readings on different dates
   - Verify calendar displays correct month
   - Click days with readings and verify modal opens
   - Hover over days and verify tooltip appears with correct data
   - Navigate between months and verify readings display correctly
   - Test on mobile and desktop viewports
   - Verify color coding matches reading categories

### Console Monitoring

- Monitor for any errors during modal open/close
- Check for errors during calendar rendering
- Verify readings load correctly from storage
- Check tooltip positioning calculations

### Cross-Session Testing

- Add readings, close browser, reopen and verify calendar displays correctly
- Test offline functionality with calendar and modal

### Responsive Testing

- Test on mobile viewport (< 480px)
- Test on tablet viewport (480px - 768px)
- Test on desktop viewport (> 768px)
- Verify modal and calendar are usable on all sizes
