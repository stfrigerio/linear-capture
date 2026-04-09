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

  // Svelte
  if (el.__svelte_meta) {
    return el.__svelte_meta.loc?.file?.split('/').pop()?.replace('.svelte', '') || null;
  }

  return null;
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

/** Smart title suggestion based on element */
export function suggestTitle(el) {
  const component = getComponentName(el);
  const tag = el.tagName.toLowerCase();
  const text = truncate(el.innerText, 40);

  if (component) return `[${component}] `;
  if (tag === 'button' && text) return `Button "${text}" — `;
  if (tag === 'input') return `Input [${el.type || 'text'}] — `;
  if (tag === 'img') return `Image — `;
  if (tag === 'a' && text) return `Link "${text}" — `;
  return '';
}

/** Detect OS for keyboard shortcut display */
export function isMac() {
  return navigator.platform?.toLowerCase().includes('mac') ||
    navigator.userAgent?.toLowerCase().includes('mac');
}
