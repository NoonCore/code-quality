# Code Quality Library

[![npm version](https://badge.fury.io/js/code-quality-lib.svg)](https://badge.fury.io/js/code-quality-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

> 🚀 **The ultimate code quality checker for modern JavaScript/TypeScript projects** - Auto-detects your package manager and runs TypeScript, ESLint, Prettier, Knip, and Snyk with beautiful terminal output.

---

## ✨ Why You'll Love This

- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 📦 **Universal Compatibility** - Supports bun, pnpm, yarn, and npm automatically
- 🎨 **Beautiful Output** - Colorized, clear, and informative terminal display
- ⚡ **Lightning Fast** - Parallel execution and optimized performance
- 🛡️ **Production Ready** - Handles edge cases and authentication gracefully
- � **Fully Configurable** - Customize tools, commands, and behavior
- � **TypeScript First** - Full type definitions included

---

## � Quick Start

### Installation

```bash
# Install as dependency
npm install code-quality-lib

# Or install globally for CLI usage
npm install -g code-quality-lib
```

### Basic Usage

```bash
# Run all quality checks (auto-detects your package manager)
code-quality

# Or use with npx
npx code-quality-lib
```

### Programmatic Usage

```javascript
const { CodeQualityChecker } = require('code-quality-lib');

// Default configuration - auto-detects everything
const checker = new CodeQualityChecker();
checker.run().then(result => {
  console.log(result.success ? '✅ Ready for production!' : '❌ Fix issues first');
});
```

---

## ⚙️ Configuration

### Default Tools

The library intelligently runs these tools (only if installed):

| Tool | Purpose | Default Script |
|------|---------|----------------|
| **TypeScript** | Type checking & compilation | `type:check` |
| **ESLint** | Code linting & style | `lint:check` |
| **Prettier** | Formatting validation | `format:check` |
| **Knip** | Dead code detection | `knip:error` |
| **Snyk** | Security scanning | `snyk` |

### Custom Configuration

```javascript
const customChecker = new CodeQualityChecker({
  // Force specific package manager
  packageManager: 'pnpm', // 'bun' | 'pnpm' | 'yarn' | 'npm'
  
  // Only run specific tools
  tools: ['TypeScript', 'ESLint'],
  
  // Custom commands
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

### Environment-Specific Setup

```javascript
const isCI = process.env.CI === 'true';
const ciChecker = new CodeQualityChecker({
  tools: isCI 
    ? ['TypeScript', 'ESLint'] 
    : ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
  loadEnv: !isCI
});
```

---

## 🔧 Package Manager Detection

The library automatically detects your package manager in this priority order:

1. **Lock Files** - `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
2. **Available Commands** - Checks if `bun`, `pnpm`, `yarn` are installed
3. **Fallback** - Uses `npm` if nothing else is found

You can also override the detection:

```javascript
const checker = new CodeQualityChecker({
  packageManager: 'yarn' // Force yarn usage
});
```

---

## 📊 Beautiful Output Example

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

---

## �️ Integration Examples

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

### Build Pipeline Integration

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
  
  console.log('✅ Quality checks passed, building...');
  // Continue with your build process...
}

buildWithQualityCheck();
```

---

## � Requirements

- **Node.js** >= 14.0.0
- **Package Manager**: bun, pnpm, yarn, or npm (auto-detected)
- **Quality Tools** (install only what you need):
  - **TypeScript** - `npm install -D typescript`
  - **ESLint** - `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
  - **Prettier** - `npm install -D prettier eslint-config-prettier`
  - **Knip** - `npm install -D knip`
  - **Snyk** - `npm install -D snyk`

### Quick Setup Commands

```bash
# Install everything (npm example)
npm install -D typescript eslint prettier knip snyk

# Minimal setup
npm install -D typescript eslint prettier

# With bun (faster)
bun add -D typescript eslint prettier knip snyk
```

**💡 Smart Detection**: The library automatically skips tools that aren't installed, so you can start with just the tools you need and add more later.

---

## 🛠️ API Reference

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
- `packageManager` ('bun' | 'pnpm' | 'yarn' | 'npm'): Force specific package manager

#### Methods
- `run()`: Promise<QualityCheckResult> - Run all configured checks
- `runCommand(command, description)`: CommandResult - Execute a single command
- `formatOutput(tool, result)`: string - Format output for a tool
- `checkSnykToken()`: boolean - Check Snyk authentication status

---

## 🏆 What Makes This Special?

- 🎯 **Zero Config Magic** - Just install and run
- 📦 **Universal Package Manager Support** - Works with everything
- 🎨 **Developer Experience Focused** - Beautiful, informative output
- 🛡️ **Production Battle-Tested** - Handles edge cases gracefully
- 📚 **TypeScript Native** - Full type safety
- ⚡ **Performance Optimized** - Fast parallel execution
- 🔧 **Flexible & Extensible** - Customize everything

---

## 🤝 Contributing

We love contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/yourusername/code-quality-lib.git
cd code-quality-lib
npm install
npm test
```

---

## 📄 License

MIT © [Your Name](https://github.com/yourusername) - Built with ❤️ for the developer community

---

## 🙏 Acknowledgments

- Built for modern JavaScript/TypeScript development workflows
- Inspired by the need for unified, beautiful tooling
- Designed with developer experience and productivity in mind
- Powered by the amazing open-source community

---

**⭐ Star this repo if it helps you build better code!**
