"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueProvider = void 0;
const vscode = require("vscode");
class IssueProvider {
    constructor(giteaService) {
        this.giteaService = giteaService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.issues = [];
        this.loadIssues();
    }
    refresh() {
        this.loadIssues();
        this._onDidChangeTreeData.fire();
    }
    async loadIssues() {
        try {
            this.issues = await this.giteaService.getIssues();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to load issues: ${error}`);
            this.issues = [];
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.issues.map(issue => new IssueItem(issue)));
        }
        return Promise.resolve([]);
    }
}
exports.IssueProvider = IssueProvider;
class IssueItem extends vscode.TreeItem {
    constructor(issue) {
        super(`#${issue.number}: ${issue.title}`, vscode.TreeItemCollapsibleState.None);
        this.issue = issue;
        this.description = `by ${issue.user.login}`;
        this.tooltip = this.createTooltip();
        this.contextValue = 'issue';
        // Set icon based on state
        this.iconPath = issue.state === 'open'
            ? new vscode.ThemeIcon('issues', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'))
            : new vscode.ThemeIcon('issue-closed', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
        // Command to show issue details
        this.command = {
            command: 'gitea.showIssueDetails',
            title: 'Show Issue Details',
            arguments: [issue]
        };
    }
    createTooltip() {
        const issue = this.issue;
        const labels = issue.labels ? issue.labels.map(l => l.name).join(', ') : 'None';
        return `Issue #${issue.number}
Title: ${issue.title}
Author: ${issue.user.login}
State: ${issue.state}
Labels: ${labels}
Created: ${new Date(issue.created_at).toLocaleDateString()}
Updated: ${new Date(issue.updated_at).toLocaleDateString()}`;
    }
}
//# sourceMappingURL=issueProvider.js.map