"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiteaService = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
class GiteaService {
    constructor() {
        this.config = vscode.workspace.getConfiguration('gitea');
        this.client = this.createClient();
    }
    createClient() {
        const instanceURL = this.config.get('instanceURL');
        const token = this.config.get('token');
        if (!instanceURL) {
            throw new Error('Gitea instance URL not configured');
        }
        if (!token) {
            throw new Error('Gitea token not configured');
        }
        return axios_1.default.create({
            baseURL: `${instanceURL}/api/v1`,
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }
    getRepoPath() {
        const owner = this.config.get('owner');
        const repo = this.config.get('repo');
        if (!owner || !repo) {
            throw new Error('Repository owner or name not configured');
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
            const response = await this.client.get(`/${this.getRepoPath()}/issues`);
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
}
exports.GiteaService = GiteaService;
//# sourceMappingURL=giteaService.js.map