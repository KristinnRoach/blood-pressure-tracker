# Project Preferences

## Development Philosophy

- **KISS Principle**: Keep implementations simple and minimal - avoid over-engineering
- **Functionality First**: Test in browser after each functional step with console monitoring
- **Interactive Testing**: Primary testing method using browser console for real-time debugging
- **Minimal Dependencies**: Use lightweight libraries and vanilla JavaScript when possible

## Code Standards

- **Vanilla JavaScript**: Prefer vanilla JS over heavy frameworks for simple applications
- **Modular Structure**: Split code into focused, single-purpose files
- **Progressive Enhancement**: Build core functionality first, add enhancements incrementally
- **Mobile-First**: Ensure responsive design works on mobile, tablet, and desktop

## Testing Approach

- **Vitest**: Use sparingly for critical logic only - delete verification tests after confirming functionality
- **Console Monitoring**: Primary debugging method during development
- **Browser Testing**: Verify functionality works across sessions and offline scenarios
- **Avoid Test Overhead**: Don't maintain extensive test suites for simple applications

## PWA Requirements

- **Offline First**: Applications should work completely offline after initial load
- **IndexedDB**: Use for persistent local storage with Dexie.js wrapper
- **Service Workers**: Implement for caching and offline functionality
- **Installable**: Include proper PWA manifest for native-like installation

## Git Workflow

- **Commit After Features**: Make commits after completing each functional component
- **Test Before Commit**: Verify functionality works in browser before committing
- **Deploy Early**: Set up GitHub Pages deployment for easy testing and sharing

## Preferred tools

- **Package Manager**: Prefer pnpm over npm.

## UI/UX Principles

- **Immediate Feedback**: Provide instant visual feedback for user actions
- **Color Coding**: Use consistent color schemes
- **Clean Interface**: Maintain simple, uncluttered layouts
