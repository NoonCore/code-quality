# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
