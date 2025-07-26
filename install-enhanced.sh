#!/bin/bash

# Enhanced Gitea VS Code Extension Installation Script with Cache Clearing

EXTENSION_NAME="gitea-integration"
VSCODE_EXTENSIONS_DIR="$HOME/.vscode/extensions"
CURRENT_DIR="$(pwd)"

echo "🚀 Installing Gitea VS Code Extension (Enhanced)..."

# Check if VS Code is running and warn user
if pgrep -f "Visual Studio Code" > /dev/null; then
    echo "⚠️  VS Code is currently running. Please close it before installing the extension."
    echo "   This ensures proper extension loading."
    echo ""
    read -p "Press Enter after closing VS Code to continue..."
fi

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

# Ensure extension is compiled
if [ ! -f "out/extension.js" ]; then
    echo "🔨 Compiling extension..."
    npm run compile
fi

# Copy extension files
echo "📋 Copying extension files..."
cp -r package.json "$EXTENSION_DIR/"
cp -r out/ "$EXTENSION_DIR/"
cp -r node_modules/ "$EXTENSION_DIR/"
cp -r README.md "$EXTENSION_DIR/" 2>/dev/null || true

# Clear VS Code extension cache
echo "🧹 Clearing VS Code caches..."
CACHE_DIRS=(
    "$HOME/Library/Caches/com.microsoft.VSCode"
    "$HOME/.vscode/CachedExtensions"
    "$HOME/.vscode/.cache"
)

for cache_dir in "${CACHE_DIRS[@]}"; do
    if [ -d "$cache_dir" ]; then
        echo "   Clearing: $cache_dir"
        rm -rf "$cache_dir" 2>/dev/null || true
    fi
done

# Verify installation
if [ -f "$EXTENSION_DIR/package.json" ] && [ -f "$EXTENSION_DIR/out/extension.js" ]; then
    echo "✅ Extension installed successfully!"
else
    echo "❌ Installation failed! Missing files."
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Start VS Code"
echo "2. Verify your settings include:"
echo "   {"
echo "     \"gitea.instanceURL\": \"https://gitea.bright-gps.com\","
echo "     \"gitea.owner\": \"BrightSoftware\","
echo "     \"gitea.repo\": \"brightschoolv3\","
echo "     \"gitea.token\": \"60cd6b4597aafe268a619cf72618419b2781bd8b\""
echo "   }"
echo "3. Open Command Palette (Cmd+Shift+P) and search for 'Gitea'"
echo "4. If commands don't appear, try: Developer: Reload Window"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If extension doesn't load: Developer > Reload Window"
echo "   - Check Developer Console: Help > Toggle Developer Tools"
echo "   - Re-run this script if needed"
echo ""
echo "🎉 Happy coding!"
