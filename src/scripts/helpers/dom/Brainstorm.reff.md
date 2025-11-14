I'm GitHub Copilot.

Short answer:

- Yes, this is already framework-agnostic (pure DOM API, no framework ties).
- You can add optional native Web Component output without a refactor by creating a thin wrapper around your existing factory.
- A few small internal tweaks (event emission + render batching) improve interop and perf without adding complexity.

## Template syntax options tested

### Option 1: Escaped placeholders (current)

```javascript
template: `<div>\${count}</div>`;
```

✅ Works universally, no deps  
❌ Easy to forget escaping, causes ReferenceError

### Option 2: String.raw tagged template

```javascript
import { template } from './component-utils.js';
template: template`<div>${count}</div>`;
```

✅ Clean syntax, no escaping needed  
✅ Zero runtime cost, ES6 standard  
❌ Requires extra import

### Option 3: Template functions (tested, reverted)

```javascript
template: (props) => `<div>${props.count}</div>`;
```

✅ No escaping, no imports  
✅ Full JavaScript in templates  
❌ Requires `props.` prefix (more verbose)  
❌ Can't statically analyze which props are used (always re-renders all)  
**Verdict:** Works but not better than original

Proposed minimal enhancements

1. Emit CustomEvents for interop (no breaking changes)

- Why: Frameworks and plain DOM can subscribe without touching your callbacks.
- Events:
  - render with detail { props }
  - props-updated with detail { props, changedKeys }

2. Microtask-batched renders (optional)

- Why: Coalesce multiple prop sets into a single render.
- How: Add batchRenders option; when true, schedule render via microtask.

3. Optional Web Component wrapper (no refactor)

- Provide defineComponent(tagName, options) that registers a custom element, internally uses createComponent, supports:
  - Shadow DOM (open/closed/none)
  - Attribute <-> prop reflection for primitive props
  - Re-emits render and props-updated from the host element
- Keep your current API untouched.

Code changes (small and contained)

1. Add events + optional batching to createComponent

const createComponent = ({
initialProps,
template,
handlers = {},
parent = null,
containerTag = 'div',
className = '',
onMount = null,
onCleanup = null,
autoAppend = true,
preserveInputState = true,
// NEW:
emitEvents = true,
batchRenders = false,
}) => {
const element = document.createElement(containerTag);
element.className = className;

let currentProps = { ...initialProps };

const renderListeners = []; // onRender listeners (after render)
const anyUpdateListeners = []; // onAnyPropUpdated listeners (after state change, render optional)

// NEW: microtask batching toggle
let pendingRender = false;
const scheduleRender = () => {
if (!batchRenders) return render();
if (pendingRender) return;
pendingRender = true;
Promise.resolve().then(() => {
pendingRender = false;
render();
});
};

const render = () => {
// Capture state before render if needed
let inputState = [];
let mediaState = [];
if (preserveInputState) {
inputState = captureInputState(element);
mediaState = captureMediaState(element);
}

    // Render
    element.textContent = '';
    const content = html(template, currentProps);
    element.appendChild(content);

    // Attach event handlers // TODO: optimize to avoid re-adding on every render
    Object.keys(handlers).forEach((handlerName) => {
      const elements = element.querySelectorAll(`[onclick="${handlerName}"]`);
      const fn = handlers[handlerName];
      elements.forEach((el) => {
        el.removeAttribute('onclick'); // Remove the attribute
        if (typeof fn === 'function') {
          el.addEventListener('click', fn);
        }
      });
    });

    // Restore state after render
    if (preserveInputState) {
      restoreInputState(element, inputState);
      restoreMediaState(element, mediaState);
    }

    // Notify listeners
    renderListeners.forEach((listener) => listener({ ...currentProps }));

    // NEW: emit DOM event
    if (emitEvents) {
      element.dispatchEvent(
        new CustomEvent('render', { detail: { props: { ...currentProps } } })
      );
    }

};

const notifyPropsUpdated = (changedKeys) => {
if (!Array.isArray(changedKeys) || changedKeys.length === 0) return;
const payload = { props: { ...currentProps }, changedKeys };
anyUpdateListeners.forEach((listener) => listener(payload));
// NEW: emit DOM event
if (emitEvents) {
element.dispatchEvent(
new CustomEvent('props-updated', { detail: payload })
);
}
};

for (const prop of Object.keys(initialProps)) {
singlePropListeners[prop] = [];

    Object.defineProperty(element, prop, {
      get() {
        return currentProps[prop];
      },
      set(value) {
        if (currentProps[prop] !== value) {
          currentProps[prop] = value;
          // Only re-render if this prop is actually used in the template
          if (usedProps.has(prop)) {
            // CHANGED: schedule instead of immediate render (optional)
            scheduleRender();
          }
          // Always notify per-prop listeners
          singlePropListeners[prop].forEach((cb) => cb(value));
          // Notify global props-updated listeners for single prop change
          notifyPropsUpdated([prop]);
        }
      },
      configurable: true,
      enumerable: true,
    });

}

element.update = (newProps) => {
let changed = false;
let shouldRender = false;
const changedKeys = [];

    for (const key in newProps) {
      if (newProps[key] !== currentProps[key]) {
        currentProps[key] = newProps[key];
        if (usedProps.has(key)) {
          shouldRender = true;
        }
        if (singlePropListeners[key]) {
          singlePropListeners[key].forEach((cb) => cb(newProps[key]));
        }
        changed = true;
        changedKeys.push(key);
      }
    }

    // Only re-render if a prop used in the template changed
    if (changed && shouldRender) {
      // CHANGED: schedule instead of immediate render (optional)
      scheduleRender();
    }

    if (changedKeys.length > 0) {
      notifyPropsUpdated(changedKeys);
    }

};

return element;
};
