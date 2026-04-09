import { ContextBuilder } from '../context.js';
import { Annotator } from './annotator.js';
import { ICON_PEN, ICON_CONSOLE, ICON_NETWORK } from '../icons.js';

/**
 * Bottom Sheet — the main issue reporting UI.
 * Features: title, description, priority, screenshot w/ annotate,
 * collapsible auto-captured context.
 */
export class BottomSheet {
  constructor({ onSubmit, onCancel }) {
    this._onSubmit = onSubmit;
    this._onCancel = onCancel;
    this._overlay = null;
    this._sheet = null;
    this._context = null;
    this._priority = 0;
    this._screenshotDataURL = null;
  }

  open(context, defaultPriority = 0) {
    this._context = context;
    this._priority = defaultPriority;
    this._screenshotDataURL = context.screenshotDataURL;
    this._render();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._overlay.classList.add('lc-visible');
        this._sheet.classList.add('lc-visible');
        const input = this._sheet.querySelector('.lc-input');
        if (input) input.focus();
      });
    });
  }

  close() {
    if (!this._sheet) return;
    this._overlay.classList.remove('lc-visible');
    this._sheet.classList.remove('lc-visible');
    setTimeout(() => {
      this._overlay?.remove();
      this._sheet?.remove();
      this._overlay = null;
      this._sheet = null;
    }, 400);
  }

  _render() {
    const ctx = this._context;
    const md = new ContextBuilder().formatMarkdown(ctx);

    // Error/network counts for badges
    const errorCount = ctx.consoleErrors?.length || 0;
    const networkCount = ctx.networkFailures?.length || 0;

    // Overlay
    this._overlay = document.createElement('div');
    this._overlay.className = 'lc-overlay';
    this._overlay.addEventListener('click', () => { this.close(); this._onCancel(); });

    // Sheet
    this._sheet = document.createElement('div');
    this._sheet.className = 'lc-sheet';

    this._sheet.innerHTML = `
      <div class="lc-handle"></div>
      <div class="lc-sheet-header">
        <h2>Report Issue</h2>
        <button class="lc-cancel-top" type="button">Cancel</button>
      </div>
      <div class="lc-sheet-body">

        <div class="lc-field">
          <label class="lc-label">Title</label>
          <input class="lc-input lc-title-input" type="text"
            placeholder="What's the issue?"
            value="${this._esc(ctx._suggestedTitle || '')}"
            autocomplete="off" />
        </div>

        <div class="lc-field">
          <label class="lc-label">Priority</label>
          <div class="lc-priority-group">
            ${[
              [0, 'None'], [1, 'Urgent'], [2, 'High'], [3, 'Medium'], [4, 'Low']
            ].map(([v, l]) =>
              `<button class="lc-priority-btn${this._priority === v ? ' lc-selected' : ''}" data-p="${v}">${l}</button>`
            ).join('')}
          </div>
        </div>

        ${this._screenshotDataURL ? `
        <div class="lc-field">
          <label class="lc-label">Screenshot</label>
          <div class="lc-screenshot-wrap">
            <img class="lc-screenshot-preview" src="${this._screenshotDataURL}" alt="Element screenshot" />
            <button class="lc-annotate-btn" type="button">
              ${ICON_PEN} Annotate
            </button>
          </div>
        </div>
        ` : ''}

        <div class="lc-field">
          <div class="lc-collapsible-header" data-collapse="context">
            <svg class="lc-collapsible-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>
            <span class="lc-label" style="margin:0">Context</span>
            ${errorCount ? `<span class="lc-badge lc-badge-error">${errorCount}</span>` : ''}
            ${networkCount ? `<span class="lc-badge lc-badge-network">${networkCount}</span>` : ''}
          </div>
          <div class="lc-collapsible-body" data-collapse-body="context">
            <textarea class="lc-textarea lc-context-textarea">${this._esc(md)}</textarea>
          </div>
        </div>

      </div>
      <div class="lc-sheet-footer">
        <button class="lc-btn lc-btn-secondary lc-cancel-bottom" type="button">Cancel</button>
        <button class="lc-btn lc-btn-primary lc-submit-btn" type="button">Submit to Linear</button>
      </div>
    `;

    this._bindEvents();
    this._setupDrag();

    document.body.appendChild(this._overlay);
    document.body.appendChild(this._sheet);
  }

  _bindEvents() {
    // Cancel buttons
    this._sheet.querySelector('.lc-cancel-top').addEventListener('click', () => {
      this.close(); this._onCancel();
    });
    this._sheet.querySelector('.lc-cancel-bottom').addEventListener('click', () => {
      this.close(); this._onCancel();
    });

    // Priority buttons
    this._sheet.querySelectorAll('.lc-priority-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._sheet.querySelectorAll('.lc-priority-btn').forEach(b => b.classList.remove('lc-selected'));
        btn.classList.add('lc-selected');
        this._priority = parseInt(btn.dataset.p, 10);
      });
    });

    // Annotate button
    const annotateBtn = this._sheet.querySelector('.lc-annotate-btn');
    if (annotateBtn) {
      annotateBtn.addEventListener('click', () => this._openAnnotator());
    }

    // Collapsible
    const collapseHeader = this._sheet.querySelector('[data-collapse="context"]');
    if (collapseHeader) {
      collapseHeader.addEventListener('click', () => {
        collapseHeader.classList.toggle('lc-open');
        const body = this._sheet.querySelector('[data-collapse-body="context"]');
        body.classList.toggle('lc-open');
      });
    }

    // Submit
    this._sheet.querySelector('.lc-submit-btn').addEventListener('click', () => {
      const titleInput = this._sheet.querySelector('.lc-title-input');
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.classList.add('lc-error');
        titleInput.focus();
        // Remove error on input
        titleInput.addEventListener('input', () => titleInput.classList.remove('lc-error'), { once: true });
        return;
      }
      const description = this._sheet.querySelector('.lc-context-textarea').value;
      this._setSubmitting(true);
      this._onSubmit({
        title,
        description,
        priority: this._priority,
        screenshotDataURL: this._screenshotDataURL,
      });
    });

    // Enter in title submits
    this._sheet.querySelector('.lc-title-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._sheet.querySelector('.lc-submit-btn').click();
      }
    });
  }

  _openAnnotator() {
    if (!this._screenshotDataURL) return;

    const annotator = new Annotator(this._screenshotDataURL, (result) => {
      if (result) {
        this._screenshotDataURL = result;
        const img = this._sheet.querySelector('.lc-screenshot-preview');
        if (img) img.src = result;
      }
    });
    annotator.open();
  }

  _setSubmitting(busy) {
    const btn = this._sheet?.querySelector('.lc-submit-btn');
    if (!btn) return;
    btn.disabled = busy;
    btn.innerHTML = busy
      ? '<span class="lc-spinner"></span> Submitting\u2026'
      : 'Submit to Linear';
  }

  setError() {
    this._setSubmitting(false);
  }

  _setupDrag() {
    const handle = this._sheet.querySelector('.lc-handle');
    let startY = 0, dy = 0, dragging = false;

    const onStart = e => {
      const pt = e.touches ? e.touches[0] : e;
      startY = pt.clientY;
      dragging = true;
      this._sheet.style.transition = 'none';
    };
    const onMove = e => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      dy = Math.max(0, pt.clientY - startY);
      this._sheet.style.transform = `translateY(${dy}px)`;
    };
    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      this._sheet.style.transition = '';
      if (dy > 150) {
        this.close();
        this._onCancel();
      } else {
        this._sheet.style.transform = '';
        this._sheet.classList.add('lc-visible');
      }
      dy = 0;
    };

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd);
    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  }

  _esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
