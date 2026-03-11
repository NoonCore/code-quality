#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Package Manager Detection ──────────────────────────────────────────────

function detectPackageManager() {
  const cwd = process.cwd();
  const lockFiles = [
    { file: 'bun.lock', pm: 'bun' },
    { file: 'bun.lockb', pm: 'bun' },
    { file: 'pnpm-lock.yaml', pm: 'pnpm' },
    { file: 'yarn.lock', pm: 'yarn' },
    { file: 'package-lock.json', pm: 'npm' },
  ];

  for (const { file, pm } of lockFiles) {
    if (fs.existsSync(path.join(cwd, file))) return pm;
  }

  const binaries = ['bun', 'pnpm', 'yarn'];
  for (const bin of binaries) {
    try {
      execSync(`which ${bin}`, { stdio: 'ignore' });
      return bin;
    } catch {
      // not found, continue
    }
  }

  return 'npm';
}

function getExecPrefix(pm) {
  const map = { bun: 'bunx', pnpm: 'pnpm dlx', yarn: 'yarn dlx', npm: 'npx' };
  return map[pm] || 'npx';
}

function getRunPrefix(pm) {
  const map = { bun: 'bun run', pnpm: 'pnpm run', yarn: 'yarn', npm: 'npm run' };
  return map[pm] || 'npm run';
}

// ─── Environment Loading ────────────────────────────────────────────────────

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      if (key) process.env[key] = value;
    }
  } catch {
    // silently continue without .env
  }
}

// ─── Tool Path Resolution ───────────────────────────────────────────────────

function resolveToolBinDir() {
  try {
    return path.join(
      path.dirname(require.resolve('code-quality-lib/package.json')),
      'node_modules',
      '.bin'
    );
  } catch {
    return path.join(__dirname, 'node_modules', '.bin');
  }
}

// ─── Config File Detection ──────────────────────────────────────────────────

function detectProjectConfigs() {
  const cwd = process.cwd();
  const configs = {
    eslint: null,
    prettier: null,
    typescript: null,
    knip: null,
  };

  // ESLint config
  const eslintFiles = [
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    'eslint.config.js',
    'eslint.config.mjs',
  ];
  for (const file of eslintFiles) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      configs.eslint = fullPath;
      break;
    }
  }

  // Prettier config
  const prettierFiles = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    '.prettierrc.js',
    '.prettierrc.cjs',
    'prettier.config.js',
    'prettier.config.cjs',
  ];
  for (const file of prettierFiles) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      configs.prettier = fullPath;
      break;
    }
  }

  // TypeScript config
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    configs.typescript = tsconfigPath;
  }

  // Knip config
  const knipFiles = ['knip.json', 'knip.jsonc', '.knip.json', '.knip.jsonc'];
  for (const file of knipFiles) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      configs.knip = fullPath;
      break;
    }
  }

  return configs;
}

// ─── Default Checks ─────────────────────────────────────────────────────────

const DEFAULT_TOOLS = [
  { name: 'TypeScript', bin: 'tsc', args: '--noEmit', description: 'Type checking and compilation' },
  { name: 'ESLint', bin: 'eslint', args: '. --ext .js,.jsx,.ts,.tsx', description: 'Code linting and style checking' },
  { name: 'Prettier', bin: 'prettier', args: '--check .', description: 'Code formatting validation' },
  { name: 'Knip', bin: 'knip', args: '', description: 'Dead code detection' },
  { name: 'Snyk', bin: 'snyk', args: 'test --severity-threshold=high', description: 'Security vulnerability scanning' },
];

// ─── CodeQualityChecker Class ───────────────────────────────────────────────

class CodeQualityChecker {
  constructor(options = {}) {
    this.options = {
      loadEnv: options.loadEnv !== false,
      useProjectConfig: options.useProjectConfig !== false,
      tools: options.tools || DEFAULT_TOOLS.map((t) => t.name),
      commands: options.commands || {},
      descriptions: options.descriptions || {},
      packageManager: options.packageManager || detectPackageManager(),
    };

    if (this.options.loadEnv) loadEnvFile();

    // Detect project configs if useProjectConfig is enabled
    this.projectConfigs = this.options.useProjectConfig ? detectProjectConfigs() : {};
  }

  _getChecks() {
    const binDir = resolveToolBinDir();
    const checks = [];

    for (const toolName of this.options.tools) {
      const defaultTool = DEFAULT_TOOLS.find((t) => t.name === toolName);
      if (!defaultTool && !this.options.commands[toolName]) continue;

      let cmd = this.options.commands[toolName];

      // If no custom command, build default with config detection
      if (!cmd) {
        const binPath = path.join(binDir, defaultTool.bin);
        let args = defaultTool.args;

        // Add config flags if project configs exist and useProjectConfig is true
        if (this.options.useProjectConfig) {
          if (toolName === 'ESLint' && this.projectConfigs.eslint) {
            args = `${args} --config ${this.projectConfigs.eslint}`;
          } else if (toolName === 'Prettier' && this.projectConfigs.prettier) {
            args = `${args} --config ${this.projectConfigs.prettier}`;
          } else if (toolName === 'TypeScript' && this.projectConfigs.typescript) {
            args = `--project ${this.projectConfigs.typescript} --noEmit`;
          } else if (toolName === 'Knip' && this.projectConfigs.knip) {
            args = `--config ${this.projectConfigs.knip}`;
          }
        }

        cmd = `${binPath}${args ? ' ' + args : ''}`;
      }

      const description =
        this.options.descriptions[toolName] ||
        (defaultTool ? defaultTool.description : toolName);

      checks.push({ name: toolName, cmd, description });
    }

    return checks;
  }

  runCommand(command, description) {
    try {
      const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
      return { success: true, output: (output || '').trim() };
    } catch (error) {
      const output = error.stdout || error.stderr || error.message || 'Unknown error';
      return { success: false, output: output.trim() };
    }
  }

  async run(options = {}) {
    const showLogs = options.showLogs || false;
    const checks = this._getChecks();
    const pm = this.options.packageManager;
    const runCmd = getRunPrefix(pm);
    const results = [];
    let allPassed = true;
    let step = 1;

    // Header
    console.log('\n� Code Quality Setup');
    console.log('─'.repeat(50));
    console.log(`📦 Package Manager: ${pm}`);
    console.log(`⚙️  Config: ${this.options.useProjectConfig ? 'Project configs' : 'Bundled configs'}`);
    console.log(`🔧 Tools: ${checks.length} quality checks\n`);

    if (showLogs) {
      console.log('📋 Verbose logging enabled\n');
    }

    // Run each check with step-by-step output
    for (const { name, cmd, description } of checks) {
      const stepNum = String(step).padStart(2, ' ');
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let spinIndex = 0;

      // Show starting message
      process.stdout.write(`${stepNum}. ${name}... `);
      
      // Simple spinner (simulate work)
      const spinInterval = setInterval(() => {
        process.stdout.write(`\r${stepNum}. ${name}... ${spinner[spinIndex]}`);
        spinIndex = (spinIndex + 1) % spinner.length;
      }, 100);

      // Run the actual check
      const result = this.runCommand(cmd, description);
      
      // Stop spinner
      clearInterval(spinInterval);

      // Show result
      if (result.success) {
        process.stdout.write(`\r${stepNum}. ${name}... ✅ Done\n`);
      } else {
        allPassed = false;
        process.stdout.write(`\r${stepNum}. ${name}... ❌ Failed\n`);
      }

      // Show details if logs enabled
      if (showLogs && result.output) {
        console.log(`   ${result.success ? '📄 Output:' : '❌ Error:'}`);
        console.log('   ' + '─'.repeat(48));
        const lines = result.output.split('\n');
        for (const line of lines.slice(0, 10)) { // Limit output
          console.log(`   ${line}`);
        }
        if (lines.length > 10) {
          console.log(`   ... (${lines.length - 10} more lines)`);
        }
        console.log('   ' + '─'.repeat(48));
      }

      results.push({ name, description, ...result });
      step++;
    }

    // Generate report
    this._writeReport(results, allPassed, pm, runCmd);

    // Summary
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Quality Check Summary\n');
    
    const passed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Show results with checkmarks/strikes
    for (const result of results) {
      const icon = result.success ? '✅' : '❌';
      const name = result.name.padEnd(12, ' ');
      console.log(`${icon} ${name}${result.success ? 'Passed' : 'Failed'}`);
    }
    
    console.log('\n' + '─'.repeat(50));
    
    if (allPassed) {
      console.log('🎉 Success! All quality checks passed.\n');
      console.log('✅ Your code is ready for production!\n');
    } else {
      console.log('❌ Some quality checks failed.\n');
      console.log(`📊 Results: ${passed.length} passed, ${failed.length} failed\n`);
      if (!showLogs) {
        console.log('💡 Run with --logs flag to see detailed errors');
      }
      console.log('📄 See .quality-report.md for full details\n');
    }

    return {
      success: allPassed,
      message: allPassed ? 'All quality checks passed' : 'Some quality checks failed',
      results,
    };
  }

  _writeReport(results, allPassed, pm, runCmd) {
    const reportPath = path.join(process.cwd(), '.quality-report.md');
    const timestamp = new Date().toISOString();
    const passed = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    let report = `# Code Quality Report\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Package Manager**: ${pm}\n\n`;
    report += `---\n\n`;

    for (const r of results) {
      report += `## ${r.name}\n\n`;
      report += `**Description**: ${r.description}\n\n`;
      report += `**Status**: ${r.success ? '✅ **PASSED**' : '❌ **FAILED**'}\n\n`;
      if (r.output) {
        report += `**Output**:\n\`\`\`\n${r.output}\n\`\`\`\n\n`;
      }
      report += `---\n\n`;
    }

    report += `## Summary\n\n`;
    report += `**Total Checks**: ${results.length}\n`;
    report += `**Passed**: ${passed.length}\n`;
    report += `**Failed**: ${failed.length}\n\n`;

    if (allPassed) {
      report += `### ✅ All quality checks passed!\n\nYour code is ready for production.\n\n`;
    } else {
      report += `### ❌ Some quality checks failed\n\n`;
      report += `**Quick Fix Commands**:\n`;
      report += `- \`${runCmd} lint:fix\` — Auto-fix linting issues\n`;
      report += `- \`${runCmd} format:fix\` — Auto-format code\n\n`;
    }

    report += `---\n\n## For AI Agents\n\n`;
    report += `**Failed Checks**: ${failed.map((r) => r.name).join(', ') || 'None'}\n\n`;
    if (!allPassed) {
      report += `**Action Required**:\n`;
      for (const r of failed) {
        report += `- Fix ${r.name} errors\n`;
      }
      report += `\n`;
    }

    try {
      fs.writeFileSync(reportPath, report, 'utf8');
      console.log(`\n📄 Quality report saved to: .quality-report.md`);
    } catch (err) {
      console.error(`\n⚠️  Failed to write report: ${err.message}`);
    }
  }
}

// ─── Convenience Function ───────────────────────────────────────────────────

async function runQualityCheck(options = {}) {
  const checker = new CodeQualityChecker(options);
  return checker.run({ showLogs: options.showLogs || false });
}

// ─── Config Generation ────────────────────────────────────────────────────

function generateConfigFile() {
  const configPath = path.join(process.cwd(), '.code-quality.json');
  
  const config = {
    version: '1.0.0',
    tools: ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
    packageManager: detectPackageManager(),
    useProjectConfig: true,
    loadEnv: true,
    commands: {
      TypeScript: 'tsc --noEmit',
      ESLint: '. --ext .js,.jsx,.ts,.tsx',
      Prettier: '--check .',
      Knip: '',
      Snyk: 'test --severity-threshold=high'
    },
    descriptions: {
      TypeScript: 'Type checking and compilation',
      ESLint: 'Code linting and style checking',
      Prettier: 'Code formatting validation',
      Knip: 'Dead code detection',
      Snyk: 'Security vulnerability scanning'
    },
    generated: new Date().toISOString(),
    readme: `# Code Quality Configuration

This file controls how code-quality-lib runs checks in this project.

## Options Explained

- **tools**: Array of tools to run. Remove any you don't need.
- **packageManager**: Auto-detected, but you can force one (npm, bun, pnpm, yarn)
- **useProjectConfig**: Use project's own .eslintrc, .prettierrc, etc. (true) or bundled configs (false)
- **loadEnv**: Load .env file before running checks
- **commands**: Override default commands for each tool
- **descriptions**: Custom descriptions shown during execution

## Usage

\`\`\`javascript
const { CodeQualityChecker } = require('code-quality-lib');
const config = require('./.code-quality.json');

const checker = new CodeQualityChecker(config);
await checker.run();
\`\`\`

Or with CLI (will automatically use this config):
\`\`\`bash
code-quality
\`\`\``
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Configuration file created: ${configPath}`);
    console.log('📝 Edit the file to customize your quality checks');
    console.log('📖 See the readme section in the file for guidance');
  } catch (error) {
    console.error(`❌ Failed to create config file: ${error.message}`);
    process.exit(1);
  }
}

function loadConfigFile() {
  const configPath = path.join(process.cwd(), '.code-quality.json');
  
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Failed to load .code-quality.json: ${error.message}`);
    return null;
  }
}

// ─── Interactive Wizard ───────────────────────────────────────────────────

async function runWizard() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🧙‍♂️ Code Quality Setup Wizard');
  console.log('─'.repeat(50));
  console.log('Let\'s configure your quality checks!\n');

  // Step 1: Package Manager
  const pm = detectPackageManager();
  console.log(`📦 Detected package manager: ${pm}`);
  const pmAnswer = await askQuestion(rl, `Use ${pm}? (Y/n): `);
  const selectedPm = pmAnswer.toLowerCase().startsWith('n') ? 
    await askQuestion(rl, 'Enter package manager (npm/bun/pnpm/yarn): ') : pm;

  // Step 2: Config Type
  console.log('\n⚙️  Config Options:');
  console.log('1. Project configs (use your .eslintrc, .prettierrc, etc.)');
  console.log('2. Bundled configs (use library\'s built-in configs)');
  const configAnswer = await askQuestion(rl, 'Choose config type (1/2) [1]: ');
  const useProjectConfig = configAnswer !== '2';

  // Step 3: Tools Selection
  console.log('\n🔧 Select tools to run (space-separated, or "all"):');
  console.log('Available: TypeScript, ESLint, Prettier, Knip, Snyk');
  const toolsAnswer = await askQuestion(rl, 'Tools [all]: ');
  const tools = toolsAnswer.toLowerCase() === 'all' || !toolsAnswer.trim() ?
    ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'] :
    toolsAnswer.split(/\s+/).map(t => t.trim()).filter(t => t);

  // Step 4: Load .env
  console.log('\n🌍 Environment Variables:');
  const envAnswer = await askQuestion(rl, 'Load .env file before checks? (Y/n) [Y]: ');
  const loadEnv = !envAnswer.toLowerCase().startsWith('n');

  // Step 5: Show summary and confirm
  console.log('\n📋 Configuration Summary:');
  console.log('─'.repeat(50));
  console.log(`📦 Package Manager: ${selectedPm}`);
  console.log(`⚙️  Config: ${useProjectConfig ? 'Project configs' : 'Bundled configs'}`);
  console.log(`🔧 Tools: ${tools.join(', ')}`);
  console.log(`🌍 Load .env: ${loadEnv ? 'Yes' : 'No'}`);
  console.log('─'.repeat(50));

  const confirm = await askQuestion(rl, 'Run checks with these settings? (Y/n): ');
  
  rl.close();

  if (confirm.toLowerCase().startsWith('n')) {
    console.log('\n❌ Wizard cancelled. Use --config flag to generate config file manually.');
    process.exit(0);
  }

  // Run with wizard settings
  const config = {
    packageManager: selectedPm,
    useProjectConfig,
    tools,
    loadEnv
  };

  const checker = new CodeQualityChecker(config);
  const result = await checker.run({ showLogs: false });
  
  process.exit(result.success ? 0 : 1);
}

function askQuestion(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: code-quality [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version number');
    console.log('  --logs         Show detailed error logs');
    console.log('  --config       Generate .code-quality.json configuration file');
    console.log('  --wizard       Run interactive setup wizard');
    console.log('');
    console.log('Examples:');
    console.log('  code-quality                    # Run checks with defaults');
    console.log('  code-quality --wizard           # Run interactive wizard');
    console.log('  code-quality --config            # Generate config file');
    console.log('  code-quality --logs              # Run with verbose output');
    console.log('');
    console.log('Runs TypeScript, ESLint, Prettier, Knip, and Snyk checks.');
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('./package.json');
    console.log(pkg.version);
    process.exit(0);
  }

  if (args.includes('--config')) {
    generateConfigFile();
    process.exit(0);
  }

  if (args.includes('--wizard')) {
    runWizard().catch(err => {
      console.error('❌ Wizard error:', err.message);
      process.exit(1);
    });
    return;
  }

  // Load config file if exists
  const config = loadConfigFile();
  const checker = new CodeQualityChecker(config || {});
  checker.run({ showLogs: args.includes('--logs') }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { CodeQualityChecker, runQualityCheck };
