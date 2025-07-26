# Gitea VS Code Extension (React Version)

A modern React-based VS Code extension to integrate with Gitea repositories, allowing you to view and manage pull requests and issues directly from VS Code with improved UI and better development experience.

## Features

- 📋 View all pull requests in a tree view
- 🐛 View all issues in a tree view
- ⚛️ Modern React-based webview with Tailwind CSS styling
- 🔄 Refresh data with a click
- 📖 Detailed view for individual pull requests and issues
- 🎨 VS Code theme-aware UI components
- 🚀 Better development experience with hot reloading

## Development

### Prerequisites

- Node.js 16+ and npm
- VS Code 1.74.0+

### Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   cd webview-ui && npm install && cd ..
   ```

3. Build the project:

   ```bash
   npm run compile
   ```

4. Open in VS Code and press F5 to launch the Extension Host

### Project Structure

```
├── src/                    # Extension source code
│   ├── extension.ts        # Main extension entry point
│   ├── giteaService.ts     # Gitea API service
│   ├── pullRequestProvider.ts # Tree view provider for PRs
│   ├── issueProvider.ts    # Tree view provider for issues
│   └── reactWebviewProvider.ts # React webview provider
├── webview-ui/             # React application for webviews
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx         # Main React app
│   │   └── index.tsx       # React entry point
│   ├── public/
│   └── package.json        # React app dependencies
└── package.json            # Extension dependencies
```

### Building

- `npm run compile` - Compile TypeScript and build React app
- `npm run watch` - Watch mode for development
- `cd webview-ui && npm run build` - Build React app only

### Testing

Press F5 in VS Code to launch the Extension Development Host. The extension will be available in the new VS Code window.

## Configuration

Add the following settings to your VS Code User settings:

```json
{
  "gitea.instanceURL": "[Your server instance address]",
  "gitea.owner": "[Owner of the gitea repo]",
  "gitea.repo": "[Repo name]",
  "gitea.token": "[Access token for the user]"
}
```

## Commands

- **Gitea: View Pull Requests** - Open a React-based view of all pull requests
- **Gitea: View Issues** - Open a React-based view of all issues

## Tree Views

The extension adds two tree views to the Explorer panel:

1. **Gitea Pull Requests** - Shows a list of all pull requests
2. **Gitea Issues** - Shows a list of all issues

Click on any item to see detailed information in a modern React-based webview.

## Improvements over Original

- **React-based UI**: Modern, responsive interface built with React and Tailwind CSS
- **Better Development Experience**: Hot reloading and component-based architecture
- **VS Code Theme Integration**: Respects VS Code's theme colors and styling
- **Improved Performance**: Optimized React components with proper state management
- **Better Error Handling**: More robust error handling and user feedback
- **Enhanced Styling**: Professional UI with consistent design patterns

## Development Workflow

1. Make changes to the extension code in `src/`
2. Make changes to the React components in `webview-ui/src/`
3. Run `npm run compile` to build everything
4. Press Ctrl+R in the Extension Development Host to reload the extension
5. Test your changes

For React-only changes, you can run `cd webview-ui && npm start` for development with hot reloading, then build with `npm run build` when ready.

## License

MIT License
