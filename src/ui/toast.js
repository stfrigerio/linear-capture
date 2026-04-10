import { ICON_CHECK, ICON_ALERT } from '../icons.js';

const ICONS = {
  success: ICON_CHECK,
  error: ICON_ALERT,
};

export function showToast(message, type = '') {
  const el = document.createElement('div');
  el.className = `lc-toast ${type ? 'lc-' + type : ''}`;

  const icon = ICONS[type];
  el.innerHTML = (icon || '') + `<span>${escapeHtml(message)}</span>`;

  (document.getElementById('lc-root') || document.body).appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('lc-visible'));
  });

  setTimeout(() => {
    el.classList.remove('lc-visible');
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
