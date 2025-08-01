// Shared types for the webview-ui components

export interface User {
  id: number;
  login: string;
  login_name: string;
  full_name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  username: string;
}

export interface Label {
  id: number;
  name: string;
  exclusive: boolean;
  is_archived: boolean;
  color: string;
  description: string;
  url: string;
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
  assignee?: User;
  assignees: User[];
  created_at: string;
  updated_at: string;
  html_url: string;
}

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

export interface RefIssue {
  id: number;
  url: string;
  html_url: string;
  number: number;
  user: User;
  original_author: string;
  original_author_id: number;
  title: string;
  body: string;
  ref: string;
  assets: any[];
  labels: Label[];
  milestone: any;
  assignee: User | null;
  assignees: User[] | null;
  state: string;
  is_locked: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  due_date: string | null;
  pull_request?: {
    merged: boolean;
    merged_at: string | null;
    draft: boolean;
    html_url: string;
  };
  repository: {
    id: number;
    name: string;
    owner: string;
    full_name: string;
  };
  pin_order: number;
}

export interface RefComment {
  id: number;
  html_url: string;
  pull_request_url: string;
  issue_url: string;
  user: User;
  original_author: string;
  original_author_id: number;
  body: string;
  assets: any[];
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: number;
  type: string;
  html_url: string;
  pull_request_url: string;
  issue_url: string;
  user: User;
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
  ref_issue: RefIssue | null;
  ref_comment: RefComment | null;
  ref_action: string;
  ref_commit_sha: string;
  review_id: number;
  label: Label | null;
  assignee: any;
  assignee_team: any;
  removed_assignee: boolean;
  resolve_doer: any;
  dependent_issue: any;
}

export interface CommitFile {
  filename: string;
  status: string;
}

export interface CommitStats {
  total: number;
  additions: number;
  deletions: number;
}

export interface CommitDetails {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: User;
  committer: User;
  files: CommitFile[];
  stats: CommitStats;
  html_url: string;
}

export interface Comment {
  id: number;
  html_url: string;
  pull_request_url: string;
  issue_url: string;
  user: User;
  original_author: string;
  original_author_id: number;
  body: string;
  assets: any[];
  created_at: string;
  updated_at: string;
}

export interface CommentCreateRequest {
  body: string;
}

export interface CommentEditRequest {
  body: string;
}

export interface IssueStateChangeRequest {
  state: "open" | "closed";
}

export interface PullRequestStateChangeRequest {
  state: "open" | "closed";
}

export interface LabelRequest {
  labels: (number | string)[];
}

export interface AssigneeRequest {
  assignees: string[];
}

export interface CreateIssueRequest {
  title: string;
  body?: string;
  assignees?: string[];
  labels?: number[];
  milestone?: number;
  closed?: boolean;
  due_date?: string;
}

export interface EditIssueRequest {
  title?: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  milestone?: number;
  state?: string;
  due_date?: string;
  unset_due_date?: boolean;
  ref?: string;
}

export interface EditPullRequestRequest {
  title?: string;
  body?: string;
  assignee?: string;
  assignees?: string[];
  base?: string;
  labels?: number[];
  milestone?: number;
  state?: string;
  due_date?: string;
  unset_due_date?: boolean;
  allow_maintainer_edit?: boolean;
}

export interface MarkdownRenderRequest {
  Text: string;
  Mode?: string;
  Context?: string;
  Wiki?: boolean;
}

export interface MarkdownRenderResponse {
  html: string;
}
