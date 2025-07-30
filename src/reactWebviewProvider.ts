import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GiteaService } from "./giteaService";
import { CommitDetails, Issue, PullRequest } from "../types/_types";

interface AssetManifest {
  files: {
    [key: string]: string;
  };
  entrypoints: string[];
}

export class ReactWebviewProvider {
  private static readonly viewType = "giteaReactWebview";
  private static readonly detailsViewType = "giteaDetailsWebview";

  // Track current details panel to reuse/replace it
  private currentDetailsPanel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly giteaService: GiteaService
  ) {}

  public async showPullRequestDetails(pullRequest: PullRequest) {
    // Dispose existing details panel if it exists
    if (this.currentDetailsPanel) {
      this.currentDetailsPanel.dispose();
    }

    const panel = vscode.window.createWebviewPanel(
      ReactWebviewProvider.detailsViewType,
      `PR #${pullRequest.number}: ${pullRequest.title}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "webview-ui", "build"),
        ],
      }
    );

    // Track this panel as the current details panel
    this.currentDetailsPanel = panel;

    // Clear the reference when panel is disposed
    panel.onDidDispose(() => {
      if (this.currentDetailsPanel === panel) {
        this.currentDetailsPanel = undefined;
      }
    });

    panel.webview.html = this.getWebviewContent(
      panel.webview,
      "pullrequest",
      pullRequest
    );

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "openExternal":
          vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
        case "refresh":
          try {
            const updatedPR = await this.giteaService.getPullRequest(
              pullRequest.number
            );
            panel.webview.postMessage({ type: "updateData", data: updatedPR });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh PR: ${error}`);
          }
          break;
        case "getTimeline":
          try {
            const timeline = await this.giteaService.getPullRequestTimeline(
              message.pullRequestNumber
            );
            panel.webview.postMessage({ type: "timelineData", data: timeline });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to fetch timeline: ${error}`
            );
            panel.webview.postMessage({ type: "timelineData", data: [] });
          }
          break;
        case "getCommitDetails":
          try {
            const commitDetails = await this.giteaService.getCommitDetails(
              message.commitId
            );
            panel.webview.postMessage({
              type: "commitDetails",
              commitId: message.commitId,
              data: commitDetails,
            });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to fetch commit details: ${error}`
            );
          }
          break;
        case "showCommitDetails":
          this.showCommitDetails(message.data);
          break;
        case "addComment":
          try {
            const comment = await this.giteaService.addComment(
              message.pullRequestNumber,
              { body: message.body }
            );
            panel.webview.postMessage({ type: "commentAdded", data: comment });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to add comment: ${error}`);
            panel.webview.postMessage({ type: "commentError", error: error });
          }
          break;
        case "deleteComment":
          try {
            await this.giteaService.deleteComment(message.commentId);
            panel.webview.postMessage({
              type: "commentDeleted",
              commentId: message.commentId,
            });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to delete comment: ${error}`
            );
          }
          break;
        case "editComment":
          try {
            const updatedComment = await this.giteaService.editComment(
              message.commentId,
              { body: message.body }
            );
            panel.webview.postMessage({
              type: "commentEdited",
              data: updatedComment,
            });
            // Also refresh timeline to show updated comment
            const timeline = await this.giteaService.getPullRequestTimeline(
              pullRequest.number
            );
            panel.webview.postMessage({ type: "timelineData", data: timeline });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to edit comment: ${error}`);
          }
          break;
        case "closePullRequest":
          try {
            const updatedPR = await this.giteaService.closePullRequest(
              pullRequest.number
            );
            panel.webview.postMessage({ type: "updateData", data: updatedPR });
            vscode.window.showInformationMessage(
              `Pull Request #${pullRequest.number} closed successfully`
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to close pull request: ${error}`
            );
          }
          break;
        case "reopenPullRequest":
          try {
            const updatedPR = await this.giteaService.reopenPullRequest(
              pullRequest.number
            );
            panel.webview.postMessage({ type: "updateData", data: updatedPR });
            vscode.window.showInformationMessage(
              `Pull Request #${pullRequest.number} reopened successfully`
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to reopen pull request: ${error}`
            );
          }
          break;
        case "getRepositoryLabels":
          try {
            const labels = await this.giteaService.getRepositoryLabels();
            panel.webview.postMessage({
              type: "repositoryLabels",
              data: labels,
            });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch labels: ${error}`);
          }
          break;
        case "updatePullRequestLabels":
          try {
            const updatedLabels =
              await this.giteaService.replacePullRequestLabels(
                pullRequest.number,
                { labels: message.labelIds }
              );
            panel.webview.postMessage({
              type: "labelsUpdated",
              data: updatedLabels,
            });
            vscode.window.showInformationMessage(
              "Pull request labels updated successfully"
            );
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to update labels: ${error}`);
          }
          break;
      }
    });
  }

  public async showIssueDetails(issue: Issue) {
    // Dispose existing details panel if it exists
    if (this.currentDetailsPanel) {
      this.currentDetailsPanel.dispose();
    }

    const panel = vscode.window.createWebviewPanel(
      ReactWebviewProvider.detailsViewType,
      `Issue #${issue.number}: ${issue.title}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "webview-ui", "build"),
        ],
      }
    );

    // Track this panel as the current details panel
    this.currentDetailsPanel = panel;

    // Clear the reference when panel is disposed
    panel.onDidDispose(() => {
      if (this.currentDetailsPanel === panel) {
        this.currentDetailsPanel = undefined;
      }
    });

    panel.webview.html = this.getWebviewContent(panel.webview, "issue", issue);

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "openExternal":
          vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
        case "refresh":
          try {
            const updatedIssue = await this.giteaService.getIssue(issue.number);
            panel.webview.postMessage({
              type: "updateData",
              data: updatedIssue,
            });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh issue: ${error}`);
          }
          break;
        case "getTimeline":
          try {
            const timeline = await this.giteaService.getIssueTimeline(
              message.issueNumber
            );
            panel.webview.postMessage({ type: "timelineData", data: timeline });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to fetch timeline: ${error}`
            );
            panel.webview.postMessage({ type: "timelineData", data: [] });
          }
          break;
        case "addComment":
          try {
            const comment = await this.giteaService.addComment(
              message.issueNumber,
              { body: message.body }
            );
            panel.webview.postMessage({ type: "commentAdded", data: comment });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to add comment: ${error}`);
            panel.webview.postMessage({ type: "commentError", error: error });
          }
          break;
        case "deleteComment":
          try {
            await this.giteaService.deleteComment(message.commentId);
            panel.webview.postMessage({
              type: "commentDeleted",
              commentId: message.commentId,
            });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to delete comment: ${error}`
            );
          }
          break;
        case "editComment":
          try {
            const updatedComment = await this.giteaService.editComment(
              message.commentId,
              { body: message.body }
            );
            panel.webview.postMessage({
              type: "commentEdited",
              data: updatedComment,
            });
            // Also refresh timeline to show updated comment
            const timeline = await this.giteaService.getIssueTimeline(
              message.issueNumber || issue.number
            );
            panel.webview.postMessage({ type: "timelineData", data: timeline });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to edit comment: ${error}`);
          }
          break;
        case "closeIssue":
          try {
            const updatedIssue = await this.giteaService.closeIssue(
              issue.number
            );
            panel.webview.postMessage({
              type: "updateData",
              data: updatedIssue,
            });
            vscode.window.showInformationMessage(
              `Issue #${issue.number} closed successfully`
            );
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to close issue: ${error}`);
          }
          break;
        case "reopenIssue":
          try {
            const updatedIssue = await this.giteaService.reopenIssue(
              issue.number
            );
            panel.webview.postMessage({
              type: "updateData",
              data: updatedIssue,
            });
            vscode.window.showInformationMessage(
              `Issue #${issue.number} reopened successfully`
            );
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to reopen issue: ${error}`);
          }
          break;
        case "getRepositoryLabels":
          try {
            const labels = await this.giteaService.getRepositoryLabels();
            panel.webview.postMessage({
              type: "repositoryLabels",
              data: labels,
            });
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch labels: ${error}`);
          }
          break;
        case "updateIssueLabels":
          try {
            const updatedLabels = await this.giteaService.replaceIssueLabels(
              issue.number,
              { labels: message.labelIds }
            );
            panel.webview.postMessage({
              type: "labelsUpdated",
              data: updatedLabels,
            });
            vscode.window.showInformationMessage(
              "Issue labels updated successfully"
            );
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to update labels: ${error}`);
          }
          break;
      }
    });
  }

  public async showPullRequestsList() {
    const panel = vscode.window.createWebviewPanel(
      ReactWebviewProvider.viewType,
      "Gitea Pull Requests",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "webview-ui", "build"),
        ],
      }
    );

    try {
      const pullRequests = await this.giteaService.getPullRequests();
      panel.webview.html = this.getWebviewContent(
        panel.webview,
        "pullrequests",
        pullRequests
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load pull requests: ${error}`);
      panel.webview.html = this.getErrorContent(
        panel.webview,
        "Failed to load pull requests"
      );
    }

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "openExternal":
          vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
        case "showDetails":
          this.showPullRequestDetails(message.data);
          break;
        case "refresh":
          try {
            const pullRequests = await this.giteaService.getPullRequests();
            panel.webview.postMessage({
              type: "updateData",
              data: pullRequests,
            });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to refresh pull requests: ${error}`
            );
          }
          break;
      }
    });
  }

  public async showIssuesList() {
    const panel = vscode.window.createWebviewPanel(
      ReactWebviewProvider.viewType,
      "Gitea Issues",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "webview-ui", "build"),
        ],
      }
    );

    try {
      const issues = await this.giteaService.getIssues();
      panel.webview.html = this.getWebviewContent(
        panel.webview,
        "issues",
        issues
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load issues: ${error}`);
      panel.webview.html = this.getErrorContent(
        panel.webview,
        "Failed to load issues"
      );
    }

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "openExternal":
          vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
        case "showDetails":
          this.showIssueDetails(message.data);
          break;
        case "refresh":
          try {
            const issues = await this.giteaService.getIssues();
            panel.webview.postMessage({ type: "updateData", data: issues });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to refresh issues: ${error}`
            );
          }
          break;
      }
    });
  }

  private getWebviewContent(
    webview: vscode.Webview,
    viewType: string,
    data: any
  ): string {
    // Read the asset manifest to get the correct file names
    const manifestPath = vscode.Uri.joinPath(
      this.extensionUri,
      "webview-ui",
      "build",
      "asset-manifest.json"
    );

    let manifest: AssetManifest;
    try {
      const manifestContent = fs.readFileSync(manifestPath.fsPath, "utf8");
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      console.error("Failed to read asset manifest:", error);
      return this.getErrorContent(webview, "Failed to load webview assets");
    }

    // Get the main JS and CSS files from the manifest
    const mainJs = manifest.files["main.js"];
    const mainCss = manifest.files["main.css"];

    if (!mainJs || !mainCss) {
      return this.getErrorContent(webview, "Main assets not found in manifest");
    }

    // Create webview URIs for the assets
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "webview-ui",
        "build",
        mainJs.replace(/^\//, "")
      )
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "webview-ui",
        "build",
        mainCss.replace(/^\//, "")
      )
    );

    // Generate nonce for security
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
                  webview.cspSource
                } 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${
      webview.cspSource
    } https:; connect-src 'none';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Gitea ${viewType}</title>
                <link href="${cssUri}" rel="stylesheet">
                <script nonce="${nonce}">
                    console.log('Setting up webview globals...');
                    window.vscode = acquireVsCodeApi();
                    window.initialData = ${JSON.stringify(data)};
                    window.viewType = '${viewType}';
                    console.log('Webview globals set:', {
                        hasVscode: !!window.vscode,
                        viewType: window.viewType,
                        dataLength: window.initialData ? (Array.isArray(window.initialData) ? window.initialData.length : 'object') : 'null'
                    });
                </script>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
  }

  private getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getErrorContent(
    webview: vscode.Webview,
    errorMessage: string
  ): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style nonce="${nonce}">
                    body {
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 20px;
                        margin: 0;
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                        background: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        padding: 15px;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="error">
                    <h3>Error</h3>
                    <p>${errorMessage}</p>
                    <p><small>Check the VS Code Developer Console for more details.</small></p>
                </div>
            </body>
            </html>`;
  }

  public async showCommitDetails(commitDetails: CommitDetails) {
    // Create a new panel without disposing the current one
    const panel = vscode.window.createWebviewPanel(
      ReactWebviewProvider.detailsViewType,
      `Commit ${commitDetails.sha.substring(0, 8)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "webview-ui", "build"),
        ],
      }
    );

    panel.webview.html = this.getWebviewContent(
      panel.webview,
      "commit",
      commitDetails
    );

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "openExternal":
          vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
      }
    });
  }
}
