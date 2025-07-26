# Gitea VS Code Extension

A VS Code extension to integrate with Gitea repositories, allowing you to view and manage pull requests and issues directly from VS Code.

## Features

- 📋 View all pull requests in a tree view
- 🐛 View all issues in a tree view
- 📝 Display pull requests and issues in markdown format through command(markdown renderer extensions will do the extra benefit of displaying it nicely)
- 🔄 Refresh data with a click
- 📖 Detailed view for individual pull requests and issues

## Configuration

Add the following settings to your VS Code User settings or just click on the settings icon on the extension page and fill the text boxes:

```json
{
  "gitea.instanceURL": "[Your server instance address]",
  "gitea.owner": "[Owner of the gitea repo]",
  "gitea.repo": "[Repo name]",
  "gitea.token": "[Access token for the user]"
}
```
***Note: To get the access token, go to your gitea settings and click on Application and then generate token.***

### Commands

- **Gitea: View Pull Requests** - Open a markdown view of all pull requests
- **Gitea: View Issues** - Open a markdown view of all issues

### Tree Views

The extension adds two tree views to the Explorer panel:

1. **Gitea Pull Requests** - Shows a list of all pull requests
2. **Gitea Issues** - Shows a list of all issues

Click on any item to see detailed information in the Editor area in a separate tab.

### Refresh

Use the refresh button (🔄) in each tree view to fetch the latest data from Gitea.

## API Endpoints Used

The extension uses the following Gitea API endpoints:

- `GET /api/v1/repos/{owner}/{repo}/pulls` - List pull requests
- `GET /api/v1/repos/{owner}/{repo}/issues` - List issues
- `GET /api/v1/repos/{owner}/{repo}/pulls/{index}` - Get specific pull request
- `GET /api/v1/repos/{owner}/{repo}/issues/{index}` - Get specific issue

## License

MIT License
