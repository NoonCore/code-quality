# Prettier Formatting Rules

This project enforces consistent formatting via Prettier. All code must follow these rules exactly.

## Quick Reference

| Rule | Value |
|------|-------|
| Semicolons | **No** |
| Quotes | **Single** `'` |
| JSX Quotes | **Single** `'` |
| Trailing Commas | **ES5** (objects, arrays — not function params) |
| Print Width | **100** characters |
| Tab Width | **2 spaces** |
| Tabs | **No** (spaces only) |
| Line Endings | **LF** (`\n`) |
| Arrow Parens | **Always** `(x) => x` |
| Bracket Spacing | **Yes** `{ foo }` |
| Bracket Same Line | **No** (JSX closing `>` on new line) |
| Quote Props | **As needed** |

## Semicolons — NONE

```ts
// ✅ DO
const name = 'hello'
const items = [1, 2, 3]
function greet() {
  return 'hi'
}

// ❌ DON'T
const name = 'hello';
const items = [1, 2, 3];
function greet() {
  return 'hi';
}
```

## Quotes — Single

```ts
// ✅ DO
const name = 'hello'
const message = 'it\'s fine'
const template = `Hello ${name}`

// ❌ DON'T
const name = "hello"
const message = "it's fine"
```

## JSX Quotes — Single

```tsx
// ✅ DO
<Button label='Click me' className='btn-primary' />

// ❌ DON'T
<Button label="Click me" className="btn-primary" />
```

## Trailing Commas — ES5

Add trailing commas in objects and arrays, but NOT in function parameters:

```ts
// ✅ DO
const config = {
  name: 'app',
  version: '1.0.0',  // trailing comma in objects
}

const items = [
  'first',
  'second',
  'third',  // trailing comma in arrays
]

function greet(
  name: string,
  age: number  // NO trailing comma in function params
) {
  return `${name} is ${age}`
}

// ❌ DON'T
const config = {
  name: 'app',
  version: '1.0.0'   // missing trailing comma
}

function greet(
  name: string,
  age: number,  // trailing comma in function params (ES5 doesn't allow)
) {}
```

## Line Width — 100 Characters

Keep lines under 100 characters. Break long lines:

```ts
// ✅ DO
const message = createMessage(
  'Hello',
  userName,
  formatDate(new Date()),
)

// ❌ DON'T
const message = createMessage('Hello', userName, formatDate(new Date()), extraLongParameterThatExceedsTheLimit)
```

## Indentation — 2 Spaces

```ts
// ✅ DO (2 spaces)
function process() {
  if (condition) {
    doSomething()
  }
}

// ❌ DON'T (4 spaces or tabs)
function process() {
    if (condition) {
        doSomething()
    }
}
```

## Arrow Functions — Always Parentheses

```ts
// ✅ DO
const double = (x) => x * 2
const greet = (name) => `Hello ${name}`
const add = (a, b) => a + b

// ❌ DON'T
const double = x => x * 2
```

## Object Brackets — Spaces Inside

```ts
// ✅ DO
const { name, age } = user
import { useState } from 'react'

// ❌ DON'T
const {name, age} = user
import {useState} from 'react'
```

## JSX Bracket Placement — New Line

```tsx
// ✅ DO
<Button
  variant='primary'
  onClick={handleClick}
>
  Click me
</Button>

// ❌ DON'T
<Button
  variant='primary'
  onClick={handleClick}>
  Click me
</Button>
```

## Object Property Quotes — As Needed

```ts
// ✅ DO
const obj = {
  name: 'value',
  'content-type': 'application/json',  // quoted because of hyphen
}

// ❌ DON'T
const obj = {
  'name': 'value',  // unnecessary quotes
  'content-type': 'application/json',
}
```

## Line Endings

Always use LF (`\n`), never CRLF (`\r\n`). Configure your editor:
- VS Code: set `files.eol` to `\n`
- Git: `git config core.autocrlf input`
