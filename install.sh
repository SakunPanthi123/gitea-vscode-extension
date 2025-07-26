#!/bin/bash

# Gitea VS Code Extension Installation Script

EXTENSION_NAME="gitea-integration"
VSCODE_EXTENSIONS_DIR="$HOME/.vscode/extensions"
CURRENT_DIR="$(pwd)"

echo "🚀 Installing Gitea VS Code Extension..."

# Check if VS Code extensions directory exists
if [ ! -d "$VSCODE_EXTENSIONS_DIR" ]; then
    echo "📁 Creating VS Code extensions directory..."
    mkdir -p "$VSCODE_EXTENSIONS_DIR"
fi

# Create extension directory
EXTENSION_DIR="$VSCODE_EXTENSIONS_DIR/$EXTENSION_NAME"
echo "📦 Creating extension directory: $EXTENSION_DIR"

if [ -d "$EXTENSION_DIR" ]; then
    echo "🗑️  Removing existing extension..."
    rm -rf "$EXTENSION_DIR"
fi

mkdir -p "$EXTENSION_DIR"

# Copy extension files
echo "📋 Copying extension files..."
cp -r package.json "$EXTENSION_DIR/"
cp -r out/ "$EXTENSION_DIR/"
cp -r node_modules/ "$EXTENSION_DIR/"
cp -r README.md "$EXTENSION_DIR/"

echo "✅ Extension installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Restart VS Code"
echo "2. Add your Gitea configuration to VS Code settings:"
echo "   {" 
echo "     \"gitea.instanceURL\": \"https://gitea.bright-gps.com\","
echo "     \"gitea.owner\": \"BrightSoftware\","
echo "     \"gitea.repo\": \"brightschoolv3\","
echo "     \"gitea.token\": \"60cd6b4597aafe268a619cf72618419b2781bd8b\""
echo "   }"
echo "3. Open the Command Palette (Cmd+Shift+P) and run 'Gitea: View Pull Requests'"
echo ""
echo "🎉 Happy coding!"
