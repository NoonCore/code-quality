# TypeScript Rules

This project uses strict TypeScript configuration targeting ES2022. Follow these rules to avoid type errors.

## Strict Mode

All strict checks are enabled. This means:

### No Implicit `any`
Every variable, parameter, and return type must be explicitly typed or inferable:

```ts
// ✅ DO
function greet(name: string): string {
  return `Hello, ${name}`
}

// ❌ DON'T
function greet(name) {  // implicit 'any'
  return `Hello, ${name}`
}
```

### Strict Null Checks
`null` and `undefined` are distinct types. Handle them explicitly:

```ts
// ✅ DO
function getUser(id: string): User | null {
  const user = users.get(id)
  return user ?? null
}

const user = getUser('123')
if (user) {
  console.warn('Found:', user.name)
}

// ❌ DON'T
function getUser(id: string): User {
  return users.get(id)  // could be undefined
}
```

### Strict Property Initialization
Class properties must be initialized in constructor or declaration:

```ts
// ✅ DO
class Service {
  private name: string
  private count = 0

  constructor(name: string) {
    this.name = name
  }
}

// ❌ DON'T
class Service {
  private name: string  // not initialized — error
}
```

## Index Access Safety

`noUncheckedIndexedAccess` is enabled. Array/object index access returns `T | undefined`:

```ts
// ✅ DO
const items = ['a', 'b', 'c']
const first = items[0]  // type: string | undefined
if (first) {
  console.warn(first.toUpperCase())
}

const map: Record<string, number> = { a: 1 }
const value = map['key']  // type: number | undefined
if (value !== undefined) {
  process(value)
}

// ❌ DON'T
const items = ['a', 'b', 'c']
console.warn(items[0].toUpperCase())  // might be undefined
```

## Exact Optional Properties

`exactOptionalPropertyTypes` is enabled. Optional properties can't be set to `undefined` explicitly:

```ts
// ✅ DO
interface Config {
  name: string
  debug?: boolean
}

const config: Config = { name: 'app' }           // ok — omit property
const config2: Config = { name: 'app', debug: true }  // ok — set value

// ❌ DON'T
const config: Config = { name: 'app', debug: undefined }  // error!
```

If you need to allow `undefined`, declare the type explicitly:

```ts
interface Config {
  name: string
  debug?: boolean | undefined  // now undefined is allowed
}
```

## Return Types

`noImplicitReturns` is enabled. All code paths must return a value:

```ts
// ✅ DO
function getLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    default:
      return 'Unknown'
  }
}

// ❌ DON'T
function getLabel(status: string): string {
  if (status === 'active') {
    return 'Active'
  }
  // missing return for other cases
}
```

## Override Keyword

`noImplicitOverride` is enabled. Use `override` when overriding parent methods:

```ts
// ✅ DO
class Dog extends Animal {
  override speak(): string {
    return 'Woof!'
  }
}

// ❌ DON'T
class Dog extends Animal {
  speak(): string {  // missing 'override'
    return 'Woof!'
  }
}
```

## Switch Statements

`noFallthroughCasesInSwitch` is enabled. Every case must `break`, `return`, or `throw`:

```ts
// ✅ DO
switch (action) {
  case 'start':
    startProcess()
    break
  case 'stop':
    stopProcess()
    break
  default:
    throw new Error(`Unknown action: ${action}`)
}

// ❌ DON'T
switch (action) {
  case 'start':
    startProcess()
  case 'stop':   // falls through from 'start'!
    stopProcess()
    break
}
```

## Module System

- Target: **ES2022**
- Module: **ESNext** with **bundler** resolution
- JSON imports: enabled (`resolveJsonModule`)
- Isolated modules: enabled (each file is a standalone module)
- JSX: **react-jsx** (no need to import React)

```ts
// ✅ DO — importing JSON
import config from './config.json'

// ✅ DO — JSX without React import
export function Button() {
  return <button>Click me</button>
}
```

## File Casing

`forceConsistentCasingInFileNames` is enabled. Import paths must match the actual file name casing exactly:

```ts
// ✅ DO (file is MyComponent.tsx)
import { MyComponent } from './MyComponent'

// ❌ DON'T
import { MyComponent } from './mycomponent'  // wrong casing
```
