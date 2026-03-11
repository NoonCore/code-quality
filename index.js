#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Color codes for beautiful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Detect package manager
function detectPackageManager() {
  const cwd = process.cwd();
  
  if (fs.existsSync(path.join(cwd, 'bun.lockb'))) {
    return 'bun';
  } else if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  } else if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
    return 'npm';
  }
  
  // Default to npm if no lock file found
  return 'npm';
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
      copyConfigs: true,
      ...options
    };
    
    if (this.options.loadEnv) {
      loadEnvFile();
    }
    
    if (this.options.copyConfigs) {
      copyConfigFiles(this.options.packageManager);
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

    const args = process.argv.slice(2);
    if (args.includes('--no-configs')) {
      this.options.copyConfigs = false;
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
