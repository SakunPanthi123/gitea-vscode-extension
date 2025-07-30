"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiteaService = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
class GiteaService {
    client;
    config;
    constructor() {
        this.config = vscode.workspace.getConfiguration("gitea");
        this.client = this.createClient();
    }
    createClient() {
        const instanceURL = this.config.get("instanceURL");
        const token = this.config.get("token");
        if (!instanceURL) {
            throw new Error("Gitea instance URL not configured");
        }
        if (!token) {
            throw new Error("Gitea token not configured");
        }
        return axios_1.default.create({
            baseURL: `${instanceURL}/api/v1`,
            headers: {
                Authorization: `token ${token}`,
                "Content-Type": "application/json",
            },
        });
    }
    getRepoPath() {
        const owner = this.config.get("owner");
        const repo = this.config.get("repo");
        if (!owner || !repo) {
            throw new Error("Repository owner or name not configured");
        }
        return `repos/${owner}/${repo}`;
    }
    async getPullRequests() {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/pulls`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch pull requests: ${error.message}`);
        }
    }
    async getPullRequest(index) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/pulls/${index}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch pull request: ${error.message}`);
        }
    }
    async getIssues() {
        try {
            // Filter out pull requests by using type=issues query parameter.
            // what a brilliant foresight by copilot. it actually filters out pull requests.
            // This is necessary because Gitea's issues API returns both issues and pull requests.
            const response = await this.client.get(`/${this.getRepoPath()}/issues?type=issues`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch issues: ${error.message}`);
        }
    }
    async getIssue(index) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues/${index}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch issue: ${error.message}`);
        }
    }
    async getPullRequestCommits(index) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/pulls/${index}/commits`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch pull request commits: ${error.message}`);
        }
    }
    async getPullRequestFiles(index) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/pulls/${index}/files`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch pull request files: ${error.message}`);
        }
    }
    async getIssueTimeline(index) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues/${index}/timeline`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch issue timeline: ${error.message}`);
        }
    }
    async getPullRequestTimeline(index) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/issues/${index}/timeline`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch pull request timeline: ${error.message}`);
        }
    }
    async getCommitDetails(commitSha) {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/git/commits/${commitSha}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch commit details: ${error.message}`);
        }
    }
    async addComment(issueNumber, comment) {
        try {
            const response = await this.client.post(`/${this.getRepoPath()}/issues/${issueNumber}/comments`, comment);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to add comment: ${error.message}`);
        }
    }
    async deleteComment(commentId) {
        try {
            await this.client.delete(`/${this.getRepoPath()}/issues/comments/${commentId}`);
        }
        catch (error) {
            throw new Error(`Failed to delete comment: ${error.message}`);
        }
    }
    async editComment(commentId, comment) {
        try {
            const response = await this.client.patch(`/${this.getRepoPath()}/issues/comments/${commentId}`, comment);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to edit comment: ${error.message}`);
        }
    }
    async closeIssue(issueNumber) {
        try {
            const response = await this.client.patch(`/${this.getRepoPath()}/issues/${issueNumber}`, { state: "closed" });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to close issue: ${error.message}`);
        }
    }
    async reopenIssue(issueNumber) {
        try {
            const response = await this.client.patch(`/${this.getRepoPath()}/issues/${issueNumber}`, { state: "open" });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to reopen issue: ${error.message}`);
        }
    }
    async closePullRequest(pullRequestNumber) {
        try {
            const response = await this.client.patch(`/${this.getRepoPath()}/pulls/${pullRequestNumber}`, { state: "closed" });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to close pull request: ${error.message}`);
        }
    }
    async reopenPullRequest(pullRequestNumber) {
        try {
            const response = await this.client.patch(`/${this.getRepoPath()}/pulls/${pullRequestNumber}`, { state: "open" });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to reopen pull request: ${error.message}`);
        }
    }
    async getRepositoryLabels() {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/labels`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch repository labels: ${error.message}`);
        }
    }
    async addLabelsToIssue(issueNumber, labels) {
        try {
            const response = await this.client.post(`/${this.getRepoPath()}/issues/${issueNumber}/labels`, labels);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to add labels to issue: ${error.message}`);
        }
    }
    async removeLabelFromIssue(issueNumber, labelId) {
        try {
            await this.client.delete(`/${this.getRepoPath()}/issues/${issueNumber}/labels/${labelId}`);
        }
        catch (error) {
            throw new Error(`Failed to remove label from issue: ${error.message}`);
        }
    }
    async replaceIssueLabels(issueNumber, labels) {
        try {
            const response = await this.client.put(`/${this.getRepoPath()}/issues/${issueNumber}/labels`, labels);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to replace issue labels: ${error.message}`);
        }
    }
    async getRepositoryAssignees() {
        try {
            const response = await this.client.get(`/${this.getRepoPath()}/assignees`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch repository assignees: ${error.message}`);
        }
    }
    async updateIssueAssignees(issueNumber, assignees) {
        try {
            const response = await this.client.patch(`/${this.getRepoPath()}/issues/${issueNumber}`, assignees);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to update issue assignees: ${error.message}`);
        }
    }
}
exports.GiteaService = GiteaService;
//# sourceMappingURL=giteaService.js.map