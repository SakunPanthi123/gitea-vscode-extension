import * as vscode from 'vscode';
import { GiteaService, PullRequest } from './giteaService';

export class PullRequestProvider implements vscode.TreeDataProvider<PullRequestItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PullRequestItem | undefined | null | void> = new vscode.EventEmitter<PullRequestItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PullRequestItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private pullRequests: PullRequest[] = [];

    constructor(private giteaService: GiteaService) {
        this.loadPullRequests();
    }

    refresh(): void {
        this.loadPullRequests();
        this._onDidChangeTreeData.fire();
    }

    private async loadPullRequests(): Promise<void> {
        try {
            this.pullRequests = await this.giteaService.getPullRequests();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load pull requests: ${error}`);
            this.pullRequests = [];
        }
    }

    getTreeItem(element: PullRequestItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PullRequestItem): Thenable<PullRequestItem[]> {
        if (!element) {
            return Promise.resolve(this.pullRequests.map(pr => new PullRequestItem(pr)));
        }
        return Promise.resolve([]);
    }
}

class PullRequestItem extends vscode.TreeItem {
    constructor(public readonly pullRequest: PullRequest) {
        super(`#${pullRequest.number}: ${pullRequest.title}`, vscode.TreeItemCollapsibleState.None);
        
        this.description = `by ${pullRequest.user.login}`;
        this.tooltip = this.createTooltip();
        this.contextValue = 'pullrequest';
        
        // Set icon based on state
        this.iconPath = pullRequest.state === 'open' 
            ? new vscode.ThemeIcon('git-pull-request', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'))
            : new vscode.ThemeIcon('git-pull-request', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
        
        // Make the item clickable
        this.command = {
            command: 'gitea.showPullRequestDetails',
            title: 'Show Pull Request Details',
            arguments: [pullRequest]
        };
    }

    private createTooltip(): string {
        const pr = this.pullRequest;
        return `#${pr.number}: ${pr.title}\n\nAuthor: ${pr.user.login}\nState: ${pr.state}\nCreated: ${new Date(pr.created_at).toLocaleString()}\nUpdated: ${new Date(pr.updated_at).toLocaleString()}\n\n${pr.body || 'No description'}`;
    }
}
