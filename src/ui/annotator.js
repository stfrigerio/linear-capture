import { ICON_PEN, ICON_ARROW, ICON_RECT, ICON_UNDO } from '../icons.js';

const COLORS = ['#E5484D', '#F5A623', '#5E6AD2', '#30A46C', '#FFFFFF'];

/**
 * Screenshot annotation overlay.
 * Lets users draw freehand, arrows, and rectangles on a captured screenshot.
 */
export class Annotator {
  constructor(imageDataURL, onDone) {
    this._imageDataURL = imageDataURL;
    this._onDone = onDone; // callback with annotated dataURL (or null if cancelled)
    this._overlay = null;
    this._canvas = null;
    this._ctx = null;
    this._img = null;
    this._tool = 'pen';
    this._color = COLORS[0];
    this._lineWidth = 3;
    this._drawing = false;
    this._history = [];     // array of ImageData snapshots
    this._startPt = null;   // for arrow/rect
    this._points = [];      // for pen
    this._scale = 1;
  }

  open() {
    this._overlay = document.createElement('div');
    this._overlay.className = 'lc-annotator-overlay';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'lc-annotator-toolbar';
    toolbar.innerHTML = this._renderToolbar();
    this._overlay.appendChild(toolbar);

    // Canvas wrapper
    const wrap = document.createElement('div');
    wrap.className = 'lc-annotator-canvas-wrap';
    this._canvas = document.createElement('canvas');
    this._canvas.className = 'lc-annotator-canvas';
    wrap.appendChild(this._canvas);
    this._overlay.appendChild(wrap);

    document.body.appendChild(this._overlay);

    // Load image then setup
    this._img = new Image();
    this._img.onload = () => {
      this._setupCanvas();
      this._bindToolbar(toolbar);
      this._bindCanvas();
      requestAnimationFrame(() => this._overlay.classList.add('lc-visible'));
    };
    this._img.src = this._imageDataURL;
  }

  _renderToolbar() {
    const tools = [
      { id: 'pen', icon: ICON_PEN, label: 'Pen' },
      { id: 'arrow', icon: ICON_ARROW, label: 'Arrow' },
      { id: 'rect', icon: ICON_RECT, label: 'Rectangle' },
    ];

    let html = '';
    for (const t of tools) {
      html += `<button class="lc-annotator-tool${t.id === this._tool ? ' lc-selected' : ''}" data-tool="${t.id}" title="${t.label}">${t.icon}</button>`;
    }

    html += '<div class="lc-annotator-sep"></div>';

    // Colors
    for (const c of COLORS) {
      html += `<button class="lc-annotator-color${c === this._color ? ' lc-selected' : ''}" data-color="${c}" style="background:${c}" title="${c}"></button>`;
    }

    html += '<div class="lc-annotator-sep"></div>';
    html += `<button class="lc-annotator-tool" data-action="undo" title="Undo">${ICON_UNDO}</button>`;

    html += '<div class="lc-annotator-spacer"></div>';
    html += '<button class="lc-annotator-tool" data-action="cancel" title="Cancel" style="color:#E5484D">✕</button>';
    html += '<button class="lc-annotator-done" data-action="done">Done</button>';

    return html;
  }

  _setupCanvas() {
    // Size canvas to fit image within viewport
    const maxW = window.innerWidth - 32;
    const maxH = window.innerHeight - 120;
    const imgW = this._img.naturalWidth;
    const imgH = this._img.naturalHeight;

    this._scale = Math.min(1, maxW / imgW, maxH / imgH);
    const displayW = Math.round(imgW * this._scale);
    const displayH = Math.round(imgH * this._scale);

    // Use natural resolution for crisp drawing
    this._canvas.width = imgW;
    this._canvas.height = imgH;
    this._canvas.style.width = displayW + 'px';
    this._canvas.style.height = displayH + 'px';

    this._ctx = this._canvas.getContext('2d');
    this._ctx.drawImage(this._img, 0, 0);
    this._saveSnapshot();
  }

  _bindToolbar(toolbar) {
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tool]');
      if (btn) {
        this._tool = btn.dataset.tool;
        toolbar.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('lc-selected'));
        btn.classList.add('lc-selected');
        return;
      }

      const color = e.target.closest('[data-color]');
      if (color) {
        this._color = color.dataset.color;
        toolbar.querySelectorAll('[data-color]').forEach(b => b.classList.remove('lc-selected'));
        color.classList.add('lc-selected');
        return;
      }

      const action = e.target.closest('[data-action]');
      if (action) {
        switch (action.dataset.action) {
          case 'undo': this._undo(); break;
          case 'cancel': this._close(null); break;
          case 'done': this._close(this._canvas.toDataURL('image/png')); break;
        }
      }
    });
  }

  _bindCanvas() {
    const getPos = (e) => {
      const r = this._canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - r.left) / this._scale,
        y: (clientY - r.top) / this._scale,
      };
    };

    const onStart = (e) => {
      e.preventDefault();
      this._drawing = true;
      const pos = getPos(e);
      this._startPt = pos;
      this._points = [pos];

      if (this._tool === 'pen') {
        this._ctx.beginPath();
        this._ctx.moveTo(pos.x, pos.y);
        this._ctx.strokeStyle = this._color;
        this._ctx.lineWidth = this._lineWidth / this._scale;
        this._ctx.lineCap = 'round';
        this._ctx.lineJoin = 'round';
      }
    };

    const onMove = (e) => {
      if (!this._drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this._points.push(pos);

      if (this._tool === 'pen') {
        this._ctx.lineTo(pos.x, pos.y);
        this._ctx.stroke();
      } else {
        // Preview: restore last snapshot and draw shape
        this._restoreSnapshot();
        this._drawShape(this._startPt, pos);
      }
    };

    const onEnd = (e) => {
      if (!this._drawing) return;
      this._drawing = false;

      if (this._tool !== 'pen' && this._startPt) {
        const pos = this._points[this._points.length - 1] || this._startPt;
        this._restoreSnapshot();
        this._drawShape(this._startPt, pos);
      }

      this._saveSnapshot();
      this._points = [];
      this._startPt = null;
    };

    this._canvas.addEventListener('mousedown', onStart);
    this._canvas.addEventListener('mousemove', onMove);
    this._canvas.addEventListener('mouseup', onEnd);
    this._canvas.addEventListener('mouseleave', onEnd);
    this._canvas.addEventListener('touchstart', onStart, { passive: false });
    this._canvas.addEventListener('touchmove', onMove, { passive: false });
    this._canvas.addEventListener('touchend', onEnd);

    // Keyboard
    const onKey = (e) => {
      if (e.key === 'Escape') this._close(null);
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
    };
    document.addEventListener('keydown', onKey);
    this._cleanupKey = () => document.removeEventListener('keydown', onKey);
  }

  _drawShape(from, to) {
    const ctx = this._ctx;
    ctx.strokeStyle = this._color;
    ctx.lineWidth = this._lineWidth / this._scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this._tool === 'arrow') {
      this._drawArrow(ctx, from.x, from.y, to.x, to.y);
    } else if (this._tool === 'rect') {
      ctx.beginPath();
      ctx.rect(from.x, from.y, to.x - from.x, to.y - from.y);
      ctx.stroke();
    }
  }

  _drawArrow(ctx, x1, y1, x2, y2) {
    const headLen = 14 / this._scale;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
  }

  _saveSnapshot() {
    this._history.push(this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height));
    // Keep max 30 snapshots
    if (this._history.length > 30) this._history.shift();
  }

  _restoreSnapshot() {
    if (this._history.length) {
      this._ctx.putImageData(this._history[this._history.length - 1], 0, 0);
    }
  }

  _undo() {
    if (this._history.length > 1) {
      this._history.pop();
      this._restoreSnapshot();
    }
  }

  _close(result) {
    this._overlay.classList.remove('lc-visible');
    this._cleanupKey?.();
    setTimeout(() => {
      this._overlay.remove();
      this._onDone(result);
    }, 300);
  }
}
