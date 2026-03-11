# ESLint Rules

This project uses ESLint with TypeScript, React, SonarJS, Unicorn, and Import plugins. Follow these rules to avoid lint errors.

## Import Ordering (CRITICAL)

Imports **must** be grouped and sorted alphabetically within each group, separated by blank lines:

```ts
// ✅ DO — correct order with blank lines between groups
import fs from 'node:fs' // 1. builtin (node: protocol required)
import path from 'node:path'

import express from 'express' // 2. external (npm packages)
import React from 'react'

import { db } from '@/lib/database' // 3. internal (aliases like @/)

import { Parent } from '../Parent' // 4. parent

import { Sibling } from './Sibling' // 5. sibling

import styles from './index.module.css' // 6. index
```

```ts
// ❌ DON'T — mixed groups, no blank lines
import { Sibling } from './Sibling'
import express from 'express'
import fs from 'fs'
import { db } from '@/lib/database'
```

**Key rules:**

- Groups: `builtin` → `external` → `internal` → `parent` → `sibling` → `index`
- Blank line between each group
- Alphabetical within each group (case-insensitive)

## Node.js Built-in Modules

Always use `node:` protocol prefix for built-in modules:

```ts
// ✅ DO
import fs from 'node:fs'
import path from 'node:path'
const { execSync } = require('node:child_process')

// ❌ DON'T
import fs from 'fs'
import path from 'path'
```

## TypeScript-Specific Rules

### No Unused Variables

Every declared variable must be used. Prefix intentionally unused parameters with `_`:

```ts
// ✅ DO
const handleClick = (_event: MouseEvent, id: string) => fetchItem(id)
const { data, error: _error } = useQuery()

// ❌ DON'T
const handleClick = (event: MouseEvent, id: string) => fetchItem(id) // 'event' unused
```

### Avoid `any` Type

Use proper types. `any` triggers a warning:

```ts
// ✅ DO
function parse(input: string): Record<string, unknown> { ... }
function handle(data: unknown): void { ... }

// ⚠️ WARNING
function parse(input: any): any { ... }
```

### Nullish Coalescing

Use `??` instead of `||` for null/undefined checks:

```ts
// ✅ DO
const name = user.name ?? 'Anonymous'
const count = options.count ?? 0

// ❌ DON'T
const name = user.name || 'Anonymous' // empty string '' becomes 'Anonymous'
const count = options.count || 0 // 0 becomes 0 (wrong with ||)
```

### Optional Chaining

Use `?.` instead of manual null checks:

```ts
// ✅ DO
const city = user?.address?.city
const result = callback?.()

// ❌ DON'T
const city = user && user.address && user.address.city
const result = callback && callback()
```

### Non-null Assertion

Avoid `!` postfix — handle null explicitly:

```ts
// ✅ DO
const el = document.getElementById('app')
if (el) el.textContent = 'Hello'

// ⚠️ WARNING
const el = document.getElementById('app')!
el.textContent = 'Hello'
```

## Code Quality (SonarJS)

### Cognitive Complexity

Keep functions under complexity 15. Break complex logic into smaller functions:

```ts
// ✅ DO — split into smaller functions
function processOrder(order: Order) {
  validateOrder(order)
  calculateTotal(order)
  applyDiscounts(order)
  return finalizeOrder(order)
}

// ⚠️ WARNING — too many nested conditions
function processOrder(order: Order) {
  if (order.items) {
    for (const item of order.items) {
      if (item.discount) {
        if (item.discount.type === 'percent') {
          // deeply nested logic...
        }
      }
    }
  }
}
```

### No Duplicate Strings

Extract repeated strings (3+ occurrences) into constants:

```ts
// ✅ DO
const STATUS_ACTIVE = 'active'
if (user.status === STATUS_ACTIVE) { ... }
if (account.status === STATUS_ACTIVE) { ... }

// ⚠️ WARNING
if (user.status === 'active') { ... }
if (account.status === 'active') { ... }
if (order.status === 'active') { ... }
```

### No Identical Functions

Don't copy-paste functions — extract shared logic:

```ts
// ✅ DO
function formatEntity(entity: { name: string; id: number }) {
  return `${entity.name} (#${entity.id})`
}
const formatUser = formatEntity
const formatProduct = formatEntity

// ⚠️ WARNING — identical function bodies
function formatUser(user) {
  return `${user.name} (#${user.id})`
}
function formatProduct(product) {
  return `${product.name} (#${product.id})`
}
```

## Array Best Practices (Unicorn)

### No `.forEach()` — Use `for...of`

```ts
// ✅ DO
for (const item of items) {
  process(item)
}

// ❌ DON'T
items.forEach((item) => {
  process(item)
})
```

### Use `.some()` for Existence Checks

```ts
// ✅ DO
const hasAdmin = users.some((user) => user.role === 'admin')

// ❌ DON'T
const hasAdmin = users.filter((user) => user.role === 'admin').length > 0
```

### No `new Array()` — Use Literals

```ts
// ✅ DO
const items: string[] = []
const filled = Array.from({ length: 5 }, (_, i) => i)

// ❌ DON'T
const items = new Array()
```

## Console Usage

```ts
// ✅ DO — warn and error are allowed
console.warn('Deprecated API used')
console.error('Connection failed:', error)

// ⚠️ WARNING
console.log('debug value:', value) // use console.warn/error instead
```

## Test File Exceptions

In `*.test.*` and `*.spec.*` files, the following rules are relaxed:

- `@typescript-eslint/no-explicit-any` → off
- `sonarjs/no-duplicate-string` → off

In `*.stories.*` files:

- `import/no-extraneous-dependencies` → off
