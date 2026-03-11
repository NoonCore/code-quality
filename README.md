# Code Quality Library

[![npm version](https://badge.fury.io/js/code-quality-lib.svg)](https://badge.fury.io/js/code-quality-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/code-quality-lib.svg)](https://www.npmjs.com/package/code-quality-lib)
[![CI/CD](https://github.com/NoonCore/code-quality-lib/actions/workflows/ci.yml/badge.svg)](https://github.com/NoonCore/code-quality-lib/actions/workflows/ci.yml)

> 🚀 **A configurable code quality checker library for Node.js projects** - Now available on npm! Auto-detects your package manager and runs TypeScript, ESLint, Prettier, Knip, and Snyk with beautiful terminal output.

## Features

- **Multi-Package Manager Support**: Auto-detects and works with bun, pnpm, yarn, and npm
- **Configurable**: Customize which tools to run and their commands
- **Beautiful Output**: Colorized terminal output with clear status indicators  
- **Environment Support**: Automatically loads `.env` files
- **Snyk Integration**: Handles Snyk authentication gracefully
- **TypeScript Support**: Full TypeScript definitions included
- **CLI & Library**: Can be used as both command-line tool and library
- **Extensible**: Easy to add custom tools and checks
- **Detailed Reporting**: Clear error counts and status messages

## Installation

### npm
```bash
# Install as development dependency (recommended)
npm install -D code-quality-lib

# Install globally for CLI usage
npm install -g code-quality-lib

# Install from GitHub (development)
npm install -D https://github.com/NoonCore/code-quality-lib.git
```

### bun (recommended - faster)
```bash
# Install as development dependency (recommended)
bun add -D code-quality-lib

# Install globally for CLI usage
bun add -g code-quality-lib

# Install from GitHub (development)
bun add -D https://github.com/NoonCore/code-quality-lib.git
```

### pnpm
```bash
# Install as development dependency (recommended)
pnpm add -D code-quality-lib

# Install globally for CLI usage
pnpm add -g code-quality-lib

# Install from GitHub (development)
pnpm add -D https://github.com/NoonCore/code-quality-lib.git
```

### yarn
```bash
# Install as development dependency (recommended)
yarn add -D code-quality-lib

# Install globally for CLI usage
yarn global add code-quality-lib

# Install from GitHub (development)
yarn add -D https://github.com/NoonCore/code-quality-lib.git
```

### 📦 Available on NPM

This library is now published on npm! You can install it directly:

```bash
# Latest stable version
npm install -D code-quality-lib

# Specific version
npm install -D code-quality-lib@^1.0.0

# Or with bun (recommended)
bun add -D code-quality-lib
```

**Version Management:**
- Use `^1.0.0` for automatic patch/minor updates
- Use `~1.0.0` for patch updates only  
- Use `1.0.0` for exact version
- Use `*` or `latest` for always latest version

## Quick Start

```bash
# Install and run in one command
bun add -D code-quality-lib && bunx code-quality

# Or with npm
npm install -D code-quality-lib && npx code-quality

# Or with yarn
yarn add -D code-quality-lib && yarn code-quality

# Or install globally
npm install -g code-quality-lib
code-quality
```

That's it! The library will auto-detect your package manager and run all quality checks.

## Usage

### As a CLI Tool

```bash
# Run all quality checks
code-quality

# Or use with npx (without installing)
npx code-quality-lib

# Or with bunx (without installing)
bunx code-quality-lib

# Or with yarn
yarn code-quality
```

### As a Library

```javascript
const { CodeQualityChecker } = require('code-quality-lib');

// Use default configuration
const checker = new CodeQualityChecker();
checker.run().then(result => {
  console.log(result.success ? '✅ All checks passed!' : '❌ Some checks failed');
});
```

## Configuration

### Default Tools

The library runs these tools by default:
- **TypeScript** - Type checking and compilation
- **ESLint** - Code linting and style checking  
- **Prettier** - Code formatting validation
- **Knip** - Dead code detection and unused exports
- **Snyk** - Security vulnerability scanning

### Custom Configuration

```javascript
const customChecker = new CodeQualityChecker({
  // Force specific package manager
  packageManager: 'pnpm', // 'bun' | 'pnpm' | 'yarn' | 'npm'
  
  // Only run specific tools
  tools: ['TypeScript', 'ESLint'],
  
  // Custom commands for each tool
  commands: {
    TypeScript: 'tsc --noEmit',
    ESLint: 'eslint src/ --ext .ts,.tsx',
    Prettier: 'prettier --check "src/**/*.{ts,tsx}"'
  },
  
  // Custom descriptions
  descriptions: {
    TypeScript: 'TypeScript type checking',
    ESLint: 'ESLint code analysis'
  },
  
  // Disable .env loading
  loadEnv: false
});
```

### Package Manager Detection

The library automatically detects your package manager in this order:
1. **Lock files**: `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
2. **Available commands**: Checks if `bun`, `pnpm`, `yarn` are installed
3. **Fallback**: Uses `npm` if nothing else is found

You can also override the detection:
```javascript
const checker = new CodeQualityChecker({
  packageManager: 'yarn' // Force yarn usage
});
```

### Environment-Specific Configuration

```javascript
const isCI = process.env.CI === 'true';
const ciChecker = new CodeQualityChecker({
  tools: isCI 
    ? ['TypeScript', 'ESLint'] 
    : ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
  loadEnv: !isCI
});
```

## Integration with Existing Projects

### Replace Existing Scripts

**Before:**
```json
{
  "scripts": {
    "quality": "node scripts/quality-check.js"
  }
}
```

**After:**
```json
{
  "scripts": {
    "quality": "code-quality"
  }
}
```

### Programmatic Usage

```javascript
// In your build script
const { CodeQualityChecker } = require('code-quality-lib');

async function buildWithQualityCheck() {
  const checker = new CodeQualityChecker({
    tools: ['TypeScript', 'ESLint']
  });
  
  const result = await checker.run();
  if (!result.success) {
    console.error('❌ Quality checks failed!');
    process.exit(1);
  }
  
  // Continue with build...
  console.log('✅ Quality checks passed, building...');
}

buildWithQualityCheck();
```

## Output Example

```
🔍 Professional Code Quality Check

──────────────────────────────────────────────────
📦 Using bun package manager
Checking Snyk authentication...
Running TypeScript compilation...
Running ESLint validation...
Running Prettier formatting...
Running Dead code detection...
Running Security vulnerability scan...

✅ TypeScript: 0 errors
✅ ESLint: 0 errors, 0 warnings  
✅ Prettier: All files formatted
✅ Knip: No critical errors
✅ Snyk: No vulnerabilities
──────────────────────────────────────────────────

🎉 All quality checks passed! Code is ready for production.
```

## API Reference

### CodeQualityChecker

#### Constructor
```javascript
new CodeQualityChecker(options)
```

#### Options
- `loadEnv` (boolean): Load environment variables from `.env` file
- `tools` (string[]): Array of tool names to run
- `commands` (Record<string, string>): Custom commands for each tool
- `descriptions` (Record<string, string>): Descriptions shown during execution
- `packageManager` ('bun' | 'pnpm' | 'yarn' | 'npm'): Force specific package manager (auto-detected if not specified)

#### Methods
- `run()`: Promise<QualityCheckResult> - Run all configured checks
- `runCommand(command, description)`: CommandResult - Execute a single command
- `formatOutput(tool, result)`: string - Format output for a tool
- `checkSnykToken()`: boolean - Check Snyk authentication status

### Types

```typescript
interface CodeQualityOptions {
  loadEnv?: boolean;
  tools?: string[];
  commands?: Record<string, string>;
  descriptions?: Record<string, string>;
  packageManager?: 'bun' | 'pnpm' | 'yarn' | 'npm';
}

interface CommandResult {
  success: boolean;
  output: string;
}

interface QualityCheckResult {
  success: boolean;
  message: string;
}
```

## Requirements

- **Node.js** >= 18.0.0 (tested on 25.x, 22.x, 20.x)
- **Package Manager**: bun, pnpm, yarn, or npm (auto-detected)
- **Quality Tools** (install only what you need):
  - **TypeScript** - `npm install -D typescript` or `bun add -D typescript` or `pnpm add -D typescript` or `yarn add -D typescript`
  - **ESLint** - `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin` or `bun add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
  - **Prettier** - `npm install -D prettier eslint-config-prettier` or `bun add -D prettier eslint-config-prettier`
  - **Knip** - `npm install -D knip` or `bun add -D knip`
  - **Snyk** - `npm install -D snyk` or `bun add -D snyk`

### Quick Setup

#### npm
```bash
# Install all quality tools
npm install -D typescript eslint prettier knip snyk

# Minimal setup
npm install -D typescript eslint prettier
```

#### bun (recommended - faster)
```bash
# Install all quality tools
bun add -D typescript eslint prettier knip snyk

# Minimal setup
bun add -D typescript eslint prettier
```

#### pnpm
```bash
# Install all quality tools
pnpm add -D typescript eslint prettier knip snyk

# Minimal setup
pnpm add -D typescript eslint prettier
```

#### yarn
```bash
# Install all quality tools
yarn add -D typescript eslint prettier knip snyk

# Minimal setup
yarn add -D typescript eslint prettier
```

**Note**: The library automatically skips tools that aren't installed, so you can start with just the tools you need and add more later.

## Framework Compatibility

This library is framework-agnostic and works with:

- **Next.js** (all versions)
- **React** (Create React App, Vite, etc.)
- **Vue.js** (Vue CLI, Nuxt, Vite)
- **Angular** (Angular CLI)
- **Node.js** (Express, Koa, etc.)
- **TypeScript** projects
- **Plain JavaScript** projects

## Examples

### Next.js Project
```javascript
const { CodeQualityChecker } = require('code-quality-lib');

const nextJSChecker = new CodeQualityChecker({
  commands: {
    TypeScript: 'tsc --noEmit',
    ESLint: 'next lint',
    Prettier: 'prettier --check .',
    Knip: 'knip',
    Snyk: 'snyk test'
  }
});
```

### Vue.js Project
```javascript
const vueChecker = new CodeQualityChecker({
  commands: {
    TypeScript: 'vue-tsc --noEmit',
    ESLint: 'eslint .ext .vue,.js,.ts',
    Prettier: 'prettier --check .'
  }
});
```

### Express.js Project
```javascript
const expressChecker = new CodeQualityChecker({
  tools: ['TypeScript', 'ESLint'],
  commands: {
    TypeScript: 'tsc --noEmit',
    ESLint: 'eslint src/'
  }
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Testing & CI/CD

This library is automatically tested across multiple runtimes:
- **Node.js** 25.x (npm)
- **Bun** 1.3.x
- **pnpm** 10.x
- **Yarn** 4.13.0

All tests run in parallel on every push and pull request. The library only publishes to npm when all tests pass.

## Acknowledgments

- Built for modern JavaScript/TypeScript development workflows
- Inspired by the need for unified quality checking across projects
- Designed with developer experience and productivity in mind
