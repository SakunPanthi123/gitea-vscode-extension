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
exports.PullRequestProvider = void 0;
const vscode = __importStar(require("vscode"));
class PullRequestProvider {
    giteaService;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    pullRequests = [];
    constructor(giteaService) {
        this.giteaService = giteaService;
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
    pullRequest;
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
        // Make the item clickable
        this.command = {
            command: 'gitea.showPullRequestDetails',
            title: 'Show Pull Request Details',
            arguments: [pullRequest]
        };
    }
    createTooltip() {
        const pr = this.pullRequest;
        return `#${pr.number}: ${pr.title}\n\nAuthor: ${pr.user.login}\nState: ${pr.state}\nCreated: ${new Date(pr.created_at).toLocaleString()}\nUpdated: ${new Date(pr.updated_at).toLocaleString()}\n\n${pr.body || 'No description'}`;
    }
}
//# sourceMappingURL=pullRequestProvider.js.map