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

// Check if this is first run and setup configuration
function checkFirstRun() {
  const configPath = path.join(process.cwd(), '.code-quality.json');
  
  if (!fs.existsSync(configPath)) {
    colorLog('\n🔧 Code Quality Library - First Time Setup', 'bright');
    colorLog('─'.repeat(50), 'cyan');
    colorLog('\nChoose your quality rules configuration:', 'yellow');
    colorLog('1) Use library rules (recommended for new projects)', 'white');
    colorLog('2) Use project rules (keep existing configurations)', 'white');
    colorLog('3) Custom setup (choose specific tools)', 'white');
    
    // For now, default to library rules
    // In a real implementation, you would read user input here
    const choice = process.env.CODE_QUALITY_CHOICE || '1';
    
    const config = {
      useLibraryRules: choice === '1',
      useProjectRules: choice === '2',
      customSetup: choice === '3',
      tools: ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
      copyConfigs: choice === '1',
      version: '1.0.1'
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    if (choice === '1') {
      colorLog('\n✅ Using library rules - Config files will be copied', 'green');
    } else if (choice === '2') {
      colorLog('\n✅ Using project rules - Existing configs preserved', 'green');
    } else {
      colorLog('\n✅ Custom setup - Configure as needed', 'green');
    }
    
    colorLog('\n💡 To change this later, edit: .code-quality.json', 'cyan');
    colorLog('💡 Or run: code-quality --config to reconfigure', 'cyan');
    colorLog('─'.repeat(50), 'cyan');
    
    return config;
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    colorLog('⚠️  Invalid config file, using defaults', 'yellow');
    return {
      useLibraryRules: true,
      useProjectRules: false,
      customSetup: false,
      tools: ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
      copyConfigs: true
    };
  }
}

// Copy config files from library to project
function copyConfigFiles(packageManager) {
  const libPath = path.dirname(__dirname);
  const projectPath = process.cwd();
  
  const configs = [
    { src: '.eslintrc.js', dest: '.eslintrc.js' },
    { src: '.prettierrc', dest: '.prettierrc' },
    { src: 'knip.json', dest: 'knip.json' },
    { src: 'tsconfig.json', dest: 'tsconfig.json' }
  ];
  
  configs.forEach(({ src, dest }) => {
    const srcPath = path.join(libPath, src);
    const destPath = path.join(projectPath, dest);
    
    try {
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        colorLog(`✅ Copied ${dest}`, 'green');
      }
    } catch (error) {
      colorLog(`⚠️  Could not copy ${dest}: ${error.message}`, 'yellow');
    }
  });
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
    // Check first run configuration
    const config = checkFirstRun();
    
    this.options = {
      loadEnv: true,
      tools: config.tools || ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
      packageManager: detectPackageManager(),
      copyConfigs: config.copyConfigs !== false,
      useLibraryRules: config.useLibraryRules !== false,
      useProjectRules: config.useProjectRules || false,
      customSetup: config.customSetup || false,
      ...options
    };
    
    if (this.options.loadEnv) {
      loadEnvFile();
    }
    
    if (this.options.copyConfigs && this.options.useLibraryRules) {
      copyConfigFiles(this.options.packageManager);
    }
  }

  runCommand(command, description) {
    const startTime = Date.now();
    const result = {
      success: true,
      message: ''
    };
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      result.message = output.trim();
    } catch (error) {
      result.success = false;
      result.message = error.stdout.trim();
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    return {
      ...result,
      duration
    };
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
    for (const arg of args) {
      if (arg === '--no-configs') {
        this.options.copyConfigs = false;
      } else if (arg === '--config') {
        this.options.reconfigure = true;
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
  const options = {};
  
  // Check for reconfigure flag
  if (args.includes('--config')) {
    // Remove existing config and run setup again
    const configPath = path.join(process.cwd(), '.code-quality.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      colorLog('🔧 Configuration reset - Running setup again', 'yellow');
    }
  }
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--no-env') {
      options.loadEnv = false;
    } else if (arg === '--no-configs') {
      options.copyConfigs = false;
    } else if (arg.startsWith('--tools=')) {
      options.tools = arg.split('=')[1].split(',');
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Professional Code Quality Checker

Usage: code-quality [options]

Options:
  --no-env          Skip loading .env file
  --no-configs      Skip copying config files
  --config          Reconfigure setup choices
  --tools=tools     Comma-separated list of tools to run
                    (TypeScript,ESLint,Prettier,Knip,Snyk)
  --help, -h        Show this help message

Examples:
  code-quality                    # Run all tools
  code-quality --tools=ESLint     # Run only ESLint
  code-quality --no-env           # Skip .env loading
  code-quality --config           # Reconfigure setup
      `);
      process.exit(0);
    }
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('./package.json');
    console.log(pkg.version);
    process.exit(0);
  }
  
  const checker = new CodeQualityChecker(options);
  checker.run().then(({ success }) => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Error running quality checks:', error);
    process.exit(1);
  });
}
