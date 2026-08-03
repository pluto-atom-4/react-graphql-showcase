---
name: frontend-development-guide
description: Frontend-specific patterns, best practices, constraints for Next.js, React, Apollo Client development
applyTo: ["frontend/**/*.{ts,tsx,js,jsx}", "frontend/**/*.{css,module.css}"]
scope: frontend
---

# Frontend Instructions (`frontend/**`)

**Applies to**: `frontend/**/*.{ts,tsx,js,jsx}`  
**Tech Stack**: Next.js 16, React 19, Apollo Client, Tailwind CSS, Vitest  
**Pattern Type**: React Server Components + Client Components with real-time event integration

---

## 🎯 Key Patterns

### Server Components (Data Fetching)
- Use `async` functions in `app/page.tsx` and route handlers
- Fetch initial data via Apollo queries at build/request time
- Pass fetched data as props to Client Components
- **Anti-pattern**: Don't fetch in useEffect in Server Components

### Client Components
- Use `"use client"` directive at file top
- Implement interactive features: forms, mutations, optimistic updates
- Subscribe to real-time events via Server-Sent Events (SSE)
- Cache results in Apollo Client memory

### Apollo Client Best Practices
- Use `useMutation` with `optimisticResponse` for instant UI feedback
- Leverage `cache.modify()` for granular cache updates
- Batch DataLoader queries on backend to prevent N+1
- Use `loading` states during mutation (Apollo handles automatically)

### Real-Time Event Integration
- Listen to SSE stream: `new EventSource("http://localhost:5000/events")`
- Handle 10+ event types: buildCreated, partAdded, testRunSubmitted, etc.
- Auto-reconnect with exponential backoff (1s→2s→4s→8s→16s→30s)
- Deduplicate events in 1000-event sliding window (5-min TTL)

### Testing
- Use Vitest + React Testing Library
- Test Server Components with `renderToString()`
- Mock Apollo Provider with `MockedProvider` for Client Components
- Test real-time subscriptions with EventSource mocks
- Global test setup in `./__tests__/setup/` for isolated state

### Styling
- Use Tailwind CSS utility classes
- Keep component-specific styles in component files (no CSS modules needed)
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints

---

## 🔄 Workflow Commands

```bash
# Development
pnpm dev:frontend              # Start Next.js dev server (port 3000)
pnpm dev                       # Start all services (frontend 3000, Apollo 4000, Express 5000)

# Testing
pnpm test:frontend             # Run frontend tests with Vitest
pnpm test:frontend --watch     # Watch mode for continuous testing
pnpm test:frontend --run       # Single run (CI mode)

# Quality
pnpm lint                       # ESLint check (entire monorepo)
pnpm lint:fix                  # Auto-fix linting issues
pnpm format:check              # Prettier check
pnpm type-check                # TypeScript strict mode check
```

---

## 📋 Implementation Checklist

When implementing a frontend feature:

- [ ] **Plan**: Break down into Server Component + Client Component layers
- [ ] **Implement**: Follow pattern above (async for data, "use client" for interactivity)
- [ ] **Test**: 
  - Vitest unit tests for components
  - Apollo MockedProvider for mutations
  - EventSource mocks for real-time events
  - localStorage cleanup per global test setup
- [ ] **Quality Checks** (automated per Issue #306):
  - `pnpm test:frontend --run` — All tests pass
  - `pnpm lint` — No ESLint violations
  - `pnpm format:check` — Prettier compliance
  - `pnpm type-check` — TypeScript strict mode
- [ ] **Logs**: Capture output to `docs/dev-note/issue-#[N]-pnpm-*.txt` (see Issue #306 automation)
- [ ] **PR**: Reference logs in PR description and link issues

---

## 🛠️ Common Tasks

### Adding a New Component
```typescript
// app/components/my-feature.tsx
"use client"

import { useQuery, useMutation } from "@apollo/client"

export function MyFeature() {
  const { data, loading } = useQuery(MY_QUERY)
  const [mutate] = useMutation(MY_MUTATION)
  
  return (
    <div>
      {loading ? <p>Loading...</p> : <p>{data}</p>}
      <button onClick={() => mutate(...)}>Action</button>
    </div>
  )
}
```

### Real-Time Event Subscription
```typescript
useEffect(() => {
  const eventSource = new EventSource("http://localhost:5000/events")
  
  eventSource.addEventListener("buildCreated", (e) => {
    const data = JSON.parse(e.data)
    // Update Apollo cache: client.cache.evict({ fieldName: "builds" })
  })
  
  return () => eventSource.close()
}, [])
```

### Optimistic Updates
```typescript
const [updateBuild] = useMutation(UPDATE_BUILD, {
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
Install [Apollo DevTools](https://www.apollographql.com/docs/react/development-testing/developer-tools/) browser extension to inspect cache, network, and queries.

### Real-Time Event Debug Mode
```javascript
// In browser console
window.__SSE_DEBUG = true      // Enable verbose logging
window.__SSE_METRICS = true    // Show performance metrics
```

### SSE Stream Testing
```bash
# Listen to raw SSE stream
curl -N http://localhost:5000/events

# In another terminal, trigger mutation to see events
curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBuild(name: \"test\") { id } }"}'
```

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `frontend/app/page.tsx` | Root Server Component (fetches initial data) |
| `frontend/lib/apollo.ts` | Apollo Client configuration + error handling |
| `frontend/lib/use-sse-events.ts` | SSE hook with exponential backoff & dedup |
| `frontend/components/__tests__/` | Component tests (Vitest + RTL) |
| `frontend/__tests__/setup/` | Global test setup (localStorage mock, cleanup) |
| `frontend/vitest.config.ts` | Vitest configuration with setup file |

---

## ✅ Quality Gate (Issue #306 Automation)

All quality checks run **without user confirmation**. Expected pattern:

```bash
pnpm test:frontend --run       # ✓ Tests pass
pnpm lint                      # ✓ 0 violations
pnpm format:check              # ✓ All files formatted
pnpm type-check                # ✓ TypeScript strict

# Logs captured to:
docs/dev-note/issue-#[N]-pnpm-test.txt        # Test results
docs/dev-note/issue-#[N]-pnpm-lint.txt        # Lint results
docs/dev-note/issue-#[N]-pnpm-format-check.txt      # Format results
docs/dev-note/issue-#[N]-pnpm-type-check.txt   # Type check results
```

If any check fails, fix and re-run. Orchestrator validates pre-merge.

---

**Last Updated**: 2026-05-19  
**Pattern**: GitHub Official (path-specific instruction file with `applyTo` glob)
