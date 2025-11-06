// PWA functionality - service worker registration and install prompts

let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
function checkInstallStatus() {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled = true;
    console.log('PWA: App is running in standalone mode');
  }

  // Check if running as PWA on iOS
  if (window.navigator.standalone === true) {
    isInstalled = true;
    console.log('PWA: App is running as PWA on iOS');
  }
}

// Register service worker
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('PWA: Registering service worker...');

      const registration = await navigator.serviceWorker.register(
        './service-worker.js'
      );

      console.log('PWA: Service worker registered successfully', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('PWA: New service worker found');

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('PWA: New service worker installed, update available');
            showUpdateAvailable(registration);
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('PWA: Service worker registration failed', error);
      return null;
    }
  } else {
    console.log('PWA: Service workers not supported');
    return null;
  }
}

// Show update notification
function showUpdateAvailable(registration) {
  // Simple update notification - could be enhanced with a proper UI
  if (confirm('A new version of the app is available. Update now?')) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}

// Handle install prompt
export function setupInstallPrompt() {
  checkInstallStatus();

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('PWA: Install prompt available');

    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();

    // Save the event for later use
    deferredPrompt = event;

    // Show install button or notification
    showInstallOption();
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA: App was installed');
    isInstalled = true;
    hideInstallOption();
    deferredPrompt = null;
  });
}

// Show install option to user
function showInstallOption() {
  if (isInstalled) return;

  // Create a simple install notification
  const installBanner = document.createElement('div');
  installBanner.id = 'install-banner';
  installBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #007bff;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 1000;
      font-size: 14px;
    ">
      <span>Install this app for a better experience</span>
      <button id="install-button" style="
        margin-left: 10px;
        background: white;
        color: #007bff;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
      ">Install</button>
      <button id="dismiss-install" style="
        margin-left: 5px;
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
      ">×</button>
    </div>
  `;

  document.body.appendChild(installBanner);

  // Handle install button click
  document
    .getElementById('install-button')
    .addEventListener('click', async () => {
      if (deferredPrompt) {
        console.log('PWA: Showing install prompt');
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA: Install prompt result:', outcome);

        deferredPrompt = null;
        hideInstallOption();
      }
    });

  // Handle dismiss button click
  document.getElementById('dismiss-install').addEventListener('click', () => {
    hideInstallOption();
  });
}

// Hide install option
function hideInstallOption() {
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.remove();
  }
}

// Initialize PWA features
export function initializePWA() {
  console.log('PWA: Initializing PWA features');

  registerServiceWorker();
  setupInstallPrompt();

  // Add body class for PWA styling
  if (isInstalled) {
    document.body.classList.add('pwa-installed');
  }
}

// Check if app is offline
export function isOnline() {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOfflineHandling() {
  window.addEventListener('online', () => {
    console.log('PWA: App is online');
    document.body.classList.remove('offline');
  });

  window.addEventListener('offline', () => {
    console.log('PWA: App is offline');
    document.body.classList.add('offline');
  });

  // Set initial state
  if (!isOnline()) {
    document.body.classList.add('offline');
  }
}
