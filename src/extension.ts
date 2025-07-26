import * as vscode from 'vscode';
import { GiteaService } from './giteaService';
import { PullRequestProvider } from './pullRequestProvider';
import { IssueProvider } from './issueProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Gitea Integration extension is now active!');

    const giteaService = new GiteaService();
    
    // Create providers
    const pullRequestProvider = new PullRequestProvider(giteaService);
    const issueProvider = new IssueProvider(giteaService);

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
        try {
            const pullRequests = await giteaService.getPullRequests();
            await showPullRequestsInMarkdown(pullRequests);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch pull requests: ${error}`);
        }
    });

    const viewIssuesCommand = vscode.commands.registerCommand('gitea.viewIssues', async () => {
        try {
            const issues = await giteaService.getIssues();
            await showIssuesInMarkdown(issues);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch issues: ${error}`);
        }
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
        await showPullRequestDetailsWebview(pullRequest, giteaService);
    });

    const showIssueDetailsCommand = vscode.commands.registerCommand('gitea.showIssueDetails', async (issue: any) => {
        await showIssueDetailsWebview(issue, giteaService);
    });

    const openPullRequestsWebviewCommand = vscode.commands.registerCommand('gitea.openPullRequestsWebview', async () => {
        try {
            const pullRequests = await giteaService.getPullRequests();
            const panel = vscode.window.createWebviewPanel(
                'giteaPullRequests',
                'Gitea Pull Requests',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = generatePullRequestsWebviewHtml(pullRequests);

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.type) {
                    case 'openPR':
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        break;
                    case 'refresh':
                        const newPRs = await giteaService.getPullRequests();
                        panel.webview.html = generatePullRequestsWebviewHtml(newPRs);
                        break;
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load pull requests: ${error}`);
        }
    });

    const openIssuesWebviewCommand = vscode.commands.registerCommand('gitea.openIssuesWebview', async () => {
        try {
            const issues = await giteaService.getIssues();
            const panel = vscode.window.createWebviewPanel(
                'giteaIssues',
                'Gitea Issues',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = generateIssuesWebviewHtml(issues);

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.type) {
                    case 'openIssue':
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        break;
                    case 'refresh':
                        const newIssues = await giteaService.getIssues();
                        panel.webview.html = generateIssuesWebviewHtml(newIssues);
                        break;
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load issues: ${error}`);
        }
    });

    const createNewPullRequestCommand = vscode.commands.registerCommand('gitea.createNewPullRequest', () => {
        vscode.window.showInformationMessage('Create New Pull Request - Feature coming soon!');
    });

    const createNewIssueCommand = vscode.commands.registerCommand('gitea.createNewIssue', () => {
        vscode.window.showInformationMessage('Create New Issue - Feature coming soon!');
    });

    const listAllPullRequestsCommand = vscode.commands.registerCommand('gitea.listAllPullRequests', async () => {
        try {
            const pullRequests = await giteaService.getPullRequests();
            const panel = vscode.window.createWebviewPanel(
                'giteaAllPullRequests',
                'All Pull Requests',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = generateAllPullRequestsHtml(pullRequests);

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.type) {
                    case 'openPR':
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        break;
                    case 'viewDetails':
                        // Find the PR and show details
                        const pr = pullRequests.find(p => p.number === message.prNumber);
                        if (pr) {
                            await showPullRequestDetailsWebview(pr, giteaService);
                        }
                        break;
                    case 'refresh':
                        const newPRs = await giteaService.getPullRequests();
                        panel.webview.html = generateAllPullRequestsHtml(newPRs);
                        break;
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load pull requests: ${error}`);
        }
    });

    const listAllIssuesCommand = vscode.commands.registerCommand('gitea.listAllIssues', async () => {
        try {
            const issues = await giteaService.getIssues();
            const panel = vscode.window.createWebviewPanel(
                'giteaAllIssues',
                'All Issues',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = generateAllIssuesHtml(issues);

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.type) {
                    case 'openIssue':
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        break;
                    case 'viewDetails':
                        // Find the issue and show details
                        const issue = issues.find(i => i.number === message.issueNumber);
                        if (issue) {
                            await showIssueDetailsWebview(issue, giteaService);
                        }
                        break;
                    case 'refresh':
                        const newIssues = await giteaService.getIssues();
                        panel.webview.html = generateAllIssuesHtml(newIssues);
                        break;
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load issues: ${error}`);
        }
    });

    context.subscriptions.push(
        viewPullRequestsCommand,
        viewIssuesCommand,
        refreshPullRequestsCommand,
        refreshIssuesCommand,
        showPullRequestDetailsCommand,
        showIssueDetailsCommand,
        openPullRequestsWebviewCommand,
        openIssuesWebviewCommand,
        createNewPullRequestCommand,
        createNewIssueCommand,
        listAllPullRequestsCommand,
        listAllIssuesCommand
    );
}

async function showPullRequestsInMarkdown(pullRequests: any[]) {
    const markdown = generatePullRequestsMarkdown(pullRequests);
    const doc = await vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
}

async function showIssuesInMarkdown(issues: any[]) {
    const markdown = generateIssuesMarkdown(issues);
    const doc = await vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
}

async function showPullRequestDetailsInMarkdown(pullRequest: any) {
    const markdown = generateSinglePullRequestMarkdown(pullRequest);
    const doc = await vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
}

async function showIssueDetailsInMarkdown(issue: any) {
    const markdown = generateSingleIssueMarkdown(issue);
    const doc = await vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
}

function generatePullRequestsMarkdown(pullRequests: any[]): string {
    let markdown = '# Gitea Pull Requests\\n\\n';
    
    if (pullRequests.length === 0) {
        markdown += 'No pull requests found.\\n';
        return markdown;
    }

    pullRequests.forEach(pr => {
        const status = pr.mergeable ? '✅ Mergeable' : '❌ Not Mergeable';
        const state = pr.state === 'open' ? '🟢 Open' : '🔴 Closed';
        
        markdown += `## #${pr.number} - ${pr.title}\\n\\n`;
        markdown += `**State**: ${state} | **Status**: ${status}\\n\\n`;
        markdown += `**Author**: ${pr.user.login}\\n\\n`;
        markdown += `**Created**: ${new Date(pr.created_at).toLocaleDateString()}\\n\\n`;
        markdown += `**Updated**: ${new Date(pr.updated_at).toLocaleDateString()}\\n\\n`;
        
        if (pr.body) {
            markdown += `**Description**:\\n${pr.body}\\n\\n`;
        }
        
        markdown += `**Branch**: \`${pr.head.ref}\` → \`${pr.base.ref}\`\\n\\n`;
        markdown += `**URL**: [View PR](${pr.html_url})\\n\\n`;
        markdown += '---\\n\\n';
    });

    return markdown;
}

function generateIssuesMarkdown(issues: any[]): string {
    let markdown = '# Gitea Issues\\n\\n';
    
    if (issues.length === 0) {
        markdown += 'No issues found.\\n';
        return markdown;
    }

    issues.forEach(issue => {
        const state = issue.state === 'open' ? '🟢 Open' : '🔴 Closed';
        
        markdown += `## #${issue.number} - ${issue.title}\\n\\n`;
        markdown += `**State**: ${state}\\n\\n`;
        markdown += `**Author**: ${issue.user.login}\\n\\n`;
        markdown += `**Created**: ${new Date(issue.created_at).toLocaleDateString()}\\n\\n`;
        markdown += `**Updated**: ${new Date(issue.updated_at).toLocaleDateString()}\\n\\n`;
        
        if (issue.labels && issue.labels.length > 0) {
            const labels = issue.labels.map((label: any) => `\`${label.name}\``).join(', ');
            markdown += `**Labels**: ${labels}\\n\\n`;
        }
        
        if (issue.body) {
            markdown += `**Description**:\\n${issue.body}\\n\\n`;
        }
        
        markdown += `**URL**: [View Issue](${issue.html_url})\\n\\n`;
        markdown += '---\\n\\n';
    });

    return markdown;
}

function generateSinglePullRequestMarkdown(pr: any): string {
    const status = pr.mergeable ? '✅ Mergeable' : '❌ Not Mergeable';
    const state = pr.state === 'open' ? '🟢 Open' : '🔴 Closed';
    
    let markdown = `# Pull Request #${pr.number} - ${pr.title}\\n\\n`;
    markdown += `**State**: ${state} | **Status**: ${status}\\n\\n`;
    markdown += `**Author**: ${pr.user.login}\\n\\n`;
    markdown += `**Created**: ${new Date(pr.created_at).toLocaleDateString()}\\n\\n`;
    markdown += `**Updated**: ${new Date(pr.updated_at).toLocaleDateString()}\\n\\n`;
    markdown += `**Branch**: \`${pr.head.ref}\` → \`${pr.base.ref}\`\\n\\n`;
    
    if (pr.body) {
        markdown += `## Description\\n\\n${pr.body}\\n\\n`;
    }
    
    markdown += `## Links\\n\\n`;
    markdown += `- [View PR on Gitea](${pr.html_url})\\n`;
    markdown += `- [View Diff](${pr.html_url}/files)\\n`;
    markdown += `- [View Commits](${pr.html_url}/commits)\\n\\n`;

    return markdown;
}

function generateSingleIssueMarkdown(issue: any): string {
    const state = issue.state === 'open' ? '🟢 Open' : '🔴 Closed';
    
    let markdown = `# Issue #${issue.number} - ${issue.title}\\n\\n`;
    markdown += `**State**: ${state}\\n\\n`;
    markdown += `**Author**: ${issue.user.login}\\n\\n`;
    markdown += `**Created**: ${new Date(issue.created_at).toLocaleDateString()}\\n\\n`;
    markdown += `**Updated**: ${new Date(issue.updated_at).toLocaleDateString()}\\n\\n`;
    
    if (issue.labels && issue.labels.length > 0) {
        const labels = issue.labels.map((label: any) => `\`${label.name}\``).join(', ');
        markdown += `**Labels**: ${labels}\\n\\n`;
    }
    
    if (issue.body) {
        markdown += `## Description\\n\\n${issue.body}\\n\\n`;
    }
    
    markdown += `## Links\\n\\n`;
    markdown += `- [View Issue on Gitea](${issue.html_url})\\n\\n`;

    return markdown;
}

function generatePullRequestsWebviewHtml(pullRequests: any[]): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gitea Pull Requests</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    margin: 0;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                }
                .refresh-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .refresh-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .pr-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 20px;
                }
                .pr-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 16px;
                    background: var(--vscode-sideBar-background);
                    transition: all 0.2s ease;
                }
                .pr-card:hover {
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .pr-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0 0 12px 0;
                    color: var(--vscode-editor-foreground);
                }
                .pr-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 500;
                }
                .pr-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin: 12px 0;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }
                .pr-status {
                    display: flex;
                    gap: 8px;
                    margin: 12px 0;
                }
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-open { background: #1a7b34; color: white; }
                .status-closed { background: #cf222e; color: white; }
                .status-mergeable { background: #0969da; color: white; }
                .status-not-mergeable { background: #bc4c00; color: white; }
                .pr-branch {
                    font-family: monospace;
                    font-size: 12px;
                    background: var(--vscode-textCodeBlock-background);
                    padding: 4px 8px;
                    border-radius: 4px;
                    margin: 8px 0;
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }
                .pr-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 16px;
                }
                .action-btn {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-decoration: none;
                }
                .action-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .no-data {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔀 Pull Requests (${pullRequests.length})</h1>
                <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
            </div>
            
            ${pullRequests.length === 0 ? 
                '<div class="no-data">📭 No pull requests found</div>' :
                `<div class="pr-grid">
                    ${pullRequests.map(pr => `
                        <div class="pr-card">
                            <h3 class="pr-title">
                                <span class="pr-number">#${pr.number}</span> ${escapeHtml(pr.title)}
                            </h3>
                            
                            <div class="pr-meta">
                                <div>👤 ${escapeHtml(pr.user.login)}</div>
                                <div>📅 ${new Date(pr.created_at).toLocaleDateString()}</div>
                                <div>🔄 Updated ${new Date(pr.updated_at).toLocaleDateString()}</div>
                                <div>📊 ${pr.state}</div>
                            </div>
                            
                            <div class="pr-status">
                                <span class="status-badge ${pr.state === 'open' ? 'status-open' : 'status-closed'}">
                                    ${pr.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                                </span>
                                <span class="status-badge ${pr.mergeable ? 'status-mergeable' : 'status-not-mergeable'}">
                                    ${pr.mergeable ? '✅ Mergeable' : '❌ Not Mergeable'}
                                </span>
                            </div>
                            
                            <div class="pr-branch">
                                <strong>Branch:</strong> ${escapeHtml(pr.head.ref)} → ${escapeHtml(pr.base.ref)}
                            </div>
                            
                            <div class="pr-actions">
                                <button class="action-btn" onclick="openPR('${pr.html_url}')">
                                    🔗 Open in Gitea
                                </button>
                                <button class="action-btn" onclick="openPR('${pr.html_url}/files')">
                                    📄 View Files
                                </button>
                                <button class="action-btn" onclick="openPR('${pr.html_url}/commits')">
                                    📝 Commits
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
                
                function openPR(url) {
                    vscode.postMessage({ type: 'openPR', url: url });
                }
            </script>
        </body>
        </html>`;
}

function generateIssuesWebviewHtml(issues: any[]): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gitea Issues</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    margin: 0;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                }
                .refresh-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .refresh-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .issue-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 20px;
                }
                .issue-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 16px;
                    background: var(--vscode-sideBar-background);
                    transition: all 0.2s ease;
                }
                .issue-card:hover {
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .issue-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0 0 12px 0;
                    color: var(--vscode-editor-foreground);
                }
                .issue-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 500;
                }
                .issue-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin: 12px 0;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }
                .issue-status {
                    display: flex;
                    gap: 8px;
                    margin: 12px 0;
                }
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-open { background: #1a7b34; color: white; }
                .status-closed { background: #cf222e; color: white; }
                .labels {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin: 12px 0;
                }
                .label {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 12px;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                }
                .issue-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 16px;
                }
                .action-btn {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-decoration: none;
                }
                .action-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .no-data {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐛 Issues (${issues.length})</h1>
                <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
            </div>
            
            ${issues.length === 0 ? 
                '<div class="no-data">📭 No issues found</div>' :
                `<div class="issue-grid">
                    ${issues.map(issue => `
                        <div class="issue-card">
                            <h3 class="issue-title">
                                <span class="issue-number">#${issue.number}</span> ${escapeHtml(issue.title)}
                            </h3>
                            
                            <div class="issue-meta">
                                <div>👤 ${escapeHtml(issue.user.login)}</div>
                                <div>📅 ${new Date(issue.created_at).toLocaleDateString()}</div>
                                <div>🔄 Updated ${new Date(issue.updated_at).toLocaleDateString()}</div>
                                <div>📊 ${issue.state}</div>
                            </div>
                            
                            <div class="issue-status">
                                <span class="status-badge ${issue.state === 'open' ? 'status-open' : 'status-closed'}">
                                    ${issue.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                                </span>
                            </div>
                            
                            ${issue.labels && issue.labels.length > 0 ? `
                                <div class="labels">
                                    ${issue.labels.map((label: any) => `
                                        <span class="label" style="background: #${label.color}33; color: #${label.color};">
                                            ${escapeHtml(label.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="issue-actions">
                                <button class="action-btn" onclick="openIssue('${issue.html_url}')">
                                    🔗 Open in Gitea
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
                
                function openIssue(url) {
                    vscode.postMessage({ type: 'openIssue', url: url });
                }
            </script>
        </body>
        </html>`;
}

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function showPullRequestDetailsWebview(pullRequest: any, giteaService: any) {
    const panel = vscode.window.createWebviewPanel(
        'giteaPRDetails',
        `PR #${pullRequest.number}: ${pullRequest.title}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = generatePullRequestDetailsHtml(pullRequest);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
            case 'mergePR':
                vscode.window.showInformationMessage('Merge PR - Feature coming soon!');
                break;
            case 'addComment':
                vscode.window.showInformationMessage('Add Comment - Feature coming soon!');
                break;
            case 'openInGitea':
                vscode.env.openExternal(vscode.Uri.parse(message.url));
                break;
            case 'refresh':
                // In a real implementation, you'd fetch fresh PR data
                vscode.window.showInformationMessage('Refreshed!');
                break;
        }
    });
}

async function showIssueDetailsWebview(issue: any, giteaService: any) {
    const panel = vscode.window.createWebviewPanel(
        'giteaIssueDetails',
        `Issue #${issue.number}: ${issue.title}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = generateIssueDetailsHtml(issue);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
            case 'closeIssue':
                vscode.window.showInformationMessage('Close Issue - Feature coming soon!');
                break;
            case 'addComment':
                vscode.window.showInformationMessage('Add Comment - Feature coming soon!');
                break;
            case 'openInGitea':
                vscode.env.openExternal(vscode.Uri.parse(message.url));
                break;
            case 'refresh':
                // In a real implementation, you'd fetch fresh issue data
                vscode.window.showInformationMessage('Refreshed!');
                break;
        }
    });
}

function generatePullRequestDetailsHtml(pr: any): string {
    const statusColor = pr.state === 'open' ? '#1a7b34' : '#cf222e';
    const statusIcon = pr.state === 'open' ? '🟢' : '🔴';
    const mergeableColor = pr.mergeable ? '#0969da' : '#bc4c00';
    const mergeableIcon = pr.mergeable ? '✅' : '❌';

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pull Request #${pr.number}</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                    margin: 0;
                    line-height: 1.6;
                }
                .header {
                    background: var(--vscode-sideBar-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 20px;
                }
                .title {
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    color: var(--vscode-editor-foreground);
                }
                .pr-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 500;
                }
                .meta-row {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin: 10px 0;
                    flex-wrap: wrap;
                }
                .status-badge {
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .author-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                }
                .content {
                    padding: 20px;
                    max-width: 800px;
                }
                .section {
                    margin: 30px 0;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0 0 15px 0;
                    color: var(--vscode-editor-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                }
                .branch-info {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid var(--vscode-textLink-foreground);
                    margin: 15px 0;
                    font-family: monospace;
                }
                .description {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 20px;
                    border-radius: 6px;
                    border: 1px solid var(--vscode-panel-border);
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                    margin: 20px 0;
                    padding: 20px;
                    background: var(--vscode-sideBar-background);
                    border-radius: 6px;
                    flex-wrap: wrap;
                }
                .action-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-primary {
                    background: #1a7b34;
                    color: white;
                }
                .btn-primary:hover { background: #2ea043; }
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
                .btn-danger {
                    background: #cf222e;
                    color: white;
                }
                .btn-danger:hover { background: #da3633; }
                .comments-section {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 20px;
                }
                .comment-placeholder {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    padding: 40px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="title">
                    <span class="pr-number">#${pr.number}</span> ${escapeHtml(pr.title)}
                </h1>
                
                <div class="meta-row">
                    <span class="status-badge" style="background: ${statusColor}; color: white;">
                        ${statusIcon} ${pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}
                    </span>
                    <span class="status-badge" style="background: ${mergeableColor}; color: white;">
                        ${mergeableIcon} ${pr.mergeable ? 'Mergeable' : 'Not Mergeable'}
                    </span>
                </div>
                
                <div class="author-info">
                    👤 <strong>${escapeHtml(pr.user.login)}</strong> opened this pull request 
                    📅 ${new Date(pr.created_at).toLocaleDateString()} 
                    🔄 Updated ${new Date(pr.updated_at).toLocaleDateString()}
                </div>
            </div>

            <div class="content">
                <div class="section">
                    <h2 class="section-title">🌿 Branch Information</h2>
                    <div class="branch-info">
                        <strong>Merge:</strong> ${escapeHtml(pr.head.ref)} → ${escapeHtml(pr.base.ref)}
                    </div>
                </div>

                ${pr.body ? `
                    <div class="section">
                        <h2 class="section-title">📝 Description</h2>
                        <div class="description">${escapeHtml(pr.body)}</div>
                    </div>
                ` : ''}

                <div class="section">
                    <h2 class="section-title">🎯 Actions</h2>
                    <div class="actions">
                        ${pr.mergeable && pr.state === 'open' ? `
                            <button class="action-btn btn-primary" onclick="mergePR()">
                                🔀 Merge Pull Request
                            </button>
                        ` : ''}
                        <button class="action-btn btn-secondary" onclick="addComment()">
                            💬 Add Comment
                        </button>
                        <button class="action-btn btn-secondary" onclick="openInGitea('${pr.html_url}')">
                            🔗 Open in Gitea
                        </button>
                        <button class="action-btn btn-secondary" onclick="openInGitea('${pr.html_url}/files')">
                            📄 View Files
                        </button>
                        <button class="action-btn btn-secondary" onclick="openInGitea('${pr.html_url}/commits')">
                            📝 View Commits
                        </button>
                        <button class="action-btn btn-secondary" onclick="refresh()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">💬 Comments</h2>
                    <div class="comments-section">
                        <div class="comment-placeholder">
                            Comments will be displayed here in a future version
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function mergePR() {
                    vscode.postMessage({ type: 'mergePR' });
                }
                
                function addComment() {
                    vscode.postMessage({ type: 'addComment' });
                }
                
                function openInGitea(url) {
                    vscode.postMessage({ type: 'openInGitea', url: url });
                }
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
            </script>
        </body>
        </html>`;
}

function generateIssueDetailsHtml(issue: any): string {
    const statusColor = issue.state === 'open' ? '#1a7b34' : '#cf222e';
    const statusIcon = issue.state === 'open' ? '🟢' : '🔴';

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Issue #${issue.number}</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                    margin: 0;
                    line-height: 1.6;
                }
                .header {
                    background: var(--vscode-sideBar-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 20px;
                }
                .title {
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    color: var(--vscode-editor-foreground);
                }
                .issue-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 500;
                }
                .meta-row {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin: 10px 0;
                    flex-wrap: wrap;
                }
                .status-badge {
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .author-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                }
                .content {
                    padding: 20px;
                    max-width: 800px;
                }
                .section {
                    margin: 30px 0;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0 0 15px 0;
                    color: var(--vscode-editor-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                }
                .labels {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin: 15px 0;
                }
                .label {
                    font-size: 12px;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-weight: 500;
                }
                .description {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 20px;
                    border-radius: 6px;
                    border: 1px solid var(--vscode-panel-border);
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                    margin: 20px 0;
                    padding: 20px;
                    background: var(--vscode-sideBar-background);
                    border-radius: 6px;
                    flex-wrap: wrap;
                }
                .action-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-primary {
                    background: #1a7b34;
                    color: white;
                }
                .btn-primary:hover { background: #2ea043; }
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
                .btn-danger {
                    background: #cf222e;
                    color: white;
                }
                .btn-danger:hover { background: #da3633; }
                .comments-section {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 20px;
                }
                .comment-placeholder {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                    padding: 40px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="title">
                    <span class="issue-number">#${issue.number}</span> ${escapeHtml(issue.title)}
                </h1>
                
                <div class="meta-row">
                    <span class="status-badge" style="background: ${statusColor}; color: white;">
                        ${statusIcon} ${issue.state.charAt(0).toUpperCase() + issue.state.slice(1)}
                    </span>
                </div>
                
                <div class="author-info">
                    👤 <strong>${escapeHtml(issue.user.login)}</strong> opened this issue 
                    📅 ${new Date(issue.created_at).toLocaleDateString()} 
                    🔄 Updated ${new Date(issue.updated_at).toLocaleDateString()}
                </div>
            </div>

            <div class="content">
                ${issue.labels && issue.labels.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">🏷️ Labels</h2>
                        <div class="labels">
                            ${issue.labels.map((label: any) => `
                                <span class="label" style="background: #${label.color}33; color: #${label.color}; border: 1px solid #${label.color}55;">
                                    ${escapeHtml(label.name)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${issue.body ? `
                    <div class="section">
                        <h2 class="section-title">📝 Description</h2>
                        <div class="description">${escapeHtml(issue.body)}</div>
                    </div>
                ` : ''}

                <div class="section">
                    <h2 class="section-title">🎯 Actions</h2>
                    <div class="actions">
                        ${issue.state === 'open' ? `
                            <button class="action-btn btn-danger" onclick="closeIssue()">
                                ❌ Close Issue
                            </button>
                        ` : ''}
                        <button class="action-btn btn-secondary" onclick="addComment()">
                            💬 Add Comment
                        </button>
                        <button class="action-btn btn-secondary" onclick="openInGitea('${issue.html_url}')">
                            🔗 Open in Gitea
                        </button>
                        <button class="action-btn btn-secondary" onclick="refresh()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">💬 Comments</h2>
                    <div class="comments-section">
                        <div class="comment-placeholder">
                            Comments will be displayed here in a future version
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function closeIssue() {
                    vscode.postMessage({ type: 'closeIssue' });
                }
                
                function addComment() {
                    vscode.postMessage({ type: 'addComment' });
                }
                
                function openInGitea(url) {
                    vscode.postMessage({ type: 'openInGitea', url: url });
                }
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
            </script>
        </body>
        </html>`;
}

function generateAllPullRequestsHtml(pullRequests: any[]): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>All Pull Requests</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    margin: 0;
                    line-height: 1.6;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                }
                .header h1 {
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    font-size: 24px;
                }
                .refresh-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                .refresh-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .pr-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                    gap: 20px;
                }
                .pr-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    background: var(--vscode-sideBar-background);
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .pr-card:hover {
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }
                .pr-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .pr-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    line-height: 1.4;
                    flex: 1;
                    margin-right: 10px;
                }
                .pr-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 500;
                }
                .pr-status {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .status-open { background: #1a7b34; color: white; }
                .status-closed { background: #cf222e; color: white; }
                .status-merged { background: #8b5cf6; color: white; }
                .status-mergeable { background: #0969da; color: white; }
                .status-not-mergeable { background: #bc4c00; color: white; }
                .pr-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 15px 0;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pr-branch {
                    font-family: monospace;
                    font-size: 12px;
                    background: var(--vscode-textCodeBlock-background);
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin: 12px 0;
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }
                .pr-description {
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                    line-height: 1.5;
                    margin: 12px 0;
                    max-height: 60px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }
                .pr-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid var(--vscode-panel-border);
                }
                .action-btn {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .action-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .no-data {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔀 Pull Requests (${pullRequests.length})</h1>
                <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
            </div>
            
            ${pullRequests.length === 0 ? 
                '<div class="no-data">📭 No pull requests found</div>' :
                `<div class="pr-grid">
                    ${pullRequests.map(pr => `
                        <div class="pr-card" onclick="viewDetails(${pr.number})">
                            <div class="pr-header">
                                <h3 class="pr-title">
                                    <span class="pr-number">#${pr.number}</span> ${escapeHtml(pr.title)}
                                </h3>
                                <div class="pr-status">
                                    <span class="status-badge ${pr.state === 'open' ? 'status-open' : pr.state === 'closed' ? 'status-closed' : 'status-merged'}">
                                        ${pr.state === 'open' ? '🟢 Open' : pr.state === 'closed' ? '🔴 Closed' : '🟣 Merged'}
                                    </span>
                                    <span class="status-badge ${pr.mergeable ? 'status-mergeable' : 'status-not-mergeable'}">
                                        ${pr.mergeable ? '✅' : '❌'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="pr-meta">
                                <div class="meta-item">
                                    <span>👤</span> <strong>${escapeHtml(pr.user.login)}</strong>
                                </div>
                                <div class="meta-item">
                                    <span>📅</span> ${new Date(pr.created_at).toLocaleDateString()}
                                </div>
                                <div class="meta-item">
                                    <span>🔄</span> ${new Date(pr.updated_at).toLocaleDateString()}
                                </div>
                                <div class="meta-item">
                                    <span>📊</span> ${pr.state}
                                </div>
                            </div>
                            
                            <div class="pr-branch">
                                <strong>Branch:</strong> ${escapeHtml(pr.head.ref)} → ${escapeHtml(pr.base.ref)}
                            </div>
                            
                            ${pr.body ? `
                                <div class="pr-description">
                                    ${escapeHtml(pr.body)}
                                </div>
                            ` : ''}
                            
                            <div class="pr-actions" onclick="event.stopPropagation()">
                                <button class="action-btn" onclick="openPR('${pr.html_url}')">
                                    🔗 Gitea
                                </button>
                                <button class="action-btn" onclick="openPR('${pr.html_url}/files')">
                                    📄 Files
                                </button>
                                <button class="action-btn" onclick="openPR('${pr.html_url}/commits')">
                                    📝 Commits
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
                
                function openPR(url) {
                    vscode.postMessage({ type: 'openPR', url: url });
                }
                
                function viewDetails(prNumber) {
                    vscode.postMessage({ type: 'viewDetails', prNumber: prNumber });
                }
            </script>
        </body>
        </html>`;
}

function generateAllIssuesHtml(issues: any[]): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>All Issues</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    margin: 0;
                    line-height: 1.6;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                }
                .header h1 {
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    font-size: 24px;
                }
                .refresh-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                .refresh-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .issue-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                    gap: 20px;
                }
                .issue-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    background: var(--vscode-sideBar-background);
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .issue-card:hover {
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }
                .issue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .issue-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    line-height: 1.4;
                    flex: 1;
                    margin-right: 10px;
                }
                .issue-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 500;
                }
                .issue-status {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .status-open { background: #1a7b34; color: white; }
                .status-closed { background: #cf222e; color: white; }
                .issue-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 15px 0;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .labels {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin: 12px 0;
                }
                .label {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-weight: 500;
                }
                .issue-description {
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                    line-height: 1.5;
                    margin: 12px 0;
                    max-height: 60px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }
                .issue-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid var(--vscode-panel-border);
                }
                .action-btn {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .action-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .no-data {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐛 Issues (${issues.length})</h1>
                <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
            </div>
            
            ${issues.length === 0 ? 
                '<div class="no-data">📭 No issues found</div>' :
                `<div class="issue-grid">
                    ${issues.map(issue => `
                        <div class="issue-card" onclick="viewDetails(${issue.number})">
                            <div class="issue-header">
                                <h3 class="issue-title">
                                    <span class="issue-number">#${issue.number}</span> ${escapeHtml(issue.title)}
                                </h3>
                                <div class="issue-status">
                                    <span class="status-badge ${issue.state === 'open' ? 'status-open' : 'status-closed'}">
                                        ${issue.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="issue-meta">
                                <div class="meta-item">
                                    <span>👤</span> <strong>${escapeHtml(issue.user.login)}</strong>
                                </div>
                                <div class="meta-item">
                                    <span>📅</span> ${new Date(issue.created_at).toLocaleDateString()}
                                </div>
                                <div class="meta-item">
                                    <span>🔄</span> ${new Date(issue.updated_at).toLocaleDateString()}
                                </div>
                                <div class="meta-item">
                                    <span>📊</span> ${issue.state}
                                </div>
                            </div>
                            
                            ${issue.labels && issue.labels.length > 0 ? `
                                <div class="labels">
                                    ${issue.labels.map((label: any) => `
                                        <span class="label" style="background: #${label.color}33; color: #${label.color}; border: 1px solid #${label.color}55;">
                                            ${escapeHtml(label.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${issue.body ? `
                                <div class="issue-description">
                                    ${escapeHtml(issue.body)}
                                </div>
                            ` : ''}
                            
                            <div class="issue-actions" onclick="event.stopPropagation()">
                                <button class="action-btn" onclick="openIssue('${issue.html_url}')">
                                    🔗 Open in Gitea
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
                
                function openIssue(url) {
                    vscode.postMessage({ type: 'openIssue', url: url });
                }
                
                function viewDetails(issueNumber) {
                    vscode.postMessage({ type: 'viewDetails', issueNumber: issueNumber });
                }
            </script>
        </body>
        </html>`;
}

export function deactivate() {}
