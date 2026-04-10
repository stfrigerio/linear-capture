import { dataURLtoBlob } from './utils.js';

/**
 * Linear GraphQL API client.
 */
export class LinearClient {
  constructor(apiKey) {
    this._apiKey = apiKey;
  }

  async _graphql(query, variables = {}) {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this._apiKey,
      },
      body: JSON.stringify({ query, variables }),
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
    const data = await this._graphql(`
      query($projectId: String!) {
        project(id: $projectId) {
          projectMilestones { nodes { id name targetDate } }
        }
      }
    `, { projectId });
    return data.project?.projectMilestones?.nodes ?? [];
  }

  /** Upload a file and return its asset URL */
  async uploadFile(blob, filename) {
    const data = await this._graphql(
      `mutation($contentType: String!, $filename: String!, $size: Int!) {
        fileUpload(contentType: $contentType, filename: $filename, size: $size) {
          uploadFile {
            uploadUrl
            assetUrl
            headers { key value }
          }
        }
      }`,
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
      `mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier url }
        }
      }`,
      { input },
    );

    if (!data.issueCreate.success) throw new Error('Issue creation failed');
    return data.issueCreate.issue;
  }
}
