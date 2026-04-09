const STORAGE_KEY = 'linear-capture:config';

export const DEFAULT_CONFIG = {
  apiKey: '',
  teamId: '',
  projectId: null,
  labelIds: [],
  defaultPriority: 0,
  flagParam: 'debug',
  flagValue: '1',
};

/** Load persisted config from localStorage */
export function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist config to localStorage */
export function saveStoredConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage full or disabled — ignore
  }
}

/** Clear persisted config */
export function clearStoredConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Merge config from all sources (priority: inline > localStorage > defaults).
 * Inline config = window.__LINEAR_CAPTURE__
 */
export function resolveConfig(inlineConfig = {}) {
  const stored = loadStoredConfig();
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    ...inlineConfig,
  };
}

/** Check if we have the minimum config to create issues */
export function isConfigured(config) {
  return !!(config.apiKey && config.teamId);
}
