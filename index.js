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
  // Always use project's node_modules/.bin first (where code-quality is installed)
  const projectBinDir = path.join(process.cwd(), 'node_modules', '.bin');
  
  // Fallback to library's bundled binaries if project doesn't have them
  const libBinDir = path.join(__dirname, 'node_modules', '.bin');
  
  // Check if project has node_modules/.bin directory
  if (fs.existsSync(projectBinDir)) {
    return projectBinDir;
  }
  
  return libBinDir;
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
  { name: 'ESLint', bin: 'eslint', args: '. --ext .js,.jsx,.ts,.tsx', description: 'Code linting and style checking' },
  { name: 'TypeScript', bin: 'tsc', args: '--noEmit', description: 'Type checking and compilation' },
  { name: 'Prettier', bin: 'prettier', args: '--check .', description: 'Code formatting validation' },
  { name: 'Knip', bin: 'knip', args: '', description: 'Dead code detection' },
  { name: 'Snyk', bin: 'snyk', args: 'test --severity-threshold=high', description: 'Security vulnerability scanning' },
];

// ─── CodeQualityChecker Class ───────────────────────────────────────────────

class CodeQualityChecker {
  constructor(options = {}) {
    // Detect environment
    const env = options.environment || process.env.NODE_ENV || process.env.CODE_QUALITY_ENV || 'development';
    
    this.options = {
      loadEnv: options.loadEnv !== false,
      useProjectConfig: options.useProjectConfig !== false,
      tools: this._resolveToolsForEnvironment(options.tools, options.environments, env),
      commands: options.commands || {},
      descriptions: options.descriptions || {},
      packageManager: options.packageManager || detectPackageManager(),
      environment: env,
      environments: options.environments || {},
    };

    if (this.options.loadEnv) loadEnvFile();

    // Detect project configs if useProjectConfig is enabled
    this.projectConfigs = this.options.useProjectConfig ? detectProjectConfigs() : {};
  }

  _resolveToolsForEnvironment(tools, environments, env) {
    // If environment-specific tools are defined
    if (environments && environments[env] && environments[env].tools) {
      return environments[env].tools;
    }
    
    // If default tools are provided
    if (tools) {
      return tools;
    }
    
    // Fallback to default tools based on environment
    if (env === 'ci' || env === 'production' || env === 'test') {
      // CI/CD: Run all tools for comprehensive checks
      return DEFAULT_TOOLS.map((t) => t.name);
    } else {
      // Development: Run essential tools only
      return ['ESLint', 'TypeScript', 'Prettier'];
    }
  }

  _getChecks() {
    const binDir = resolveToolBinDir();
    const checks = [];

    for (const toolName of this.options.tools) {
      const defaultTool = DEFAULT_TOOLS.find((t) => t.name === toolName);
      if (!defaultTool && !this.options.commands[toolName]) continue;

      let cmd = this.options.commands[toolName];

      // If custom command provided, use it directly (assumes tools are in PATH or project's node_modules)
      if (cmd) {
        // Custom command - use as-is, tools should be available in project's node_modules/.bin or PATH
        // No need to prepend full path
      } else {
        // No custom command - build default
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
    // Check for Snyk token before running Snyk
    if (description.includes('Security vulnerability scanning')) {
      if (!process.env.SNYK_TOKEN) {
        return {
          success: false,
          output: '⚠️  SNYK_TOKEN not found in environment variables. Please set SNYK_TOKEN in your .env file or run:\n  export SNYK_TOKEN=your_token_here\n\nYou can get a free token at: https://snyk.io/login'
        };
      }
    }

    try {
      const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
      return { success: true, output: (output || '').trim() };
    } catch (error) {
      const output = error.stdout || error.stderr || error.message || 'Unknown error';
      return { success: false, output: output.trim() };
    }
  }

  _parseErrorCounts(toolName, output) {
    if (!output) return { errors: 0, warnings: 0 };

    let errors = 0;
    let warnings = 0;

    switch (toolName) {
      case 'TypeScript': {
        // Parse individual TypeScript errors in tsc format
        const errorLines = output.split('\n').filter(line => line.includes(' - error TS'));
        errors = errorLines.length;
        
        // Also try the "Found X errors" format as fallback
        if (errors === 0) {
          const errorMatch = output.match(/Found (\d+) errors?/);
          if (errorMatch) errors = parseInt(errorMatch[1], 10);
        }
        break;
      }
      case 'ESLint': {
        // ESLint format: "✖ X problems (Y errors, Z warnings)" or individual error lines
        const problemMatch = output.match(/(\d+) errors?, (\d+) warnings?/);
        if (problemMatch) {
          errors = parseInt(problemMatch[1], 10);
          warnings = parseInt(problemMatch[2], 10);
        } else {
          // Count individual error/warning lines as fallback
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.includes('error ')) errors++;
            if (line.includes('warning ')) warnings++;
          }
        }
        break;
      }
      case 'Prettier': {
        // Prettier lists files that need formatting
        const lines = output.split('\n');
        const filesNeedingFormatting = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed && 
                 !trimmed.includes('Code style issues') && 
                 !trimmed.includes('formatted') &&
                 !trimmed.includes('issues found') &&
                 !trimmed.includes('files listed') &&
                 !trimmed.startsWith('[') &&
                 !trimmed.startsWith('{');
        });
        errors = filesNeedingFormatting.length;
        break;
      }
      case 'Knip': {
        // Knip shows issues per category with detailed counts
        const issueMatches = output.match(/\d+\s+(unused|unlisted|unresolved|duplicate)/gi);
        if (issueMatches) {
          errors = issueMatches.reduce((sum, match) => {
            const num = parseInt(match.match(/\d+/)[0], 10);
            return sum + num;
          }, 0);
        } else {
          // Fallback: count lines with issue keywords
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.includes('unused') || line.includes('unlisted') || 
                line.includes('unresolved') || line.includes('duplicate') ||
                line.includes('Unused') || line.includes('Unlisted') ||
                line.includes('Unresolved') || line.includes('Duplicate')) {
              errors++;
            }
          }
        }
        break;
      }
      default:
        break;
    }

    return { errors, warnings };
  }

  _parseErrorLines(toolName, output) {
    if (!output) return [];

    const errorLines = [];

    switch (toolName) {
      case 'TypeScript': {
        // Extract individual TypeScript error lines in tsc format
        const lines = output.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Match tsc error format: "src/file.ts:58:17 - error TS2552: Cannot find name"
          if (line.includes(' - error TS') && line.includes(':')) {
            errorLines.push(line);
          }
        }
        break;
      }
      case 'ESLint': {
        // Extract ESLint error lines in standard format
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Match ESLint format: "path/to/file:line:column: error message (rule)"
          if (trimmedLine.includes(':') && (trimmedLine.includes('error ') || trimmedLine.includes('warning '))) {
            // Remove any ANSI color codes and clean up
            const cleanLine = trimmedLine.replace(/\u001b\[[0-9;]*m/g, '');
            errorLines.push(cleanLine);
          }
        }
        break;
      }
      case 'Prettier': {
        // Extract files that need formatting in clean format
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip generic messages and JSON output
          if (!trimmedLine || 
              trimmedLine.includes('Code style issues') || 
              trimmedLine.includes('formatted') ||
              trimmedLine.includes('issues found') ||
              trimmedLine.includes('files listed') ||
              trimmedLine.includes('Checking formatting...') ||
              trimmedLine.startsWith('[') || 
              trimmedLine.startsWith('{') ||
              trimmedLine.startsWith('{') ||
              trimmedLine.match(/^\d+ files?/) || // "1 file" or "2 files"
              trimmedLine.match(/^.*\d+ files? checked/) // "2 files checked"
             ) {
            continue;
          }
          
          // Match file paths - various Prettier output formats
          if (trimmedLine.includes('/') || trimmedLine.includes('.')) {
            // Clean up the file path and add context
            let filePath = trimmedLine;
            
            // Remove any leading symbols or brackets
            filePath = filePath.replace(/^[\[\]\s]+/, '').replace(/[\[\]\s]+$/, '');
            
            // Skip if it looks like a directory or non-file
            if (filePath.endsWith('/') || !filePath.includes('.')) {
              continue;
            }
            
            errorLines.push(`File needs formatting: ${filePath}`);
          }
        }
        
        // If no specific files were found but Prettier failed, add a generic message
        if (errorLines.length === 0 && output.includes('issues')) {
          errorLines.push('Code formatting issues detected - run prettier --write . to fix');
        }
        
        break;
      }
      case 'Knip': {
        // Extract Knip issues in structured format
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Match Knip issue patterns
          if (trimmedLine.includes('unused') || 
              trimmedLine.includes('unlisted') || 
              trimmedLine.includes('unresolved') || 
              trimmedLine.includes('duplicate') ||
              trimmedLine.includes('Unused') ||
              trimmedLine.includes('Unlisted') ||
              trimmedLine.includes('Unresolved') ||
              trimmedLine.includes('Duplicate')) {
            // Clean up and format for AI readability
            const cleanLine = trimmedLine.replace(/\u001b\[[0-9;]*m/g, ''); // Remove ANSI codes
            errorLines.push(cleanLine);
          }
        }
        break;
      }
      default:
        break;
    }

    return errorLines;
  }

  async run(options = {}) {
    const showLogs = options.showLogs || false;
    
    // Load .env file if enabled
    if (this.options.loadEnv) {
      try {
        const dotenvPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(dotenvPath)) {
          // Try to load dotenv as optional dependency
          let dotenv;
          try {
            dotenv = require('dotenv');
          } catch (dotenvError) {
            // dotenv not installed, skip .env loading
            console.log('⚠️  dotenv not installed. Install with: npm install dotenv');
          }
          
          if (dotenv) {
            dotenv.config({ path: dotenvPath });
          }
        }
      } catch (error) {
        // .env file missing or other error, continue without it
      }
    }
    
    const checks = this._getChecks();
    const pm = this.options.packageManager;
    const runCmd = getRunPrefix(pm);
    const results = [];
    let allPassed = true;
    let step = 1;

    // Header
    console.log('\n🔧 Code Quality Setup');
    console.log('─'.repeat(50));
    console.log(`📦 Package Manager: ${pm}`);
    console.log(`🌍 Environment: ${this.options.environment}`);
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

      const counts = this._parseErrorCounts(name, result.output);
      const errorLines = this._parseErrorLines(name, result.output);
      results.push({ name, description, ...result, ...counts, errorLines });
      step++;
    }

    // Generate report
    this._writeReport(results, allPassed, pm, runCmd);

    // Summary
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Quality Check Summary\n');
    
    const passed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Show results with checkmarks/strikes and error counts
    for (const result of results) {
      const icon = result.success ? '✅' : '❌';
      const name = result.name.padEnd(12, ' ');
      let status = result.success ? 'Passed' : 'Failed';
      
      if (!result.success && (result.errors > 0 || result.warnings > 0)) {
        const parts = [];
        if (result.errors > 0) parts.push(`${result.errors} error${result.errors !== 1 ? 's' : ''}`);
        if (result.warnings > 0) parts.push(`${result.warnings} warning${result.warnings !== 1 ? 's' : ''}`);
        status = `${status} (${parts.join(', ')})`;
      }
      
      console.log(`${icon} ${name}${status}`);
      
      // Show individual error lines for failed tools only when --logs is used
      if (!result.success && result.errorLines && result.errorLines.length > 0 && showLogs) {
        console.log(`   📝 Error details:`);
        for (const errorLine of result.errorLines) {
          console.log(`   • ${errorLine}`);
        }
      }
    }
    
    console.log('\n' + '─'.repeat(50));
    
    if (allPassed) {
      console.log('🎉 Success! All quality checks passed.\n');
      console.log('✅ Your code is ready for production!\n');
    } else {
      console.log('❌ Some quality checks failed.\n');
      console.log(`📊 Results: ${passed.length} passed, ${failed.length} failed\n`);
      
      // Show summary of all errors for AI analysis
      console.log('🤖 For AI Analysis - Summary of All Errors:\n');
      for (const result of failed) {
        if (result.errorLines && result.errorLines.length > 0) {
          console.log(`## ${result.name} Errors:`);
          for (const errorLine of result.errorLines) {
            console.log(errorLine);
          }
          console.log(''); // Empty line between tools
        }
      }
      
      if (!showLogs) {
        console.log('💡 Run with --logs flag to see full tool output');
      }
      console.log('📄 See .quality-report.md for complete details\n');
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
  const configDir = path.join(process.cwd(), '.code-quality');
  const configPath = path.join(configDir, 'config.json');
  
  // Create .code-quality directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const config = {
    version: '1.0.0',
    tools: undefined, // Use environment-based tools
    environments: {
      development: {
        tools: ['ESLint', 'TypeScript', 'Prettier']
      },
      ci: {
        tools: ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']
      },
      production: {
        tools: ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']
      }
    },
    packageManager: detectPackageManager(),
    useProjectConfig: true,
    loadEnv: true,
    commands: {
      ESLint: '. --ext .js,.jsx,.ts,.tsx',
      TypeScript: 'tsc --noEmit',
      Prettier: '--check .',
      Knip: '',
      Snyk: 'test --severity-threshold=high'
    },
    descriptions: {
      ESLint: 'Code linting and style checking',
      TypeScript: 'Type checking and compilation',
      Prettier: 'Code formatting validation',
      Knip: 'Dead code detection',
      Snyk: 'Security vulnerability scanning'
    },
    generated: new Date().toISOString()
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    // Copy reference configs from library to .code-quality/
    const libConfigDir = path.join(__dirname, '.code-quality');
    const referenceConfigs = ['tsconfig.json', 'eslint.config.mjs', '.prettierrc', '.prettierignore', 'knip.json', 'README.md'];
    
    for (const configFile of referenceConfigs) {
      const srcPath = path.join(libConfigDir, configFile);
      const destPath = path.join(configDir, configFile);
      
      if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    console.log(`✅ Configuration directory created: ${configDir}`);
    console.log('📝 Reference config files copied to .code-quality/');
    console.log('📖 See .code-quality/README.md for usage guidance');
  } catch (error) {
    console.error(`❌ Failed to create config: ${error.message}`);
    process.exit(1);
  }
}

function loadConfigFile() {
  // Try new location first: .code-quality/config.json
  const newConfigPath = path.join(process.cwd(), '.code-quality', 'config.json');
  
  if (fs.existsSync(newConfigPath)) {
    try {
      const content = fs.readFileSync(newConfigPath, 'utf8');
      let config = JSON.parse(content);
      
      // Migrate old format to new environment-based structure
      if (config.tools && Array.isArray(config.tools) && (!config.environments || Object.keys(config.environments).length === 0)) {
        console.log('🔄 Migrating configuration to environment-based format...');
        console.log(`📝 Migrating tools: ${config.tools.join(', ')}`);
        
        config.environments = {
          development: {
            tools: [...config.tools] // Copy the array
          },
          ci: {
            tools: ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']
          },
          production: {
            tools: ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']
          }
        };
        config.tools = undefined; // Remove old tools array
        
        // Save migrated config
        fs.writeFileSync(newConfigPath, JSON.stringify(config, null, 2), 'utf8');
        console.log('✅ Configuration migrated successfully');
        console.log(`📁 Updated config saved to: ${newConfigPath}`);
      } else if (config.tools && Array.isArray(config.tools)) {
        console.log('⚠️  Migration condition not met. Existing environments:', config.environments);
      }
      
      return config;
    } catch (error) {
      console.warn(`⚠️  Failed to load .code-quality/config.json: ${error.message}`);
    }
  }
  
  // Fallback to old location: .code-quality.json (for backward compatibility)
  const oldConfigPath = path.join(process.cwd(), '.code-quality.json');
  
  if (fs.existsSync(oldConfigPath)) {
    try {
      const content = fs.readFileSync(oldConfigPath, 'utf8');
      let config = JSON.parse(content);
      
      // Migrate old format to new environment-based structure
      if (config.tools && !config.environments) {
        console.log('🔄 Migrating configuration to environment-based format...');
        config.environments = {
          development: {
            tools: config.tools
          },
          ci: {
            tools: ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']
          },
          production: {
            tools: ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']
          }
        };
        config.tools = undefined; // Remove old tools array
        
        // Save to new location and remove old file
        const configDir = path.join(process.cwd(), '.code-quality');
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(newConfigPath, JSON.stringify(config, null, 2), 'utf8');
        fs.unlinkSync(oldConfigPath);
        console.log('✅ Configuration migrated to .code-quality/config.json');
      }
      
      console.log('ℹ️  Using legacy .code-quality.json (consider migrating to .code-quality/config.json)');
      return config;
    } catch (error) {
      console.warn(`⚠️  Failed to load .code-quality.json: ${error.message}`);
    }
  }
  
  return null;
}

// ─── Interactive Wizard ───────────────────────────────────────────────────

async function runWizard() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Check if config already exists
  const existingConfig = loadConfigFile();
  if (existingConfig) {
    console.log('\n📋 Found existing configuration:');
    console.log(`📦 Package Manager: ${existingConfig.packageManager || 'auto-detected'}`);
    console.log(`⚙️  Config: ${existingConfig.useProjectConfig !== false ? 'Project configs' : 'Bundled configs'}`);
    console.log(`🔧 Tools: ${(existingConfig.tools || ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk']).join(', ')}`);
    console.log(`🌍 Load .env: ${existingConfig.loadEnv !== false ? 'Yes' : 'No'}`);
    
    const rerun = await askQuestion(rl, '\nReconfigure? (y/N): ');
    if (!rerun.toLowerCase().startsWith('y')) {
      rl.close();
      // Run with existing config
      const checker = new CodeQualityChecker(existingConfig);
      const result = await checker.run({ showLogs: false });
      process.exit(result.success ? 0 : 1);
    }
  }

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
  console.log('\n⚙️  Use project config files (.eslintrc, .prettierrc, etc.)?');
  console.log('Answer "No" to use bundled configs from code-quality-lib');
  const configAnswer = await askQuestion(rl, 'Use project configs? (y/N): ');
  const useProjectConfig = configAnswer.toLowerCase().startsWith('y');

  // Step 3: Tools Selection (Checkbox style)
  console.log('\n🔧 Select tools to run (default = all checked):');
  const allTools = ['ESLint', 'TypeScript', 'Prettier', 'Knip', 'Snyk'];
  const selectedTools = [];
  
  for (const tool of allTools) {
    // Default to Yes for ESLint, TypeScript, Prettier
    const isDefaultYes = ['ESLint', 'TypeScript', 'Prettier'].includes(tool);
    const prompt = isDefaultYes ? `[✓] ${tool}? (Y/n): ` : `[ ] ${tool}? (y/N): `;
    const answer = await askQuestion(rl, prompt);
    
    // For default Yes tools, include unless user explicitly says 'n'
    // For others, include only if user explicitly says 'y'
    if (isDefaultYes) {
      if (!answer.toLowerCase().startsWith('n')) {
        selectedTools.push(tool);
      }
    } else {
      if (answer.toLowerCase().startsWith('y')) {
        selectedTools.push(tool);
      }
    }
  }

  // Step 4: Environment Configuration
  console.log('\n🌍 Set up environment-specific tool sets?');
  console.log('This allows different tools for development vs CI/CD');
  const envConfigAnswer = await askQuestion(rl, 'Configure environments? (y/N): ');
  const configureEnvironments = envConfigAnswer.toLowerCase().startsWith('y');
  
  let environments = {};
  if (configureEnvironments) {
    console.log('\n🔧 Configure development tools (default: ESLint, TypeScript, Prettier):');
    const devTools = [];
    for (const tool of allTools) {
      const isDefaultYes = ['ESLint', 'TypeScript', 'Prettier'].includes(tool);
      const prompt = isDefaultYes ? `[✓] ${tool}? (Y/n): ` : `[ ] ${tool}? (y/N): `;
      const answer = await askQuestion(rl, prompt);
      
      if (isDefaultYes) {
        if (!answer.toLowerCase().startsWith('n')) {
          devTools.push(tool);
        }
      } else {
        if (answer.toLowerCase().startsWith('y')) {
          devTools.push(tool);
        }
      }
    }
    
    console.log('\n🚀 Configure CI/CD tools (default: all tools):');
    const ciTools = [];
    for (const tool of allTools) {
      const answer = await askQuestion(rl, `[✓] ${tool}? (Y/n): `);
      if (!answer.toLowerCase().startsWith('n')) {
        ciTools.push(tool);
      }
    }
    
    environments = {
      development: { tools: devTools },
      ci: { tools: ciTools },
      production: { tools: ciTools }
    };
  }

  // Step 5: Load .env
  console.log('\n🌍 Load .env file before running checks?');
  const envAnswer = await askQuestion(rl, 'Load .env? (Y/n): ');
  const loadEnv = !envAnswer.toLowerCase().startsWith('n');

  // Step 6: Show summary and confirm
  console.log('\n📋 Configuration Summary:');
  console.log('─'.repeat(50));
  console.log(`📦 Package Manager: ${selectedPm}`);
  console.log(`⚙️  Config: ${useProjectConfig ? 'Project configs' : 'Bundled configs'}`);
  
  if (configureEnvironments) {
    console.log(`🌍 Environment Config: Enabled`);
    console.log(`🔧 Development: ${environments.development.tools.join(', ')}`);
    console.log(`🚀 CI/CD: ${environments.ci.tools.join(', ')}`);
  } else {
    console.log(`🔧 Tools: ${selectedTools.join(', ')}`);
  }
  
  console.log(`🌍 Load .env: ${loadEnv ? 'Yes' : 'No'}`);
  console.log('─'.repeat(50));

  const confirm = await askQuestion(rl, 'Run checks with these settings? (Y/n): ');
  
  rl.close();

  if (confirm.toLowerCase().startsWith('n')) {
    console.log('\n❌ Wizard cancelled. Use --config flag to generate config file manually.');
    process.exit(0);
  }

  // Save config for next time in .code-quality/ directory
  const config = {
    version: '1.0.0',
    packageManager: selectedPm,
    useProjectConfig,
    tools: configureEnvironments ? undefined : selectedTools,
    environments: configureEnvironments ? environments : undefined,
    loadEnv,
    generated: new Date().toISOString()
  };

  try {
    const configDir = path.join(process.cwd(), '.code-quality');
    const configPath = path.join(configDir, 'config.json');
    
    // Create .code-quality directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    // Copy reference configs from library to .code-quality/
    const libConfigDir = path.join(__dirname, '.code-quality');
    const referenceConfigs = ['tsconfig.json', 'eslint.config.mjs', '.prettierrc', '.prettierignore', 'knip.json', 'README.md'];
    
    for (const configFile of referenceConfigs) {
      const srcPath = path.join(libConfigDir, configFile);
      const destPath = path.join(configDir, configFile);
      
      if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    console.log(`\n💾 Configuration saved to: ${configPath}`);
    console.log('📝 Reference config files copied to .code-quality/');
  } catch (error) {
    console.warn('\n⚠️  Could not save configuration file');
  }

  // Run with wizard settings
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
    console.log('  --env <name>   Set environment (development, ci, production)');
    console.log('  --ESLint       Run only ESLint checks');
    console.log('  --TypeScript   Run only TypeScript checks');
    console.log('  --Prettier     Run only Prettier checks');
    console.log('  --Knip         Run only Knip checks');
    console.log('  --Snyk         Run only Snyk checks');
    console.log('  --fix          Auto-fix issues when possible (ESLint, Prettier)');
    console.log('');
    console.log('Examples:');
    console.log('  code-quality                    # Run checks with defaults');
    console.log('  code-quality --wizard           # Run interactive wizard');
    console.log('  code-quality --config            # Generate config file');
    console.log('  code-quality --logs              # Run with verbose output');
    console.log('  code-quality --env ci            # Run CI/CD checks (all tools)');
    console.log('  code-quality --env development   # Run dev checks (ESLint, TS, Prettier)');
    console.log('  code-quality --ESLint            # Run only ESLint');
    console.log('  code-quality --TypeScript        # Run only TypeScript');
    console.log('  code-quality --Prettier          # Run only Prettier');
    console.log('  code-quality --ESLint --logs     # Run ESLint with verbose output');
    console.log('  code-quality --ESLint --fix       # Fix ESLint issues automatically');
    console.log('  code-quality --Prettier --fix     # Format code with Prettier');
    console.log('  code-quality --ESLint --Prettier --fix --logs  # Fix both with logs');
    console.log('');
    console.log('Environment Variables:');
    console.log('  NODE_ENV                        # Set environment automatically');
    console.log('  CODE_QUALITY_ENV                # Override environment detection');
    console.log('');
    console.log('Default behavior:');
    console.log('  - Development: ESLint, TypeScript, Prettier');
    console.log('  - CI/Production: All tools (including Knip, Snyk)');
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

  // Parse tool-specific flags
  const toolFlags = ['--ESLint', '--TypeScript', '--Prettier', '--Knip', '--Snyk'];
  const specificTools = args.filter(arg => toolFlags.includes(arg));
  
  // If specific tools are requested, run them directly
  if (specificTools.length > 0) {
    const config = loadConfigFile() || {};
    const results = [];
    let allPassed = true;
    const checker = new CodeQualityChecker(config);
    const useFix = args.includes('--fix');
    
    for (const toolFlag of specificTools) {
      const toolName = toolFlag.replace('--', '');
      const defaultTool = DEFAULT_TOOLS.find(t => t.name === toolName);
      
      if (!defaultTool) {
        console.error(`❌ Unknown tool: ${toolName}`);
        process.exit(1);
      }
      
      const action = useFix ? 'fixing' : 'checking';
      console.log(`\n🔧 Running ${toolName} ${action}...\n`);
      
      // Use custom command from config if available, otherwise use default
      let command = defaultTool.args;
      if (config.commands && config.commands[toolName]) {
        command = config.commands[toolName];
      }
      
      // Add fix flag for tools that support it
      if (useFix) {
        if (toolName === 'ESLint') {
          command = command.replace('. --ext', ' --fix . --ext');
        } else if (toolName === 'Prettier') {
          command = command.replace('--check', '--write');
        } else if (toolName === 'Knip') {
          // Knip doesn't have a fix mode, so we warn user
          console.log(`⚠️  ${toolName} does not support auto-fix. Running checks only...`);
        } else if (toolName === 'TypeScript') {
          // TypeScript doesn't have a fix mode
          console.log(`⚠️  ${toolName} does not support auto-fix. Running checks only...`);
        } else if (toolName === 'Snyk') {
          // Snyk has fix but it's for security vulnerabilities, not style
          console.log(`⚠️  ${toolName} auto-fix not supported through --fix flag. Use 'snyk wizard' for security fixes.`);
        }
      }
      
      // Build full command
      const binDir = resolveToolBinDir();
      const binPath = path.join(binDir, defaultTool.bin);
      const fullCommand = `${binPath}${command ? ' ' + command : ''}`;
      
      // Run the specific tool
      const result = checker.runCommand(fullCommand, defaultTool.description);
      
      // Parse error counts and lines
      const counts = checker._parseErrorCounts(toolName, result.output);
      const errorLines = checker._parseErrorLines(toolName, result.output);
      
      const resultData = {
        name: toolName,
        description: defaultTool.description,
        ...result,
        ...counts,
        errorLines
      };
      
      results.push(resultData);
      
      const icon = result.success ? '✅' : '❌';
      const status = result.success ? (useFix ? 'Fixed' : 'Passed') : 'Failed';
      
      console.log(`${icon} ${toolName}... ${status}`);
      
      // Show error details if failed and logs enabled
      if (!result.success && args.includes('--logs')) {
        console.log(`\n❌ ${toolName} Error:`);
        console.log('─'.repeat(50));
        
        if (errorLines.length > 0) {
          console.log('📝 Individual Errors:');
          for (const errorLine of errorLines) {
            console.log(`• ${errorLine}`);
          }
          console.log(''); // Empty line before full output
        }
        
        console.log('📄 Full Output:');
        console.log(result.output);
        console.log('─'.repeat(50));
      }
      
      if (!result.success) {
        allPassed = false;
      }
    }
    
    // Generate report for AI analysis
    const pm = config.packageManager || detectPackageManager();
    const runCmd = getRunPrefix(pm);
    checker._writeReport(results, allPassed, pm, runCmd);
    
    // Show summary with error details for AI
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Tool-Specific Check Summary\n');
    
    for (const result of results) {
      const icon = result.success ? '✅' : '❌';
      const name = result.name.padEnd(12, ' ');
      let status = result.success ? (useFix ? 'Fixed' : 'Passed') : 'Failed';
      
      if (!result.success && (result.errors > 0 || result.warnings > 0)) {
        const parts = [];
        if (result.errors > 0) parts.push(`${result.errors} error${result.errors !== 1 ? 's' : ''}`);
        if (result.warnings > 0) parts.push(`${result.warnings} warning${result.warnings !== 1 ? 's' : ''}`);
        status = `${status} (${parts.join(', ')})`;
      }
      
      console.log(`${icon} ${name}${status}`);
      
      // Show individual error lines for failed tools only when --logs is used
      if (!result.success && result.errorLines && result.errorLines.length > 0 && showLogs) {
        console.log(`   📝 Error details:`);
        for (const errorLine of result.errorLines) {
          console.log(`   • ${errorLine}`);
        }
      }
    }
    
    console.log('\n' + '─'.repeat(50));
    
    if (!allPassed) {
      console.log('🤖 For AI Analysis - Summary of All Errors:\n');
      for (const result of results) {
        if (!result.success && result.errorLines && result.errorLines.length > 0) {
          console.log(`## ${result.name} Errors:`);
          for (const errorLine of result.errorLines) {
            console.log(errorLine);
          }
          console.log(''); // Empty line between tools
        }
      }
      console.log('📄 See .quality-report.md for complete details\n');
    } else {
      console.log('🎉 All specified tools passed!\n');
    }
    
    process.exit(allPassed ? 0 : 1);
  }

  // Parse environment flag
  let environment = undefined;
  const envIndex = args.findIndex(arg => arg === '--env');
  if (envIndex !== -1 && args[envIndex + 1]) {
    environment = args[envIndex + 1];
    // Remove --env and its value from args
    args.splice(envIndex, 2);
  }

  // Load config file if exists, if not - run wizard automatically
  const config = loadConfigFile();
  if (!config) {
    console.log('🔧 No configuration found. Starting setup wizard...\n');
    runWizard().catch(err => {
      console.error('❌ Wizard error:', err.message);
      process.exit(1);
    });
    return;
  }

  // Override environment if specified
  if (environment) {
    config.environment = environment;
  }

  const checker = new CodeQualityChecker(config);
  checker.run({ showLogs: args.includes('--logs') }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { CodeQualityChecker, runQualityCheck };
