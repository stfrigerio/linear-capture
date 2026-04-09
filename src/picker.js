import { isOwnElement } from './utils.js';

/**
 * Element Picker — hover-to-highlight, click-to-select.
 * Supports mouse, touch, and keyboard (Escape to cancel).
 */
export class ElementPicker {
  constructor(onSelect) {
    this._onSelect = onSelect;
    this._highlighted = null;
    this._active = false;
    this._lastTouchTarget = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  get active() { return this._active; }

  activate() {
    if (this._active) return;
    this._active = true;
    document.documentElement.classList.add('lc-picking');

    document.addEventListener('mousemove', this._onMouseMove, true);
    document.addEventListener('click', this._onClick, true);
    document.addEventListener('touchstart', this._onTouchStart, { capture: true, passive: false });
    document.addEventListener('touchmove', this._onTouchMove, { capture: true, passive: false });
    document.addEventListener('touchend', this._onTouchEnd, { capture: true, passive: false });
    document.addEventListener('keydown', this._onKeyDown, true);
  }

  deactivate() {
    if (!this._active) return;
    this._active = false;
    this._clearHighlight();
    document.documentElement.classList.remove('lc-picking');

    document.removeEventListener('mousemove', this._onMouseMove, true);
    document.removeEventListener('click', this._onClick, true);
    document.removeEventListener('touchstart', this._onTouchStart, true);
    document.removeEventListener('touchmove', this._onTouchMove, true);
    document.removeEventListener('touchend', this._onTouchEnd, true);
    document.removeEventListener('keydown', this._onKeyDown, true);
  }

  _highlight(el) {
    if (el === this._highlighted) return;
    this._clearHighlight();
    if (el && !isOwnElement(el)) {
      el.classList.add('lc-highlight');
      this._highlighted = el;
    }
  }

  _clearHighlight() {
    if (this._highlighted) {
      this._highlighted.classList.remove('lc-highlight');
      this._highlighted = null;
    }
  }

  _elementAt(x, y) {
    const fab = document.querySelector('.lc-fab');
    const banner = document.querySelector('.lc-banner');
    if (fab) fab.style.pointerEvents = 'none';
    if (banner) banner.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    if (fab) fab.style.pointerEvents = '';
    if (banner) banner.style.pointerEvents = '';
    return el;
  }

  _onMouseMove(e) {
    const el = this._elementAt(e.clientX, e.clientY);
    if (el) this._highlight(el);
  }

  _onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const el = this._elementAt(e.clientX, e.clientY);
    if (el && !isOwnElement(el)) {
      this._select(el);
    }
  }

  _onTouchStart(e) {
    if (isOwnElement(e.target)) return;
    e.preventDefault();
    const t = e.touches[0];
    const el = this._elementAt(t.clientX, t.clientY);
    if (el) this._highlight(el);
    this._lastTouchTarget = el;
  }

  _onTouchMove(e) {
    if (isOwnElement(e.target)) return;
    e.preventDefault();
    const t = e.touches[0];
    const el = this._elementAt(t.clientX, t.clientY);
    if (el) this._highlight(el);
    this._lastTouchTarget = el;
  }

  _onTouchEnd(e) {
    if (isOwnElement(e.target)) return;
    e.preventDefault();
    if (this._lastTouchTarget && !isOwnElement(this._lastTouchTarget)) {
      this._select(this._lastTouchTarget);
    }
    this._lastTouchTarget = null;
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') {
      this.deactivate();
      this._onSelect(null);
    }
  }

  _select(el) {
    this._clearHighlight();
    this.deactivate();
    this._onSelect(el);
  }
}
