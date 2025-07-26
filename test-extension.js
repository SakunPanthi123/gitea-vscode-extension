// Quick test to check if our commands are properly defined
const fs = require('fs');
const path = require('path');

// Read the compiled extension
const extensionPath = path.join(__dirname, 'out', 'extension.js');
const packagePath = path.join(__dirname, 'package.json');

console.log('=== Checking Extension Registration ===');

// Check package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const commands = packageJson.contributes.commands;

console.log('\n📋 Commands in package.json:');
commands.forEach(cmd => {
    if (cmd.command.includes('listAll')) {
        console.log(`✅ ${cmd.command}: ${cmd.title}`);
    }
});

// Check if commands are in the compiled extension
const extensionCode = fs.readFileSync(extensionPath, 'utf8');

console.log('\n🔍 Commands in compiled extension:');
if (extensionCode.includes('gitea.listAllPullRequests')) {
    console.log('✅ gitea.listAllPullRequests found in compiled code');
} else {
    console.log('❌ gitea.listAllPullRequests NOT found in compiled code');
}

if (extensionCode.includes('gitea.listAllIssues')) {
    console.log('✅ gitea.listAllIssues found in compiled code');
} else {
    console.log('❌ gitea.listAllIssues NOT found in compiled code');
}

console.log('\n🎯 Extension should be ready to use!');
console.log('Try restarting VS Code completely and then test the buttons.');
