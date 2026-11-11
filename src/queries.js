// The GraphQL documents linear-capture sends, verbatim. A backend proxy
// (apiProxyUrl) can import this list and forward only exact matches:
//   import { ALLOWED_QUERIES } from '@stfrigerio/linear-capture/queries';
// Browser-free, so it loads in Node.

export const MILESTONES_QUERY = `
      query($projectId: String!) {
        project(id: $projectId) {
          projectMilestones { nodes { id name targetDate } }
        }
      }
    `;

export const FILE_UPLOAD_MUTATION = `mutation($contentType: String!, $filename: String!, $size: Int!) {
        fileUpload(contentType: $contentType, filename: $filename, size: $size) {
          uploadFile {
            uploadUrl
            assetUrl
            headers { key value }
          }
        }
      }`;

export const ISSUE_CREATE_MUTATION = `mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier url }
        }
      }`;

export const ALLOWED_QUERIES = [MILESTONES_QUERY, FILE_UPLOAD_MUTATION, ISSUE_CREATE_MUTATION];
