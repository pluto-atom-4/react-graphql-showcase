# Server vs Client Components Pattern

Next.js 13+ distinguishes server and client rendering contexts.

## Server Components (Default)
Run only on server; no browser bundle. Use for:
- Direct database access
- Private environment variables
- Fetching data at build or request time
- Rendering static UI

```typescript
// frontend/app/builds/page.tsx (Server Component)
import { getPrismaClient } from '@/lib/prisma';

export default async function BuildsPage() {
  const builds = await getPrismaClient().build.findMany();
  return <BuildsList builds={builds} />; // Serializable only
}
```

## Client Components
Run in browser. Mark with `'use client'` for:
- User interactions (click, submit, input)
- Browser APIs (localStorage, window)
- React hooks (useState, useContext, useEffect)
- Apollo Client queries

```typescript
// frontend/components/BuildForm.tsx (Client Component)
'use client';
import { useMutation } from '@apollo/client';

export function BuildForm() {
  const [createBuild] = useMutation(CREATE_BUILD);
  return <form onSubmit={(e) => createBuild()} />;
}
```

## Boundary Pattern
```typescript
// Server component uses data, passes to Client
export default async function Page() {
  const data = await fetch(...);
  return <ClientChild data={data} />; // Props are serializable
}

// Client component handles interaction
'use client';
export function ClientChild({ data }) {
  const [selected, setSelected] = useState(null);
  return <div onClick={() => setSelected(data.id)} />;
}
```

## Key Rules
1. Default to Server Components
2. Mark interactive components with `'use client'`
3. Pass serializable data across boundary
4. No 'use client' in libraries (confuses bundling)
5. Fragments/hooks go in client components

## Links
- Frontend Instructions: `.github/instructions/frontend.instructions.md`
- Root Server Component: `frontend/app/page.tsx`
