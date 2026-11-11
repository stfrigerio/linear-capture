export const DEFAULT_CONFIG = {
  // Linear personal API key. It reaches the browser, so anyone who can load
  // the page can read it: only use it on dev, staging or internal builds.
  // Anywhere else, leave it out and set apiProxyUrl instead.
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
  // Optional: a backend endpoint that forwards GraphQL requests to Linear
  // with the API key added server-side. When set, the widget never needs
  // apiKey: it POSTs { query, variables } here, with cookies included.
  apiProxyUrl: null,
  // Optional headers (an object, or a function returning one, called on every
  // request so tokens stay fresh) for both proxies, e.g. an Authorization
  // bearer for your own backend.
  proxyHeaders: null,
  // Deprecated alias of proxyHeaders, for the upload proxy only.
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
  return !!((config.apiKey || config.apiProxyUrl) && config.teamId);
}
