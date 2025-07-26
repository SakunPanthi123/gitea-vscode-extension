#!/usr/bin/env node

// Simple validation script for Gitea VS Code Extension
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Gitea VS Code Extension...\n');

// Check if compiled extension exists
const extensionPath = path.join(__dirname, 'out', 'extension.js');
if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension not compiled. Run: npm run compile');
    process.exit(1);
}
console.log('✅ Extension compiled successfully');

// Check package.json structure
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Validate required commands
const expectedCommands = [
    'gitea.viewPullRequests',
    'gitea.viewIssues',
    'gitea.refreshPullRequests',
    'gitea.refreshIssues',
    'gitea.showPullRequestDetails',
    'gitea.showIssueDetails'
];

const actualCommands = packageJson.contributes.commands.map(cmd => cmd.command);
const missingCommands = expectedCommands.filter(cmd => !actualCommands.includes(cmd));

if (missingCommands.length > 0) {
    console.error('❌ Missing commands:', missingCommands);
    process.exit(1);
}
console.log('✅ All required commands are registered');

// Check configuration properties
const expectedConfig = ['instanceURL', 'owner', 'repo', 'token'];
const actualConfig = Object.keys(packageJson.contributes.configuration.properties).map(key => key.replace('gitea.', ''));
const missingConfig = expectedConfig.filter(prop => !actualConfig.includes(prop));

if (missingConfig.length > 0) {
    console.error('❌ Missing configuration properties:', missingConfig);
    process.exit(1);
}
console.log('✅ All configuration properties are defined');

// Validate user settings (if accessible)
const os = require('os');
const settingsPath = path.join(os.homedir(), '.vscode', 'settings.json');
let userSettings = {};

try {
    if (fs.existsSync(settingsPath)) {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        // Remove comments and trailing commas for JSON parsing
        const cleanContent = settingsContent
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/,(\s*[}\]])/g, '$1');
        userSettings = JSON.parse(cleanContent);
    }
} catch (error) {
    console.warn('⚠️  Could not parse user settings.json:', error.message);
}

// Check for Gitea configuration
const giteaConfig = {
    instanceURL: userSettings['gitea.instanceURL'],
    owner: userSettings['gitea.owner'],
    repo: userSettings['gitea.repo'],
    token: userSettings['gitea.token']
};

let configIssues = [];

if (!giteaConfig.instanceURL) {
    configIssues.push('gitea.instanceURL is not set');
} else {
    if (giteaConfig.instanceURL.endsWith('/')) {
        configIssues.push('gitea.instanceURL should not have trailing slash');
    }
    try {
        new URL(giteaConfig.instanceURL);
        if (!giteaConfig.instanceURL.startsWith('https://')) {
            configIssues.push('gitea.instanceURL should use HTTPS');
        }
    } catch {
        configIssues.push('gitea.instanceURL is not a valid URL');
    }
}

['owner', 'repo', 'token'].forEach(prop => {
    if (!giteaConfig[prop]) {
        configIssues.push(`gitea.${prop} is not set`);
    }
});

if (configIssues.length > 0) {
    console.warn('⚠️  Configuration issues found:');
    configIssues.forEach(issue => console.warn(`   - ${issue}`));
    console.log('\n📝 To fix, add to your VS Code settings.json:');
    console.log(JSON.stringify({
        'gitea.instanceURL': 'https://gitea.bright-gps.com',
        'gitea.owner': 'BrightSoftware',
        'gitea.repo': 'brightschoolv3',
        'gitea.token': 'your-token-here'
    }, null, 2));
} else {
    console.log('✅ Gitea configuration looks good');
}

console.log('\n🎉 Validation complete!');
console.log('\n📋 Next steps:');
console.log('1. Make sure VS Code is restarted');
console.log('2. Open Command Palette (Cmd+Shift+P)');
console.log('3. Run "Gitea: View Pull Requests"');
console.log('4. Check Explorer panel for Gitea tree views');

if (configIssues.length === 0) {
    console.log('\n✨ Extension should be working properly!');
} else {
    console.log('\n⚠️  Fix configuration issues first, then restart VS Code');
}
