/** CSS selector path for an element */
export function getCSSPath(el) {
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

/** All non-lc data attributes */
export function getDataAttributes(el) {
  const out = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (!k.startsWith('lc')) out[k] = v;
  }
  return out;
}

/** Detect component name from React fiber, Vue instance, or data attrs */
export function getComponentName(el) {
  // The nearest marked element: the click usually lands on a child of it.
  const marked = el.closest('[data-component]') || el.closest('[data-testid]');
  if (marked) return marked.dataset.component || marked.dataset.testid;

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

  // Svelte
  if (el.__svelte_meta) {
    return el.__svelte_meta.loc?.file?.split('/').pop()?.replace('.svelte', '') || null;
  }

  return null;
}

// Query parameters whose values never leave the page in a report.
const SECRET_PARAM = /token|secret|passw|session|signature|credential|jwt|bearer|^auth(orization)?$|api[_-]?key|access[_-]?key|private[_-]?key|^key$|^sig$|^code$/i;

/** A URL with the values of secret-looking query parameters replaced. */
export function redactUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url, location.href);
    let changed = false;
    for (const k of [...u.searchParams.keys()]) {
      if (SECRET_PARAM.test(k)) {
        u.searchParams.set(k, 'REDACTED');
        changed = true;
      }
    }
    if (/^(access_token|id_token|token)=/i.test(u.hash.slice(1))) {
      u.hash = '#REDACTED';
      changed = true;
    }
    return changed ? u.toString() : url;
  } catch {
    return url;
  }
}

export function truncate(str, max = 120) {
  if (!str) return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '\u2026' : clean;
}

/** Check if el belongs to LinearCapture UI */
export function isOwnElement(el) {
  let cur = el;
  while (cur) {
    if (cur.id === 'lc-root') return true;
    if (cur.classList?.contains('lc-fab')) return true;
    cur = cur.parentElement;
  }
  return false;
}

export function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Title suggestion — disabled; user types their own. */
export function suggestTitle() {
  return '';
}

/** Detect OS for keyboard shortcut display */
export function isMac() {
  return navigator.platform?.toLowerCase().includes('mac') ||
    navigator.userAgent?.toLowerCase().includes('mac');
}
