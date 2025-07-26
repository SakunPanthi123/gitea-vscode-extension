# Gitea VS Code Extension

A VS Code extension to integrate with Gitea repositories, allowing you to view and manage pull requests and issues directly from VS Code.

## Features

- 📋 View all pull requests in a tree view
- 🐛 View all issues in a tree view
- 📝 Display pull requests and issues in markdown format
- 🔄 Refresh data with a click
- 📖 Detailed view for individual pull requests and issues

## Configuration

Add the following settings to your VS Code settings (either workspace or user settings):

```json
{
  "gitea.instanceURL": "https://[private gitea server].[domain]",
  "gitea.owner": [admin owner not your name],
  "gitea.repo": [your repo name],
  "gitea.token": "[your token]"
}
```

## Installation

1. Copy the extension folder to your VS Code extensions directory:

   - **macOS**: `~/.vscode/extensions/`
   - **Windows**: `%USERPROFILE%\\.vscode\\extensions\\`
   - **Linux**: `~/.vscode/extensions/`

2. Restart VS Code

3. The extension will automatically activate when you run any Gitea command

## Usage

### Commands

- **Gitea: View Pull Requests** - Open a markdown view of all pull requests
- **Gitea: View Issues** - Open a markdown view of all issues

### Tree Views

The extension adds two tree views to the Explorer panel:

1. **Gitea Pull Requests** - Shows a list of all pull requests
2. **Gitea Issues** - Shows a list of all issues

Click on any item to see detailed information in markdown format.

### Refresh

Use the refresh button (🔄) in each tree view to fetch the latest data from Gitea.

## Development

To work on this extension:

1. Open the extension folder in VS Code
2. Press `F5` to launch a new Extension Development Host window
3. Test your changes in the new window

## Building

```bash
npm install
npm run compile
```

## API Endpoints Used

The extension uses the following Gitea API endpoints:

- `GET /api/v1/repos/{owner}/{repo}/pulls` - List pull requests
- `GET /api/v1/repos/{owner}/{repo}/issues` - List issues
- `GET /api/v1/repos/{owner}/{repo}/pulls/{index}` - Get specific pull request
- `GET /api/v1/repos/{owner}/{repo}/issues/{index}` - Get specific issue

## License

MIT License
