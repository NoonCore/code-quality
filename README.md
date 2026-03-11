# Code Quality Library

[![npm version](https://badge.fury.io/js/code-quality-lib.svg)](https://badge.fury.io/js/code-quality-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-18.x%20%7C%2020.x%20%7C%2022.x%20%7C%2025.x-brightgreen)](https://nodejs.org/)
[![Bun Version](https://img.shields.io/badge/bun-1.3.x-black)](https://bun.sh/)
[![Downloads](https://img.shields.io/npm/dm/code-quality-lib.svg)](https://www.npmjs.com/package/code-quality-lib)
[![CI/CD](https://github.com/NoonCore/code-quality-lib/actions/workflows/ci.yml/badge.svg)](https://github.com/NoonCore/code-quality-lib/actions/workflows/ci.yml)
[![Package Managers](https://img.shields.io/badge/npm%20%7C%20bun%20%7C%20pnpm%20%7C%20yarn-support-blue)](https://github.com/NoonCore/code-quality-lib)
[![TypeScript](https://img.shields.io/badge/TypeScript-included-blue)](https://www.typescriptlang.org/)

> 🚀 A configurable code quality checker for Node.js that auto-detects your package manager and runs TypeScript, ESLint, Prettier, Knip, and Snyk.

## Features

- 🚀 Works with npm, bun, pnpm, yarn (auto-detected)
- 🎨 Beautiful terminal output
- ⚙️ Configurable tools and commands
- 📚 TypeScript definitions included
- 🔧 CLI and library usage

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


## Quick Start

```bash
# Install and run
npm install -D code-quality-lib && npx code-quality

# Or with bun
bun add -D code-quality-lib && bunx code-quality

# Or with yarn
yarn add -D code-quality-lib && yarn code-quality
```

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

## Framework Support

Works with any Node.js framework: Next.js, React, Vue, Angular, Express, etc.

## Contributing

Contributions welcome! Fork, create a feature branch, and submit a PR.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Testing & CI/CD

This library is automatically tested across multiple runtimes:
- **Node.js** 25.x (npm)
- **Bun** 1.3.x
- **pnpm** 10.x
- **Yarn** 4.13.0

All tests run in parallel on every push and pull request. The library only publishes to npm when all tests pass.

