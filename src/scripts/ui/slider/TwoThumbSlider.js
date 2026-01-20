export class TwoThumbSlider extends HTMLElement {
  static observedAttributes = [
    'min',
    'max',
    'step',
    'minimum-gap',
    'value-min',
    'value-max',
  ];

  constructor() {
    super();
    this.min = 0;
    this.max = 1;
    this.step = 0.001;
    this.minimumGap = 0.001;
    this.valueMin = 0;
    this.valueMax = 1;
    this.activeThumb = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateSlider();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (newValue === null) return;

    const value = parseFloat(newValue);
    switch (name) {
      case 'min':
        this.min = value;
        break;
      case 'max':
        this.max = value;
        break;
      case 'step':
        this.step = value;
        break;
      case 'minimum-gap':
        this.minimumGap = value;
        break;
      case 'value-min':
        this.valueMin = value;
        break;
      case 'value-max':
        this.valueMax = value;
        break;
    }

    if (this.isConnected) {
      this.updateSlider();
    }
  }

  render() {
    this.innerHTML = `
      <div class="slider-track">
          <div class="slider-range"></div>
          <div class="slider-thumb thumb-min"></div>
          <div class="slider-thumb thumb-max"></div>
      </div>
    `;
  }

  setupEventListeners() {
    const thumbMin = this.querySelector('.thumb-min');
    const thumbMax = this.querySelector('.thumb-max');

    thumbMin.addEventListener('mousedown', (e) => this.startDrag(e, 'min'));
    thumbMax.addEventListener('mousedown', (e) => this.startDrag(e, 'max'));
    thumbMin.addEventListener('touchstart', (e) => this.startDrag(e, 'min'), {
      passive: false,
    });
    thumbMax.addEventListener('touchstart', (e) => this.startDrag(e, 'max'), {
      passive: false,
    });
  }

  startDrag(e, thumb) {
    e.stopPropagation();
    e.preventDefault();
    this.activeThumb = thumb;

    const handleMove = (e) => this.handleDrag(e);
    const handleEnd = () => this.stopDrag(handleMove, handleEnd);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleEnd);
  }

  handleDrag(e) {
    if (!this.activeThumb) return;

    e.preventDefault();
    const clientX =
      'touches' in e && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const track = this.querySelector('.slider-track');
    const rect = track.getBoundingClientRect();

    let position = Math.max(0, Math.min(clientX - rect.left, rect.width));
    let percentage = position / rect.width;

    // Calculate value based on scaling type
    let value = this.min + percentage * (this.max - this.min);

    // Snap to step
    value = Math.round(value / this.step) * this.step;

    // Apply minimum gap constraint
    if (this.activeThumb === 'min') {
      value = Math.min(value, this.valueMax - this.minimumGap);
      this.valueMin = Math.max(value, this.min);
    } else {
      value = Math.max(value, this.valueMin + this.minimumGap);
      this.valueMax = Math.min(value, this.max);
    }

    this.updateSlider();
    this.dispatchChange();
  }

  stopDrag(handleMove, handleEnd) {
    this.activeThumb = null;
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
  }

  updateSlider() {
    const rangeElement = this.querySelector('.slider-range');
    const thumbMin = this.querySelector('.thumb-min');
    const thumbMax = this.querySelector('.thumb-max');

    if (!rangeElement || !thumbMin || !thumbMax) return;

    // Calculate positions as percentages
    const percentMin =
      ((this.valueMin - this.min) / (this.max - this.min)) * 100;
    const percentMax =
      ((this.valueMax - this.min) / (this.max - this.min)) * 100;

    // Add visual padding when thumbs are too close
    const minVisualGap = 2; // Minimum visual gap in percentage points
    const actualGap = percentMax - percentMin;

    if (actualGap < minVisualGap) {
      const adjustment = (minVisualGap - actualGap) / 2;
      const adjustedPercentMin = Math.max(0, percentMin - adjustment);
      const adjustedPercentMax = Math.min(100, percentMax + adjustment);

      thumbMin.style.left = `${adjustedPercentMin}%`;
      thumbMax.style.left = `${adjustedPercentMax}%`;
    } else {
      thumbMin.style.left = `${percentMin}%`;
      thumbMax.style.left = `${percentMax}%`;
    }

    // Range element always uses actual values (no padding)
    rangeElement.style.left = `${percentMin}%`;
    rangeElement.style.width = `${percentMax - percentMin}%`;
  }

  dispatchChange() {
    this.dispatchEvent(
      new CustomEvent('range-change', {
        detail: {
          min: this.valueMin,
          max: this.valueMax,
        },
        bubbles: true,
      })
    );
  }

  setValues(min, max) {
    this.valueMin = Math.max(this.min, Math.min(min, this.max));
    this.valueMax = Math.max(this.min, Math.min(max, this.max));

    // Ensure minimum gap
    if (this.valueMax - this.valueMin < this.minimumGap) {
      this.valueMax = this.valueMin + this.minimumGap;
    }

    this.updateSlider();
    this.dispatchChange();
  }
}

customElements.define('two-thumb-slider', TwoThumbSlider);

const style = document.createElement('style');
style.textContent = `
two-thumb-slider {
  height: 20px;
  width: 100%;
  position: relative;
}

.slider-track {
  position: relative;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
}

.slider-range {
  position: absolute;
  height: 8px;
  background: #4285f4;
  border-radius: 4px;
}

.slider-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 1px solid #4285f4;
  border-radius: 40%;
  top: -4px;
  margin-left: -8px;
  cursor: pointer;
}
`;
document.head.append(style);
