import * as vscode from 'vscode';
import { GiteaService, Issue } from './giteaService';

export class IssueProvider implements vscode.TreeDataProvider<IssueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private issues: Issue[] = [];

    constructor(private giteaService: GiteaService) {
        this.loadIssues();
    }

    refresh(): void {
        this.loadIssues();
        this._onDidChangeTreeData.fire();
    }

    private async loadIssues(): Promise<void> {
        try {
            this.issues = await this.giteaService.getIssues();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load issues: ${error}`);
            this.issues = [];
        }
    }

    getTreeItem(element: IssueItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: IssueItem): Thenable<IssueItem[]> {
        if (!element) {
            return Promise.resolve(this.issues.map(issue => new IssueItem(issue)));
        }
        return Promise.resolve([]);
    }
}

class IssueItem extends vscode.TreeItem {
    constructor(public readonly issue: Issue) {
        super(`#${issue.number}: ${issue.title}`, vscode.TreeItemCollapsibleState.None);
        
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

    private createTooltip(): string {
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
