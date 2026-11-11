import { getCSSPath, getDataAttributes, getComponentName, truncate, redactUrl } from './utils.js';

// ── html2canvas lazy loader ───────────────────────────────────
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

// ── Console Capture ───────────────────────────────────────────

class ConsoleCapture {
  constructor(maxEntries = 30) {
    this._entries = [];
    this._max = maxEntries;
    this._origError = console.error;
    this._origWarn = console.warn;

    console.error = (...args) => {
      this._capture('error', args);
      this._origError.apply(console, args);
    };
    console.warn = (...args) => {
      this._capture('warn', args);
      this._origWarn.apply(console, args);
    };

    window.addEventListener('error', (e) => {
      this._capture('uncaught', [e.message, `at ${e.filename}:${e.lineno}:${e.colno}`]);
    });
    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
      this._capture('unhandled-rejection', [reason]);
    });
  }

  _capture(level, args) {
    const message = args.map(a => {
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      if (typeof a === 'object') {
        try { return JSON.stringify(a); }
        catch { return String(a); }
      }
      return String(a);
    }).join(' ');

    this._entries.push({
      level,
      message: message.slice(0, 500),
      timestamp: new Date().toISOString(),
    });
    if (this._entries.length > this._max) this._entries.shift();
  }

  getEntries() { return [...this._entries]; }

  getErrors() { return this._entries.filter(e => e.level !== 'warn'); }
}

// ── Network Capture ───────────────────────────────────────────

class NetworkCapture {
  constructor(ignore = [], maxEntries = 30) {
    this._entries = [];
    this._max = maxEntries;
    // Our own traffic: Linear, the html2canvas CDN, and any proxies.
    this._ignore = ['api.linear.app', 'cdn.jsdelivr.net', ...ignore];
    this._patchFetch();
    this._patchXHR();
  }

  _patchFetch() {
    const orig = window.fetch;
    const self = this;
    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      const method = args[1]?.method || 'GET';
      const start = performance.now();
      try {
        const res = await orig.apply(window, args);
        const duration = Math.round(performance.now() - start);
        if (!res.ok) {
          self._record({ url, method, status: res.status, statusText: res.statusText, duration });
        }
        return res;
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        self._record({ url, method, error: err.message, duration });
        throw err;
      }
    };
  }

  _patchXHR() {
    const OrigXHR = window.XMLHttpRequest;
    const self = this;
    window.XMLHttpRequest = function () {
      const xhr = new OrigXHR();
      let method = 'GET', url = '';
      const origOpen = xhr.open;
      xhr.open = function (m, u, ...rest) {
        method = m;
        url = u;
        return origOpen.call(this, m, u, ...rest);
      };
      xhr.addEventListener('loadend', () => {
        if (xhr.status >= 400 || xhr.status === 0) {
          self._record({ url, method, status: xhr.status, statusText: xhr.statusText });
        }
      });
      return xhr;
    };
    // Preserve prototype
    window.XMLHttpRequest.prototype = OrigXHR.prototype;
    window.XMLHttpRequest.UNSENT = 0;
    window.XMLHttpRequest.OPENED = 1;
    window.XMLHttpRequest.HEADERS_RECEIVED = 2;
    window.XMLHttpRequest.LOADING = 3;
    window.XMLHttpRequest.DONE = 4;
  }

  _record(entry) {
    if (this._ignore.some(part => entry.url?.includes(part))) return;
    this._entries.push({ ...entry, url: redactUrl(entry.url), timestamp: new Date().toISOString() });
    if (this._entries.length > this._max) this._entries.shift();
  }

  getEntries() { return [...this._entries]; }
}

// ── Singletons (started on demand) ───────────────────────────
// Nothing is patched until the widget is turned on: importing the package
// leaves console, fetch and XMLHttpRequest alone.

let consoleCapture = null;
let networkCapture = null;

/** Start capturing console errors and failed requests (idempotent). */
export function startCapture(ignore = []) {
  if (!consoleCapture) consoleCapture = new ConsoleCapture();
  if (!networkCapture) networkCapture = new NetworkCapture(ignore);
}

// ── Context Builder ───────────────────────────────────────────

export class ContextBuilder {
  async build(element) {
    const rect = element.getBoundingClientRect();

    const context = {
      selector: getCSSPath(element),
      component: getComponentName(element),
      tagName: element.tagName.toLowerCase(),
      innerText: truncate(element.innerText, 200),
      dataAttributes: getDataAttributes(element),
      boundingRect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
      },
      computedStyles: this._getRelevantStyles(element),
      url: redactUrl(location.href),
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
      consoleErrors: consoleCapture?.getErrors() ?? [],
      networkFailures: networkCapture?.getEntries() ?? [],
      screenshotDataURL: null,
    };

    // Capture screenshot
    try {
      const h2c = await loadHtml2Canvas();
      const canvas = await h2c(element, {
        useCORS: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio, 2),
        backgroundColor: null,
        onclone: (clonedDoc, clonedElement) => {
          // html2canvas paints the captured element's own box-shadow across
          // it, tinting the whole screenshot grey; the shadow falls outside
          // the capture anyway, so drop it from the clone.
          clonedElement.style.setProperty('box-shadow', 'none', 'important');
          // html2canvas can't render `background-clip: text` — the gradient
          // leaks out as a solid block. Walk the clone and flatten any node
          // using that trick so headings render as plain text in the capture.
          const view = clonedDoc.defaultView || window;
          const nodes = [clonedElement, ...clonedElement.querySelectorAll('*')];
          for (const node of nodes) {
            const cs = view.getComputedStyle(node);
            const clip = cs.webkitBackgroundClip || cs.backgroundClip;
            if (clip !== 'text') continue;
            node.style.setProperty('background', 'none', 'important');
            node.style.setProperty('background-clip', 'border-box', 'important');
            node.style.setProperty('-webkit-background-clip', 'border-box', 'important');
            node.style.setProperty('-webkit-text-fill-color', 'currentColor', 'important');
            if (cs.color === 'rgba(0, 0, 0, 0)' || cs.color === 'transparent') {
              node.style.setProperty('color', '#1a1a2e', 'important');
            }
          }
        },
      });
      context.screenshotDataURL = canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('[LinearCapture] Screenshot failed:', err);
    }

    return context;
  }

  _getRelevantStyles(el) {
    const computed = getComputedStyle(el);
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      overflow: computed.overflow,
      position: computed.position,
      zIndex: computed.zIndex,
    };
  }

  formatMarkdown(ctx) {
    let md = '';

    md += '## Element\n';
    md += `- **Selector:** \`${ctx.selector}\`\n`;
    if (ctx.component) md += `- **Component:** \`${ctx.component}\`\n`;
    md += `- **Tag:** \`<${ctx.tagName}>\`\n`;
    if (ctx.innerText) md += `- **Text:** "${ctx.innerText}"\n`;

    const dataKeys = Object.keys(ctx.dataAttributes);
    if (dataKeys.length) {
      const attrs = dataKeys.map(k => `\`data-${k}="${ctx.dataAttributes[k]}"\``).join(', ');
      md += `- **Data attrs:** ${attrs}\n`;
    }

    const r = ctx.boundingRect;
    md += `- **Rect:** ${r.width}\u00d7${r.height} @ (${r.x}, ${r.y})\n`;

    md += '\n## Environment\n';
    md += `- **URL:** ${ctx.url}\n`;
    md += `- **Viewport:** ${ctx.viewport.width}\u00d7${ctx.viewport.height} @${ctx.viewport.dpr}x\n`;
    md += `- **User Agent:** ${ctx.userAgent}\n`;
    md += `- **Timestamp:** ${ctx.timestamp}\n`;

    if (ctx.consoleErrors.length) {
      md += '\n## Console Errors\n';
      for (const e of ctx.consoleErrors.slice(-10)) {
        md += `- \`[${e.level}]\` ${e.message}\n`;
      }
    }

    if (ctx.networkFailures.length) {
      md += '\n## Failed Requests\n';
      for (const n of ctx.networkFailures.slice(-10)) {
        const status = n.status ? `${n.status} ${n.statusText}` : n.error;
        md += `- \`${n.method} ${n.url}\` \u2014 ${status}\n`;
      }
    }

    if (ctx.debugState) {
      md += '\n## Debug State\n';
      md += '```json\n' + JSON.stringify(ctx.debugState, null, 2) + '\n```\n';
    }

    return md;
  }
}
