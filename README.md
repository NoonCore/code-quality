# Code Quality Library

[![npm version](https://img.shields.io/npm/v/code-quality-lib)](https://www.npmjs.com/package/code-quality-lib)
[![CI/CD](https://github.com/NoonCore/code-quality-lib/actions/workflows/ci.yml/badge.svg)](https://github.com/NoonCore/code-quality-lib/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-included-blue)](https://www.typescriptlang.org/)

> A configurable code quality checker for Node.js — auto-detects your package manager and runs **TypeScript**, **ESLint**, **Prettier**, **Knip**, and **Snyk** with all dependencies bundled.

## Features

- **All tools bundled** — no need to install TypeScript, ESLint, Prettier, Knip, or Snyk separately
- **Auto-detects package manager** — npm, bun, pnpm, yarn
- **CLI + Library** — use from terminal or programmatically
- **Detailed reports** — generates `.quality-report.md` with AI-friendly error info
- **`--logs` flag** — verbose terminal output for debugging
- **TypeScript definitions** — full type safety included

## Installation

```bash
npm install -D code-quality-lib     # npm
bun add -D code-quality-lib         # bun
pnpm add -D code-quality-lib        # pnpm
yarn add -D code-quality-lib        # yarn
```

## Quick Start

```bash
# Install and run (first time will auto-start wizard)
npm install -D code-quality-lib && npx code-quality

# Or with bun
bun add -D code-quality-lib && bunx code-quality

# Or with yarn
yarn add -D code-quality-lib && yarn code-quality
```

## CLI Usage

```bash
code-quality              # run all quality checks
code-quality --wizard     # run interactive setup wizard
code-quality --config     # generate .code-quality.json config file
code-quality --logs       # show detailed error output
code-quality --help       # show help
code-quality --version    # show version
```

### Interactive Wizard

Use the wizard to configure options before running:

```bash
code-quality --wizard
```

The wizard will guide you through:

```
🧙‍♂️ Code Quality Setup Wizard
──────────────────────────────────────────────────
Let's configure your quality checks!

📦 Detected package manager: npm
Use npm? (Y/n):

⚙️  Use project config files (.eslintrc, .prettierrc, etc.)?
Answer "No" to use bundled configs from code-quality-lib
Use project configs? (y/N):

🔧 Select tools to run (default = all checked):
[✓] TypeScript? (Y/n):
[✓] ESLint? (Y/n):
[✓] Prettier? (Y/n):
[✓] Knip? (Y/n):
[✓] Snyk? (Y/n):

🌍 Load .env file before running checks?
Load .env? (Y/n):

📋 Configuration Summary:
──────────────────────────────────────────────────
📦 Package Manager: npm
⚙️  Config: Bundled configs
🔧 Tools: TypeScript, ESLint, Prettier, Knip, Snyk
🌍 Load .env: Yes
──────────────────────────────────────────────────
Run checks with these settings? (Y/n):
```

**Smart Features:**

- **Remember settings** — First run creates `.code-quality.json`, future runs skip questions
- **Yes/No questions** — Simple Y/n prompts with sensible defaults
- **Checkbox-style tools** — Each tool can be individually enabled/disabled
- **Bundled configs default** — Uses library's built-in configs by default

After confirmation, it runs the quality checks with your selected settings.

### Auto-Wizard on First Run

If you run `code-quality` without any configuration file, it automatically starts the wizard:

```bash
code-quality    # First run: no config found → starts wizard
code-quality    # Subsequent runs: uses saved settings
```

This ensures proper setup on first use while being fast on subsequent runs.

### Terminal Output

The CLI provides step-by-step progress like setup wizards:

```
🚀 Code Quality Setup
──────────────────────────────────────────────────
📦 Package Manager: npm
⚙️  Config: Project configs
🔧 Tools: 5 quality checks

 1. TypeScript... ✅ Done
 2. ESLint... ✅ Done
 3. Prettier... ✅ Done
 4. Knip... ✅ Done
 5. Snyk... ✅ Done

──────────────────────────────────────────────────
📊 Quality Check Summary

✅ TypeScript  Passed
✅ ESLint      Passed
✅ Prettier    Passed
✅ Knip        Passed
✅ Snyk        Passed

──────────────────────────────────────────────────
🎉 Success! All quality checks passed.

✅ Your code is ready for production!
```

### Configuration Directory

Generate a configuration directory with reference configs:

```bash
code-quality --config
```

This creates `.code-quality/` directory with:

- **config.json** — Main configuration file
- **tsconfig.json** — TypeScript reference config
- **eslint.config.mjs** — ESLint reference config
- **.prettierrc** — Prettier reference config
- **knip.json** — Knip reference config
- **README.md** — Usage documentation

Example `config.json`:

```json
{
  "version": "1.0.0",
  "tools": ["TypeScript", "ESLint", "Prettier", "Knip", "Snyk"],
  "packageManager": "npm",
  "useProjectConfig": true,
  "loadEnv": true,
  "commands": {
    "TypeScript": "tsc --noEmit",
    "ESLint": ". --ext .js,.jsx,.ts,.tsx",
    "Prettier": "--check .",
    "Knip": "",
    "Snyk": "test --severity-threshold=high"
  }
}
```

The CLI automatically loads `.code-quality/config.json` if it exists:

```bash
code-quality    # uses your custom config
```

Or use it programmatically:

```javascript
const config = require('./.code-quality/config.json')
const checker = new CodeQualityChecker(config)
await checker.run()
```

### Config Modes

**Use Project Configs (Default)**

```json
{
  "useProjectConfig": true
}
```

Uses your project's existing config files (`.eslintrc.js`, `.prettierrc`, `tsconfig.json`, etc.)

**Use Reference Configs**

```json
{
  "useProjectConfig": false
}
```

Uses reference configs from `.code-quality/` directory as starting point for new projects

## Library Usage

```javascript
const { CodeQualityChecker, runQualityCheck } = require('code-quality-lib')

// Quick — run all checks with defaults (uses project's config files)
const result = await runQualityCheck()
console.log(result.success ? 'All passed' : 'Some failed')

// Use bundled configs instead of project's configs
const checker = new CodeQualityChecker({
  useProjectConfig: false, // use library's bundled .eslintrc, .prettierrc, etc.
})
await checker.run()

// Custom — select tools, override commands
const customChecker = new CodeQualityChecker({
  tools: ['TypeScript', 'ESLint'],
  packageManager: 'pnpm',
  commands: {
    TypeScript: 'tsc --noEmit',
    ESLint: 'eslint src/ --ext .ts,.tsx',
  },
  loadEnv: false,
})

const result = await customChecker.run({ showLogs: true })
console.log(result.results) // per-tool results array
```

## Configuration Options

| Option             | Type                                 | Default       | Description                                                                                 |
| ------------------ | ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| `useProjectConfig` | `boolean`                            | `true`        | Use project's config files (`.eslintrc.js`, `.prettierrc`, etc.) instead of bundled configs |
| `tools`            | `string[]`                           | All 5 tools   | Which tools to run                                                                          |
| `packageManager`   | `'npm' \| 'bun' \| 'pnpm' \| 'yarn'` | auto-detected | Force a specific package manager                                                            |
| `commands`         | `Record<string, string>`             | bundled paths | Custom commands per tool                                                                    |
| `descriptions`     | `Record<string, string>`             | built-in      | Custom descriptions per tool                                                                |
| `loadEnv`          | `boolean`                            | `true`        | Load `.env` file                                                                            |

## Tool Resolution

The library intelligently resolves tools in this order:

1. **Project's `node_modules/.bin`** — Uses your project's installed versions first
2. **Library's bundled tools** — Falls back to bundled versions if not found in project
3. **Custom commands** — If you specify custom commands in config, uses them as-is

This means:

- ✅ Uses your project's tool versions and configurations by default
- ✅ Works out-of-the-box with bundled tools as fallback
- ✅ Custom commands use tools from your project's PATH

### Bundled Tools

All tools are included as dependencies for fallback:

| Tool           | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| **TypeScript** | Type checking (`tsc --noEmit`)                                   |
| **ESLint**     | Linting with plugins (react, sonarjs, unicorn, import, prettier) |
| **Prettier**   | Code formatting validation                                       |
| **Knip**       | Dead code and unused export detection                            |
| **Snyk**       | Security vulnerability scanning                                  |

## Package Manager Detection

Automatically detected by lock file presence:

1. `bun.lock` / `bun.lockb` → bun
2. `pnpm-lock.yaml` → pnpm
3. `yarn.lock` → yarn
4. `package-lock.json` → npm
5. Fallback: checks installed binaries, defaults to npm

## Error Reporting

Every run generates `.quality-report.md` with:

- Status of each check (pass/fail)
- Full error output for failed checks
- AI-friendly structured information for automated fixes

Add `.quality-report.md` to your `.gitignore`.

## AI Skills

This library includes `.ai/skills/` — markdown files that teach AI coding assistants (Cursor, Copilot, Windsurf, etc.) to follow the project's coding standards. See [`.ai/skills/README.md`](.ai/skills/README.md).

## Requirements

- **Node.js** >= 18.0.0

## Testing & CI/CD

Tested on every push across 4 runtimes:

- **Node.js 25.x** (npm)
- **Bun 1.3.x**
- **pnpm 10.x**
- **Yarn 4.13.0**

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT — see [LICENSE](LICENSE).
