import * as vscode from "vscode";
import axios, { AxiosInstance } from "axios";
import { transformReactionsToSummary } from "./reactionUtils";
import {
  CommitDetails,
  Issue,
  PullRequest,
  TimelineEvent,
  Comment,
  CommentCreateRequest,
  CommentEditRequest,
  IssueStateChangeRequest,
  PullRequestStateChangeRequest,
  Label,
  LabelRequest,
  User,
  AssigneeRequest,
  CreateIssueRequest,
  EditIssueRequest,
  EditPullRequestRequest,
  MarkdownRenderRequest,
  MarkdownRenderResponse,
  Reaction,
  ReactionSummary,
  EditReactionOption,
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
      const pullRequest: PullRequest = response.data;

      // Fetch reactions for the pull request
      try {
        const reactions = await this.getIssueReactions(index);
        const currentUser = await this.getCurrentUser();
        pullRequest.reactions = transformReactionsToSummary(
          reactions,
          currentUser
        );
      } catch (error) {
        // If fetching reactions fails, just continue without them
        pullRequest.reactions = [];
      }

      return pullRequest;
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
      const issue: Issue = response.data;

      // Fetch reactions for the issue
      try {
        const reactions = await this.getIssueReactions(index);
        const currentUser = await this.getCurrentUser();
        issue.reactions = transformReactionsToSummary(reactions, currentUser);
      } catch (error) {
        // If fetching reactions fails, just continue without them
        issue.reactions = [];
      }

      return issue;
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
      const timeline: TimelineEvent[] = response.data;

      // Fetch reactions for comment events
      const enrichedTimeline = await Promise.all(
        timeline.map(async (event) => {
          if (event.type === "comment" && event.id) {
            try {
              const reactions = await this.getCommentReactions(event.id);
              const currentUser = await this.getCurrentUser();
              event.reactions = transformReactionsToSummary(
                reactions,
                currentUser
              );
            } catch (error) {
              // If fetching reactions fails, just continue without them
              event.reactions = [];
            }
          }
          return event;
        })
      );

      return enrichedTimeline;
    } catch (error: any) {
      throw new Error(`Failed to fetch issue timeline: ${error.message}`);
    }
  }

  async getPullRequestTimeline(index: number): Promise<TimelineEvent[]> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/issues/${index}/timeline`
      );
      const timeline: TimelineEvent[] = response.data;

      // Fetch reactions for comment events
      const enrichedTimeline = await Promise.all(
        timeline.map(async (event) => {
          if (event.type === "comment" && event.id) {
            try {
              const reactions = await this.getCommentReactions(event.id);
              const currentUser = await this.getCurrentUser();
              event.reactions = transformReactionsToSummary(
                reactions,
                currentUser
              );
            } catch (error) {
              // If fetching reactions fails, just continue without them
              event.reactions = [];
            }
          }
          return event;
        })
      );

      return enrichedTimeline;
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

  async addComment(
    issueNumber: number,
    comment: CommentCreateRequest
  ): Promise<Comment> {
    try {
      const response = await this.client.post(
        `/${this.getRepoPath()}/issues/${issueNumber}/comments`,
        comment
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    try {
      await this.client.delete(
        `/${this.getRepoPath()}/issues/comments/${commentId}`
      );
    } catch (error: any) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  async editComment(
    commentId: number,
    comment: CommentEditRequest
  ): Promise<Comment> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/issues/comments/${commentId}`,
        comment
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to edit comment: ${error.message}`);
    }
  }

  async closeIssue(issueNumber: number): Promise<Issue> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/issues/${issueNumber}`,
        { state: "closed" } as IssueStateChangeRequest
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to close issue: ${error.message}`);
    }
  }

  async reopenIssue(issueNumber: number): Promise<Issue> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/issues/${issueNumber}`,
        { state: "open" } as IssueStateChangeRequest
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to reopen issue: ${error.message}`);
    }
  }

  async closePullRequest(pullRequestNumber: number): Promise<PullRequest> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/pulls/${pullRequestNumber}`,
        { state: "closed" } as PullRequestStateChangeRequest
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to close pull request: ${error.message}`);
    }
  }

  async reopenPullRequest(pullRequestNumber: number): Promise<PullRequest> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/pulls/${pullRequestNumber}`,
        { state: "open" } as PullRequestStateChangeRequest
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to reopen pull request: ${error.message}`);
    }
  }

  async getRepositoryLabels(): Promise<Label[]> {
    try {
      const response = await this.client.get(`/${this.getRepoPath()}/labels`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository labels: ${error.message}`);
    }
  }

  async addLabelsToIssue(
    issueNumber: number,
    labels: LabelRequest
  ): Promise<Label[]> {
    try {
      const response = await this.client.post(
        `/${this.getRepoPath()}/issues/${issueNumber}/labels`,
        labels
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add labels to issue: ${error.message}`);
    }
  }

  async removeLabelFromIssue(
    issueNumber: number,
    labelId: number
  ): Promise<void> {
    try {
      await this.client.delete(
        `/${this.getRepoPath()}/issues/${issueNumber}/labels/${labelId}`
      );
    } catch (error: any) {
      throw new Error(`Failed to remove label from issue: ${error.message}`);
    }
  }

  async replaceIssueLabels(
    issueNumber: number,
    labels: LabelRequest
  ): Promise<Label[]> {
    try {
      const response = await this.client.put(
        `/${this.getRepoPath()}/issues/${issueNumber}/labels`,
        labels
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to replace issue labels: ${error.message}`);
    }
  }

  async getRepositoryAssignees(): Promise<User[]> {
    try {
      const response = await this.client.get(
        `/${this.getRepoPath()}/assignees`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository assignees: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.client.get("/user");
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch current user: ${error.message}`);
    }
  }

  async updateIssueAssignees(
    issueNumber: number,
    assignees: AssigneeRequest
  ): Promise<Issue> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/issues/${issueNumber}`,
        assignees
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to update issue assignees: ${error.message}`);
    }
  }

  async createIssue(issueData: CreateIssueRequest): Promise<Issue> {
    try {
      const response = await this.client.post(
        `/${this.getRepoPath()}/issues`,
        issueData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  async editIssue(
    issueNumber: number,
    editData: EditIssueRequest
  ): Promise<Issue> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/issues/${issueNumber}`,
        editData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to edit issue: ${error.message}`);
    }
  }

  async editPullRequest(
    pullRequestNumber: number,
    editData: EditPullRequestRequest
  ): Promise<PullRequest> {
    try {
      const response = await this.client.patch(
        `/${this.getRepoPath()}/pulls/${pullRequestNumber}`,
        editData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to edit pull request: ${error.message}`);
    }
  }

  async renderMarkdown(markdownData: MarkdownRenderRequest): Promise<string> {
    try {
      const response = await this.client.post("/markdown", markdownData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to render markdown: ${error.message}`);
    }
  }

  // Reaction methods for issues
  async getIssueReactions(issueNumber: number): Promise<Reaction[]> {
    try {
      const owner = this.config.get<string>("owner");
      const repo = this.config.get<string>("repo");
      const response = await this.client.get(
        `/repos/${owner}/${repo}/issues/${issueNumber}/reactions`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get issue reactions: ${error.message}`);
    }
  }

  async addIssueReaction(
    issueNumber: number,
    reaction: string
  ): Promise<Reaction> {
    try {
      const owner = this.config.get<string>("owner");
      const repo = this.config.get<string>("repo");
      const response = await this.client.post(
        `/repos/${owner}/${repo}/issues/${issueNumber}/reactions`,
        { content: reaction }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add issue reaction: ${error.message}`);
    }
  }

  async removeIssueReaction(
    issueNumber: number,
    reaction: string
  ): Promise<void> {
    try {
      const owner = this.config.get<string>("owner");
      const repo = this.config.get<string>("repo");
      await this.client.delete(
        `/repos/${owner}/${repo}/issues/${issueNumber}/reactions`,
        { data: { content: reaction } }
      );
    } catch (error: any) {
      throw new Error(`Failed to remove issue reaction: ${error.message}`);
    }
  }

  // Reaction methods for comments
  async getCommentReactions(commentId: number): Promise<Reaction[]> {
    try {
      const owner = this.config.get<string>("owner");
      const repo = this.config.get<string>("repo");
      const response = await this.client.get(
        `/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get comment reactions: ${error.message}`);
    }
  }

  async addCommentReaction(
    commentId: number,
    reaction: string
  ): Promise<Reaction> {
    try {
      const owner = this.config.get<string>("owner");
      const repo = this.config.get<string>("repo");
      const response = await this.client.post(
        `/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`,
        { content: reaction }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add comment reaction: ${error.message}`);
    }
  }

  async removeCommentReaction(
    commentId: number,
    reaction: string
  ): Promise<void> {
    try {
      const owner = this.config.get<string>("owner");
      const repo = this.config.get<string>("repo");
      await this.client.delete(
        `/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`,
        { data: { content: reaction } }
      );
    } catch (error: any) {
      throw new Error(`Failed to remove comment reaction: ${error.message}`);
    }
  }
}
