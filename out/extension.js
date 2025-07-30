"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const giteaService_1 = require("./giteaService");
const pullRequestProvider_1 = require("./pullRequestProvider");
const issueProvider_1 = require("./issueProvider");
const reactWebviewProvider_1 = require("./reactWebviewProvider");
function activate(context) {
    console.log('Gitea Integration (React) extension is now active!');
    const giteaService = new giteaService_1.GiteaService();
    // Create providers
    const pullRequestProvider = new pullRequestProvider_1.PullRequestProvider(giteaService);
    const issueProvider = new issueProvider_1.IssueProvider(giteaService);
    const reactWebviewProvider = new reactWebviewProvider_1.ReactWebviewProvider(context.extensionUri, giteaService);
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh pull requests: ${error}`);
        }
    });
    const refreshIssuesCommand = vscode.commands.registerCommand('gitea.refreshIssues', async () => {
        try {
            issueProvider.refresh();
            vscode.window.showInformationMessage('Issues refreshed successfully!');
        }
        catch (error) {
            // vscode.window.showErrorMessage(`Failed to refresh issues: ${error}`);
        }
    });
    const showPullRequestDetailsCommand = vscode.commands.registerCommand('gitea.showPullRequestDetails', async (pullRequest) => {
        await reactWebviewProvider.showPullRequestDetails(pullRequest);
    });
    const showIssueDetailsCommand = vscode.commands.registerCommand('gitea.showIssueDetails', async (issue) => {
        await reactWebviewProvider.showIssueDetails(issue);
    });
    const listAllPullRequestsCommand = vscode.commands.registerCommand('gitea.listAllPullRequests', async () => {
        await reactWebviewProvider.showPullRequestsList();
    });
    const listAllIssuesCommand = vscode.commands.registerCommand('gitea.listAllIssues', async () => {
        await reactWebviewProvider.showIssuesList();
    });
    // Add all commands to subscriptions
    context.subscriptions.push(viewPullRequestsCommand, viewIssuesCommand, refreshPullRequestsCommand, refreshIssuesCommand, showPullRequestDetailsCommand, showIssueDetailsCommand, listAllPullRequestsCommand, listAllIssuesCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map