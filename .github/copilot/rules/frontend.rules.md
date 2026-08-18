# Frontend Domain Rules

Rules and best practices for Next.js, React, and Apollo Client development in `frontend/`.

---

## Architecture Rules

### RSC Pattern (Server/Client Components)
- ✅ **DO**: Use Server Components for data fetching, database queries, secrets
- ✅ **DO**: Use Client Components for interactivity (click, input, state)
- ✅ **DO**: Place `"use client"` at top of Client Component files
- ❌ **DON'T**: Fetch data in Client Components (use Server Components)
- ❌ **DON'T**: Use event handlers in Server Components
- ❌ **DON'T**: Mix Server and Client logic in same component

**Pattern**: 
```tsx
// ✅ Server Component (app/builds/page.tsx)
export default async function BuildsPage() {
  const builds = await fetchBuilds();
  return <BuildsList initialBuilds={builds} />;
}

// ✅ Client Component (components/BuildsList.tsx)
"use client";
export default function BuildsList({ initialBuilds }) {
  const [builds, setBuilds] = useState(initialBuilds);
  return <div onClick={() => { /* interactive */ }}>;
}
```

### Apollo Client Setup
- ✅ **DO**: Initialize Apollo Client once in `lib/apollo.ts`
- ✅ **DO**: Configure cache policy (cache-first, network-only, etc.)
- ✅ **DO**: Setup error link for global error handling
- ✅ **DO**: Use `useApolloClient()` only in Client Components
- ❌ **DON'T**: Create Apollo Client in component bodies
- ❌ **DON'T**: Store Apollo Client state in Redux or Context

**Quick Check**: `lib/apollo.ts` exports single `getApolloClient()` function

### Component Organization
- ✅ **DO**: Group related components in feature directories
- ✅ **DO**: Use index.ts for clean exports
- ✅ **DO**: Keep component files < 300 lines
- ❌ **DON'T**: Put multiple components in one file

**Pattern**:
```
frontend/components/
├── Builds/
│   ├── BuildList.tsx
│   ├── BuildCard.tsx
│   ├── BuildForm.tsx
│   └── index.ts
├── Shared/
│   └── ErrorBoundary.tsx
```

---

## Interaction & State Rules

### Apollo Mutations
- ✅ **DO**: Include cache update logic for mutations
- ✅ **DO**: Refetch queries on mutation (setContext)
- ✅ **DO**: Handle mutation errors with error UI
- ❌ **DON'T**: Omit error handling on mutations
- ❌ **DON'T**: Mutate Apollo cache directly without refetch

**Pattern**:
```tsx
const [createBuild] = useMutation(CREATE_BUILD_MUTATION, {
  refetchQueries: [{ query: GET_BUILDS_QUERY }],
  onError: (error) => setError(error.message),
});
```

### Form Handling
- ✅ **DO**: Use controlled components (state + onChange)
- ✅ **DO**: Validate on submit, not on change
- ✅ **DO**: Clear form after successful submission
- ✅ **DO**: Show loading state while submitting
- ❌ **DON'T**: Use uncontrolled components (<input defaultValue>)
- ❌ **DON'T**: Validate on every keystroke (performance)

**Pattern**:
```tsx
const [formData, setFormData] = useState({ name: "" });
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await createBuild({ variables: formData });
    setFormData({ name: "" }); // Clear after success
  } finally {
    setLoading(false);
  }
};
```

### Error Boundaries
- ✅ **DO**: Wrap feature sections with error boundaries
- ✅ **DO**: Log errors to monitoring service
- ✅ **DO**: Show user-friendly error messages
- ❌ **DON'T**: Let errors propagate to root component

**Pattern**:
```tsx
<ErrorBoundary fallback={<ErrorUI />}>
  <BuildsList />
</ErrorBoundary>
```

---

## Performance Rules

### Optimization Techniques
- ✅ **DO**: Use `React.memo()` for expensive components
- ✅ **DO**: Use `useMemo()` for expensive computations
- ✅ **DO**: Use `useCallback()` for stable function refs
- ✅ **DO**: Lazy load routes: `next/dynamic`
- ❌ **DON'T**: Use `useMemo()` for simple values
- ❌ **DON'T**: Wrap all functions in `useCallback()`

**Pattern**:
```tsx
// ✅ Expensive list rendering
const BuildList = React.memo(({ builds }) => (
  <div>{builds.map(b => <BuildCard key={b.id} build={b} />)}</div>
));

// ✅ Expensive computation
const derivedValue = useMemo(() => compute(data), [data]);
```

### Image Optimization
- ✅ **DO**: Use `next/image` for all images
- ✅ **DO**: Specify width/height for static images
- ✅ **DO**: Use `priority` for above-fold images
- ❌ **DON'T**: Use `<img>` tag
- ❌ **DON'T**: Omit width/height (layout shift)

### CSS & Styling
- ✅ **DO**: Use Tailwind CSS utility classes
- ✅ **DO**: Use CSS modules for component-scoped styles
- ✅ **DO**: Use `clsx` or `classnames` for conditional classes
- ❌ **DON'T**: Use inline styles (except for dynamic values)
- ❌ **DON'T**: Use global CSS (except reset, fonts)

---

## Testing Rules

### Unit Tests
- ✅ **DO**: Test component rendering with React Testing Library
- ✅ **DO**: Test user interactions (click, input)
- ✅ **DO**: Mock Apollo Client, external APIs
- ✅ **DO**: Test error states
- ❌ **DON'T**: Test implementation details (internal state)
- ❌ **DON'T**: Use snapshot tests (brittle)

**Coverage Target**: 80% for components, 100% for utils

**Quick Check**: `pnpm test:frontend --run --coverage`

### Apollo Testing
- ✅ **DO**: Mock Apollo Client for component tests
- ✅ **DO**: Test query loading/error/success states
- ✅ **DO**: Test mutation side effects (cache updates, errors)

**Pattern**:
```tsx
import { MockedProvider } from "@apollo/client/testing";

const mocks = [
  {
    request: { query: GET_BUILDS_QUERY },
    result: { data: { builds: [...] } },
  },
];

render(
  <MockedProvider mocks={mocks}>
    <BuildsList />
  </MockedProvider>
);
```

---

## Accessibility Rules

### HTML Semantics
- ✅ **DO**: Use semantic HTML (`<button>`, `<a>`, `<nav>`)
- ✅ **DO**: Use proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)
- ✅ **DO**: Use `<label>` for all form inputs
- ✅ **DO**: Use `<form>` for form groups
- ❌ **DON'T**: Use `<div>` for buttons (use `<button>`)
- ❌ **DON'T**: Skip headings or use non-sequential levels

### ARIA & Labels
- ✅ **DO**: Add `aria-label` for icon-only buttons
- ✅ **DO**: Add `aria-describedby` for complex forms
- ✅ **DO**: Use `role` only when semantic HTML unavailable
- ❌ **DON'T**: Use `role="button"` on `<div>` (use `<button>`)
- ❌ **DON'T**: Forget labels on inputs

### Keyboard Navigation
- ✅ **DO**: Ensure all interactive elements are keyboard-accessible (Tab key)
- ✅ **DO**: Show focus indicators (outline, not just color)
- ✅ **DO**: Implement skip links for navigation
- ❌ **DON'T**: Remove focus outlines (accessibility violation)

---

## Code Quality Rules

### TypeScript
- ✅ **DO**: Use strict mode: `"strict": true` in tsconfig.json
- ✅ **DO**: Type all function parameters and return types
- ✅ **DO**: Use interfaces for component props
- ✅ **DO**: Use `as const` for literal types
- ❌ **DON'T**: Use `any` type
- ❌ **DON'T**: Omit return types on functions

**Quick Check**: `pnpm type-check`

### Linting
- ✅ **DO**: Use ESLint (flat config)
- ✅ **DO**: Use React hooks plugin rules
- ✅ **DO**: Fix all violations: `pnpm lint:fix`
- ✅ **DO**: Commit with clean lint status
- ❌ **DON'T**: Ignore lint warnings
- ❌ **DON'T**: Use `// eslint-disable` without reason

**Quick Check**: `pnpm lint`

### Code Formatting
- ✅ **DO**: Use Prettier for formatting
- ✅ **DO**: Run before commit: `pnpm lint:fix`
- ✅ **DO**: Configure IDE to format on save
- ❌ **DON'T**: Manually format code (use Prettier)

**Quick Check**: `pnpm format:check`

---

## File Organization Rules

### Directory Structure
```
frontend/
├── app/                    # Next.js App Router (Server Components)
│   ├── (auth)/            # Route group for auth-protected pages
│   ├── builds/            # Feature page
│   │   └── page.tsx
│   └── layout.tsx
├── components/            # Reusable Client Components
│   ├── Builds/
│   ├── Shared/
│   └── UI/
├── lib/                   # Utilities and configuration
│   ├── apollo.ts          # Apollo Client setup
│   ├── use-sse-events.ts  # Custom hooks
│   └── utils.ts
├── __tests__/             # Tests (mirror structure)
├── styles/                # Global styles
│   └── globals.css
└── types/                 # Global types
    └── index.ts
```

### Import Organization
- ✅ **DO**: Group imports: React, external libs, internal components
- ✅ **DO**: Use absolute imports from `@/` alias
- ✅ **DO**: Use barrel exports (index.ts)

**Pattern**:
```tsx
import React from "react";
import { useMutation } from "@apollo/client";
import { ErrorBoundary } from "@/components/Shared";
```

---

## Related Documentation

- **See**: `.github/instructions/frontend.instructions.md` (detailed layer guide)
- **See**: `DESIGN.md` (architecture overview)
- **See**: `SKILLS.md` (14 frontend skills indexed)

---

**Last Updated**: 2026-08-17  
**Scope**: `frontend/` directory  
**Quick Check**: `pnpm test:frontend --run && pnpm lint && pnpm type-check`
