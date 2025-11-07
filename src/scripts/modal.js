export class ReadingInfoModal {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    // Create modal DOM structure
    const modalHTML = `
      <div class="modal-overlay" id="reading-modal">
        <div class="modal-content">
          <button class="modal-close" aria-label="Close modal">&times;</button>
          <div class="modal-body">
            <!-- Reading details will be populated here -->
          </div>
        </div>
      </div>
    `;

    // Add modal to document body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('reading-modal');

    // Attach event listeners for close functionality
    this.attachCloseListeners();
  }

  attachCloseListeners() {
    // Close button click
    const closeButton = this.modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => this.hide());

    // Click outside modal (on overlay) to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.hide();
      }
    });
  }

  show(reading) {
    // Populate modal with reading details
    const modalBody = this.modal.querySelector('.modal-body');
    const categoryColor = `var(--color-${reading.category.class})`;

    modalBody.innerHTML = `
      <div class="reading-details">
        <h2>Reading Details</h2>
        <div class="reading-category" style="background-color: ${categoryColor}">
          ${reading.category.text}
        </div>
        <div class="reading-values">
          <div class="reading-value">
            <span class="label">Systolic:</span>
            <span class="value">${reading.systolic} mmHg</span>
          </div>
          <div class="reading-value">
            <span class="label">Diastolic:</span>
            <span class="value">${reading.diastolic} mmHg</span>
          </div>
          <div class="reading-value">
            <span class="label">Pulse:</span>
            <span class="value">${reading.pulse} bpm</span>
          </div>
          <div class="reading-value">
            <span class="label">Date:</span>
            <span class="value">${new Date(
              reading.date
            ).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    // Show modal by adding active class
    this.modal.classList.add('active');
  }

  hide() {
    // Hide modal by removing active class
    this.modal.classList.remove('active');
  }
}
