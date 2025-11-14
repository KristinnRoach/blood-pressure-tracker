// Theme management
const THEME_KEY = 'bp-tracker-theme';

// Get saved theme or detect system preference
function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    return savedTheme;
  }

  // Check system preference
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

// Apply theme to document
function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  // Update icon
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Save preference
  localStorage.setItem(THEME_KEY, theme);
}

// Toggle between light and dark
function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Initialize theme on page load
function initTheme() {
  const theme = getInitialTheme();
  applyTheme(theme);

  // Set up toggle button
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // Listen for system theme changes (only if user hasn't set a preference)
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a theme
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (!savedTheme) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
  }
}

export { initTheme, toggleTheme, applyTheme };
