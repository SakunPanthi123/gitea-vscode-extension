# Change Log

## [1.1.1] - 2025-08-01

### Added

- **Reaction Picker Addtion**:
  - Added a new reaction picker component for issues and pull requests
  - Allows users to add reactions to comments with a simple click
  - Supports multiple reactions with a dropdown interface
  - Displays existing reactions

- **Improved UX**:
  - Comment refs in timeline now show the referenced issue or pull request

## [1.1.0] - 2025-07-31

### Added

- **Create Issue Feature**: New ability to create issues directly from VS Code
  - Click the plus (+) icon in the Issues tree view header to open the create issue form
  - Professional webview interface with form fields for title and description
  - Select and assign labels using an interactive dropdown picker with search functionality
  - Assign users using a dropdown picker with user avatars and search
  - Form validation with proper error handling
  - Automatic refresh of issues list after successful creation
  - Newly created issue automatically opens in details view
  - VS Code theme-aware styling for consistent user experience

### Fixed

- Prevented accidental form submission when interacting with label and assignee pickers
- Improved event handling in dropdown components to prevent event bubbling

## [1.0.0] to [1.0.9] - Previous releases

### Added

- **Core Gitea Integration**: Initial release with comprehensive Gitea repository integration
- **Tree View Navigation**: Dual tree view panels for Pull Requests and Issues in VS Code sidebar
- **Pull Request Management**:
  - View all pull requests in organized tree structure
  - Detailed pull request view with React-based webview interface
  - Close and reopen pull requests directly from VS Code
  - Add, edit, and delete comments on pull requests
  - Timeline view showing all pull request events and activities
- **Issue Management**:
  - View all issues in organized tree structure
  - Detailed issue view with React-based webview interface
  - Close and reopen issues directly from VS Code
  - Add, edit, and delete comments on issues
  - Add and remove labels from issues
  - Assign and unassign participants to issues
  - Timeline view showing all issue events and activities
- **Modern UI/UX**:
  - React-based webview components with Tailwind CSS styling
  - VS Code theme-aware interface that respects user's color scheme
  - Professional, responsive design with smooth transitions
  - Interactive timeline components showing commits, merges, labels, and comments
- **Developer Experience**:
  - Hot reloading for efficient development
  - Component-based architecture for maintainability
  - TypeScript support with full type safety
- **Configuration**:
  - Easy setup through VS Code settings
  - Support for custom Gitea instances
  - Secure token-based authentication
