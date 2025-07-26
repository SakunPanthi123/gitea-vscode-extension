import * as vscode from 'vscode';
import { GiteaService, Issue } from './giteaService';

export class IssueWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'giteaIssuesWebview';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly giteaService: GiteaService
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this._update();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'refresh':
                    this._update();
                    break;
                case 'openIssue':
                    vscode.env.openExternal(vscode.Uri.parse(data.url));
                    break;
                case 'showDetails':
                    await this.showIssueDetails(data.issue);
                    break;
            }
        });
    }

    private async _update() {
        if (!this._view) {
            return;
        }

        try {
            const issues = await this.giteaService.getIssues();
            this._view.webview.html = this._getHtmlForWebview(this._view.webview, issues);
        } catch (error) {
            this._view.webview.html = this._getErrorHtml(error);
        }
    }

    private async showIssueDetails(issue: Issue) {
        const panel = vscode.window.createWebviewPanel(
            'issueDetails',
            `Issue #${issue.number}: ${issue.title}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this._getIssueDetailsHtml(issue);
    }

    private _getHtmlForWebview(webview: vscode.Webview, issues: Issue[]) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Gitea Issues</title>
                <style>
                    body {
                        padding: 10px;
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .refresh-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .refresh-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .issue-item {
                        margin-bottom: 12px;
                        padding: 12px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        background: var(--vscode-editor-background);
                        transition: background-color 0.2s;
                    }
                    .issue-item:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    .issue-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 8px;
                    }
                    .issue-title {
                        font-weight: 600;
                        font-size: 14px;
                        color: var(--vscode-editor-foreground);
                        margin: 0;
                        flex: 1;
                        margin-right: 10px;
                    }
                    .issue-number {
                        color: var(--vscode-textLink-foreground);
                        font-weight: 500;
                    }
                    .issue-meta {
                        display: flex;
                        gap: 15px;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 8px;
                    }
                    .issue-status {
                        display: flex;
                        gap: 10px;
                        font-size: 12px;
                        margin-bottom: 8px;
                    }
                    .status-badge {
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-weight: 500;
                    }
                    .status-open { 
                        background: #1a7b34; 
                        color: white; 
                    }
                    .status-closed { 
                        background: #cf222e; 
                        color: white; 
                    }
                    .labels {
                        display: flex;
                        gap: 6px;
                        flex-wrap: wrap;
                        margin: 8px 0;
                    }
                    .label {
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 10px;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                    }
                    .issue-actions {
                        display: flex;
                        gap: 8px;
                        margin-top: 8px;
                    }
                    .action-btn {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    }
                    .action-btn:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    .no-data {
                        text-align: center;
                        padding: 40px 20px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3 style="margin: 0;">Issues (${issues.length})</h3>
                    <button class="refresh-btn" onclick="refresh()">↻ Refresh</button>
                </div>
                
                ${issues.length === 0 ? 
                    '<div class="no-data">No issues found</div>' :
                    issues.map(issue => `
                        <div class="issue-item">
                            <div class="issue-header">
                                <h4 class="issue-title">
                                    <span class="issue-number">#${issue.number}</span> ${this.escapeHtml(issue.title)}
                                </h4>
                            </div>
                            
                            <div class="issue-meta">
                                <span>👤 ${this.escapeHtml(issue.user.login)}</span>
                                <span>📅 ${new Date(issue.created_at).toLocaleDateString()}</span>
                                <span>🔄 ${new Date(issue.updated_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div class="issue-status">
                                <span class="status-badge ${issue.state === 'open' ? 'status-open' : 'status-closed'}">
                                    ${issue.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                                </span>
                            </div>
                            
                            ${issue.labels && issue.labels.length > 0 ? `
                                <div class="labels">
                                    ${issue.labels.map(label => `
                                        <span class="label" style="background: #${label.color}33; color: #${label.color};">
                                            ${this.escapeHtml(label.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="issue-actions">
                                <button class="action-btn" onclick="showDetails(${JSON.stringify(issue).replace(/"/g, '&quot;')})">
                                    📋 Details
                                </button>
                                <button class="action-btn" onclick="openIssue('${issue.html_url}')">
                                    🔗 Open in Gitea
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function refresh() {
                        vscode.postMessage({ type: 'refresh' });
                    }
                    
                    function openIssue(url) {
                        vscode.postMessage({ type: 'openIssue', url: url });
                    }
                    
                    function showDetails(issue) {
                        vscode.postMessage({ type: 'showDetails', issue: issue });
                    }
                </script>
            </body>
            </html>`;
    }

    private _getIssueDetailsHtml(issue: Issue) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Issue #${issue.number} Details</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        line-height: 1.6;
                    }
                    .issue-header {
                        border-bottom: 2px solid var(--vscode-panel-border);
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .issue-title {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0 0 10px 0;
                    }
                    .issue-number {
                        color: var(--vscode-textLink-foreground);
                    }
                    .issue-meta-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .meta-item {
                        padding: 10px;
                        background: var(--vscode-textCodeBlock-background);
                        border-radius: 6px;
                    }
                    .meta-label {
                        font-weight: 600;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .meta-value {
                        font-size: 14px;
                    }
                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 15px;
                        font-weight: 500;
                        font-size: 12px;
                    }
                    .labels {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                        margin: 10px 0;
                    }
                    .label {
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .description {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 15px;
                        border-radius: 6px;
                        margin: 20px 0;
                        white-space: pre-wrap;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    .btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        text-decoration: none;
                        display: inline-block;
                    }
                    .btn-primary {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="issue-header">
                    <h1 class="issue-title">
                        <span class="issue-number">#${issue.number}</span> ${this.escapeHtml(issue.title)}
                    </h1>
                    
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <span class="status-badge ${issue.state === 'open' ? 'status-open' : 'status-closed'}">
                            ${issue.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                        </span>
                    </div>

                    ${issue.labels && issue.labels.length > 0 ? `
                        <div class="labels">
                            ${issue.labels.map(label => `
                                <span class="label" style="background: #${label.color}33; color: #${label.color};">
                                    ${this.escapeHtml(label.name)}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="issue-meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">Author</div>
                        <div class="meta-value">👤 ${this.escapeHtml(issue.user.login)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Created</div>
                        <div class="meta-value">📅 ${new Date(issue.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Last Updated</div>
                        <div class="meta-value">🔄 ${new Date(issue.updated_at).toLocaleDateString()}</div>
                    </div>
                </div>

                ${issue.body ? `
                    <h3>Description</h3>
                    <div class="description">${this.escapeHtml(issue.body)}</div>
                ` : ''}

                <div class="action-buttons">
                    <a href="${issue.html_url}" class="btn btn-primary">🔗 View on Gitea</a>
                </div>
            </body>
            </html>`;
    }

    private _getErrorHtml(error: any) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        text-align: center;
                    }
                    .error {
                        background: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        color: var(--vscode-inputValidation-errorForeground);
                        padding: 15px;
                        border-radius: 6px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <h3>❌ Error Loading Issues</h3>
                <div class="error">
                    ${this.escapeHtml(error.toString())}
                </div>
                <button onclick="location.reload()">🔄 Retry</button>
            </body>
            </html>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
