# Contributing to Code Quality Library

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/NoonCore/code-quality-lib.git
   cd code-quality-lib
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
code-quality-lib/
├── .github/          # CI/CD workflows
├── config/           # Configuration files (ESLint, Prettier, TypeScript, Knip)
├── examples/         # Usage examples
├── test/             # Test files
├── index.js          # Main CLI entry point
├── index.d.ts        # TypeScript definitions
├── package.json      # Package configuration
└── README.md         # Documentation
```

## Testing

- All tests must pass before submitting a PR
- Tests are located in `test/` directory
- Run tests with: `npm test`

## Code Style

- ESLint configuration: `config/.eslintrc.js`
- Prettier configuration: `config/.prettierrc`
- TypeScript configuration: `config/tsconfig.json`

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure they pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## CI/CD

All PRs are automatically tested on:
- Node.js 25.x (npm)
- Bun 1.3.x
- pnpm 10.x
- Yarn 4.13.0

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
