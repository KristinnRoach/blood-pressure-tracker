# Design Document

## Overview

The Blood Pressure Tracker MVP builds upon the existing PoC by adding PWA capabilities, IndexedDB storage, visual feedback scales, and trend charts. The design maintains the simple, clean interface while enhancing functionality for better user experience and data persistence.

## Architecture

### Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (building on existing PoC)
- **Storage**: IndexedDB with Dexie.js wrapper for simplified database operations
- **Charts**: Chart.js for lightweight trend visualization
- **PWA**: Workbox for service worker and caching
- **Build**: Vite for development and production builds

### Application Structure

```
src/
├── index.html          # Main app interface (enhanced PoC)
├── styles/
│   └── main.css       # Extracted and enhanced styles
├── scripts/
│   ├── app.js         # Main application logic
│   ├── storage.js     # IndexedDB operations
│   ├── charts.js      # Chart rendering and updates
│   ├── users.js       # Optional: User management
│   └── pwa.js         # PWA registration and updates
├── manifest.json      # PWA manifest
└── sw.js             # Service worker
```

## Components and Interfaces

### 1. User Selection Component (Optional)

**New component for multi-user support**

- Simple dropdown/select for choosing active user
- "Add User" button for creating new profiles
- Username input modal (no passwords - local only)
- Current user indicator in header

### 2. Data Input Component

**Enhancement of existing form**

- Retains current 3-input layout (systolic/diastolic/pulse)
- Adds visual feedback scales below each input
- Implements real-time validation with visual indicators

### 2. Visual Feedback Scales

**New component for enhanced user feedback**

- Horizontal progress bars for each measurement type
- Color-coded segments (green/yellow/orange/red)
- Dynamic positioning based on entered values
- Tooltips showing exact ranges

### 3. Status Display Component

**Enhanced version of existing status div**

- Retains current color-coded categories
- Adds numerical positioning on scales
- Shows trend indicators (↑↓→) compared to recent average

### 4. Charts Component

**New trend visualization**

- Combined systolic/diastolic line chart
- Separate pulse trend chart
- 7-day and 30-day view toggles
- Responsive design for mobile screens

### 5. History Component

**Enhanced version of existing history**

- Retains current list format
- Adds mini trend indicators per entry
- Implements pagination for large datasets
- Export functionality (CSV format)

### 6. Storage Interface

```javascript
// IndexedDB Schema
const schema = {
  users: {
    id: 'auto_increment',
    username: 'string',
    created: 'date',
  },
  readings: {
    id: 'auto_increment',
    userId: 'number', // Optional: foreign key to users table
    systolic: 'number',
    diastolic: 'number',
    pulse: 'number',
    timestamp: 'date',
    category: 'string',
  },
};
```

## Data Models

### User Model (Optional)

```javascript
{
  id: number,           // Auto-generated
  username: string,     // 3-20 characters, unique
  created: Date         // Account creation timestamp
}
```

### Reading Model

```javascript
{
  id: number,           // Auto-generated
  userId: number,       // Optional: reference to user (null for single-user mode)
  systolic: number,     // 70-250 range
  diastolic: number,    // 40-150 range
  pulse: number,        // 30-200 range
  timestamp: Date,      // ISO string
  category: string      // 'normal'|'elevated'|'high1'|'high2'|'crisis'
}
```

### Visual Scale Configuration

```javascript
{
  systolic: {
    ranges: [
      { min: 0, max: 120, color: '#28a745', label: 'Normal' },
      { min: 120, max: 130, color: '#ffc107', label: 'Elevated' },
      { min: 130, max: 140, color: '#fd7e14', label: 'High 1' },
      { min: 140, max: 180, color: '#dc3545', label: 'High 2' },
      { min: 180, max: 250, color: '#6f42c1', label: 'Crisis' },
    ];
  }
  // Similar for diastolic and pulse
}
```

## Error Handling

### Input Validation

- Client-side validation for numeric ranges
- Visual feedback for invalid inputs
- Graceful handling of edge cases (very high/low values)

### Storage Errors

- Fallback to localStorage if IndexedDB fails
- User notification for storage quota exceeded
- Data export before clearing storage

### PWA Errors

- Graceful degradation when offline
- Update notification system
- Cache failure recovery

## Testing Strategy

### Core Functionality Tests

- Reading input and validation
- Category calculation accuracy
- Data persistence across sessions
- Chart rendering with various data sets

### PWA Tests

- Offline functionality verification
- Installation flow testing
- Service worker update handling
- Cross-browser compatibility

### Performance Tests

- Large dataset handling (1000+ readings)
- Chart rendering performance
- Storage operation speed
- Mobile device responsiveness

## Implementation Notes

### Core Principles

1. **KISS (Keep It Simple, Stupid)** - Minimal code, simple solutions
2. **Functionality First** - Test in browser after each functional step
3. **Avoid Over-Engineering** - Don't lock into patterns without user approval

### Migration from PoC

1. Extract existing CSS to separate file
2. Modularize JavaScript functions
3. Replace localStorage with IndexedDB
4. Add PWA manifest and service worker
5. Integrate Chart.js for visualizations
6. Implement visual feedback scales
7. Optional: Add multi-user functionality with simple username selection

### Multi-User Implementation (Optional)

- Start with single-user mode (userId = null for all readings)
- Add user selection UI as enhancement
- Implement user switching without authentication
- Filter all data operations by active user
- Graceful fallback if user management is disabled

### PWA Considerations

- Minimal app shell for fast loading
- Aggressive caching of static assets
- Background sync for future enhancements
- Install prompts for mobile users

### Performance Optimizations

- Lazy loading of chart library
- Virtual scrolling for large history lists
- Debounced input validation
- Efficient IndexedDB queries with indexes
