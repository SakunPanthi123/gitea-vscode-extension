import * as vscode from 'vscode';
import { GiteaService } from './giteaService';
import { PullRequestProvider } from './pullRequestProvider';
import { IssueProvider } from './issueProvider';
import { ReactWebviewProvider } from './reactWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Gitea Integration (React) extension is now active!');

    const giteaService = new GiteaService();
    
    // Create providers
    const pullRequestProvider = new PullRequestProvider(giteaService);
    const issueProvider = new IssueProvider(giteaService);
    const reactWebviewProvider = new ReactWebviewProvider(context.extensionUri, giteaService);

    // Register tree data providers
    vscode.window.createTreeView('giteaPullRequests', {
        treeDataProvider: pullRequestProvider,
        showCollapseAll: true
    });

    vscode.window.createTreeView('giteaIssues', {
        treeDataProvider: issueProvider,
        showCollapseAll: true
    });

    // Set context to show views
    vscode.commands.executeCommand('setContext', 'giteaPullRequestsVisible', true);
    vscode.commands.executeCommand('setContext', 'giteaIssuesVisible', true);

    // Register commands
    const viewPullRequestsCommand = vscode.commands.registerCommand('gitea.viewPullRequests', async () => {
        await reactWebviewProvider.showPullRequestsList();
    });

    const viewIssuesCommand = vscode.commands.registerCommand('gitea.viewIssues', async () => {
        await reactWebviewProvider.showIssuesList();
    });

    const refreshPullRequestsCommand = vscode.commands.registerCommand('gitea.refreshPullRequests', async () => {
        try {
            pullRequestProvider.refresh();
            vscode.window.showInformationMessage('Pull requests refreshed successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh pull requests: ${error}`);
        }
    });

    const refreshIssuesCommand = vscode.commands.registerCommand('gitea.refreshIssues', async () => {
        try {
            issueProvider.refresh();
            vscode.window.showInformationMessage('Issues refreshed successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh issues: ${error}`);
        }
    });

    const showPullRequestDetailsCommand = vscode.commands.registerCommand('gitea.showPullRequestDetails', async (pullRequest: any) => {
        await reactWebviewProvider.showPullRequestDetails(pullRequest);
    });

    const showIssueDetailsCommand = vscode.commands.registerCommand('gitea.showIssueDetails', async (issue: any) => {
        await reactWebviewProvider.showIssueDetails(issue);
    });

    const listAllPullRequestsCommand = vscode.commands.registerCommand('gitea.listAllPullRequests', async () => {
        await reactWebviewProvider.showPullRequestsList();
    });

    const listAllIssuesCommand = vscode.commands.registerCommand('gitea.listAllIssues', async () => {
        await reactWebviewProvider.showIssuesList();
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
        viewPullRequestsCommand,
        viewIssuesCommand,
        refreshPullRequestsCommand,
        refreshIssuesCommand,
        showPullRequestDetailsCommand,
        showIssueDetailsCommand,
        listAllPullRequestsCommand,
        listAllIssuesCommand
    );
}

export function deactivate() {}
