#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const showLogs = args.includes('--logs');

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            process.env[key] = valueParts.join('=');
          }
        }
      });
      
      console.log('✅ Loaded environment variables from .env');
    }
  } catch (error) {
    console.log('⚠️  Could not load .env file:', error.message);
  }
}

loadEnvFile();

console.log('\n🔍 Professional Code Quality Check\n');
console.log('─'.repeat(50));
console.log('📦 Using bun package manager\n');

if (showLogs) {
  console.log('📋 Detailed error logging enabled (--logs flag)\n');
}

// Prepare report
const reportPath = path.join(process.cwd(), '.quality-report.md');
const timestamp = new Date().toISOString();
let reportContent = `# Code Quality Report\n\n`;
reportContent += `**Generated**: ${timestamp}\n`;
reportContent += `**Package Manager**: bun\n\n`;
reportContent += `---\n\n`;

// Run quality checks
const checks = [
  { name: 'TypeScript', cmd: 'npx tsc --noEmit', description: 'Type checking and compilation' },
  { name: 'ESLint', cmd: 'npx eslint . --ext .js,.jsx,.ts,.tsx', description: 'Code linting and style checking' },
  { name: 'Prettier', cmd: 'npx prettier --check .', description: 'Code formatting validation' },
  { name: 'Knip', cmd: 'npx knip', description: 'Dead code detection' },
  { name: 'Snyk', cmd: 'npx snyk test --severity-threshold=high', description: 'Security vulnerability scanning' }
];

let allPassed = true;
const results = [];

checks.forEach(({ name, cmd, description }) => {
  console.log(`Running ${name}...`);
  
  reportContent += `## ${name}\n\n`;
  reportContent += `**Description**: ${description}\n\n`;
  reportContent += `**Command**: \`${cmd}\`\n\n`;
  
  try {
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    console.log(`✅ ${name}: Passed`);
    
    reportContent += `**Status**: ✅ **PASSED**\n\n`;
    if (output && output.trim()) {
      reportContent += `**Output**:\n\`\`\`\n${output.trim()}\n\`\`\`\n\n`;
      
      if (showLogs) {
        console.log(`\n📄 ${name} Output:`);
        console.log(output.trim());
        console.log('');
      }
    }
    
    results.push({ name, status: 'passed', output: output.trim() });
  } catch (error) {
    allPassed = false;
    const errorOutput = error.stdout || error.stderr || error.message || 'Unknown error';
    console.log(`❌ ${name}: Failed`);
    
    // Show errors in terminal if --logs flag is present
    if (showLogs) {
      console.log(`\n❌ ${name} Error Details:`);
      console.log('─'.repeat(50));
      console.log(errorOutput.trim());
      console.log('─'.repeat(50));
      console.log('');
    }
    
    reportContent += `**Status**: ❌ **FAILED**\n\n`;
    reportContent += `**Error Output**:\n\`\`\`\n${errorOutput.trim()}\n\`\`\`\n\n`;
    
    // Add suggestions for common issues
    reportContent += `**Suggestions**:\n`;
    if (name === 'TypeScript') {
      reportContent += `- Check type errors in the output above\n`;
      reportContent += `- Run \`npx tsc --noEmit\` to see detailed errors\n`;
      reportContent += `- Fix type mismatches and missing type definitions\n`;
    } else if (name === 'ESLint') {
      reportContent += `- Run \`bun run lint:fix\` to auto-fix issues\n`;
      reportContent += `- Check ESLint errors in the output above\n`;
      reportContent += `- Review and fix code style violations\n`;
    } else if (name === 'Prettier') {
      reportContent += `- Run \`bun run format:fix\` to auto-format files\n`;
      reportContent += `- Check formatting issues in the output above\n`;
    } else if (name === 'Knip') {
      reportContent += `- Remove unused exports and dependencies\n`;
      reportContent += `- Check dead code in the output above\n`;
    } else if (name === 'Snyk') {
      reportContent += `- Review security vulnerabilities in the output above\n`;
      reportContent += `- Update vulnerable dependencies\n`;
      reportContent += `- Run \`npx snyk wizard\` for guided fixes\n`;
    }
    reportContent += `\n`;
    
    results.push({ name, status: 'failed', error: errorOutput.trim() });
  }
  
  reportContent += `---\n\n`;
});

// Add summary
reportContent += `## Summary\n\n`;
reportContent += `**Total Checks**: ${checks.length}\n`;
reportContent += `**Passed**: ${results.filter(r => r.status === 'passed').length}\n`;
reportContent += `**Failed**: ${results.filter(r => r.status === 'failed').length}\n\n`;

if (allPassed) {
  reportContent += `### ✅ All quality checks passed!\n\n`;
  reportContent += `Your code is ready for production.\n\n`;
} else {
  reportContent += `### ❌ Some quality checks failed\n\n`;
  reportContent += `Please review the errors above and fix the issues.\n\n`;
  reportContent += `**Quick Fix Commands**:\n`;
  reportContent += `- \`bun run fix\` - Auto-fix linting and formatting\n`;
  reportContent += `- \`bun run type:check\` - Check TypeScript errors\n`;
  reportContent += `- \`bun run lint:check\` - Check ESLint errors\n`;
  reportContent += `- \`bun run format:check\` - Check Prettier formatting\n\n`;
}

// Add AI Agent section
reportContent += `---\n\n`;
reportContent += `## For AI Agents\n\n`;
reportContent += `This report contains detailed error information for automated code quality fixes.\n\n`;
reportContent += `**Failed Checks**: ${results.filter(r => r.status === 'failed').map(r => r.name).join(', ') || 'None'}\n\n`;
if (!allPassed) {
  reportContent += `**Action Required**:\n`;
  results.filter(r => r.status === 'failed').forEach(r => {
    reportContent += `- Fix ${r.name} errors\n`;
  });
  reportContent += `\n`;
}

// Write report to file (overwrite existing)
try {
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`\n📄 Quality report saved to: .quality-report.md`);
} catch (error) {
  console.error(`\n⚠️  Failed to write report: ${error.message}`);
}

console.log('\n' + '─'.repeat(50));

if (allPassed) {
  console.log('\n🎉 All quality checks passed! Code is ready for production.\n');
  process.exit(0);
} else {
  console.log('\n❌ Some quality checks failed. Please fix the issues above.\n');
  if (!showLogs) {
    console.log('💡 Run with --logs flag to see detailed errors in terminal');
  }
  console.log('📄 See .quality-report.md for detailed error information\n');
  process.exit(1);
}
