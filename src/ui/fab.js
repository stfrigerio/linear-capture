import { ICON_TARGET, ICON_CLOSE, ICON_SETTINGS } from '../icons.js';
import { isMac } from '../utils.js';

/**
 * Floating Action Button — the entry point for LinearCapture.
 * Shows a target icon that toggles the element picker.
 * Has a settings gear overlay.
 */
export class FAB {
  constructor({ onToggle, onSettings }) {
    this._onToggle = onToggle;
    this._onSettings = onSettings;
    this._el = null;
    this._hint = null;
    this._active = false;
    this._hintShown = false;
  }

  render() {
    // FAB button
    this._el = document.createElement('button');
    this._el.className = 'lc-fab lc-intro';
    this._el.setAttribute('aria-label', 'Toggle bug reporter');
    this._el.innerHTML = ICON_TARGET;
    this._el.addEventListener('click', (e) => {
      e.stopPropagation();
      this._onToggle();
    });

    // Settings gear
    const gear = document.createElement('div');
    gear.className = 'lc-fab-gear';
    gear.innerHTML = ICON_SETTINGS;
    gear.addEventListener('click', (e) => {
      e.stopPropagation();
      this._onSettings();
    });
    this._el.appendChild(gear);

    // Keyboard shortcut hint
    this._hint = document.createElement('div');
    this._hint.className = 'lc-shortcut-hint';
    const mod = isMac() ? '\u2318' : 'Ctrl';
    this._hint.innerHTML = `<kbd>${mod}</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd>`;

    // Show hint briefly on first load
    setTimeout(() => {
      this._hint.classList.add('lc-visible');
      setTimeout(() => this._hint.classList.remove('lc-visible'), 3000);
    }, 2000);

    // Remove intro animation
    this._el.addEventListener('animationend', () => {
      this._el.classList.remove('lc-intro');
    });

    return [this._el, this._hint];
  }

  setActive(active) {
    this._active = active;
    if (active) {
      this._el.classList.add('lc-active');
      this._el.innerHTML = ICON_CLOSE;
    } else {
      this._el.classList.remove('lc-active');
      this._el.innerHTML = ICON_TARGET;
      // Re-add gear
      const gear = document.createElement('div');
      gear.className = 'lc-fab-gear';
      gear.innerHTML = ICON_SETTINGS;
      gear.addEventListener('click', (e) => {
        e.stopPropagation();
        this._onSettings();
      });
      this._el.appendChild(gear);
    }
  }

  setLoading(loading) {
    this._el.disabled = loading;
    this._el.style.opacity = loading ? '0.6' : '';
  }

  destroy() {
    this._el?.remove();
    this._hint?.remove();
  }
}
