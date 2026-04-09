/**
 * Linear Capture — In-page Dev Toolkit
 *
 * Element Picker -> Context Builder -> Linear Ticket
 *
 * Usage:
 *   <script type="module" src="linear-capture.js"></script>
 *
 * Activates when ?debug=1 (configurable) is in the URL.
 *
 * Configure via window.__LINEAR_CAPTURE__ before the script loads:
 *   window.__LINEAR_CAPTURE__ = {
 *     apiKey:   'lin_api_...',
 *     teamId:   'TEAM_UUID',
 *     projectId: null,          // optional
 *     labelIds:  [],            // optional
 *     defaultPriority: 0,       // 0=none 1=urgent 2=high 3=medium 4=low
 *     flagParam: 'debug',       // URL param name
 *     flagValue: '1',           // URL param value
 *   };
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_CONFIG = {
  apiKey: '',
  teamId: '',
  projectId: null,
  labelIds: [],
  defaultPriority: 0,
  flagParam: 'debug',
  flagValue: '1',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Styles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STYLES = /* css */ `
/* ── FAB ────────────────────────────────────────────── */
.lc-fab{
  position:fixed; bottom:24px; right:24px;
  width:56px; height:56px; border-radius:28px; border:none;
  background:#5E6AD2; color:#fff; font-size:24px;
  cursor:pointer; z-index:2147483646;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 12px rgba(0,0,0,.3);
  transition:transform .2s,background .2s;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
  user-select:none;
}
.lc-fab:active{transform:scale(.92)}
.lc-fab.lc-active{background:#E5484D}
.lc-fab svg{width:24px;height:24px;pointer-events:none}

/* ── Picking mode ───────────────────────────────────── */
.lc-highlight{
  outline:3px solid #5E6AD2 !important;
  outline-offset:2px !important;
  background-color:rgba(94,106,210,.08) !important;
}
.lc-picking *{cursor:crosshair !important}

.lc-banner{
  position:fixed; top:0; left:0; right:0;
  padding:12px 16px;
  padding-top:max(12px, env(safe-area-inset-top));
  background:#5E6AD2; color:#fff;
  font:500 14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  text-align:center; z-index:2147483646;
  transform:translateY(-100%);
  transition:transform .3s ease;
}
.lc-banner.lc-visible{transform:translateY(0)}

/* ── Overlay + Sheet ────────────────────────────────── */
.lc-overlay{
  position:fixed; inset:0;
  background:rgba(0,0,0,.45);
  z-index:2147483645;
  opacity:0; transition:opacity .3s ease;
  pointer-events:none;
}
.lc-overlay.lc-visible{opacity:1;pointer-events:auto}

.lc-sheet{
  position:fixed; bottom:0; left:0; right:0;
  max-height:92vh; background:#fff;
  border-radius:16px 16px 0 0;
  z-index:2147483647;
  transform:translateY(100%);
  transition:transform .35s cubic-bezier(.32,.72,0,1);
  overflow:hidden; display:flex; flex-direction:column;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  color:#1a1a2e;
}
.lc-sheet.lc-visible{transform:translateY(0)}

.lc-handle{
  width:36px;height:5px;background:#d0d0d0;
  border-radius:3px;margin:8px auto 0;flex-shrink:0;
}

.lc-sheet-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 16px 12px;border-bottom:1px solid #eee;flex-shrink:0;
}
.lc-sheet-header h2{margin:0;font-size:17px;font-weight:600}
.lc-sheet-header button{
  background:none;border:none;font-size:14px;color:#888;
  cursor:pointer;padding:4px 8px;
}

.lc-sheet-body{
  overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:16px;flex:1;
}

.lc-sheet-footer{
  padding:12px 16px;
  padding-bottom:max(12px, env(safe-area-inset-bottom));
  border-top:1px solid #eee;
  display:flex;gap:12px;flex-shrink:0;
}

/* ── Form controls ──────────────────────────────────── */
.lc-field{margin-bottom:16px}
.lc-label{
  display:block;font-size:12px;font-weight:600;color:#888;
  margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;
}

.lc-input,.lc-textarea{
  width:100%;padding:12px;
  border:1.5px solid #ddd;border-radius:10px;
  font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  color:#1a1a2e;background:#f8f8fa;
  box-sizing:border-box;transition:border-color .2s;
  -webkit-appearance:none;
}
.lc-input:focus,.lc-textarea:focus{
  outline:none;border-color:#5E6AD2;background:#fff;
}
.lc-textarea{
  min-height:140px;resize:vertical;
  font:13px/1.5 'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;
}

.lc-screenshot-preview{
  width:100%;max-height:200px;object-fit:contain;
  border-radius:8px;border:1px solid #eee;background:#f5f5f5;
}

.lc-priority-group{display:flex;gap:8px}
.lc-priority-btn{
  flex:1;padding:10px 4px;
  border:1.5px solid #ddd;border-radius:10px;
  background:#f8f8fa;
  font:13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  color:#666;cursor:pointer;text-align:center;
  touch-action:manipulation;transition:all .15s;
}
.lc-priority-btn.lc-selected{
  border-color:#5E6AD2;background:#F0F1FF;color:#5E6AD2;font-weight:600;
}

.lc-btn{
  flex:1;padding:14px;border:none;border-radius:12px;
  font:600 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  cursor:pointer;touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
  transition:opacity .2s;
}
.lc-btn:active{opacity:.7}
.lc-btn:disabled{opacity:.5;cursor:not-allowed}
.lc-btn-primary{background:#5E6AD2;color:#fff}
.lc-btn-secondary{background:#f0f0f3;color:#666}

/* ── Toast ──────────────────────────────────────────── */
.lc-toast{
  position:fixed;top:24px;left:50%;
  transform:translateX(-50%) translateY(-120px);
  background:#1a1a2e;color:#fff;
  padding:12px 24px;border-radius:12px;
  font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  z-index:2147483647;transition:transform .3s ease;
  box-shadow:0 8px 32px rgba(0,0,0,.3);
  pointer-events:none;
}
.lc-toast.lc-visible{transform:translateX(-50%) translateY(0)}
.lc-toast.lc-error{background:#E5484D}
.lc-toast.lc-success{background:#30A46C}

/* ── Spinner ────────────────────────────────────────── */
.lc-spinner{
  display:inline-block;width:18px;height:18px;
  border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff;border-radius:50%;
  animation:lc-spin .6s linear infinite;
  vertical-align:middle;margin-right:6px;
}
@keyframes lc-spin{to{transform:rotate(360deg)}}

/* ── Dark mode ──────────────────────────────────────── */
@media(prefers-color-scheme:dark){
  .lc-sheet{background:#1a1a2e;color:#e0e0e0}
  .lc-sheet-header{border-color:#333}
  .lc-sheet-footer{border-color:#333}
  .lc-input,.lc-textarea{background:#252540;border-color:#444;color:#e0e0e0}
  .lc-input:focus,.lc-textarea:focus{background:#2a2a4a}
  .lc-btn-secondary{background:#252540;color:#aaa}
  .lc-priority-btn{background:#252540;border-color:#444;color:#aaa}
  .lc-priority-btn.lc-selected{background:#2a2a5a;border-color:#5E6AD2;color:#8B92E8}
  .lc-screenshot-preview{border-color:#333;background:#252540}
  .lc-handle{background:#555}
  .lc-label{color:#999}
}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SVG Icons
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ICON_TARGET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
  <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
  <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
</svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
</svg>`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getCSSPath(el) {
  const parts = [];
  let cur = el;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    let seg = cur.tagName.toLowerCase();
    if (cur.id) {
      parts.unshift(`#${CSS.escape(cur.id)}`);
      break;
    }
    const cls = [...cur.classList].filter(c => !c.startsWith('lc-')).slice(0, 2);
    if (cls.length) {
      seg += '.' + cls.map(c => CSS.escape(c)).join('.');
    } else if (cur.parentElement) {
      const sibs = [...cur.parentElement.children].filter(s => s.tagName === cur.tagName);
      if (sibs.length > 1) seg += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
    }
    parts.unshift(seg);
    cur = cur.parentElement;
  }
  return parts.join(' > ') || el.tagName.toLowerCase();
}

function getDataAttributes(el) {
  const out = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (!k.startsWith('lc')) out[k] = v;
  }
  return out;
}

function getComponentName(el) {
  if (el.dataset.component) return el.dataset.component;
  if (el.dataset.testid) return el.dataset.testid;

  // React fiber
  const fiberKey = Object.keys(el).find(
    k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'),
  );
  if (fiberKey) {
    let fiber = el[fiberKey];
    while (fiber) {
      if (fiber.type && typeof fiber.type !== 'string') {
        const name = fiber.type.displayName || fiber.type.name;
        if (name) return name;
      }
      fiber = fiber.return;
    }
  }

  // Vue 2
  if (el.__vue__) {
    const name = el.__vue__.$options.name || el.__vue__.$options._componentTag;
    if (name) return name;
  }

  // Vue 3
  if (el.__vueParentComponent) {
    const name = el.__vueParentComponent.type.name || el.__vueParentComponent.type.__name;
    if (name) return name;
  }

  return null;
}

function truncate(str, max = 120) {
  if (!str) return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '...' : clean;
}

function isOwnElement(el) {
  let cur = el;
  while (cur) {
    if (cur.classList && (cur.classList.contains('lc-fab') ||
        cur.classList.contains('lc-sheet') ||
        cur.classList.contains('lc-banner') ||
        cur.classList.contains('lc-overlay') ||
        cur.classList.contains('lc-toast'))) return true;
    cur = cur.parentElement;
  }
  return false;
}

function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  html2canvas loader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _h2cPromise = null;

function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (_h2cPromise) return _h2cPromise;
  _h2cPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(s);
  });
  return _h2cPromise;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Element Picker
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ElementPicker {
  constructor(onSelect) {
    this._onSelect = onSelect;
    this._highlighted = null;
    this._active = false;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._lastTouchTarget = null;
  }

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
    // Temporarily hide our UI to get the real element underneath
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
      this._onSelect(null); // signal cancel
    }
  }

  _select(el) {
    this._clearHighlight();
    this.deactivate();
    this._onSelect(el);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Context Builder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ContextBuilder {
  async build(element) {
    const rect = element.getBoundingClientRect();

    const context = {
      selector: getCSSPath(element),
      component: getComponentName(element),
      innerText: truncate(element.innerText, 200),
      dataAttributes: getDataAttributes(element),
      boundingRect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
      },
      url: location.href,
      path: location.pathname,
      hash: location.hash,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      debugState: window.__DEBUG_STATE || null,
      screenshotDataURL: null,
    };

    // Capture screenshot (non-blocking failure)
    try {
      const h2c = await loadHtml2Canvas();
      const canvas = await h2c(element, {
        useCORS: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio, 2),
        backgroundColor: null,
      });
      context.screenshotDataURL = canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('[LinearCapture] Screenshot failed:', err);
    }

    return context;
  }

  formatMarkdown(ctx) {
    let md = '';

    md += '## Element\n';
    md += `- **Selector:** \`${ctx.selector}\`\n`;
    if (ctx.component) md += `- **Component:** \`${ctx.component}\`\n`;
    if (ctx.innerText) md += `- **Text:** "${ctx.innerText}"\n`;

    const dataKeys = Object.keys(ctx.dataAttributes);
    if (dataKeys.length) {
      const attrs = dataKeys.map(k => `\`data-${k}="${ctx.dataAttributes[k]}"\``).join(', ');
      md += `- **Data attrs:** ${attrs}\n`;
    }

    const r = ctx.boundingRect;
    md += `- **Rect:** ${r.width} x ${r.height} @ (${r.x}, ${r.y})\n`;

    md += '\n## Environment\n';
    md += `- **URL:** ${ctx.url}\n`;
    md += `- **Viewport:** ${ctx.viewport.width} x ${ctx.viewport.height} @${ctx.viewport.dpr}x\n`;
    md += `- **User Agent:** ${ctx.userAgent}\n`;
    md += `- **Timestamp:** ${ctx.timestamp}\n`;

    if (ctx.debugState) {
      md += '\n## Debug State\n';
      md += '```json\n' + JSON.stringify(ctx.debugState, null, 2) + '\n```\n';
    }

    return md;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Linear API Client
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class LinearClient {
  constructor(apiKey) {
    this._apiKey = apiKey;
  }

  async _graphql(query, variables = {}) {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this._apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Linear API ${res.status}: ${res.statusText}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
    return json.data;
  }

  async uploadFile(blob, filename) {
    const data = await this._graphql(
      `mutation($contentType: String!, $filename: String!, $size: Int!) {
        fileUpload(contentType: $contentType, filename: $filename, size: $size) {
          uploadFile {
            uploadUrl
            assetUrl
            headers { key value }
          }
        }
      }`,
      { contentType: blob.type, filename, size: blob.size },
    );

    const { uploadUrl, assetUrl, headers } = data.fileUpload.uploadFile;

    const hdrs = {};
    for (const h of headers) hdrs[h.key] = h.value;
    hdrs['Content-Type'] = blob.type;
    hdrs['Cache-Control'] = 'public, max-age=31536000';

    const up = await fetch(uploadUrl, { method: 'PUT', headers: hdrs, body: blob });
    if (!up.ok) throw new Error(`Upload failed: ${up.status}`);

    return assetUrl;
  }

  async createIssue({ title, description, teamId, projectId, labelIds, priority }) {
    const input = { title, description, teamId };
    if (projectId) input.projectId = projectId;
    if (labelIds && labelIds.length) input.labelIds = labelIds;
    if (priority) input.priority = priority;

    const data = await this._graphql(
      `mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier url }
        }
      }`,
      { input },
    );

    if (!data.issueCreate.success) throw new Error('Issue creation failed');
    return data.issueCreate.issue;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Bottom Sheet UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class BottomSheet {
  constructor({ onSubmit, onCancel }) {
    this._onSubmit = onSubmit;
    this._onCancel = onCancel;
    this._overlay = null;
    this._sheet = null;
    this._context = null;
    this._priority = 0;
  }

  open(context, defaultPriority = 0) {
    this._context = context;
    this._priority = defaultPriority;
    this._render();

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._overlay.classList.add('lc-visible');
        this._sheet.classList.add('lc-visible');
        this._sheet.querySelector('.lc-input').focus();
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
    // Overlay
    this._overlay = document.createElement('div');
    this._overlay.className = 'lc-overlay';
    this._overlay.addEventListener('click', () => { this.close(); this._onCancel(); });

    // Sheet
    this._sheet = document.createElement('div');
    this._sheet.className = 'lc-sheet';

    const ctx = this._context;
    const md = new ContextBuilder().formatMarkdown(ctx);

    this._sheet.innerHTML = `
      <div class="lc-handle"></div>
      <div class="lc-sheet-header">
        <h2>Report Issue</h2>
        <button class="lc-cancel-btn" type="button">Cancel</button>
      </div>
      <div class="lc-sheet-body">
        <div class="lc-field">
          <label class="lc-label">Title</label>
          <input class="lc-input" type="text" placeholder="Describe the issue..." autocomplete="off" />
        </div>
        <div class="lc-field">
          <label class="lc-label">Priority</label>
          <div class="lc-priority-group">
            <button class="lc-priority-btn${this._priority === 0 ? ' lc-selected' : ''}" data-p="0">None</button>
            <button class="lc-priority-btn${this._priority === 1 ? ' lc-selected' : ''}" data-p="1">Urgent</button>
            <button class="lc-priority-btn${this._priority === 2 ? ' lc-selected' : ''}" data-p="2">High</button>
            <button class="lc-priority-btn${this._priority === 3 ? ' lc-selected' : ''}" data-p="3">Medium</button>
            <button class="lc-priority-btn${this._priority === 4 ? ' lc-selected' : ''}" data-p="4">Low</button>
          </div>
        </div>
        ${ctx.screenshotDataURL ? `
        <div class="lc-field">
          <label class="lc-label">Screenshot</label>
          <img class="lc-screenshot-preview" src="${ctx.screenshotDataURL}" alt="Element screenshot" />
        </div>
        ` : ''}
        <div class="lc-field">
          <label class="lc-label">Context (auto-generated)</label>
          <textarea class="lc-textarea">${this._escapeHtml(md)}</textarea>
        </div>
      </div>
      <div class="lc-sheet-footer">
        <button class="lc-btn lc-btn-secondary lc-cancel-btn2" type="button">Cancel</button>
        <button class="lc-btn lc-btn-primary lc-submit-btn" type="button">Submit</button>
      </div>
    `;

    // Events
    this._sheet.querySelector('.lc-cancel-btn').addEventListener('click', () => {
      this.close();
      this._onCancel();
    });
    this._sheet.querySelector('.lc-cancel-btn2').addEventListener('click', () => {
      this.close();
      this._onCancel();
    });

    // Priority buttons
    this._sheet.querySelectorAll('.lc-priority-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._sheet.querySelectorAll('.lc-priority-btn').forEach(b => b.classList.remove('lc-selected'));
        btn.classList.add('lc-selected');
        this._priority = parseInt(btn.dataset.p, 10);
      });
    });

    // Submit
    this._sheet.querySelector('.lc-submit-btn').addEventListener('click', () => {
      const title = this._sheet.querySelector('.lc-input').value.trim();
      if (!title) {
        this._sheet.querySelector('.lc-input').style.borderColor = '#E5484D';
        this._sheet.querySelector('.lc-input').focus();
        return;
      }
      const description = this._sheet.querySelector('.lc-textarea').value;
      this._setSubmitting(true);
      this._onSubmit({
        title,
        description,
        priority: this._priority,
        screenshotDataURL: this._context.screenshotDataURL,
      });
    });

    // Drag to dismiss
    this._setupDrag();

    document.body.appendChild(this._overlay);
    document.body.appendChild(this._sheet);
  }

  _setSubmitting(busy) {
    const btn = this._sheet?.querySelector('.lc-submit-btn');
    if (!btn) return;
    btn.disabled = busy;
    btn.innerHTML = busy
      ? '<span class="lc-spinner"></span>Submitting...'
      : 'Submit';
  }

  setError(msg) {
    this._setSubmitting(false);
    const btn = this._sheet?.querySelector('.lc-submit-btn');
    if (btn) btn.style.background = '#E5484D';
    setTimeout(() => { if (btn) btn.style.background = ''; }, 2000);
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

  _escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Toast
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showToast(message, type = '') {
  const el = document.createElement('div');
  el.className = `lc-toast ${type ? 'lc-' + type : ''}`;
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('lc-visible'));
  });
  setTimeout(() => {
    el.classList.remove('lc-visible');
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Main Controller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class LinearCapture {
  constructor(config = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._fab = null;
    this._banner = null;
    this._picker = new ElementPicker(el => this._onElementSelected(el));
    this._contextBuilder = new ContextBuilder();
    this._sheet = null;
    this._picking = false;
    this._styleEl = null;
  }

  init() {
    this._injectStyles();
    this._createFAB();
    this._createBanner();
    console.log('[LinearCapture] Initialized. Tap the target button to start picking.');
  }

  destroy() {
    this._picker.deactivate();
    this._fab?.remove();
    this._banner?.remove();
    this._styleEl?.remove();
    this._sheet?.close();
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.textContent = STYLES;
    document.head.appendChild(this._styleEl);
  }

  _createFAB() {
    this._fab = document.createElement('button');
    this._fab.className = 'lc-fab';
    this._fab.setAttribute('aria-label', 'Open bug reporter');
    this._fab.innerHTML = ICON_TARGET;
    this._fab.addEventListener('click', () => this._onFABClick());
    document.body.appendChild(this._fab);
  }

  _createBanner() {
    this._banner = document.createElement('div');
    this._banner.className = 'lc-banner';
    this._banner.textContent = 'Tap any element to report an issue';
    document.body.appendChild(this._banner);
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
    this._fab.classList.add('lc-active');
    this._fab.innerHTML = ICON_CLOSE;
    this._banner.classList.add('lc-visible');
    this._picker.activate();
  }

  _stopPicking() {
    this._picking = false;
    this._fab.classList.remove('lc-active');
    this._fab.innerHTML = ICON_TARGET;
    this._banner.classList.remove('lc-visible');
    this._picker.deactivate();
  }

  async _onElementSelected(el) {
    this._stopPicking();

    if (!el) return; // cancelled

    // Show loading state
    this._fab.disabled = true;
    this._fab.style.opacity = '0.5';
    showToast('Capturing context...', '');

    try {
      const context = await this._contextBuilder.build(el);
      this._openSheet(context);
    } catch (err) {
      console.error('[LinearCapture] Context build failed:', err);
      showToast('Failed to capture context', 'error');
    } finally {
      this._fab.disabled = false;
      this._fab.style.opacity = '';
    }
  }

  _openSheet(context) {
    this._sheet = new BottomSheet({
      onSubmit: data => this._onSubmit(data),
      onCancel: () => { this._sheet = null; },
    });
    this._sheet.open(context, this._config.defaultPriority);
  }

  async _onSubmit({ title, description, priority, screenshotDataURL }) {
    const cfg = this._config;

    if (!cfg.apiKey) {
      showToast('No API key configured', 'error');
      this._sheet?.setError('No API key');
      return;
    }
    if (!cfg.teamId) {
      showToast('No team ID configured', 'error');
      this._sheet?.setError('No team ID');
      return;
    }

    const client = new LinearClient(cfg.apiKey);
    let finalDescription = description;

    try {
      // Upload screenshot if available
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
        labelIds: cfg.labelIds,
        priority: priority || undefined,
      });

      this._sheet?.close();
      this._sheet = null;
      showToast(`Created ${issue.identifier}`, 'success');
      console.log('[LinearCapture] Issue created:', issue.url);
    } catch (err) {
      console.error('[LinearCapture] Submit failed:', err);
      showToast('Failed to create issue', 'error');
      this._sheet?.setError(err.message);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Auto-init
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const userConfig = window.__LINEAR_CAPTURE__ || {};
const merged = { ...DEFAULT_CONFIG, ...userConfig };
const params = new URLSearchParams(location.search);

if (params.get(merged.flagParam) === merged.flagValue) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LinearCapture(userConfig).init());
  } else {
    new LinearCapture(userConfig).init();
  }
}

export default LinearCapture;
