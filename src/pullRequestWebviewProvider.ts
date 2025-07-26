import * as vscode from 'vscode';
import { GiteaService, PullRequest } from './giteaService';

export class PullRequestWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'giteaPullRequestsWebview';

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
                case 'openPR':
                    vscode.env.openExternal(vscode.Uri.parse(data.url));
                    break;
                case 'showDetails':
                    await this.showPullRequestDetails(data.pr);
                    break;
            }
        });
    }

    private async _update() {
        if (!this._view) {
            return;
        }

        try {
            const pullRequests = await this.giteaService.getPullRequests();
            this._view.webview.html = this._getHtmlForWebview(this._view.webview, pullRequests);
        } catch (error) {
            this._view.webview.html = this._getErrorHtml(error);
        }
    }

    private async showPullRequestDetails(pr: PullRequest) {
        const panel = vscode.window.createWebviewPanel(
            'pullRequestDetails',
            `PR #${pr.number}: ${pr.title}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this._getPullRequestDetailsHtml(pr);
    }

    private _getHtmlForWebview(webview: vscode.Webview, pullRequests: PullRequest[]) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Gitea Pull Requests</title>
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
                    .pr-item {
                        margin-bottom: 12px;
                        padding: 12px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        background: var(--vscode-editor-background);
                        transition: background-color 0.2s;
                    }
                    .pr-item:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    .pr-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 8px;
                    }
                    .pr-title {
                        font-weight: 600;
                        font-size: 14px;
                        color: var(--vscode-editor-foreground);
                        margin: 0;
                        flex: 1;
                        margin-right: 10px;
                    }
                    .pr-number {
                        color: var(--vscode-textLink-foreground);
                        font-weight: 500;
                    }
                    .pr-meta {
                        display: flex;
                        gap: 15px;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 8px;
                    }
                    .pr-status {
                        display: flex;
                        gap: 10px;
                        font-size: 12px;
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
                    .status-mergeable { 
                        background: #0969da; 
                        color: white; 
                    }
                    .status-not-mergeable { 
                        background: #bc4c00; 
                        color: white; 
                    }
                    .pr-branch {
                        font-family: monospace;
                        font-size: 11px;
                        background: var(--vscode-textCodeBlock-background);
                        padding: 2px 6px;
                        border-radius: 3px;
                        color: var(--vscode-textPreformat-foreground);
                    }
                    .pr-actions {
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
                    <h3 style="margin: 0;">Pull Requests (${pullRequests.length})</h3>
                    <button class="refresh-btn" onclick="refresh()">↻ Refresh</button>
                </div>
                
                ${pullRequests.length === 0 ? 
                    '<div class="no-data">No pull requests found</div>' :
                    pullRequests.map(pr => `
                        <div class="pr-item">
                            <div class="pr-header">
                                <h4 class="pr-title">
                                    <span class="pr-number">#${pr.number}</span> ${this.escapeHtml(pr.title)}
                                </h4>
                            </div>
                            
                            <div class="pr-meta">
                                <span>👤 ${this.escapeHtml(pr.user.login)}</span>
                                <span>📅 ${new Date(pr.created_at).toLocaleDateString()}</span>
                                <span>🔄 ${new Date(pr.updated_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div class="pr-status">
                                <span class="status-badge ${pr.state === 'open' ? 'status-open' : 'status-closed'}">
                                    ${pr.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                                </span>
                                <span class="status-badge ${pr.mergeable ? 'status-mergeable' : 'status-not-mergeable'}">
                                    ${pr.mergeable ? '✅ Mergeable' : '❌ Not Mergeable'}
                                </span>
                            </div>
                            
                            <div style="margin: 8px 0; font-size: 12px;">
                                <span class="pr-branch">${this.escapeHtml(pr.head.ref)}</span> 
                                → 
                                <span class="pr-branch">${this.escapeHtml(pr.base.ref)}</span>
                            </div>
                            
                            <div class="pr-actions">
                                <button class="action-btn" onclick="showDetails(${JSON.stringify(pr).replace(/"/g, '&quot;')})">
                                    📋 Details
                                </button>
                                <button class="action-btn" onclick="openPR('${pr.html_url}')">
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
                    
                    function openPR(url) {
                        vscode.postMessage({ type: 'openPR', url: url });
                    }
                    
                    function showDetails(pr) {
                        vscode.postMessage({ type: 'showDetails', pr: pr });
                    }
                </script>
            </body>
            </html>`;
    }

    private _getPullRequestDetailsHtml(pr: PullRequest) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PR #${pr.number} Details</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        line-height: 1.6;
                    }
                    .pr-header {
                        border-bottom: 2px solid var(--vscode-panel-border);
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .pr-title {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0 0 10px 0;
                    }
                    .pr-number {
                        color: var(--vscode-textLink-foreground);
                    }
                    .pr-meta-grid {
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
                    .branch-info {
                        font-family: monospace;
                        background: var(--vscode-textCodeBlock-background);
                        padding: 8px 12px;
                        border-radius: 4px;
                        border-left: 4px solid var(--vscode-textLink-foreground);
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
                    .btn-secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                </style>
            </head>
            <body>
                <div class="pr-header">
                    <h1 class="pr-title">
                        <span class="pr-number">#${pr.number}</span> ${this.escapeHtml(pr.title)}
                    </h1>
                    
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <span class="status-badge ${pr.state === 'open' ? 'status-open' : 'status-closed'}">
                            ${pr.state === 'open' ? '🟢 Open' : '🔴 Closed'}
                        </span>
                        <span class="status-badge ${pr.mergeable ? 'status-mergeable' : 'status-not-mergeable'}">
                            ${pr.mergeable ? '✅ Mergeable' : '❌ Not Mergeable'}
                        </span>
                    </div>
                </div>

                <div class="pr-meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">Author</div>
                        <div class="meta-value">👤 ${this.escapeHtml(pr.user.login)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Created</div>
                        <div class="meta-value">📅 ${new Date(pr.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Last Updated</div>
                        <div class="meta-value">🔄 ${new Date(pr.updated_at).toLocaleDateString()}</div>
                    </div>
                </div>

                <div class="meta-item branch-info">
                    <div class="meta-label">Branch</div>
                    <div class="meta-value">${this.escapeHtml(pr.head.ref)} → ${this.escapeHtml(pr.base.ref)}</div>
                </div>

                ${pr.body ? `
                    <h3>Description</h3>
                    <div class="description">${this.escapeHtml(pr.body)}</div>
                ` : ''}

                <div class="action-buttons">
                    <a href="${pr.html_url}" class="btn btn-primary">🔗 View on Gitea</a>
                    <a href="${pr.html_url}/files" class="btn btn-secondary">📄 View Files</a>
                    <a href="${pr.html_url}/commits" class="btn btn-secondary">📝 View Commits</a>
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
                <h3>❌ Error Loading Pull Requests</h3>
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
