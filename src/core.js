import { resolveConfig, isConfigured } from './config.js';
import { suggestTitle, isMac } from './utils.js';
import { ElementPicker } from './picker.js';
import { ContextBuilder } from './context.js';
import { LinearClient } from './api.js';
import { dataURLtoBlob } from './utils.js';
import { STYLES } from './ui/styles.js';
import { FAB } from './ui/fab.js';
import { Banner } from './ui/banner.js';
import { BottomSheet } from './ui/sheet.js';
import { showToast } from './ui/toast.js';

/**
 * Main controller — ties everything together.
 */
export class LinearCapture {
  constructor(inlineConfig = {}) {
    this._config = resolveConfig(inlineConfig);
    this._root = null;
    this._fab = null;
    this._banner = null;
    this._picker = new ElementPicker(el => this._onElementSelected(el));
    this._contextBuilder = new ContextBuilder();
    this._sheet = null;
    this._picking = false;
    this._styleEl = null;
    this._keyHandler = null;
  }

  init() {
    if (!isConfigured(this._config)) {
      console.warn('[LinearCapture] Missing apiKey or teamId — pass them via the constructor config.');
      return;
    }

    this._injectStyles();
    this._createRoot();
    this._bindKeyboard();

    console.log(
      '%c[LinearCapture]%c Initialized — %s to toggle picker',
      'color:#5E6AD2;font-weight:bold', 'color:inherit',
      isMac() ? '\u2318\u21e7K' : 'Ctrl+Shift+K',
    );
  }

  destroy() {
    this._picker.deactivate();
    this._fab?.destroy();
    this._banner?.destroy();
    this._sheet?.close();
    this._root?.remove();
    this._styleEl?.remove();
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler, true);
    }
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.id = 'lc-styles';
    this._styleEl.textContent = STYLES;
    document.head.appendChild(this._styleEl);
  }

  _createRoot() {
    this._root = document.createElement('div');
    this._root.id = 'lc-root';

    // FAB
    this._fab = new FAB({
      onToggle: () => this._onFABClick(),
    });
    const [fabEl, hintEl] = this._fab.render();
    this._root.appendChild(fabEl);
    this._root.appendChild(hintEl);

    // Banner
    this._banner = new Banner();
    this._root.appendChild(this._banner.render());

    document.body.appendChild(this._root);
  }

  _bindKeyboard() {
    this._keyHandler = (e) => {
      // Ctrl/Cmd + Shift + K
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this._onFABClick();
      }
    };
    document.addEventListener('keydown', this._keyHandler, true);
  }

  _onFABClick() {
    if (this._picking) {
      this._stopPicking();
    } else {
      this._startPicking();
    }
  }

  _startPicking() {
    this._picking = true;
    this._fab.setActive(true);
    this._banner.show();
    this._picker.activate();
  }

  _stopPicking() {
    this._picking = false;
    this._fab.setActive(false);
    this._banner.hide();
    this._picker.deactivate();
  }

  async _onElementSelected(el) {
    this._stopPicking();
    if (!el) return;

    this._fab.setLoading(true);
    showToast('Capturing context\u2026');

    try {
      const context = await this._contextBuilder.build(el);
      context._suggestedTitle = suggestTitle(el);

      // Pre-fetch milestones in parallel with sheet opening
      const milestones = await this._fetchMilestones();
      this._openSheet(context, milestones);
    } catch (err) {
      console.error('[LinearCapture] Context build failed:', err);
      showToast('Failed to capture context', 'error');
    } finally {
      this._fab.setLoading(false);
    }
  }

  async _fetchMilestones() {
    const cfg = this._config;
    if (!cfg.apiKey || !cfg.projectId) return [];
    try {
      const client = new LinearClient(cfg.apiKey);
      return await client.getProjectMilestones(cfg.projectId);
    } catch (err) {
      console.warn('[LinearCapture] Failed to fetch milestones:', err);
      return [];
    }
  }

  _openSheet(context, milestones = []) {
    this._sheet = new BottomSheet({
      onSubmit: data => this._onSubmit(data),
      onCancel: () => { this._sheet = null; },
    });
    this._sheet.open(context, this._config.defaultPriority, milestones);
  }

  async _onSubmit({ title, userDescription, context, priority, projectMilestoneId, screenshotDataURL }) {
    const cfg = this._config;
    const client = new LinearClient(cfg.apiKey);
    let finalDescription = userDescription
      ? `${userDescription}\n\n---\n\n${context}`
      : context;

    try {
      // Upload screenshot
      if (screenshotDataURL) {
        try {
          const blob = dataURLtoBlob(screenshotDataURL);
          const assetUrl = await client.uploadFile(blob, `screenshot-${Date.now()}.png`);
          finalDescription += `\n\n## Screenshot\n![Element screenshot](${assetUrl})\n`;
        } catch (err) {
          console.warn('[LinearCapture] Screenshot upload failed:', err);
          finalDescription += '\n\n> Screenshot upload failed\n';
        }
      }

      const issue = await client.createIssue({
        title,
        description: finalDescription,
        teamId: cfg.teamId,
        projectId: cfg.projectId,
        projectMilestoneId: projectMilestoneId || undefined,
        labelIds: cfg.labelIds,
        priority: priority || undefined,
      });

      this._sheet?.close();
      this._sheet = null;
      showToast(`Created ${issue.identifier}`, 'success');
      console.log('[LinearCapture] Issue created:', issue.url);
    } catch (err) {
      console.error('[LinearCapture] Submit failed:', err);
      showToast(err.message || 'Failed to create issue', 'error');
      this._sheet?.setError();
    }
  }
}
