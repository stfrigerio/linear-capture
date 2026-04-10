export const DEFAULT_CONFIG = {
  apiKey: '',
  teamId: '',
  projectId: null,
  labelIds: [],
  defaultPriority: 0,
  flagParam: 'debug',
  flagValue: '1',
  // Optional file upload proxy — if set, the widget POSTs the screenshot blob
  // to this URL (as multipart/form-data field "file") and expects a JSON body
  // { assetUrl } in response, instead of calling Linear's S3 signed URL from
  // the browser. This bypasses the S3 CORS preflight that blocks uploads from
  // non-linear.app origins.
  uploadProxyUrl: null,
  // Optional function returning headers to attach to the proxy request (e.g.
  // an Authorization bearer). Called at upload time so tokens stay fresh.
  uploadProxyHeaders: null,
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
