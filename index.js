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

    console.log('\n🔍 Professional Code Quality Check\n');
    console.log('─'.repeat(50));
    console.log(`📦 Using ${pm} package manager`);
    console.log(`⚙️  Config: ${this.options.useProjectConfig ? 'Project configs' : 'Bundled configs'}\n`);

    if (showLogs) {
      console.log('📋 Detailed error logging enabled (--logs flag)\n');
    }

    for (const { name, cmd, description } of checks) {
      console.log(`Running ${name}...`);
      const result = this.runCommand(cmd, description);

      if (result.success) {
        console.log(`✅ ${name}: Passed`);
      } else {
        allPassed = false;
        console.log(`❌ ${name}: Failed`);
      }

      if (showLogs && result.output) {
        const icon = result.success ? '📄' : '❌';
        console.log(`\n${icon} ${name} ${result.success ? 'Output' : 'Error Details'}:`);
        console.log('─'.repeat(50));
        console.log(result.output);
        console.log('─'.repeat(50));
        console.log('');
      }

      results.push({ name, description, ...result });
    }

    // Generate report
    this._writeReport(results, allPassed, pm, runCmd);

    console.log('\n' + '─'.repeat(50));

    if (allPassed) {
      console.log('\n🎉 All quality checks passed! Code is ready for production.\n');
    } else {
      console.log('\n❌ Some quality checks failed. Please fix the issues above.\n');
      if (!showLogs) {
        console.log('💡 Run with --logs flag to see detailed errors in terminal');
      }
      console.log('📄 See .quality-report.md for detailed error information\n');
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
  checker.run({ showLogs: args.includes('--logs') }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { CodeQualityChecker, runQualityCheck };
