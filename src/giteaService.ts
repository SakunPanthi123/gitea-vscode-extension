import * as vscode from "vscode";
import axios, { AxiosInstance } from "axios";
import {
  CommitDetails,
  Issue,
  PullRequest,
  TimelineEvent,
  // @ts-ignore
} from "../types/_types";

export class GiteaService {
  private client: AxiosInstance;
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration("gitea");
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    const instanceURL = this.config.get<string>("instanceURL");
    const token = this.config.get<string>("token");

    if (!instanceURL) {
      throw new Error("Gitea instance URL not configured");
    }

    if (!token) {
      throw new Error("Gitea token not configured");
    }

    return axios.create({
      baseURL: `${instanceURL}/api/v1`,
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  private getRepoPath(): string {
    const owner = this.config.get<string>("owner");
    const repo = this.config.get<string>("repo");

    if (!owner || !repo) {
      throw new Error("Repository owner or name not configured");
    }

    return `repos/${owner}/${repo}`;
  }

  async getPullRequests(): Promise<PullRequest[]> {
    try {
      const response = await this.client.get(`/${this.getRepoPath()}/pulls`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  async getPullRequest(index: number): Promise<PullRequest> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/pulls/${index}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch pull request: ${error.message}`);
    }
  }

  async getIssues(): Promise<Issue[]> {
    try {
      // Filter out pull requests by using type=issues query parameter.
      // what a brilliant foresight by copilot. it actually filters out pull requests.
      // This is necessary because Gitea's issues API returns both issues and pull requests.
      const response = await this.client.get(
        `/${this.getRepoPath()}/issues?type=issues`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  }

  async getIssue(index: number): Promise<Issue> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/issues/${index}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch issue: ${error.message}`);
    }
  }

  async getPullRequestCommits(index: number): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/pulls/${index}/commits`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch pull request commits: ${error.message}`);
    }
  }

  async getPullRequestFiles(index: number): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/pulls/${index}/files`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch pull request files: ${error.message}`);
    }
  }

  async getIssueTimeline(index: number): Promise<TimelineEvent[]> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/issues/${index}/timeline`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch issue timeline: ${error.message}`);
    }
  }

  async getPullRequestTimeline(index: number): Promise<TimelineEvent[]> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/issues/${index}/timeline`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch pull request timeline: ${error.message}`
      );
    }
  }

  async getCommitDetails(commitSha: string): Promise<CommitDetails> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/git/commits/${commitSha}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch commit details: ${error.message}`);
    }
  }
}
