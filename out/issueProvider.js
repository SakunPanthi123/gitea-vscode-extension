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
exports.IssueProvider = void 0;
const vscode = __importStar(require("vscode"));
class IssueProvider {
    giteaService;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    issues = [];
    constructor(giteaService) {
        this.giteaService = giteaService;
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
    issue;
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
        // Make the item clickable
        this.command = {
            command: 'gitea.showIssueDetails',
            title: 'Show Issue Details',
            arguments: [issue]
        };
    }
    createTooltip() {
        const issue = this.issue;
        const labels = issue.labels.map(label => label.name).join(', ');
        return `#${issue.number}: ${issue.title}\n\nAuthor: ${issue.user.login}\nState: ${issue.state}\nLabels: ${labels || 'None'}\nCreated: ${new Date(issue.created_at).toLocaleString()}\nUpdated: ${new Date(issue.updated_at).toLocaleString()}\n\n${issue.body || 'No description'}`;
    }
}
//# sourceMappingURL=issueProvider.js.map