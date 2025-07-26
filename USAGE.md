# Gitea VS Code Extension - Usage Guide

## 🎯 Quick Start

### 1. Installation Complete ✅

The extension has been installed to: `~/.vscode/extensions/gitea-integration`

### 2. Configure Settings

Add these settings to your VS Code configuration:

**Option A: Workspace Settings (Recommended)**

- Create/open `.vscode/settings.json` in your project
- Add the configuration below

**Option B: User Settings**

- Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
- Click "Open Settings (JSON)" in the top right
- Add the configuration below

```json
{
  "gitea.instanceURL": "https://gitea.bright-gps.com",
  "gitea.owner": "BrightSoftware",
  "gitea.repo": "brightschoolv3",
  "gitea.token": "60cd6b4597aafe268a619cf72618419b2781bd8b"
}
```

### 3. Restart VS Code

Close and reopen VS Code for the extension to load.

## 🚀 Features

### Command Palette Commands

Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) and search for:

- **"Gitea: View Pull Requests"** - Opens a markdown document with all PRs
- **"Gitea: View Issues"** - Opens a markdown document with all issues

### Explorer Tree Views

Look for these new sections in the Explorer panel:

1. **📋 Gitea Pull Requests**

   - Shows all pull requests as a tree
   - Click any PR to see detailed markdown view
   - Use refresh button to update

2. **🐛 Gitea Issues**
   - Shows all issues as a tree
   - Click any issue to see detailed markdown view
   - Use refresh button to update

### What You'll See

**Pull Request Details Include:**

- Title and number
- Author and state (open/closed)
- Mergeable status
- Source and target branches
- Creation and update dates
- Full description
- Links to view on Gitea

**Issue Details Include:**

- Title and number
- Author and state (open/closed)
- Labels (if any)
- Creation and update dates
- Full description
- Link to view on Gitea

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to fetch pull requests/issues"**

   - Check your internet connection
   - Verify the Gitea instance URL is correct
   - Ensure your API token is valid
   - Make sure the owner/repo settings are correct

2. **Extension not showing up**

   - Restart VS Code completely
   - Check if the extension folder exists: `~/.vscode/extensions/gitea-integration`
   - Re-run the installation script

3. **Tree views not appearing**
   - Make sure you've configured all required settings
   - Try running a command from the Command Palette first
   - Check the Developer Console (Help > Toggle Developer Tools) for errors

## 🔄 Updating the Extension

To update or reinstall:

1. Navigate to the extension directory: `cd /Users/sakunpanthi/Desktop/Work/gitea-vscode-extension`
2. Make any changes to the code
3. Run: `npm run compile && ./install.sh`
4. Restart VS Code

## 🎨 Customization

The extension source code is available in:
`/Users/sakunpanthi/Desktop/Work/gitea-vscode-extension/`

Key files:

- `src/extension.ts` - Main extension logic
- `src/giteaService.ts` - API integration
- `src/pullRequestProvider.ts` - Pull request tree view
- `src/issueProvider.ts` - Issue tree view
- `package.json` - Extension configuration

Feel free to modify and customize as needed!

## 📝 Next Steps

1. ✅ Extension installed
2. ⏳ Configure settings in VS Code
3. ⏳ Restart VS Code
4. ⏳ Test with "Gitea: View Pull Requests" command
5. ⏳ Check the Explorer panel for tree views

Happy coding! 🎉
