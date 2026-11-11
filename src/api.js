import { MILESTONES_QUERY, FILE_UPLOAD_MUTATION, ISSUE_CREATE_MUTATION } from './queries.js';

/**
 * Linear GraphQL API client.
 */
export const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';

function resolveHeaders(h) {
  return (typeof h === 'function' ? h() : h) || {};
}

export class LinearClient {
  constructor(apiKey, options = {}) {
    this._apiKey = apiKey;
    this._apiProxyUrl = options.apiProxyUrl || null;
    this._uploadProxyUrl = options.uploadProxyUrl || null;
    this._proxyHeaders = options.proxyHeaders || null;
    this._uploadProxyHeaders = options.uploadProxyHeaders || options.proxyHeaders || null;
  }

  async _graphql(query, variables = {}) {
    // Through your own backend when apiProxyUrl is set: the key stays there.
    const proxied = !!this._apiProxyUrl;
    const headers = { 'Content-Type': 'application/json' };
    if (proxied) Object.assign(headers, resolveHeaders(this._proxyHeaders));
    else headers.Authorization = this._apiKey;
    const res = await fetch(proxied ? this._apiProxyUrl : LINEAR_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      ...(proxied ? { credentials: 'include' } : {}),
    });
    if (!res.ok) throw new Error(`Linear API ${res.status}: ${res.statusText}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
    return json.data;
  }

  /** Fetch teams the API key has access to */
  async getTeams() {
    const data = await this._graphql(`{
      teams { nodes { id name key } }
    }`);
    return data.teams.nodes;
  }

  /** Fetch projects for a team */
  async getProjects(teamId) {
    const data = await this._graphql(`
      query($teamId: String!) {
        team(id: $teamId) {
          projects { nodes { id name } }
        }
      }
    `, { teamId });
    return data.team.projects.nodes;
  }

  /** Fetch milestones for a project */
  async getProjectMilestones(projectId) {
    const data = await this._graphql(MILESTONES_QUERY, { projectId });
    return data.project?.projectMilestones?.nodes ?? [];
  }

  /** Upload a file and return its asset URL */
  async uploadFile(blob, filename) {
    // Proxy mode — POST the blob to a backend endpoint that runs the Linear
    // upload flow server-side. Used to sidestep the S3 CORS preflight that
    // blocks PUT requests with Linear's custom headers from non-linear.app
    // origins (i.e. every self-hosted app embedding this widget).
    if (this._uploadProxyUrl) {
      const form = new FormData();
      form.append('file', blob, filename);
      const extraHeaders = resolveHeaders(this._uploadProxyHeaders);
      const res = await fetch(this._uploadProxyUrl, {
        method: 'POST',
        headers: extraHeaders, // don't set Content-Type — FormData sets the multipart boundary
        body: form,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let detail = text;
        try {
          const json = JSON.parse(text);
          if (json?.error) detail = json.error;
        } catch {}
        throw new Error(`Upload proxy failed: ${res.status} ${detail}`.trim());
      }
      const json = await res.json();
      if (!json?.assetUrl) throw new Error('Upload proxy returned no assetUrl');
      return json.assetUrl;
    }

    // Direct mode — two-step: fetch a signed S3 URL, then PUT the blob to it.
    const data = await this._graphql(
      FILE_UPLOAD_MUTATION,
      { contentType: blob.type, filename, size: blob.size },
    );

    const { uploadUrl, assetUrl, headers } = data.fileUpload.uploadFile;
    const hdrs = { 'Content-Type': blob.type };
    for (const h of headers) hdrs[h.key] = h.value;

    const up = await fetch(uploadUrl, { method: 'PUT', headers: hdrs, body: blob });
    if (!up.ok) {
      const text = await up.text().catch(() => '');
      throw new Error(`Upload failed: ${up.status} ${up.statusText} ${text}`.trim());
    }

    return assetUrl;
  }

  /** Create a Linear issue */
  async createIssue({ title, description, teamId, projectId, projectMilestoneId, labelIds, priority }) {
    const input = { title, description, teamId };
    if (projectId) input.projectId = projectId;
    if (projectMilestoneId) input.projectMilestoneId = projectMilestoneId;
    if (labelIds?.length) input.labelIds = labelIds;
    if (priority) input.priority = priority;

    const data = await this._graphql(
      ISSUE_CREATE_MUTATION,
      { input },
    );

    if (!data.issueCreate.success) throw new Error('Issue creation failed');
    return data.issueCreate.issue;
  }
}
