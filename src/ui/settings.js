import { saveStoredConfig, loadStoredConfig, clearStoredConfig } from '../config.js';

/**
 * Settings panel — configure API key, team, etc.
 * Persists to localStorage so you configure once per browser.
 */
export class SettingsPanel {
  constructor({ onSave, onClose }) {
    this._onSave = onSave;
    this._onClose = onClose;
    this._el = null;
    this._validateTimeout = null;
  }

  open(currentConfig = {}) {
    const stored = loadStoredConfig();
    const config = { ...stored, ...currentConfig };

    this._el = document.createElement('div');
    this._el.className = 'lc-settings';
    this._el.innerHTML = `
      <div class="lc-settings-backdrop"></div>
      <div class="lc-settings-card">
        <div class="lc-settings-header">
          <h2>Linear Capture</h2>
          <p>Configure your Linear integration. Settings are saved in your browser.</p>
        </div>
        <div class="lc-settings-body">
          <div class="lc-field">
            <label class="lc-label">API Key</label>
            <input class="lc-input lc-settings-apikey" type="password" placeholder="lin_api_..." value="${this._esc(config.apiKey || '')}" spellcheck="false" autocomplete="off" />
            <div class="lc-settings-hint">
              Create one at Linear &rarr; Settings &rarr; API &rarr; Personal API keys
            </div>
          </div>
          <div class="lc-field">
            <label class="lc-label">Team ID</label>
            <input class="lc-input lc-settings-teamid" type="text" placeholder="Team UUID or key" value="${this._esc(config.teamId || '')}" spellcheck="false" autocomplete="off" />
            <div class="lc-settings-hint">
              The UUID of your team. Found in team settings URL.
            </div>
          </div>
          <div class="lc-field">
            <label class="lc-label">Project ID <span style="opacity:0.5">(optional)</span></label>
            <input class="lc-input lc-settings-projectid" type="text" placeholder="Project UUID" value="${this._esc(config.projectId || '')}" spellcheck="false" autocomplete="off" />
          </div>
          <div class="lc-field">
            <label class="lc-label">Default Priority</label>
            <div class="lc-priority-group">
              ${[
                [0, 'None'], [1, 'Urgent'], [2, 'High'], [3, 'Medium'], [4, 'Low']
              ].map(([v, l]) =>
                `<button class="lc-priority-btn${config.defaultPriority === v ? ' lc-selected' : ''}" data-p="${v}">${l}</button>`
              ).join('')}
            </div>
          </div>
        </div>
        <div class="lc-settings-footer">
          <button class="lc-btn lc-btn-secondary lc-settings-clear" type="button">Clear</button>
          <div style="flex:1"></div>
          <button class="lc-btn lc-btn-secondary lc-settings-cancel" type="button">Cancel</button>
          <button class="lc-btn lc-btn-primary lc-settings-save" type="button">Save</button>
        </div>
      </div>
    `;

    // Events
    this._el.querySelector('.lc-settings-backdrop').addEventListener('click', () => this.close());
    this._el.querySelector('.lc-settings-cancel').addEventListener('click', () => this.close());
    this._el.querySelector('.lc-settings-clear').addEventListener('click', () => this._clear());
    this._el.querySelector('.lc-settings-save').addEventListener('click', () => this._save());

    // Priority buttons
    this._el.querySelectorAll('.lc-priority-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._el.querySelectorAll('.lc-priority-btn').forEach(b => b.classList.remove('lc-selected'));
        btn.classList.add('lc-selected');
      });
    });

    // Enter key submits
    this._el.querySelectorAll('.lc-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._save();
        if (e.key === 'Escape') this.close();
      });
    });

    document.body.appendChild(this._el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._el.classList.add('lc-visible');
        this._el.querySelector('.lc-settings-apikey').focus();
      });
    });
  }

  close() {
    if (!this._el) return;
    this._el.classList.remove('lc-visible');
    setTimeout(() => {
      this._el?.remove();
      this._el = null;
      this._onClose();
    }, 350);
  }

  _save() {
    const apiKey = this._el.querySelector('.lc-settings-apikey').value.trim();
    const teamId = this._el.querySelector('.lc-settings-teamid').value.trim();
    const projectId = this._el.querySelector('.lc-settings-projectid').value.trim() || null;

    const selectedPriority = this._el.querySelector('.lc-priority-btn.lc-selected');
    const defaultPriority = selectedPriority ? parseInt(selectedPriority.dataset.p, 10) : 0;

    if (!apiKey) {
      this._el.querySelector('.lc-settings-apikey').classList.add('lc-error');
      this._el.querySelector('.lc-settings-apikey').focus();
      return;
    }
    if (!teamId) {
      this._el.querySelector('.lc-settings-teamid').classList.add('lc-error');
      this._el.querySelector('.lc-settings-teamid').focus();
      return;
    }

    const config = { apiKey, teamId, projectId, defaultPriority };
    saveStoredConfig(config);
    this._onSave(config);
    this.close();
  }

  _clear() {
    clearStoredConfig();
    this._el.querySelector('.lc-settings-apikey').value = '';
    this._el.querySelector('.lc-settings-teamid').value = '';
    this._el.querySelector('.lc-settings-projectid').value = '';
    this._el.querySelectorAll('.lc-priority-btn').forEach(b => b.classList.remove('lc-selected'));
    this._el.querySelector('.lc-priority-btn[data-p="0"]').classList.add('lc-selected');
  }

  _esc(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
