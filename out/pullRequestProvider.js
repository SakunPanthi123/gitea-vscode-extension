"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PullRequestProvider = void 0;
const vscode = require("vscode");
class PullRequestProvider {
    constructor(giteaService) {
        this.giteaService = giteaService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.pullRequests = [];
        this.loadPullRequests();
    }
    refresh() {
        this.loadPullRequests();
        this._onDidChangeTreeData.fire();
    }
    async loadPullRequests() {
        try {
            this.pullRequests = await this.giteaService.getPullRequests();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to load pull requests: ${error}`);
            this.pullRequests = [];
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.pullRequests.map(pr => new PullRequestItem(pr)));
        }
        return Promise.resolve([]);
    }
}
exports.PullRequestProvider = PullRequestProvider;
class PullRequestItem extends vscode.TreeItem {
    constructor(pullRequest) {
        super(`#${pullRequest.number}: ${pullRequest.title}`, vscode.TreeItemCollapsibleState.None);
        this.pullRequest = pullRequest;
        this.description = `by ${pullRequest.user.login}`;
        this.tooltip = this.createTooltip();
        this.contextValue = 'pullrequest';
        // Set icon based on state
        this.iconPath = pullRequest.state === 'open'
            ? new vscode.ThemeIcon('git-pull-request', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'))
            : new vscode.ThemeIcon('git-pull-request', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
        // Command to show PR details
        this.command = {
            command: 'gitea.showPullRequestDetails',
            title: 'Show Pull Request Details',
            arguments: [pullRequest]
        };
    }
    createTooltip() {
        const pr = this.pullRequest;
        return `Pull Request #${pr.number}
Title: ${pr.title}
Author: ${pr.user.login}
State: ${pr.state}
Branch: ${pr.head.ref} → ${pr.base.ref}
Created: ${new Date(pr.created_at).toLocaleDateString()}
Updated: ${new Date(pr.updated_at).toLocaleDateString()}`;
    }
}
//# sourceMappingURL=pullRequestProvider.js.map