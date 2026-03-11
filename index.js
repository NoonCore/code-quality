#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const fs = require('fs');
    const envPath = path.join(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');

      lines.forEach((line) => {
        // Skip comments and empty lines
        if (line.trim() && !line.trim().startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key.trim()] = value;
          }
        }
      });

      console.log('✅ Loaded environment variables from .env');
    }
  } catch (error) {
    // Continue without .env if file doesn't exist or can't be read
  }
}

// Colors for beautiful output
const colors = {
  success: '\x1b[32m\x1b[1m✅\x1b[0m',
  error: '\x1b[31m\x1b[1m❌\x1b[0m',
  warning: '\x1b[33m\x1b[1m⚠️\x1b[0m',
  info: '\x1b[34m\x1b[1mℹ️\x1b[0m',
  header: (text) => `\x1b[36m\x1b[1m${text}\x1b[0m`,
  text: (text) => `\x1b[37m${text}\x1b[0m`,
  dim: (text) => `\x1b[90m${text}\x1b[0m`,
};

function runCommand(command, description) {
  try {
    console.log(colors.dim(`Running ${description}...`));
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

function formatOutput(tool, result) {
  if (tool === 'TypeScript') {
    if (result.success) {
      return `${colors.success} TypeScript: ${colors.text('0 errors')}`;
    } else {
      const errors = (result.output.match(/error/g) || []).length;
      return `${colors.error} TypeScript: ${colors.text(`${errors} errors`)}`;
    }
  }

  if (tool === 'ESLint') {
    if (result.success) {
      return `${colors.success} ESLint: ${colors.text('0 errors, 0 warnings')}`;
    } else {
      const errors = (result.output.match(/error/g) || []).length;
      const warnings = (result.output.match(/warning/g) || []).length;
      return `${colors.error} ESLint: ${colors.text(`${errors} errors, ${warnings} warnings`)}`;
    }
  }

  if (tool === 'Prettier') {
    if (result.success) {
      return `${colors.success} Prettier: ${colors.text('All files formatted')}`;
    } else {
      return `${colors.error} Prettier: ${colors.text('Formatting issues found')}`;
    }
  }

  if (tool === 'Knip') {
    if (result.success && result.output.includes('✅ No Knip errors found')) {
      return `${colors.success} Knip: ${colors.text('No critical errors')}`;
    } else {
      const errors = (result.output.match(/error/g) || []).length;
      return `${colors.error} Knip: ${colors.text(`${errors} critical errors`)}`;
    }
  }

    if (tool === 'Snyk') {
      if (
        result.output.includes('Authentication required - run')
      ) {
        return `${colors.warning} Snyk: ${colors.text('Authentication required')}`;
      } else if (
        result.success &&
        result.output.includes('no vulnerable paths found')
      ) {
        return `${colors.success} Snyk: ${colors.text('No vulnerabilities')}`;
      } else if (
        result.output.includes('Authentication error') ||
        result.output.includes('SNYK-0005')
      ) {
        return `${colors.warning} Snyk: ${colors.text('Authentication required')}`;
      } else if (result.success) {
        const vulnerabilities = (result.output.match(/vulnerabilities/g) || [])
          .length;
        return `${colors.success} Snyk: ${colors.text(`${vulnerabilities} vulnerabilities found`)}`;
      } else {
        return `${colors.error} Snyk: ${colors.text('Scan failed')}`;
      }
    }

  return `${colors.error} ${tool}: ${colors.text('Unknown status')}`;
}

function checkSnykToken() {
  try {
    console.log(colors.dim('Checking Snyk authentication...'));

    // Check if SNYK_TOKEN is available in environment
    const snykToken = process.env.SNYK_TOKEN;
    if (snykToken && snykToken.startsWith('snyk_')) {
      console.log(colors.dim('✅ SNYK_TOKEN found in environment'));
      return true;
    }

    // Fallback to CLI authentication check
    const packageManager = detectPackageManager();
    const execCommand = getExecCommand(packageManager);
    const result = execSync(`${execCommand} snyk whoami --experimental`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    // Check if authentication was successful (returns username)
    return (
      result.trim().length > 0 &&
      !result.includes('Authentication error') &&
      !result.includes('SNYK-0005')
    );
  } catch (error) {
    return false;
  }
}

// Detect package manager
function detectPackageManager() {
  try {
    // Check for lock files
    const fs = require('fs');
    
    if (fs.existsSync('bun.lock')) {
      return 'bun';
    }
    if (fs.existsSync('pnpm-lock.yaml')) {
      return 'pnpm';
    }
    if (fs.existsSync('yarn.lock')) {
      return 'yarn';
    }
    if (fs.existsSync('package-lock.json')) {
      return 'npm';
    }
    
    // Fallback to checking if commands are available
    try {
      execSync('which bun', { stdio: 'ignore' });
      return 'bun';
    } catch {}
    
    try {
      execSync('which pnpm', { stdio: 'ignore' });
      return 'pnpm';
    } catch {}
    
    try {
      execSync('which yarn', { stdio: 'ignore' });
      return 'yarn';
    } catch {}
    
    return 'npm'; // Default fallback
  } catch (error) {
    return 'npm'; // Default fallback
  }
}

// Get package manager run command
function getRunCommand(packageManager) {
  switch (packageManager) {
    case 'bun': return 'bun run';
    case 'pnpm': return 'pnpm run';
    case 'yarn': return 'yarn';
    case 'npm': return 'npm run';
    default: return 'npm run';
  }
}

// Get package manager exec command
function getExecCommand(packageManager) {
  switch (packageManager) {
    case 'bun': return 'bunx';
    case 'pnpm': return 'pnpm dlx';
    case 'yarn': return 'yarn dlx';
    case 'npm': return 'npx';
    default: return 'npx';
  }
}

// Main class for the library
class CodeQualityChecker {
  constructor(options = {}) {
    const packageManager = options.packageManager || detectPackageManager();
    const runCommand = getRunCommand(packageManager);
    const execCommand = getExecCommand(packageManager);
    
    this.options = {
      loadEnv: true,
      tools: ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
      commands: {
        TypeScript: `${runCommand} type:check`,
        ESLint: `${runCommand} lint:check`,
        Prettier: `${runCommand} format:check`,
        Knip: `${runCommand} knip:error`,
        Snyk: `${runCommand} snyk`
      },
      descriptions: {
        TypeScript: 'TypeScript compilation',
        ESLint: 'ESLint validation',
        Prettier: 'Prettier formatting',
        Knip: 'Dead code detection',
        Snyk: 'Security vulnerability scan'
      },
      packageManager,
      ...options
    };
    
    if (this.options.loadEnv) {
      loadEnvFile();
    }
  }

  runCommand(command, description) {
    return runCommand(command, description);
  }

  formatOutput(tool, result) {
    return formatOutput(tool, result);
  }

  checkSnykToken() {
    return checkSnykToken();
  }

  async run() {
    console.log(colors.header('\n🔍 Professional Code Quality Check\n'));
    console.log(colors.dim('─'.repeat(50)));
    
    // Show detected package manager
    console.log(colors.dim(`📦 Using ${this.options.packageManager} package manager`));

    // Check Snyk authentication first
    const snykAuthenticated = this.checkSnykToken();

    const results = this.options.tools.map(tool => ({
      tool,
      command: tool === 'Snyk' && !snykAuthenticated
        ? `echo "Authentication required - add SNYK_TOKEN to .env or run ${getExecCommand(this.options.packageManager)} snyk auth"`
        : this.options.commands[tool],
      description: this.options.descriptions[tool]
    }));

    let allPassed = true;
    const outputs = [];

    for (const { tool, command, description } of results) {
      const result = this.runCommand(command, description);
      const output = this.formatOutput(tool, result);
      outputs.push(output);
      if (!result.success) {
        allPassed = false;
      }
    }

    console.log('\n');
    outputs.forEach((output) => console.log(output));

    console.log(colors.dim('─'.repeat(50)));

    if (allPassed) {
      console.log(
        '\n🎉 All quality checks passed! Code is ready for production.\n'
      );
      return { success: true, message: 'All checks passed' };
    } else {
      console.log(
        '\n❌ Some quality checks failed. Please fix the issues above.\n'
      );
      return { success: false, message: 'Some checks failed' };
    }
  }
}

// Export both the class and a simple function
module.exports = { CodeQualityChecker };

// If run directly, execute with default options
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: code-quality-lib [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version number');
    console.log('');
    console.log('Runs TypeScript, ESLint, Prettier, Knip, and Snyk checks.');
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('./package.json');
    console.log(pkg.version);
    process.exit(0);
  }

  const checker = new CodeQualityChecker();
  checker.run().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
