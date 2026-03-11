# React & JSX Rules

This project supports React development with hooks, JSX, and component patterns. Follow these rules when generating React code.

## JSX Scope

React does **not** need to be imported for JSX (using `react-jsx` transform):

```tsx
// ✅ DO
export function Button() {
  return <button>Click me</button>
}

// ❌ DON'T — unnecessary import
import React from 'react'
export function Button() {
  return <button>Click me</button>
}
```

## Prop Types

Do **not** use PropTypes — use TypeScript interfaces instead:

```tsx
// ✅ DO
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

// ❌ DON'T
import PropTypes from 'prop-types'
Button.propTypes = {
  label: PropTypes.string.isRequired,
}
```

## Hooks Rules (CRITICAL)

### Only Call Hooks at Top Level

Never call hooks inside loops, conditions, or nested functions:

```tsx
// ✅ DO
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />
  return <div>{user?.name}</div>
}

// ❌ DON'T — hook inside condition
function UserProfile({ userId }: { userId: string }) {
  if (userId) {
    const [user, setUser] = useState(null) // ERROR: hook in condition
  }
}
```

### Exhaustive Dependencies

Include all referenced values in `useEffect` / `useCallback` / `useMemo` dependency arrays:

```tsx
// ✅ DO
useEffect(() => {
  fetchData(userId, token)
}, [userId, token]) // all dependencies listed

const handleSubmit = useCallback(() => {
  submitForm(formData)
}, [formData])

// ⚠️ WARNING — missing dependency
useEffect(() => {
  fetchData(userId, token)
}, [userId]) // 'token' is missing
```

### Strategies for Dependency Warnings

```tsx
// Strategy 1: Move function inside useEffect
useEffect(() => {
  const fetchData = async () => {
    const result = await api.get(`/users/${userId}`)
    setUser(result)
  }
  fetchData()
}, [userId])

// Strategy 2: Use useCallback for stable references
const fetchData = useCallback(async () => {
  const result = await api.get(`/users/${userId}`)
  setUser(result)
}, [userId])

useEffect(() => {
  fetchData()
}, [fetchData])

// Strategy 3: Use ref for values you don't want to trigger re-runs
const callbackRef = useRef(onComplete)
callbackRef.current = onComplete

useEffect(() => {
  doWork().then(() => callbackRef.current())
}, [])
```

## Component Exports

Only export components from component files. Use `react-refresh/only-export-components`:

```tsx
// ✅ DO — single component export
export function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
}

// ✅ DO — component + constant export is allowed
export const USER_ROLES = ['admin', 'user'] as const
export function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
}

// ⚠️ WARNING — non-component function exported alongside component
export function formatUser(user: User) {
  return user.name
} // move to utils
export function UserCard({ user }: { user: User }) {
  return <div>{formatUser(user)}</div>
}
```

## Component Patterns

### Prefer Function Components

```tsx
// ✅ DO
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>
}

// ❌ DON'T — class components
export class Counter extends React.Component {
  state = { count: 0 }
  render() { ... }
}
```

### Event Handlers

Name event handlers with `handle` prefix, props with `on` prefix:

```tsx
// ✅ DO
interface Props {
  onSubmit: (data: FormData) => void
  onChange: (value: string) => void
}

function Form({ onSubmit, onChange }: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(new FormData(e.currentTarget))
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Conditional Rendering

```tsx
// ✅ DO — clean patterns
{
  isLoading && <Spinner />
}
{
  error ? <ErrorMessage error={error} /> : <Content data={data} />
}
{
  items.length > 0 && <List items={items} />
}

// ❌ DON'T — number 0 renders as text
{
  items.length && <List items={items} />
} // renders "0" when empty!
```

## JSX Formatting

Follow Prettier rules for JSX:

- Single quotes for JSX attributes
- Closing bracket on new line for multi-line JSX
- Self-close tags without children

```tsx
// ✅ DO
<Input
  type='text'
  value={name}
  onChange={handleChange}
  placeholder='Enter name'
/>

<div className='container'>
  <Header />
  <Main>{children}</Main>
  <Footer />
</div>

// ❌ DON'T
<Input type="text" value={name} onChange={handleChange} placeholder="Enter name" />
```
