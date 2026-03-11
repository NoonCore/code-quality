# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-03-11

### Added
- **`.code-quality/` directory structure** — All configs in one organized directory
- **Reference config templates** — TypeScript, ESLint, Prettier, Knip configs included
- **Interactive wizard** (`--wizard` flag) — Step-by-step setup with smart defaults
- **Auto-wizard on first run** — Automatically starts wizard if no config exists
- **Config modes** — Choose between project configs or reference configs
- **Step-by-step terminal output** — Setup wizard-style progress with spinners
- **Checkbox-style tool selection** — Individual tool enable/disable in wizard
- **Smart config memory** — Remembers settings, skips questions on subsequent runs

### Changed
- **Config location** — Moved from `.code-quality.json` to `.code-quality/config.json`
- **Tool resolution** — Uses project's `node_modules/.bin` first, library's bundled tools as fallback
- **Wizard UX** — Yes/No prompts with sensible defaults (bundled configs default)
- **Terminal output** — Professional step-by-step progress like `npx create-next-app`

### Fixed
- **Tool resolution priority** — Now correctly uses project's installed tools instead of bundled versions
- **Custom commands** — Uses commands as-is without prepending paths
- **Backward compatibility** — Old `.code-quality.json` still works with migration notice

### Migration
- Old `.code-quality.json` files are still supported
- Run `code-quality --config` to create new `.code-quality/` directory structure
- Reference configs automatically copied to `.code-quality/` on first setup

## [2.0.0] - 2026-03-11

### Added
- Bundle all quality tool dependencies (TypeScript, ESLint, Prettier, Knip, Snyk)
- `--logs` flag for detailed error output
- Quality report generation (`.quality-report.md`)
- `--help` and `--version` CLI flags
- Multi-runtime CI/CD testing (Node.js, Bun, pnpm, Yarn)
- Comprehensive README with badges and examples
- Professional project structure with organized directories

### Changed
- Updated Node.js requirement to >=18.0.0
- Reorganized configuration files into `config/` directory
- Improved test suite to not run actual quality checks in CI
- Enhanced .npmignore to exclude development files

### Fixed
- CI/CD pipeline now passes on all 4 runtimes
- Security audit: 0 vulnerabilities
- Test reliability improvements

## [1.1.0] - 2026-03-11

### Added
- Quality report generation with detailed error information
- `--logs` flag for verbose error output

## [1.0.0] - 2026-03-11

### Added
- Initial release
- Multi-package manager support (npm, bun, pnpm, yarn)
- TypeScript, ESLint, Prettier, Knip, and Snyk integration
- Beautiful terminal output with colors
- Environment variable loading from .env
- CLI and library usage support
