export const DEFAULT_CONFIG = {
  apiKey: '',
  teamId: '',
  projectId: null,
  labelIds: [],
  defaultPriority: 0,
  flagParam: 'debug',
  flagValue: '1',
};

/** Merge inline config with defaults. */
export function resolveConfig(inlineConfig = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...inlineConfig,
  };
}

/** Check if we have the minimum config to create issues */
export function isConfigured(config) {
  return !!(config.apiKey && config.teamId);
}
