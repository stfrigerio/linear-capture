import { LinearCapture } from './core.js';
import { resolveConfig } from './config.js';

// ── Auto-init ─────────────────────────────────────────────────
// Reads config from window.__LINEAR_CAPTURE__ and activates
// when the URL flag matches (default: ?debug=1).

const userConfig = window.__LINEAR_CAPTURE__ || {};
const merged = resolveConfig(userConfig);
const params = new URLSearchParams(location.search);

if (params.get(merged.flagParam) === merged.flagValue) {
  const boot = () => {
    const instance = new LinearCapture(userConfig);
    instance.init();
    window.__linearCapture = instance;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

// ── Exports ───────────────────────────────────────────────────
// For programmatic use:
//   import LinearCapture from 'linear-capture'
//   const lc = new LinearCapture({ teamId: '...' })
//   lc.init()

export default LinearCapture;
export { LinearCapture };
