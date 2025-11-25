/**
 * GitHub API Client
 * 
 * Simple wrapper for GitHub API interactions.
 */

/**
 * Pull request information.
 */
export interface PullRequest {
  readonly number: number;
  readonly title: string;
  readonly head: {
    readonly sha: string;
    readonly ref: string;
  };
  readonly base: {
    readonly sha: string;
    readonly ref: string;
  };
}

/**
 * Commit status state.
 */
export type StatusState = 'pending' | 'success' | 'failure' | 'error';

/**
 * Simple GitHub API client.
 */
export class GitHubClient {
  private readonly token: string;
  private readonly owner: string;
  private readonly repo: string;
  private readonly baseUrl = 'https://api.github.com';

  /**
   * Creates a new GitHub client.
   */
  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Gets pull request information.
   */
  async getPullRequest(prNumber: number): Promise<PullRequest> {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls/${prNumber}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get PR: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Updates commit status.
   */
  async updateStatus(
    sha: string,
    state: StatusState,
    description: string,
    context: string = 'ci/quality-check'
  ): Promise<void> {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/statuses/${sha}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        state,
        description,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.statusText}`);
    }
  }

  /**
   * Posts a comment on a pull request.
   */
  async postComment(prNumber: number, body: string): Promise<void> {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${prNumber}/comments`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      throw new Error(`Failed to post comment: ${response.statusText}`);
    }
  }

  /**
   * Gets request headers with authentication.
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }
}
