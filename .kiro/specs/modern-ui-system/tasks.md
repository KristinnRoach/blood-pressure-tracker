# Implementation Plan

- [ ] 1. Implement CSS design system with custom properties and themes

  - Add CSS custom properties at `:root` level for essential colors, spacing, and border radius
  - Add dark theme using `@media (prefers-color-scheme: dark)` query
  - Replace all hardcoded color values in existing CSS with custom property references
  - Test theme switching by changing system preferences
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Create ReadingInfoModal component

  - [ ] 2.1 Create modal.js file with ReadingInfoModal class

    - Implement constructor and init() method to create modal DOM structure
    - Create modal overlay and content elements
    - Add modal HTML to document body on initialization
    - _Requirements: 2.1, 2.2_

  - [ ] 2.2 Implement modal show() method

    - Accept reading object parameter with systolic, diastolic, pulse, date, and category
    - Populate modal with reading details
    - Display category with color-coded indicator
    - Show modal by adding active class
    - _Requirements: 2.2, 2.3_

  - [ ] 2.3 Implement modal close functionality

    - Add hide() method to remove active class
    - Attach click listener to close button
    - Attach click listener to overlay for click-outside-to-close
    - Attach ESC key listener to document
    - _Requirements: 2.4_

  - [ ] 2.4 Add modal CSS styles
    - Style modal overlay with semi-transparent background
    - Style modal content card with border, shadow, and centering
    - Add close button styling
    - Make modal responsive (full-width on mobile, fixed width on desktop)
    - Use design system custom properties for all colors and spacing
    - _Requirements: 2.5_

- [ ] 3. Update UI to use ReadingInfoModal instead of status div

  - [ ] 3.1 Modify ui.js to integrate modal

    - Import ReadingInfoModal class
    - Create modal instance on module load
    - Update showStatus() function to call modal.show() instead of updating status div
    - Pass reading data to modal including category information
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Remove status div from HTML
    - Delete `<div id="status"></div>` from index.html
    - Update app.js if needed to remove status div references
    - _Requirements: 2.1_

- [ ] 4. Create Calendar component

  - [ ] 4.1 Create calendar.js file with Calendar class

    - Implement constructor accepting containerId parameter
    - Initialize currentMonth to current date
    - Create empty readings array and modal reference property
    - _Requirements: 3.1_

  - [ ] 4.2 Implement calendar data loading

    - Create init() method accepting modal reference
    - Implement loadReadings() method to fetch readings from storage
    - Group readings by date (YYYY-MM-DD format) in a Map for quick lookup
    - Store modal reference for later use
    - _Requirements: 3.1_

  - [ ] 4.3 Implement calendar rendering logic

    - Create render() method to build calendar grid
    - Calculate days in current month and starting day of week
    - Generate array of CalendarDay objects with date, reading status, and reading data
    - Build DOM structure with header (month/year title and nav buttons) and grid
    - Apply color coding to days based on reading category
    - _Requirements: 3.2, 3.3_

  - [ ] 4.4 Implement calendar navigation

    - Create nextMonth() method to advance calendar by one month
    - Create prevMonth() method to go back one month
    - Attach click listeners to navigation buttons
    - Re-render calendar after navigation
    - _Requirements: 3.2_

  - [ ] 4.5 Implement day click interaction

    - Create handleDayClick() method accepting date parameter
    - Check if clicked day has a reading
    - If reading exists, call modal.show() with reading data
    - Attach click listeners to all day elements with readings
    - _Requirements: 3.4_

  - [ ] 4.6 Implement tooltip on hover

    - Create handleDayHover() method accepting date and event parameters
    - Create tooltip element in DOM
    - Show tooltip with reading summary (e.g., "120/80, 72 bpm") on mouseenter
    - Position tooltip near cursor, adjust to stay in viewport
    - Hide tooltip on mouseleave
    - Attach hover listeners to all day elements with readings
    - _Requirements: 3.5_

  - [ ] 4.7 Add calendar CSS styles
    - Style calendar container with header and grid layout
    - Create 7-column grid for days of week
    - Style day cells with appropriate sizing and spacing
    - Add color-coded backgrounds for days with readings using category colors
    - Style navigation buttons
    - Add hover effects for clickable days
    - Style tooltip with background, border, and positioning
    - Make calendar responsive (smaller cells on mobile)
    - Use design system custom properties throughout
    - _Requirements: 3.6, 3.7_

- [ ] 5. Replace History section with Calendar component

  - [ ] 5.1 Update HTML structure

    - Replace history section content with calendar container div
    - Update section title from "History" to "Calendar" or similar
    - _Requirements: 3.1_

  - [ ] 5.2 Integrate calendar into app.js

    - Import Calendar class
    - Create calendar instance with container ID
    - Call calendar.init() with modal reference after DOM loads
    - Remove or update loadHistory() calls to use calendar.loadReadings()
    - Ensure calendar refreshes when new reading is added
    - _Requirements: 3.1_

  - [ ] 5.3 Update ui.js to refresh calendar
    - Modify loadHistory() function to refresh calendar instead of history list
    - Ensure calendar updates after adding or deleting readings
    - _Requirements: 3.1_

- [ ] 6. Integration and final adjustments
  - Test complete flow: add reading → modal shows → calendar updates
  - Verify theme switching works across all components
  - Test modal and calendar on mobile, tablet, and desktop viewports
  - Verify all close methods work for modal (click outside, close button, ESC)
  - Test calendar navigation and verify readings display correctly across months
  - Test tooltip positioning and content
  - Verify color coding matches reading categories throughout
  - _Requirements: 1.4, 2.4, 2.5, 3.4, 3.5, 3.6, 3.7_
