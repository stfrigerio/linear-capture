import { isMac } from '../utils.js';

/**
 * Top banner shown during element picking.
 */
export class Banner {
  constructor() {
    this._el = null;
  }

  render() {
    this._el = document.createElement('div');
    this._el.className = 'lc-banner';
    const esc = '<kbd>Esc</kbd>';
    this._el.innerHTML = `Tap any element to report an issue ${esc}`;
    return this._el;
  }

  show() {
    this._el?.classList.add('lc-visible');
  }

  hide() {
    this._el?.classList.remove('lc-visible');
  }

  destroy() {
    this._el?.remove();
  }
}
