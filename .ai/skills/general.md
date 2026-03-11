# General Coding Standards

## Project Structure

```
├── .github/          # CI/CD workflows
├── .ai/skills/       # AI coding assistant rules
├── config/           # Linting, formatting, TypeScript configs
├── examples/         # Usage examples
├── test/             # Test files
├── index.js          # Main CLI entry point
├── index.d.ts        # TypeScript type definitions
└── package.json      # Package metadata
```

## Language & Runtime

- **Runtime**: Node.js >= 18.0.0
- **Module system**: CommonJS (`require` / `module.exports`)
- **Target**: ES2022
- **Package managers**: npm, bun, pnpm, yarn (all supported)

## Universal Rules

### Variables & Constants
- Always use `const` for values that don't change
- Never use `var` — use `let` only when reassignment is needed
- Prefix unused function parameters with `_`

```js
// ✅ DO
const MAX_RETRIES = 3
let count = 0
const handler = (_event, data) => process(data)

// ❌ DON'T
var MAX_RETRIES = 3
let count = 0  // if never reassigned, use const
const handler = (event, data) => process(data)  // unused param without _
```

### Console & Debugging
- Avoid `console.log` — use `console.warn` or `console.error` instead
- Never leave `debugger` statements in code

```js
// ✅ DO
console.warn('Unexpected state:', state)
console.error('Failed to connect:', error)

// ❌ DON'T
console.log('debug:', value)
debugger
```

### Error Handling
- Always handle errors explicitly
- Provide meaningful error messages
- Use try/catch for async operations

```js
// ✅ DO
try {
  const result = await fetchData()
  return result
} catch (error) {
  console.error('Failed to fetch data:', error.message)
  throw new Error(`Data fetch failed: ${error.message}`)
}

// ❌ DON'T
const result = await fetchData() // unhandled rejection
```

### Naming Conventions
- **Files**: kebab-case (`my-component.ts`)
- **Variables/Functions**: camelCase (`getUserName`)
- **Classes**: PascalCase (`CodeQualityChecker`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserConfig`)
- **Booleans**: prefix with `is`, `has`, `should`, `can` (`isLoading`, `hasError`)

### Comments
- Write self-documenting code; avoid obvious comments
- Use JSDoc for public API functions
- Use `TODO:` for planned improvements
- Use `FIXME:` for known issues

### Dependencies
- Every dependency in `package.json` must be used
- Every import must resolve to an installed package
- Remove unused dependencies promptly
- Prefer built-in Node.js modules over third-party when possible

### Testing
- Test files go in `test/` directory
- Test file naming: `*.test.js` or `*.spec.js`
- Tests should not run external tools or make network calls
- Tests must be deterministic and fast
