---
name: frontend-development-guide
description: Frontend patterns for Next.js 16, React 19, Apollo Client, real-time events
applyTo: ["frontend/**/*.{ts,tsx,js,jsx}", "frontend/**/*.{css,module.css}"]
scope: frontend
---

# Frontend Instructions (`frontend/**`)

**Tech Stack**: Next.js 16, React 19, Apollo Client, Tailwind CSS, Vitest

---

## 🎯 Key Patterns

### Server Components (Default)
- Use `async` functions to fetch data at request time
- Pass fetched data as props to Client Components
- See: `.claude/patterns/server-client-components-pattern.md`

### Client Components
- Mark with `"use client"` for interactivity
- Use Apollo `useMutation` with `optimisticResponse` for instant feedback
- Subscribe to SSE via `new EventSource("http://localhost:5000/events")`
- Handle localStorage, browser APIs, React hooks

### Real-Time Event Integration
- Listen to SSE stream for buildCreated, partAdded, testRunSubmitted events
- Auto-reconnect with exponential backoff (1s→30s)
- Deduplicate events in 1000-event sliding window

### Testing
- Vitest + React Testing Library
- Mock Apollo Provider with `MockedProvider`
- Mock EventSource for subscription tests
- Global setup in `frontend/__tests__/setup/` for state isolation

### Styling
- Tailwind CSS utility classes only
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints

---

## 🔄 Commands

```bash
pnpm dev:frontend              # Start Next.js (port 3000)
pnpm test:frontend --run       # Tests in CI mode
pnpm lint                      # ESLint check
pnpm type-check                # TypeScript strict mode
```

---

## 📋 Implementation Checklist

When implementing a frontend feature:

- [ ] **Plan**: Break into Server + Client Component layers
- [ ] **Implement**: Follow `.claude/patterns/server-client-components-pattern.md`
- [ ] **Test**: 
  - Unit tests with Vitest
  - Apollo MockedProvider for mutations
  - EventSource mocks for real-time
  - localStorage cleanup via global setup
- [ ] **Quality Checks**:
  - `pnpm test:frontend --run` — All tests pass
  - `pnpm lint` — No ESLint violations
  - `pnpm type-check` — TypeScript strict mode
- [ ] **Logs**: Capture to `docs/dev-note/issue-#[N]-pnpm-*.txt`

---

## 🛠️ Common Tasks

### Adding a Client Component
```typescript
"use client"
import { useMutation } from "@apollo/client"

export function MyFeature() {
  const [mutate] = useMutation(MY_MUTATION)
  return <button onClick={() => mutate(...)}>Action</button>
}
```

### Real-Time Subscription
```typescript
useEffect(() => {
  const eventSource = new EventSource("http://localhost:5000/events")
  eventSource.onmessage = (e) => {
    const event = JSON.parse(e.data)
    // Update Apollo cache or state
  }
  return () => eventSource.close()
}, [])
```

### Optimistic Updates
```typescript
const [update] = useMutation(UPDATE_BUILD, {
  optimisticResponse: {
    updateBuild: { id, status: "COMPLETE", __typename: "Build" }
  },
  update(cache, { data }) {
    cache.modify({
      fields: {
        builds: (existing) => existing.map(b => 
          b.id === id ? data.updateBuild : b
        )
      }
    })
  }
})
```

---

## 🐛 Debugging

### Apollo DevTools
Install [Apollo DevTools](https://www.apollographql.com/docs/react/development-testing/developer-tools/) extension to inspect cache and network.

### SSE Stream Testing
```bash
curl -N http://localhost:5000/events
```

### Enable Debug Mode
```javascript
// Browser console
window.__SSE_DEBUG = true
window.__SSE_METRICS = true
```

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `frontend/app/page.tsx` | Root Server Component |
| `frontend/lib/apollo.ts` | Apollo Client configuration |
| `frontend/lib/use-sse-events.ts` | SSE hook with backoff/dedup |
| `frontend/__tests__/setup/` | Global test setup |

---

## 🔗 Related Patterns

- `.claude/patterns/server-client-components-pattern.md`
- `.claude/patterns/event-emission-pattern.md`
- `.claude/patterns/auth-patterns.md`

---

**Last Updated**: 2026-08-09
