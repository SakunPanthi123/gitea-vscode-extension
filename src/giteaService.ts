import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface PullRequest {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    user: {
        login: string;
        avatar_url: string;
    };
    head: {
        ref: string;
    };
    base: {
        ref: string;
    };
    created_at: string;
    updated_at: string;
    html_url: string;
    mergeable: boolean;
}

export interface Issue {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    user: {
        login: string;
        avatar_url: string;
    };
    labels: Array<{
        name: string;
        color: string;
    }>;
    created_at: string;
    updated_at: string;
    html_url: string;
}

export interface TimelineEvent {
    id: number;
    type: string;
    html_url: string;
    pull_request_url: string;
    issue_url: string;
    user: {
        id: number;
        login: string;
        login_name: string;
        full_name: string;
        email: string;
        avatar_url: string;
        html_url: string;
        username: string;
    };
    body: string;
    created_at: string;
    updated_at: string;
    old_project_id: number;
    project_id: number;
    old_milestone: any;
    milestone: any;
    tracked_time: any;
    old_title: string;
    new_title: string;
    old_ref: string;
    new_ref: string;
    ref_issue: any;
    ref_comment: any;
    ref_action: string;
    ref_commit_sha: string;
    review_id: number;
    label: {
        id: number;
        name: string;
        exclusive: boolean;
        is_archived: boolean;
        color: string;
        description: string;
        url: string;
    } | null;
    assignee: any;
    assignee_team: any;
    removed_assignee: boolean;
    resolve_doer: any;
    dependent_issue: any;
}

export class GiteaService {
    private client: AxiosInstance;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('gitea');
        this.client = this.createClient();
    }

    private createClient(): AxiosInstance {
        const instanceURL = this.config.get<string>('instanceURL');
        const token = this.config.get<string>('token');

        if (!instanceURL) {
            throw new Error('Gitea instance URL not configured');
        }

        if (!token) {
            throw new Error('Gitea token not configured');
        }

        return axios.create({
            baseURL: `${instanceURL}/api/v1`,
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    private getRepoPath(): string {
        const owner = this.config.get<string>('owner');
        const repo = this.config.get<string>('repo');

        if (!owner || !repo) {
            throw new Error('Repository owner or name not configured');
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
            const response = await this.client.get(`/${this.getRepoPath()}/pulls/${index}`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch pull request: ${error.message}`);
        }
    }

    async getIssues(): Promise<Issue[]> {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch issues: ${error.message}`);
        }
    }

    async getIssue(index: number): Promise<Issue> {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues/${index}`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch issue: ${error.message}`);
        }
    }

    async getPullRequestCommits(index: number): Promise<any[]> {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/pulls/${index}/commits`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch pull request commits: ${error.message}`);
        }
    }

    async getPullRequestFiles(index: number): Promise<any[]> {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/pulls/${index}/files`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch pull request files: ${error.message}`);
        }
    }

    async getIssueTimeline(index: number): Promise<TimelineEvent[]> {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues/${index}/timeline`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch issue timeline: ${error.message}`);
        }
    }

    async getPullRequestTimeline(index: number): Promise<TimelineEvent[]> {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues/${index}/timeline`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch pull request timeline: ${error.message}`);
        }
    }
}
