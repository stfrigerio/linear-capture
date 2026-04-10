export const STYLES = /* css */ `
/* ═══════════════════════════════════════════════════════════════
   Linear Capture — Styles
   ═══════════════════════════════════════════════════════════════ */

/* ── CSS Variables ─────────────────────────────────────────── */
:root {
  --lc-accent: #5E6AD2;
  --lc-accent-hover: #4F5ABF;
  --lc-accent-light: rgba(94, 106, 210, 0.1);
  --lc-accent-glow: rgba(94, 106, 210, 0.25);
  --lc-danger: #E5484D;
  --lc-success: #30A46C;
  --lc-warn: #F5A623;
  --lc-bg: rgba(255, 255, 255, 0.88);
  --lc-bg-solid: #ffffff;
  --lc-bg-elevated: #f8f8fa;
  --lc-bg-input: #f4f4f6;
  --lc-border: rgba(0, 0, 0, 0.08);
  --lc-border-focus: var(--lc-accent);
  --lc-text: #1a1a2e;
  --lc-text-secondary: #6b6b80;
  --lc-text-muted: #9494a6;
  --lc-shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --lc-shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
  --lc-shadow-lg: 0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
  --lc-shadow-fab: 0 4px 20px rgba(94,106,210,0.4), 0 2px 8px rgba(0,0,0,0.12);
  --lc-radius: 12px;
  --lc-radius-lg: 20px;
  --lc-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  --lc-font-mono: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  --lc-spring: cubic-bezier(0.32, 0.72, 0, 1);
  --lc-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --lc-bg: rgba(22, 22, 38, 0.92);
    --lc-bg-solid: #16162a;
    --lc-bg-elevated: #1e1e36;
    --lc-bg-input: #252544;
    --lc-border: rgba(255, 255, 255, 0.08);
    --lc-text: #e4e4ed;
    --lc-text-secondary: #8b8ba0;
    --lc-text-muted: #5e5e72;
    --lc-shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
    --lc-shadow-md: 0 4px 16px rgba(0,0,0,0.3);
    --lc-shadow-lg: 0 12px 48px rgba(0,0,0,0.4);
    --lc-shadow-fab: 0 4px 24px rgba(94,106,210,0.5), 0 2px 8px rgba(0,0,0,0.3);
    --lc-accent-light: rgba(94, 106, 210, 0.15);
  }
}

/* ── Reset (scoped to our root) ────────────────────────────── */
#lc-root *, #lc-root *::before, #lc-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
#lc-root {
  font-family: var(--lc-font);
  color: var(--lc-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/* Defensive reset against host CSS bleeding into the widget.
   .lc-sheet, .lc-annotator-overlay, and .lc-toast live directly on document.body
   (to keep fixed-positioning working), so host element selectors for headings
   or inputs can leak in. !important is used because the widget has no control
   over host specificity. */
.lc-sheet h1, .lc-sheet h2, .lc-sheet h3,
.lc-sheet h4, .lc-sheet h5, .lc-sheet h6,
.lc-annotator-overlay h1, .lc-annotator-overlay h2, .lc-annotator-overlay h3 {
  color: var(--lc-text) !important;
  background: none !important;
  background-clip: border-box !important;
  -webkit-background-clip: border-box !important;
  -webkit-text-fill-color: var(--lc-text) !important;
  font-family: var(--lc-font) !important;
  padding-bottom: 0 !important;
}
.lc-sheet input, .lc-sheet textarea, .lc-sheet select {
  color: var(--lc-text) !important;
  min-height: auto !important;
  font-family: var(--lc-font) !important;
  -webkit-text-fill-color: var(--lc-text) !important;
}

/* ── FAB ───────────────────────────────────────────────────── */
.lc-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 54px;
  height: 54px;
  border-radius: 27px;
  border: none;
  background: var(--lc-accent);
  color: #fff;
  cursor: pointer;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--lc-shadow-fab);
  transition: transform 0.2s var(--lc-spring), background 0.2s, box-shadow 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  outline: none;
}
.lc-fab svg { width: 22px; height: 22px; pointer-events: none; }
.lc-fab:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 28px rgba(94,106,210,0.5), 0 2px 10px rgba(0,0,0,0.15);
}
.lc-fab:active { transform: scale(0.94); }
.lc-fab.lc-active { background: var(--lc-danger); }

/* Intro pulse */
@keyframes lc-fab-pulse {
  0% { box-shadow: var(--lc-shadow-fab), 0 0 0 0 rgba(94,106,210,0.4); }
  70% { box-shadow: var(--lc-shadow-fab), 0 0 0 14px rgba(94,106,210,0); }
  100% { box-shadow: var(--lc-shadow-fab), 0 0 0 0 rgba(94,106,210,0); }
}
.lc-fab.lc-intro { animation: lc-fab-pulse 1.5s ease 0.5s 2; }

/* ── Picking mode ──────────────────────────────────────────── */
.lc-highlight {
  outline: 2.5px solid var(--lc-accent) !important;
  outline-offset: 2px !important;
  background-color: var(--lc-accent-light) !important;
  transition: outline-color 0.15s, background-color 0.15s !important;
}
.lc-picking * { cursor: crosshair !important; }

.lc-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  padding: 10px 16px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: var(--lc-accent);
  color: #fff;
  font: 500 13px/1.4 var(--lc-font);
  text-align: center;
  z-index: 2147483646;
  transform: translateY(-100%);
  transition: transform 0.35s var(--lc-spring);
  letter-spacing: 0.01em;
}
.lc-banner.lc-visible { transform: translateY(0); }
.lc-banner kbd {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--lc-font-mono);
  margin-left: 6px;
  vertical-align: 1px;
}

/* ── Overlay ───────────────────────────────────────────────── */
.lc-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 2147483645;
  opacity: 0;
  transition: opacity 0.3s var(--lc-ease);
  pointer-events: none;
}
.lc-overlay.lc-visible { opacity: 1; pointer-events: auto; }

/* ── Sheet ─────────────────────────────────────────────────── */
.lc-sheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  max-height: 92vh;
  background: var(--lc-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--lc-radius-lg) var(--lc-radius-lg) 0 0;
  z-index: 2147483647;
  transform: translateY(100%);
  transition: transform 0.4s var(--lc-spring);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 40px rgba(0,0,0,0.12);
  font-family: var(--lc-font);
  color: var(--lc-text);
}
.lc-sheet.lc-visible { transform: translateY(0); }

@media (min-width: 768px) {
  .lc-sheet {
    left: 16px;
    right: 16px;
    bottom: 16px;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
    max-height: 82vh;
    border-radius: var(--lc-radius-lg);
    box-shadow: var(--lc-shadow-lg);
  }
}

.lc-handle {
  width: 36px; height: 4px;
  background: var(--lc-text-muted);
  opacity: 0.3;
  border-radius: 2px;
  margin: 8px auto 0;
  flex-shrink: 0;
}

.lc-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 12px;
  border-bottom: 1px solid var(--lc-border);
  flex-shrink: 0;
}
.lc-sheet-header h2 {
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.lc-sheet-header button {
  background: none;
  border: none;
  font: 14px var(--lc-font);
  color: var(--lc-text-muted);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.lc-sheet-header button:hover {
  color: var(--lc-text);
  background: var(--lc-accent-light);
}

.lc-sheet-body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  flex: 1;
}

.lc-sheet-footer {
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--lc-border);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ── Form controls ─────────────────────────────────────────── */
.lc-field { margin-bottom: 16px; }
.lc-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--lc-text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.lc-input, .lc-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--lc-border);
  border-radius: 10px;
  font: 14px/1.5 var(--lc-font);
  color: var(--lc-text);
  background: var(--lc-bg-input);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;
  outline: none;
}
.lc-input:focus, .lc-textarea:focus {
  border-color: var(--lc-accent);
  background: var(--lc-bg-solid);
  box-shadow: 0 0 0 3px var(--lc-accent-glow);
}
.lc-input.lc-error {
  border-color: var(--lc-danger);
  box-shadow: 0 0 0 3px rgba(229, 72, 77, 0.15);
}
.lc-textarea {
  min-height: 100px;
  resize: vertical;
  font: 12px/1.6 var(--lc-font-mono);
}
.lc-description-textarea {
  min-height: 72px;
  font: 14px/1.5 var(--lc-font);
}
select.lc-input {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 34px;
  cursor: pointer;
}

/* ── Priority selector ─────────────────────────────────────── */
.lc-priority-group { display: flex; gap: 6px; }
.lc-priority-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1.5px solid var(--lc-border);
  border-radius: 10px;
  background: var(--lc-bg-input);
  font: 12px/1 var(--lc-font);
  font-weight: 500;
  color: var(--lc-text-secondary);
  cursor: pointer;
  text-align: center;
  touch-action: manipulation;
  transition: all 0.15s var(--lc-ease);
  outline: none;
}
.lc-priority-btn:hover {
  border-color: var(--lc-text-muted);
}
.lc-priority-btn.lc-selected {
  border-color: var(--lc-accent);
  background: var(--lc-accent-light);
  color: var(--lc-accent);
  font-weight: 600;
}

/* ── Buttons ───────────────────────────────────────────────── */
.lc-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: var(--lc-radius);
  font: 600 14px/1 var(--lc-font);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s var(--lc-ease);
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.lc-btn:active { transform: scale(0.97); }
.lc-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.lc-btn-primary {
  background: var(--lc-accent);
  color: #fff;
}
.lc-btn-primary:hover:not(:disabled) {
  background: var(--lc-accent-hover);
}
.lc-btn-secondary {
  background: var(--lc-bg-elevated);
  color: var(--lc-text-secondary);
}
.lc-btn-secondary:hover:not(:disabled) {
  background: var(--lc-bg-input);
}

/* ── Screenshot ────────────────────────────────────────────── */
.lc-screenshot-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--lc-border);
  background: var(--lc-bg-elevated);
}
.lc-screenshot-preview {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  display: block;
}
.lc-annotate-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font: 500 12px/1 var(--lc-font);
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.lc-annotate-btn:hover { background: rgba(0,0,0,0.8); }
.lc-annotate-btn svg { width: 13px; height: 13px; }

/* ── Collapsible section ───────────────────────────────────── */
.lc-collapsible-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
}
.lc-collapsible-header .lc-label { margin: 0; cursor: pointer; }
.lc-collapsible-chevron {
  width: 14px; height: 14px;
  stroke: var(--lc-text-muted);
  transition: transform 0.2s var(--lc-ease);
}
.lc-collapsible-header.lc-open .lc-collapsible-chevron {
  transform: rotate(90deg);
}
.lc-collapsible-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s var(--lc-ease);
}
.lc-collapsible-body.lc-open {
  max-height: 600px;
}

/* ── Badge counts ──────────────────────────────────────────── */
.lc-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
.lc-badge-error { background: rgba(229,72,77,0.12); color: var(--lc-danger); }
.lc-badge-warn { background: rgba(245,166,35,0.12); color: var(--lc-warn); }
.lc-badge-network { background: rgba(94,106,210,0.12); color: var(--lc-accent); }

/* ── Toast ─────────────────────────────────────────────────── */
.lc-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  background: var(--lc-bg-solid);
  color: var(--lc-text);
  padding: 10px 20px;
  border-radius: var(--lc-radius);
  font: 500 13px/1.4 var(--lc-font);
  z-index: 2147483647;
  transition: transform 0.4s var(--lc-spring), opacity 0.3s;
  box-shadow: var(--lc-shadow-lg);
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--lc-border);
  max-width: 90vw;
}
.lc-toast.lc-visible { transform: translateX(-50%) translateY(0); }
.lc-toast svg { width: 16px; height: 16px; flex-shrink: 0; }
.lc-toast.lc-error { border-color: rgba(229,72,77,0.3); }
.lc-toast.lc-error svg { stroke: var(--lc-danger); }
.lc-toast.lc-success { border-color: rgba(48,164,108,0.3); }
.lc-toast.lc-success svg { stroke: var(--lc-success); }

/* ── Spinner ───────────────────────────────────────────────── */
.lc-spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: lc-spin 0.6s linear infinite;
}
@keyframes lc-spin { to { transform: rotate(360deg); } }

/* ── Annotator ─────────────────────────────────────────────── */
.lc-annotator-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.3s var(--lc-ease);
}
.lc-annotator-overlay.lc-visible { opacity: 1; }

.lc-annotator-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.lc-annotator-tool {
  width: 36px; height: 36px;
  border: 1.5px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.lc-annotator-tool svg { width: 18px; height: 18px; }
.lc-annotator-tool:hover { background: rgba(255,255,255,0.15); }
.lc-annotator-tool.lc-selected {
  background: var(--lc-accent);
  border-color: var(--lc-accent);
}
.lc-annotator-sep {
  width: 1px; height: 24px;
  background: rgba(255,255,255,0.15);
  margin: 0 4px;
}
.lc-annotator-color {
  width: 24px; height: 24px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.lc-annotator-color:hover { transform: scale(1.15); }
.lc-annotator-color.lc-selected { border-color: #fff; }

.lc-annotator-spacer { flex: 1; }

.lc-annotator-done {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  background: var(--lc-accent);
  color: #fff;
  font: 600 13px/1 var(--lc-font);
  cursor: pointer;
  transition: background 0.15s;
}
.lc-annotator-done:hover { background: var(--lc-accent-hover); }

.lc-annotator-canvas-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}
.lc-annotator-canvas {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  cursor: crosshair;
  touch-action: none;
}

/* ── Shortcut hint ─────────────────────────────────────────── */
.lc-shortcut-hint {
  position: fixed;
  bottom: 86px;
  right: 24px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--lc-bg-solid);
  border: 1px solid var(--lc-border);
  box-shadow: var(--lc-shadow-md);
  font: 500 11px/1.3 var(--lc-font);
  color: var(--lc-text-secondary);
  z-index: 2147483645;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.3s, transform 0.3s var(--lc-spring);
  pointer-events: none;
  white-space: nowrap;
}
.lc-shortcut-hint.lc-visible {
  opacity: 1;
  transform: translateY(0);
}
.lc-shortcut-hint kbd {
  display: inline-block;
  background: var(--lc-bg-input);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-family: var(--lc-font-mono);
  border: 1px solid var(--lc-border);
}

/* ── Success animation ─────────────────────────────────────── */
@keyframes lc-success-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
.lc-success-icon {
  animation: lc-success-pop 0.4s var(--lc-spring);
}
.lc-success-icon svg {
  width: 20px; height: 20px; stroke: var(--lc-success);
}
`;
