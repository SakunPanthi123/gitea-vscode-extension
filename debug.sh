#!/bin/bash

echo "🔍 Debugging Gitea Extension Issue..."
echo ""

# Check if extension is installed
EXTENSION_DIR="$HOME/.vscode/extensions/gitea-integration"
if [ -d "$EXTENSION_DIR" ]; then
    echo "✅ Extension directory exists: $EXTENSION_DIR"
    
    # Check required files
    if [ -f "$EXTENSION_DIR/package.json" ]; then
        echo "✅ package.json found"
    else
        echo "❌ package.json missing"
    fi
    
    if [ -f "$EXTENSION_DIR/out/extension.js" ]; then
        echo "✅ Compiled extension.js found"
    else
        echo "❌ extension.js missing - extension not compiled"
    fi
    
    if [ -d "$EXTENSION_DIR/node_modules" ]; then
        echo "✅ node_modules found"
    else
        echo "❌ node_modules missing"
    fi
else
    echo "❌ Extension not installed at: $EXTENSION_DIR"
fi

echo ""
echo "📋 Current workspace settings:"
WORKSPACE_SETTINGS="/Users/sakunpanthi/Desktop/Work/brightschoolv3/.vscode/settings.json"
if [ -f "$WORKSPACE_SETTINGS" ]; then
    echo "✅ Workspace settings found"
    echo "Gitea configuration:"
    grep -A 4 "gitea\." "$WORKSPACE_SETTINGS" || echo "   No gitea settings found"
else
    echo "❌ Workspace settings not found"
fi

echo ""
echo "💡 Recommended actions:"
echo "1. Close VS Code completely"
echo "2. Run: cd /Users/sakunpanthi/Desktop/Work/gitea-vscode-extension && ./install-enhanced.sh"
echo "3. Start VS Code"
echo "4. Try: Developer > Reload Window"
echo "5. Open Command Palette and search for 'Gitea'"

echo ""
echo "🔧 If still not working:"
echo "1. Check VS Code Developer Console (Help > Toggle Developer Tools)"
echo "2. Look for extension loading errors"
echo "3. Try disabling other extensions temporarily"
