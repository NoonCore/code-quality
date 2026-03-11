# Knip — Dead Code Prevention

Knip detects unused files, exports, dependencies, and types. Follow these rules to keep the codebase clean and avoid Knip warnings.

## Core Principle

> Every export must be imported somewhere. Every dependency must be used. Every file must be referenced.

## Entry Points

The project's entry points are:
- `index.js` — main CLI/library entry
- `index.d.ts` — TypeScript type definitions

All exports and code paths must be reachable from these entry points.

## Exports

### Every Export Must Be Used

```ts
// ✅ DO — export is imported elsewhere
export function formatDate(date: Date): string {
  return date.toISOString()
}

// ❌ DON'T — export exists but nothing imports it
export function unusedHelper() {
  return 'nobody calls me'
}
```

### Remove Dead Exports Promptly

When you delete or refactor code that imports something, also remove the export if nothing else uses it.

```ts
// Before refactor: utils.ts exports formatDate, parseDate
// After refactor: only formatDate is used
// → Remove parseDate export from utils.ts
```

## Dependencies

### No Unused Dependencies

Every package in `package.json` `dependencies` must be imported/required somewhere:

```json
// ✅ DO — all listed deps are used in code
{
  "dependencies": {
    "express": "^4.18.0",  // used in server.ts
    "zod": "^3.22.0"       // used in validators.ts
  }
}

// ❌ DON'T — lodash is listed but never imported
{
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.0"  // Knip will flag this
  }
}
```

### No Unlisted Dependencies

Every `import` or `require` must have a corresponding entry in `package.json`:

```ts
// ❌ DON'T — dayjs is imported but not in package.json
import dayjs from 'dayjs'  // Knip: unlisted dependency
```

## Files

### No Orphan Files

Every source file must be reachable from an entry point through imports:

```
// ✅ DO — connected file chain
index.js → lib/checker.js → lib/utils.js

// ❌ DON'T — floating file nobody imports
lib/old-helper.js  // Knip: unused file
```

## Class Members

### No Unused Class Members

Every public method and property in a class should be called somewhere:

```ts
// ✅ DO
class Checker {
  run() { ... }     // called externally
  private validate() { ... }  // called by run()
}

// ❌ DON'T
class Checker {
  run() { ... }
  legacyMethod() { ... }  // never called — remove it
}
```

## Types & Enums

### No Unused Types

Every exported type/interface must be referenced:

```ts
// ✅ DO — type is used as parameter type
export interface Config {
  name: string
}
function init(config: Config) { ... }

// ❌ DON'T — type exists but nothing uses it
export interface OldConfig {
  legacy: boolean
}
```

### No Unused Enum Members

Every member of an exported enum should be referenced:

```ts
// ✅ DO
enum Status { Active, Inactive }
if (user.status === Status.Active) { ... }
if (user.status === Status.Inactive) { ... }

// ❌ DON'T
enum Status { Active, Inactive, Archived }
// 'Archived' is never used — remove it
```

## Ignored Patterns

The following are **excluded** from Knip analysis:
- `test/**` and `**/*.test.*` — test files
- `**/*.spec.*` — spec files
- `examples/**` — example code
- `node_modules`, `dist`, `build`, `coverage`
- `*.config.js`, `*.config.ts` — config files

### Ignored Dependencies

These dependencies are allowed even if not directly imported (used by tools):
- `@types/*` — TypeScript type packages
- `eslint`, `prettier`, `typescript` — dev tools
- `vitest`, `storybook` — testing/docs tools

## Best Practices for AI Code Generation

1. **Before adding an export**: Will it be imported somewhere? If not, make it a local function
2. **Before adding a dependency**: Is it already installed? Check `package.json` first
3. **When deleting imports**: Check if the source export is still used elsewhere
4. **When creating files**: Make sure they're imported from an entry point chain
5. **Prefer named exports**: Easier to track usage than default exports
