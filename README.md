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
npx code-quality          # npm
bunx code-quality         # bun
pnpm dlx code-quality     # pnpm
yarn dlx code-quality     # yarn
```

## CLI Usage

```bash
code-quality              # run all quality checks
code-quality --logs       # show detailed error output
code-quality --help       # show help
code-quality --version    # show version
```

## Library Usage

```javascript
const { CodeQualityChecker, runQualityCheck } = require('code-quality-lib');

// Quick — run all checks with defaults (uses project's config files)
const result = await runQualityCheck();
console.log(result.success ? 'All passed' : 'Some failed');

// Use bundled configs instead of project's configs
const checker = new CodeQualityChecker({
  useProjectConfig: false, // use library's bundled .eslintrc, .prettierrc, etc.
});
await checker.run();

// Custom — select tools, override commands
const customChecker = new CodeQualityChecker({
  tools: ['TypeScript', 'ESLint'],
  packageManager: 'pnpm',
  commands: {
    TypeScript: 'tsc --noEmit',
    ESLint: 'eslint src/ --ext .ts,.tsx',
  },
  loadEnv: false,
});

const result = await customChecker.run({ showLogs: true });
console.log(result.results); // per-tool results array
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useProjectConfig` | `boolean` | `true` | Use project's config files (`.eslintrc.js`, `.prettierrc`, etc.) instead of bundled configs |
| `tools` | `string[]` | All 5 tools | Which tools to run |
| `packageManager` | `'npm' \| 'bun' \| 'pnpm' \| 'yarn'` | auto-detected | Force a specific package manager |
| `commands` | `Record<string, string>` | bundled paths | Custom commands per tool |
| `descriptions` | `Record<string, string>` | built-in | Custom descriptions per tool |
| `loadEnv` | `boolean` | `true` | Load `.env` file |

## Bundled Tools

All tools are included as dependencies — zero extra setup:

| Tool | Description |
|------|-------------|
| **TypeScript** | Type checking (`tsc --noEmit`) |
| **ESLint** | Linting with plugins (react, sonarjs, unicorn, import, prettier) |
| **Prettier** | Code formatting validation |
| **Knip** | Dead code and unused export detection |
| **Snyk** | Security vulnerability scanning |

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
