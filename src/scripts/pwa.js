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

  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.style.display = 'inline-block';

    // Handle install button click (remove any existing listeners first)
    const newBtn = installBtn.cloneNode(true);
    installBtn.parentNode.replaceChild(newBtn, installBtn);

    newBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        console.log('PWA: Showing install prompt');
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA: Install prompt result:', outcome);

        deferredPrompt = null;
        hideInstallOption();
      }
    });
  }
}

// Hide install option
function hideInstallOption() {
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
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

  // For testing: show install button after a delay if no prompt appears
  // This helps with local development testing
  setTimeout(() => {
    if (!deferredPrompt && !isInstalled) {
      console.log(
        'PWA: No install prompt detected, showing button for testing'
      );
      const installBtn = document.getElementById('install-app-btn');
      if (installBtn) {
        installBtn.style.display = 'inline-block';
        installBtn.textContent = '📱 Install App (Test)';

        installBtn.addEventListener('click', () => {
          alert(
            'Install prompt not available. Try:\n1. Build and serve over HTTPS\n2. Use Chrome/Edge\n3. Visit multiple times'
          );
        });
      }
    }
  }, 2000);
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
