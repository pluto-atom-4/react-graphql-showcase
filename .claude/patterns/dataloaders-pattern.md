# DataLoader Pattern

Batch-load GraphQL resolver dependencies to prevent N+1 queries.

## When to Use
- Loading related entities (build → parts, user → builds)
- Querying collections in nested resolvers
- Cross-table joins in Apollo resolvers

## Pattern
```typescript
// Create loaders in context initialization
const createContext = () => ({
  loaders: {
    buildsByUser: new DataLoader(async (userIds) => {
      const builds = await db.build.findMany({
        where: { userId: { in: userIds } }
      });
      return userIds.map(id => builds.filter(b => b.userId === id));
    }),
    partsByBuild: new DataLoader(async (buildIds) => {
      const parts = await db.part.findMany({
        where: { buildId: { in: buildIds } }
      });
      return buildIds.map(id => parts.filter(p => p.buildId === id));
    }),
  }
});

// Use in resolver
const resolvers = {
  Build: {
    parts: (build, _, { loaders }) => loaders.partsByBuild.load(build.id),
    testRuns: (build, _, { loaders }) => loaders.testRunsByBuild.load(build.id)
  }
};
```

## Key Rules
1. **One loader per relationship** (one table → one loader instance)
2. **Return arrays in same order** as input IDs
3. **Load during batch** before resolver returns
4. **Cache within request scope** (fresh per HTTP request)
5. **Handle empty batches** (return empty arrays)

## Testing
```typescript
it('batches multiple builds', async () => {
  const loader = new DataLoader(getBuildsByUser);
  const [builds1, builds2] = await Promise.all([
    loader.load('user1'),
    loader.load('user1')  // same batch
  ]);
  expect(dbQueryCount).toBe(1); // single query
});
```

## Common Mistakes
- Returning scalars instead of arrays
- Creating new loaders per resolver call
- Mixing loader instances across requests
- Forgetting to handle null/undefined IDs

## Verify First: DataLoader Implementation

Check that DataLoader is correctly implemented:

```bash
# ✓ Loaders defined in context
grep -r "new DataLoader" backend-graphql/src/ || echo "⚠ No DataLoaders found"

# ✓ Loaders used in resolvers
grep -r "loaders\." backend-graphql/src/resolvers/ || echo "⚠ Loaders not used"

# ✓ No N+1 queries (test with slow query logging)
# In resolver test, verify single batch query vs N queries

# ✓ Tests verify batch behavior
grep -r "batches\|batch" backend-graphql/src/**/*.test.ts || echo "⚠ No batch tests"

# ✓ Context properly initializes loaders
grep -r "createContext" backend-graphql/src/ | head -5
```

**Quick Test**:
```bash
pnpm test:graphql --run -- dataloaders
```

**Common Regression**: If you see multiple similar queries in logs, DataLoader may not be applied.

## Links
- Backend GraphQL Instructions: `.github/instructions/backend-graphql.instructions.md`
- Schema: `backend-graphql/src/schema.graphql`
