# Tester Agent

## Role

The Tester Agent develops and maintains comprehensive test strategies across all three layers, ensuring new features have adequate coverage and existing tests remain reliable.

## Responsibilities

- Design test strategies for new features
- Write unit tests for business logic and resolvers
- Write integration tests for cross-layer flows
- Write E2E tests for critical user workflows (Playwright)
- Maintain test fixtures and mocks
- Review test coverage reports
- Debug failing tests
- Validate error scenarios and edge cases

## GitHub Copilot CLI Commands

**Tester-Specific Commands**:

```bash
# Test Execution & Debugging
/test                          # Run relevant test files
/debug                         # Debug failing test with breakpoints
/diff                          # Review test changes

# Communication
/ask                           # Ask developer about test scenarios
/share                         # Share test strategy with team
/delegate                      # Escalate test architecture to Orchestrator

# Session Management
/context                       # Check token usage for large test suites
/compact                       # Summarize if working with many tests
```

## Test Commands

### Running Tests

```bash
# Run all tests (across all workspaces)
pnpm test

# Run in watch mode (re-run on file changes)
pnpm test --watch

# Run with coverage report
pnpm test --coverage

# Run specific test file
pnpm test path/to/file.test.ts

# Run by layer
pnpm test:frontend      # React components + Apollo
pnpm test:graphql       # GraphQL resolvers + DataLoader
pnpm test:express       # Express routes + webhooks
```

### Debugging Tests

```bash
# Run single test in verbose mode
pnpm test path/to/file.test.ts --reporter=verbose

# Run with additional logging
pnpm test path/to/file.test.ts --reporter=verbose 2>&1 | head -100

# Use console.log in test for debugging
// In test file
console.log('Debug info:', value);
pnpm test path/to/file.test.ts
```

### Coverage Reports

```bash
# Generate coverage
pnpm test --coverage

# Open HTML coverage report
open coverage/index.html

# Check coverage by file
cat coverage/coverage-final.json | grep '"statements"'
```

## Apollo Client 4.1.7 Testing Setup (Issue #3)

### Import Paths for Testing

Apollo Client v4.1.7 reorganized exports. Use these paths for tests:

```typescript
// ✅ Testing utilities (unchanged from v3)
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

// ✅ React hooks (NEW PATH in v4.1.7 - use in component tests)
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';

// ✅ Core client setup
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

// ✅ GraphQL utilities
import { gql } from '@apollo/client/core';
```

### Testing Notes

- ✅ **MockedProvider**: Works identically to v3—no changes to test patterns
- ✅ **useQuery/useMutation**: Same API as v3—all existing tests remain valid
- ✅ **Optimistic updates**: Fully supported with `optimisticResponse` and `update` functions
- ✅ **Cache eviction**: Works as before with `client.cache.evict()` and `client.cache.gc()`
- ✅ **useApolloClient**: Unchanged—can still access Apollo client in tests
- ❌ **useSuspenseQuery**: NOT used (we use `useQuery` with loading states for Next.js compatibility)

### Breaking Changes: None

All existing test patterns for Issue #3 acceptance criteria remain valid:
- Component tests with `useQuery` and `useMutation`
- Optimistic update tests
- Real-time SSE event tests
- Cache update tests
- Error handling tests

### Testing Fresh Per-Request Apollo (Server Components)

When testing Next.js Server Components that fetch data server-side, use **fresh Apollo instances per request** (see Fresh Per-Request Pattern in CLAUDE.md):

**✅ CORRECT** — Fresh instance per test:

```typescript
// __tests__/integration/dashboard.server.test.ts
import { registerApolloClient } from '@apollo/client-integration-nextjs';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GET_BUILDS } from '@/lib/graphql/queries';

describe('Server Component Data Fetching', () => {
  it('fetches builds server-side with fresh Apollo instance', async () => {
    // Create fresh client instance for this test
    const { getClient } = registerApolloClient(() => new ApolloClient({
      ssrMode: true,
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
      cache: new InMemoryCache(),
    }));
    
    const client = getClient();
    const { data } = await client.query({ query: GET_BUILDS });
    
    expect(data.builds).toHaveLength(2);
  });
  
  it('isolates data between requests', async () => {
    // Test 1 fetches builds for User A
    const { getClient: getClient1 } = registerApolloClient(() => new ApolloClient({
      ssrMode: true,
      cache: new InMemoryCache(),
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' })
    }));
    const client1 = getClient1();
    const result1 = await client1.query({ query: GET_BUILDS });
    
    // Test 2 fetches builds for User B (fresh instance, separate cache)
    const { getClient: getClient2 } = registerApolloClient(() => new ApolloClient({
      ssrMode: true,
      cache: new InMemoryCache(), // FRESH cache, not shared
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' })
    }));
    const client2 = getClient2();
    const result2 = await client2.query({ query: GET_BUILDS });
    
    // Each request has isolated cache (no data leakage)
    expect(client1.cache).not.toBe(client2.cache);
  });
});
```

**❌ INCORRECT** — Singleton client (data leaks across tests):

```typescript
// ❌ DO NOT DO THIS
const apolloClient = new ApolloClient({ ... });

test('test 1', async () => {
  const result = await apolloClient.query({ query: GET_BUILDS }); // Shared cache
});

test('test 2', async () => {
  const result = await apolloClient.query({ query: GET_BUILDS }); // Same cache!
  // May get data from Test 1
});
```

**Why This Matters**: Server Components must isolate Apollo cache per request to prevent User A from seeing User B's data during testing.

## Test Organization

### Directory Structure

```
frontend/
  __tests__/
    components/           # Component tests
    hooks/               # Hook tests
    lib/                 # Utility function tests
  __mocks__/
    apollo/              # Apollo MockedProvider setup
    hooks/               # Mock hook implementations

backend-graphql/
  src/
    resolvers/
      __tests__/         # Resolver tests
      __mocks__/         # Mock data for resolvers
    services/
      __tests__/         # Service logic tests
    schema/              # Schema files (no tests)

backend-express/
  src/
    routes/
      __tests__/         # Route tests
      __fixtures__/      # Test data fixtures
    middleware/
      __tests__/         # Middleware tests
```

## Test Types & Strategies

### 1. Unit Tests

**What**: Test individual functions, resolvers, or components in isolation

**Where**: Same directory as source file with `.test.ts` suffix

**Tools**: Vitest + React Testing Library (frontend)

#### Frontend Unit Test Example

```typescript
// components/BuildCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BuildCard } from './BuildCard';

describe('BuildCard', () => {
  it('renders build status', () => {
    render(<BuildCard build={{ id: '1', status: 'COMPLETE' }} />);
    
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });
  
  it('calls onStatusChange when status updated', async () => {
    const onStatusChange = vi.fn();
    const { getByRole } = render(
      <BuildCard 
        build={{ id: '1', status: 'PENDING' }}
        onStatusChange={onStatusChange}
      />
    );
    
    await userEvent.click(getByRole('button', { name: /complete/i }));
    
    expect(onStatusChange).toHaveBeenCalledWith('COMPLETE');
  });
});
```

#### GraphQL Resolver Unit Test Example

```typescript
// resolvers/query.test.ts
import { queryResolvers } from './query';
import * as prisma from '@prisma/client';

vi.mock('@prisma/client');

describe('queryResolvers.builds', () => {
  it('returns all builds', async () => {
    vi.spyOn(prisma.build, 'findMany').mockResolvedValue([
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'COMPLETE' }
    ]);
    
    const builds = await queryResolvers.builds(null, {}, { dataloaders: {} });
    
    expect(builds).toHaveLength(2);
  });
  
  it('filters by status when provided', async () => {
    const spy = vi.spyOn(prisma.build, 'findMany');
    
    await queryResolvers.builds(null, { status: 'COMPLETE' }, { dataloaders: {} });
    
    expect(spy).toHaveBeenCalledWith({
      where: { status: 'COMPLETE' }
    });
  });
});
```

#### GraphQL Resolver Error Testing

Resolvers must handle errors gracefully. Test both validation errors and database errors:

```typescript
// resolvers/mutation.test.ts
import { mutationResolvers } from './mutation';
import * as prisma from '@prisma/client';

vi.mock('@prisma/client');

describe('mutationResolvers.updateBuildStatus', () => {
  it('throws error if build not found', async () => {
    vi.spyOn(prisma.build, 'findUnique').mockResolvedValue(null);
    
    await expect(
      mutationResolvers.updateBuildStatus(null, { id: 'nonexistent', status: 'COMPLETE' }, { dataloaders: {} })
    ).rejects.toThrow('Build not found');
  });
  
  it('throws error if status invalid', async () => {
    await expect(
      mutationResolvers.updateBuildStatus(null, { id: '1', status: 'INVALID_STATUS' }, { dataloaders: {} })
    ).rejects.toThrow('Invalid status');
  });
  
  it('throws Unauthorized if user not authenticated', async () => {
    await expect(
      mutationResolvers.updateBuildStatus(null, { id: '1', status: 'COMPLETE' }, { user: null, dataloaders: {} })
    ).rejects.toThrow('Unauthorized');
  });
  
  it('returns updated build on success', async () => {
    const mockBuild = { id: '1', status: 'COMPLETE' };
    vi.spyOn(prisma.build, 'update').mockResolvedValue(mockBuild);
    
    const result = await mutationResolvers.updateBuildStatus(
      null, 
      { id: '1', status: 'COMPLETE' }, 
      { user: { id: 'user_1' }, dataloaders: {} }
    );
    
    expect(result).toEqual(mockBuild);
  });
  
  it('handles database errors gracefully', async () => {
    vi.spyOn(prisma.build, 'update').mockRejectedValue(new Error('Database connection lost'));
    
    await expect(
      mutationResolvers.updateBuildStatus(
        null, 
        { id: '1', status: 'COMPLETE' }, 
        { user: { id: 'user_1' }, dataloaders: {} }
      )
    ).rejects.toThrow('Database connection lost');
  });
});
```

**Error Testing Pattern**:
1. **Validation errors** (bad input) → throw before database call
2. **Auth errors** (missing context.user) → throw immediately
3. **Not-found errors** (ID doesn't exist) → throw after query
4. **Database errors** (connection, timeout) → propagate cleanly
5. **Success path** → test return value and side effects

#### Express Route Unit Test Example

```typescript
// routes/upload.test.ts
import supertest from 'supertest';
import app from '../index';

describe('POST /upload', () => {
  it('accepts file upload and returns fileId', async () => {
    const res = await supertest(app)
      .post('/upload')
      .attach('file', 'test/fixtures/sample.pdf')
      .field('buildId', '123');
    
    expect(res.status).toBe(200);
    expect(res.body.fileId).toMatch(/^file_/);
  });
  
  it('rejects upload without file', async () => {
    const res = await supertest(app)
      .post('/upload')
      .field('buildId', '123');
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/file required/i);
  });
});
```

### 2. Integration Tests

**What**: Test components or modules working together (e.g., resolver + ORM, component + Apollo)

**Where**: Grouped in `__tests__` directories or `.integration.test.ts` files

**Tools**: Vitest + MockedProvider (frontend), Vitest + mocked database (backend)

#### Frontend Integration Test Example (Component + Apollo)

```typescript
// __tests__/integration/BuildUpdate.integration.test.tsx
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { UpdateBuildForm } from '../../../components/UpdateBuildForm';
import { UPDATE_BUILD_STATUS } from '../../../queries/mutations';

describe('BuildUpdate Integration', () => {
  it('updates build status with optimistic update', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_BUILD_STATUS,
          variables: { id: '1', status: 'COMPLETE' }
        },
        result: {
          data: {
            updateBuild: { id: '1', status: 'COMPLETE', __typename: 'Build' }
          }
        }
      }
    ];
    
    render(
      <MockedProvider mocks={mocks}>
        <UpdateBuildForm buildId="1" />
      </MockedProvider>
    );
    
    // Optimistic update shows immediately
    await userEvent.click(screen.getByRole('button', { name: /complete/i }));
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    
    // Server confirms
    await waitFor(() => {
      expect(screen.getByText('✓ Saved')).toBeInTheDocument();
    });
  });
});
```

#### GraphQL Integration Test Example (Resolver + DataLoader + Prisma)

```typescript
// resolvers/__tests__/build.integration.test.ts
import { buildResolvers } from '../build';
import * as prisma from '@prisma/client';
import DataLoader from 'dataloader';

vi.mock('@prisma/client');

describe('Build Resolver Integration', () => {
  it('loads parts using DataLoader without N+1', async () => {
    const buildRows = [
      { id: '1', name: 'Build A' },
      { id: '2', name: 'Build B' }
    ];
    
    const partRows = [
      { buildId: '1', id: 'p1', name: 'Part 1' },
      { buildId: '1', id: 'p2', name: 'Part 2' },
      { buildId: '2', id: 'p3', name: 'Part 3' }
    ];
    
    vi.spyOn(prisma.part, 'findMany').mockResolvedValue(partRows);
    
    // Create DataLoader
    const partLoader = new DataLoader(async (buildIds) => {
      return buildIds.map(id => partRows.filter(p => p.buildId === id));
    });
    
    // Resolve parts for multiple builds
    const dataloaders = { partLoader };
    const parts1 = buildResolvers.parts(buildRows[0], {}, { dataloaders });
    const parts2 = buildResolvers.parts(buildRows[1], {}, { dataloaders });
    
    // Verify both calls resolved without multiple DB queries
    expect(await Promise.all([parts1, parts2])).toEqual([
      [{ buildId: '1', id: 'p1' }, { buildId: '1', id: 'p2' }],
      [{ buildId: '2', id: 'p3' }]
    ]);
  });
});
```

#### Express Integration Test Example (Route + Event Bus)

```typescript
// routes/__tests__/webhook.integration.test.ts
import supertest from 'supertest';
import app from '../../index';
import { eventBus } from '../../event-bus';

describe('Webhook Integration', () => {
  it('processes webhook and emits event', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    
    const res = await supertest(app)
      .post('/webhooks/ci-results')
      .send({
        buildId: '123',
        status: 'PASSED',
        testsPassed: 45,
        testsFailed: 0
      });
    
    expect(res.status).toBe(200);
    
    expect(emitSpy).toHaveBeenCalledWith(
      'ciResultsReceived',
      expect.objectContaining({
        buildId: '123',
        status: 'PASSED'
      })
    );
  });
});
```

#### Complete Event Bus Testing Pattern (GraphQL → Express → Frontend)

Real-time events flow through 3 layers. Test the complete cycle:

```typescript
// __tests__/integration/event-bus-complete.test.ts
import supertest from 'supertest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import app from '../../backend-express/src/index';
import { UPDATE_BUILD_STATUS } from '../lib/graphql/mutations';
import BuildStatusUpdater from '../components/BuildStatusUpdater';
import { eventBus } from '../../backend-express/src/event-bus';

describe('Complete Event Bus Cycle', () => {
  it('GraphQL mutation → Express event → Frontend SSE listener', async () => {
    // STEP 1: Mock Apollo mutation
    const mocks = [
      {
        request: {
          query: UPDATE_BUILD_STATUS,
          variables: { id: 'build_1', status: 'COMPLETE' }
        },
        result: {
          data: {
            updateBuildStatus: { 
              id: 'build_1', 
              status: 'COMPLETE',
              __typename: 'Build'
            }
          }
        }
      }
    ];
    
    // STEP 2: Mock Express event emission
    const emitSpy = vi.spyOn(eventBus, 'emit');
    
    // STEP 3: Simulate mutation triggering event
    await eventBus.emit('buildStatusChanged', {
      buildId: 'build_1',
      status: 'COMPLETE',
      timestamp: new Date().toISOString()
    });
    
    expect(emitSpy).toHaveBeenCalledWith(
      'buildStatusChanged',
      expect.objectContaining({ buildId: 'build_1', status: 'COMPLETE' })
    );
  });
  
  it('frontend listens to SSE buildStatusChanged event', async () => {
    // Mock EventSource
    const mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    };
    global.EventSource = vi.fn(() => mockEventSource);
    
    // Render component with real-time listener
    render(
      <MockedProvider mocks={[]}>
        <BuildStatusUpdater buildId="build_1" />
      </MockedProvider>
    );
    
    // Verify EventSource connected to Express
    expect(global.EventSource).toHaveBeenCalledWith(
      'http://localhost:5000/events'
    );
    
    // Simulate SSE event from Express
    const eventHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'buildStatusChanged'
    )[1];
    
    const fakeEvent = new Event('buildStatusChanged');
    fakeEvent.data = JSON.stringify({
      buildId: 'build_1',
      status: 'COMPLETE'
    });
    
    eventHandler(fakeEvent);
    
    // UI updates with new status
    await waitFor(() => {
      expect(screen.getByText(/status.*complete/i)).toBeInTheDocument();
    });
    
    // Cleanup
    expect(mockEventSource.close).toHaveBeenCalled();
  });
  
  it('Express broadcasts event to multiple SSE clients', async () => {
    // Simulate 2 connected clients
    const client1Listeners = {};
    const client2Listeners = {};
    
    const mockEventSource1 = {
      addEventListener: vi.fn((event, handler) => {
        client1Listeners[event] = handler;
      })
    };
    const mockEventSource2 = {
      addEventListener: vi.fn((event, handler) => {
        client2Listeners[event] = handler;
      })
    };
    
    global.EventSource = vi
      .fn()
      .mockReturnValueOnce(mockEventSource1)
      .mockReturnValueOnce(mockEventSource2);
    
    // Connect 2 clients
    render(
      <MockedProvider mocks={[]}>
        <BuildStatusUpdater buildId="build_1" />
      </MockedProvider>
    );
    
    render(
      <MockedProvider mocks={[]}>
        <BuildStatusUpdater buildId="build_1" />
      </MockedProvider>
    );
    
    // Emit event via eventBus (like GraphQL mutation would)
    eventBus.emit('buildStatusChanged', {
      buildId: 'build_1',
      status: 'COMPLETE'
    });
    
    // Both clients receive event (manually fire handlers in test)
    const fakeEvent = new Event('buildStatusChanged');
    fakeEvent.data = JSON.stringify({
      buildId: 'build_1',
      status: 'COMPLETE'
    });
    
    if (client1Listeners['buildStatusChanged']) {
      client1Listeners['buildStatusChanged'](fakeEvent);
    }
    if (client2Listeners['buildStatusChanged']) {
      client2Listeners['buildStatusChanged'](fakeEvent);
    }
    
    // Both UIs updated
    const completeTexts = screen.getAllByText(/status.*complete/i);
    expect(completeTexts.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Event Bus Testing Flow**:
1. **Mutation layer** (GraphQL) → Trigger event via `eventBus.emit()`
2. **Event layer** (Express) → Verify event was emitted with correct data
3. **Frontend layer** → Mock EventSource, simulate SSE message, verify UI updates
4. **Multi-client** → Ensure broadcast reaches all connected clients

### 3. End-to-End Tests (Playwright)

**What**: Test complete user workflows from frontend through backend

**Where**: `frontend/e2e/` or `tests/e2e/`

**Tools**: Playwright

#### E2E Test Example (Create Build → View Status → Check Real-Time Update)

```typescript
// e2e/build-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('user can create build and see real-time updates', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');
  
  // Click "New Build" button
  await page.click('button:has-text("New Build")');
  
  // Fill form
  await page.fill('input[name="name"]', 'Test Build');
  await page.fill('input[name="description"]', 'E2E test build');
  
  // Submit
  await page.click('button:has-text("Create")');
  
  // Wait for build to appear in list
  const buildCard = page.locator('text=Test Build');
  await expect(buildCard).toBeVisible();
  
  // Navigate to build details
  await buildCard.click();
  
  // Verify build status
  await expect(page.locator('text=Status: PENDING')).toBeVisible();
  
  // Open another tab and update status (simulating real-time)
  const context = page.context();
  const adminPage = await context.newPage();
  await adminPage.goto('http://localhost:3000/admin');
  await adminPage.click('button:has-text("Complete Build")');
  
  // Original page should update in real-time
  await expect(page.locator('text=Status: COMPLETE')).toBeVisible({ timeout: 5000 });
  
  await adminPage.close();
});
```

## DataLoader Anti-Patterns to Avoid

DataLoader is powerful but has subtle bugs if misused. Here are common pitfalls:

### Anti-Pattern 1: Reusing DataLoader Across Requests

**❌ INCORRECT** — Singleton DataLoader (data leaks):

```typescript
// ❌ DO NOT DO THIS
const globalPartLoader = new DataLoader(async (buildIds) => {
  return prisma.part.findMany({ where: { buildId: { in: buildIds } } });
});

const resolvers = {
  Build: {
    parts: (parent, args, context) => {
      return globalPartLoader.load(parent.id); // Same loader for all requests
    }
  }
};
```

**Why it fails**: Same DataLoader instance = shared batch queue across users. User A's DataLoader caches User B's data.

**✅ CORRECT** — Fresh DataLoader per request:

```typescript
// ✅ CREATE PER-REQUEST (in apollo context factory)
const createDataloaders = () => ({
  partLoader: new DataLoader(async (buildIds) => {
    return buildIds.map(buildId => 
      prisma.part.findMany({ where: { buildId } })
    );
  })
});

server.use((req, res, next) => {
  req.context = {
    dataloaders: createDataloaders(), // Fresh instance per request
    user: extractUserFromAuth(req)
  };
  next();
});

const resolvers = {
  Build: {
    parts: (parent, args, context) => {
      return context.dataloaders.partLoader.load(parent.id); // Per-request loader
    }
  }
};
```

### Anti-Pattern 2: Incorrect Return Order

**❌ INCORRECT** — Returns in wrong order:

```typescript
// ❌ DO NOT DO THIS
const partLoader = new DataLoader(async (buildIds) => {
  const parts = await prisma.part.findMany({ where: { buildId: { in: buildIds } } });
  return parts; // Returns all parts, not grouped by buildId order
});

// Input: [1, 2, 3]
// Database returns: [part_2a, part_2b, part_3a, part_1a] (unsorted)
// Expected: [[part_1a], [part_2a, part_2b], [part_3a]]
// Actual: [part_2a, part_2b, part_3a, part_1a] ← WRONG ORDER
```

**Why it fails**: DataLoader expects return array to match input key order. Mismatched order = wrong parts attached to wrong builds.

**✅ CORRECT** — Return in same order as input:

```typescript
// ✅ CORRECT ORDER
const partLoader = new DataLoader(async (buildIds) => {
  const parts = await prisma.part.findMany({ 
    where: { buildId: { in: buildIds } } 
  });
  
  // Group by buildId and return in same order as buildIds
  return buildIds.map(buildId =>
    parts.filter(p => p.buildId === buildId)
  );
  
  // Input: [1, 2, 3]
  // Returns: [[part_1a], [part_2a, part_2b], [part_3a]] ✓ Correct order
});
```

### Anti-Pattern 3: Testing with Shared DataLoader

**❌ INCORRECT** — DataLoader leaks between tests:

```typescript
// ❌ DO NOT DO THIS
describe('Parts', () => {
  let partLoader;
  
  beforeAll(() => {
    partLoader = new DataLoader(async (buildIds) => { ... });
  });
  
  test('test 1', async () => {
    const parts = await partLoader.load('build_1');
    expect(parts).toHaveLength(2); // Cached
  });
  
  test('test 2', async () => {
    const parts = await partLoader.load('build_1');
    // Gets cached result from test 1, not fresh data
  });
});
```

**✅ CORRECT** — Fresh DataLoader per test:

```typescript
// ✅ FRESH LOADER PER TEST
describe('Parts', () => {
  let partLoader;
  
  beforeEach(() => {
    partLoader = new DataLoader(async (buildIds) => { ... });
  });
  
  test('test 1', async () => {
    const parts = await partLoader.load('build_1');
    expect(parts).toHaveLength(2);
  });
  
  test('test 2', async () => {
    const parts = await partLoader.load('build_1'); // Fresh loader, fresh data
  });
});
```

### Anti-Pattern 4: Handling Null/Error in DataLoader

**❌ INCORRECT** — Errors crash the batch:

```typescript
// ❌ DO NOT DO THIS
const partLoader = new DataLoader(async (buildIds) => {
  try {
    return prisma.part.findMany({ where: { buildId: { in: buildIds } } });
  } catch (err) {
    throw err; // Throws for ALL buildIds
  }
});
```

**✅ CORRECT** — Map errors per key:

```typescript
// ✅ HANDLE ERRORS PER KEY
const partLoader = new DataLoader(async (buildIds) => {
  const parts = await prisma.part.findMany({ 
    where: { buildId: { in: buildIds } } 
  }).catch(err => {
    return buildIds.map(() => new Error(err.message));
  });
  
  // Return error or empty array per key
  return buildIds.map(buildId => {
    const result = parts.find(p => p.buildId === buildId);
    return result || [];
  });
});
```

## Test Coverage Requirements

### Minimum Coverage by Layer

| Layer | Coverage | Critical Paths |
|-------|----------|-----------------|
| Frontend | 70% | 100% (mutations, real-time) |
| GraphQL | 80% | 100% (resolvers, DataLoader) |
| Express | 75% | 100% (webhooks, uploads) |

### What Must Be 100% Covered

✅ **Mutation resolvers** (data changes)
✅ **DataLoader implementations** (performance critical)
✅ **Event emission** (real-time coordination)
✅ **Error handlers** (robustness)
✅ **File upload routes** (critical business logic)
✅ **Apollo cache updates** (UI correctness)

### What's Acceptable at Lower Coverage

✓ Utility functions with obvious logic
✓ Third-party library integrations
✓ Configuration files

## Test Fixtures & Mocks

### Mock Data Organization

```typescript
// __mocks__/data.ts (Shared mock data)
export const mockBuild = {
  id: '1',
  name: 'Test Build',
  status: 'PENDING' as const,
  createdAt: new Date('2025-01-01')
};

export const mockBuildComplete = {
  ...mockBuild,
  status: 'COMPLETE' as const
};

export const mockParts = [
  { id: 'p1', buildId: '1', name: 'Part A' },
  { id: 'p2', buildId: '1', name: 'Part B' }
];
```

### Apollo MockedProvider Setup

```typescript
// __mocks__/apollo.tsx
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';

export const ApolloTestWrapper = ({ children, mocks = [] }: {
  children: ReactNode;
  mocks?: MockedResponse[];
}) => (
  <MockedProvider mocks={mocks} addTypename={true}>
    {children}
  </MockedProvider>
);
```

### Express Test Client

```typescript
// __mocks__/request.ts
import supertest from 'supertest';
import app from '../../index';

export const request = supertest(app);

export async function authenticate() {
  const res = await request.post('/auth/login')
    .send({ username: 'test', password: 'test' });
  return res.headers['set-cookie'];
}
```

## Common Test Patterns

### Testing Optimistic Updates

```typescript
describe('Apollo optimistic update', () => {
  it('shows optimistic response before server', async () => {
    const mocks = [{
      request: { query: UPDATE_BUILD, variables: { id: '1', status: 'COMPLETE' } },
      delay: 500, // Simulate slow network
      result: { data: { updateBuild: { id: '1', status: 'COMPLETE' } } }
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildCard id="1" />
      </MockedProvider>
    );
    
    // Click update (will show optimistic response immediately)
    await userEvent.click(screen.getByText('Complete'));
    
    // Optimistic response visible before server responds (after 500ms)
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });
});
```

### Testing N+1 Query Prevention (DataLoader)

```typescript
describe('DataLoader prevents N+1', () => {
  it('batches multiple queries for builds with parts', async () => {
    const spy = vi.spyOn(prisma.part, 'findMany');
    
    // Create DataLoader that should batch
    const loader = new DataLoader(async (ids) => {
      // Spy records this call
      const parts = await prisma.part.findMany({
        where: { buildId: { in: ids } }
      });
      return ids.map(id => parts.filter(p => p.buildId === id));
    });
    
    // Load parts for 3 builds
    await Promise.all([
      loader.load('1'),
      loader.load('2'),
      loader.load('3')
    ]);
    
    // Verify only 1 database call (batch) not 3 individual calls
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      where: { buildId: { in: ['1', '2', '3'] } }
    });
  });
});
```

### Testing Real-Time Events

```typescript
describe('Real-time event coordination', () => {
  it('receives SSE event and updates Apollo cache', async () => {
    const eventSource = new EventSource('http://localhost:5000/events');
    
    render(
      <MockedProvider>
        <BuildDashboard />
      </MockedProvider>
    );
    
    // Initial state shows PENDING
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    
    // Simulate SSE event from Express backend
    const event = new Event('buildStatusChanged');
    event.data = JSON.stringify({ buildId: '1', status: 'COMPLETE' });
    eventSource.dispatchEvent(event);
    
    // Apollo cache updated, UI re-renders
    await waitFor(() => {
      expect(screen.queryByText('PENDING')).not.toBeInTheDocument();
      expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    });
  });
});
```

### Testing Error Scenarios

```typescript
describe('Error handling', () => {
  it('handles GraphQL error gracefully', async () => {
    const mocks = [{
      request: { query: GET_BUILDS },
      error: new Error('Server error')
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildList />
      </MockedProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
  
  it('handles network timeout', async () => {
    const mocks = [{
      request: { query: GET_BUILDS },
      delay: 30000 // 30 second delay (timeout)
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildList />
      </MockedProvider>
    );
    
    // Expect timeout error after configured timeout
    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

## Test Isolation & Cleanup

Tests must not leak state to each other. Use `beforeEach` and `afterEach` to reset mocks, cache, and database state.

### Pattern: Comprehensive Test Setup & Teardown

```typescript
// __tests__/integration/builds.test.ts
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import * as prisma from '@prisma/client';

vi.mock('@prisma/client');

describe('Build Operations with Proper Cleanup', () => {
  let apolloClient: ApolloClient<any>;
  
  beforeEach(() => {
    // 1. Reset all mocks
    vi.clearAllMocks();
    
    // 2. Fresh Apollo cache (no shared state)
    apolloClient = new ApolloClient({
      cache: new InMemoryCache(),
      link: mockLink // Create fresh mock link
    });
    
    // 3. Reset Prisma mocks
    vi.resetAllMocks();
    
    // 4. Clear LocalStorage (if component uses it)
    localStorage.clear();
    
    // 5. Clear any global state
    sessionStorage.clear();
  });
  
  afterEach(async () => {
    // 1. Close EventSource listeners
    if (global.eventSource) {
      global.eventSource.close();
      delete global.eventSource;
    }
    
    // 2. Cancel pending timers
    vi.runAllTimers();
    vi.clearAllTimers();
    
    // 3. Clear all subscriptions
    const subscriptions = apolloClient.getObservableQuery({}).observers;
    subscriptions.forEach(sub => sub.unsubscribe());
    
    // 4. Flush pending database operations
    await vi.runAllTimersAsync();
    
    // 5. Stop mocking
    vi.restoreAllMocks();
  });
  
  it('fetches builds without leaking to next test', async () => {
    vi.spyOn(prisma.build, 'findMany').mockResolvedValue([
      { id: '1', status: 'PENDING' }
    ]);
    
    const result = await apolloClient.query({ query: GET_BUILDS });
    expect(result.data.builds).toHaveLength(1);
  });
  
  it('has clean state from previous test', async () => {
    // If mock wasn't reset, this would use data from previous test
    vi.spyOn(prisma.build, 'findMany').mockResolvedValue([
      { id: '2', status: 'COMPLETE' }
    ]);
    
    const result = await apolloClient.query({ query: GET_BUILDS });
    expect(result.data.builds).toHaveLength(1);
    expect(result.data.builds[0].id).toBe('2');
  });
});
```

### Common Cleanup Issues

**Issue 1: EventSource not closed**

```typescript
// ❌ INCORRECT
it('listens to real-time events', () => {
  const eventSource = new EventSource('http://localhost:5000/events');
  // Never closed - leaks to next test
});

// ✅ CORRECT
it('listens to real-time events', () => {
  const eventSource = new EventSource('http://localhost:5000/events');
  
  afterEach(() => {
    eventSource.close(); // Cleanup
  });
});
```

**Issue 2: Timers not cleared**

```typescript
// ❌ INCORRECT
it('retries after delay', async () => {
  vi.useFakeTimers();
  setTimeout(() => { /* retry */ }, 5000);
  // Timer runs in next test
});

// ✅ CORRECT
it('retries after delay', async () => {
  vi.useFakeTimers();
  setTimeout(() => { /* retry */ }, 5000);
  
  afterEach(() => {
    vi.runAllTimers(); // Drain queue
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
```

**Issue 3: Apollo cache shared between tests**

```typescript
// ❌ INCORRECT
const sharedCache = new InMemoryCache();

it('test 1 modifies cache', () => {
  sharedCache.writeQuery({ query: GET_BUILDS, data: { builds: [] } });
});

it('test 2 sees data from test 1', () => {
  const data = sharedCache.readQuery({ query: GET_BUILDS });
  // Has data from test 1!
});

// ✅ CORRECT
let cache;

beforeEach(() => {
  cache = new InMemoryCache(); // Fresh per test
});

it('test 1', () => {
  cache.writeQuery({ query: GET_BUILDS, data: { builds: [] } });
});

it('test 2', () => {
  const data = cache.readQuery({ query: GET_BUILDS });
  // Cache is clean
});
```

## Test Debugging Strategies

### Debug a Failing Test

```bash
# 1. Run in watch mode to iterate quickly
pnpm test path/to/test.ts --watch

# 2. Focus on single test with describe.only or it.only
it.only('should do something', () => {
  // This is the only test that runs
});

# 3. Add console.log for inspection
console.log('Value at this point:', someValue);

# 4. Use debugger statement (requires inspector)
debugger; // Execution pauses here

# 5. Run with verbose reporter to see more details
pnpm test path/to/test.ts --reporter=verbose
```

### Debug Apollo MockedProvider Issues

```typescript
// Add this to MockedProvider to see all requests
<MockedProvider 
  mocks={mocks} 
  defaultOptions={{
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }}
  onError={(error) => {
    console.error('Apollo error:', error);
  }}
>
  {children}
</MockedProvider>
```

### Debug DataLoader Issues

```typescript
// Add logging to see what's batched
const loader = new DataLoader(
  async (keys) => {
    console.log('DataLoader batch called with keys:', keys);
    // ... rest of loader logic
  },
  { cache: false } // Disable caching for debugging
);
```

## Async Testing Pitfalls

Asynchronous tests fail silently or flakily if not handled correctly. Here are common mistakes:

### Pitfall 1: Missing `await` on Async Operations

**❌ INCORRECT** — Promise not awaited:

```typescript
// ❌ DO NOT DO THIS
it('fetches build', async () => {
  queryResolvers.builds(); // Missing await!
  
  expect(result).toHaveLength(2); // Passes before query completes
});

// Test passes even though query never ran
```

**✅ CORRECT** — Properly awaited:

```typescript
// ✅ CORRECT
it('fetches build', async () => {
  const result = await queryResolvers.builds();
  
  expect(result).toHaveLength(2);
});
```

### Pitfall 2: Incorrect `waitFor` Usage

**❌ INCORRECT** — Callback doesn't throw on failure:

```typescript
// ❌ DO NOT DO THIS
it('updates UI after mutation', async () => {
  render(<BuildForm />);
  
  await waitFor(() => {
    screen.getByText('Build Created'); // Doesn't throw if not found!
  });
  
  // Test passes because getByText is just called, not asserted
});
```

**✅ CORRECT** — Callback throws on assertion failure:

```typescript
// ✅ CORRECT
it('updates UI after mutation', async () => {
  render(<BuildForm />);
  
  await waitFor(() => {
    expect(screen.getByText('Build Created')).toBeInTheDocument();
  });
});
```

**Better**: Use `expect` with `toBeInTheDocument()` which throws on failure.

### Pitfall 3: Hardcoded Delays (Flaky Tests)

**❌ INCORRECT** — Hardcoded timeout:

```typescript
// ❌ DO NOT DO THIS (FLAKY)
it('receives SSE event', async () => {
  render(<RealtimeEvents />);
  
  setTimeout(() => {
    eventSource.dispatchEvent(new Event('message'));
  }, 500);
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Hardcoded wait!
  
  expect(screen.getByText('Updated')).toBeInTheDocument();
  // Fails on slow machine, passes on fast machine
});
```

**✅ CORRECT** — Use `waitFor` with automatic polling:

```typescript
// ✅ CORRECT
it('receives SSE event', async () => {
  render(<RealtimeEvents />);
  
  // Simulate event after render
  setTimeout(() => {
    eventSource.dispatchEvent(new Event('message'));
  }, 100);
  
  // waitFor polls every 50ms (default) until condition passes or timeout (1s)
  await waitFor(
    () => expect(screen.getByText('Updated')).toBeInTheDocument(),
    { timeout: 1000 }
  );
});
```

### Pitfall 4: Forgetting `async/await` in Hook Callbacks

**❌ INCORRECT** — Async operation in callback:

```typescript
// ❌ DO NOT DO THIS
it('handles mutation error', () => {
  const [updateStatus] = useMutation(UPDATE_BUILD_STATUS, {
    onError: (error) => {
      // This is async but not awaited
      const message = parseErrorMessage(error);
      setErrorState(message);
    }
  });
  
  // Test completes before callback runs
});
```

**✅ CORRECT** — Wait for callback:

```typescript
// ✅ CORRECT
it('handles mutation error', async () => {
  const errorCallback = vi.fn();
  
  const [updateStatus] = useMutation(UPDATE_BUILD_STATUS, {
    onError: (error) => {
      errorCallback(error);
    }
  });
  
  // Trigger error
  await expect(updateStatus({ id: 'bad', status: 'INVALID' })).rejects.toThrow();
  
  // Wait for callback
  await waitFor(() => {
    expect(errorCallback).toHaveBeenCalled();
  });
});
```

### Pitfall 5: Race Conditions in Tests

**❌ INCORRECT** — Multiple async operations, unpredictable order:

```typescript
// ❌ DO NOT DO THIS
it('saves build and updates list', async () => {
  const saveBuild = mutationResolvers.createBuild({ name: 'B1' });
  const fetchList = queryResolvers.builds(); // Might run before save!
  
  const [savedBuild, list] = await Promise.all([saveBuild, fetchList]);
  
  expect(list).toContain(savedBuild); // Flaky!
});
```

**✅ CORRECT** — Sequential operations or proper mocking:

```typescript
// ✅ CORRECT (sequential)
it('saves build and updates list', async () => {
  const savedBuild = await mutationResolvers.createBuild({ name: 'B1' });
  const list = await queryResolvers.builds();
  
  expect(list).toContain(savedBuild);
});

// ✅ ALSO CORRECT (mocked to guarantee order)
it('saves build and updates list', async () => {
  const mockBuild = { id: '1', name: 'B1' };
  vi.spyOn(prisma.build, 'create').mockResolvedValue(mockBuild);
  vi.spyOn(prisma.build, 'findMany').mockResolvedValue([mockBuild]);
  
  const savedBuild = await mutationResolvers.createBuild({ name: 'B1' });
  const list = await queryResolvers.builds();
  
  expect(list).toContain(savedBuild);
});
```

### Pitfall 6: Subscriptions Not Cleaned Up

**❌ INCORRECT** — Subscription leaks between tests:

```typescript
// ❌ DO NOT DO THIS
it('test 1 with subscription', async () => {
  const subscription = apolloClient.subscribe({ subscription: BUILD_UPDATES });
  // Never unsubscribed
});

// test 2
it('test 2', () => {
  // Old subscription still active!
});
```

**✅ CORRECT** — Unsubscribe in cleanup:

```typescript
// ✅ CORRECT
it('test 1 with subscription', async () => {
  const subscription = apolloClient.subscribe({ subscription: BUILD_UPDATES });
  
  afterEach(() => {
    subscription.unsubscribe(); // Cleanup
  });
});
```

## Parallel Test Execution Mode (Git Worktree)

### When Enabled

When multiple independent features/layers require testing in parallel via git worktree:

**✓ Each test agent has isolated test environment** (no test pollution)  
**✓ Different test suites can run simultaneously** (no blocking on other agents)  
**✓ Test results can be committed independently** (separate branches)  
**✓ Test PRs can merge any time** (if no dependencies exist)  

### How to Proceed

1. **Verify Worktree Context**
   ```bash
   pwd                        # Confirm correct worktree directory
   git branch                 # Verify correct branch checked out
   pnpm test --run            # Verify tests pass before starting
   ```

2. **Execute Tests Independently**
   - Don't wait for other test agents to complete
   - Don't check if other test branches exist
   - Run your test suite independently
   - Each worktree is completely isolated

3. **Parallel Test Layer Execution** (Example)
   ```bash
   # In worktree 1 (frontend tests)
   cd ../feat-test-frontend
   pnpm test:frontend --run
   pnpm test:frontend -- --sequence.shuffle
   pnpm test:frontend -- --sequence.parallel
   
   # In worktree 2 (GraphQL tests)
   cd ../feat-test-graphql
   pnpm test:graphql --run
   pnpm test:graphql -- --sequence.shuffle
   
   # In worktree 3 (Express tests)
   cd ../feat-test-express
   pnpm test:express --run
   pnpm test:express -- --sequence.shuffle
   
   # All run simultaneously with zero test pollution
   ```

4. **Test Isolation Verification (Critical for Parallel)**
   ```bash
   # Verify tests pass in all modes:
   pnpm test:frontend --run                 # Sequential
   pnpm test:frontend --run -- --sequence.shuffle  # Random order
   pnpm test:frontend --run -- --sequence.parallel # Parallel
   
   # If ALL pass: ✓ Test isolation is proper
   # If ANY fail: Test has state leakage (fix before commit)
   ```

5. **Commit & Push Strategy**
   - Make commits to feature branch (not main)
   - Push to remote: `git push origin [branch-name]`
   - Create PR: `gh pr create`
   - Mark as "Ready for review"

### Success Metrics for Parallel Test Execution

- ✅ Task completed within estimated time window
- ✅ All tests passing in your scope (sequential + shuffle + parallel)
- ✅ Zero test pollution or state leakage
- ✅ Test coverage meets standards (no regressions)
- ✅ Code committed with co-author trailer
- ✅ PR created and marked ready for review
- ✅ No conflicts with other parallel test agents

### Parallel Test Coordination Patterns

**Pattern 1: Layer-Based Parallel Testing**
```
Frontend Tests (Issue #141)
  └─ Component tests + Apollo hooks
  └─ Duration: 12 min
  └─ Run in parallel with GraphQL tests

GraphQL Tests (Issue #143)
  └─ Resolver tests + DataLoader tests
  └─ Duration: 25 min
  └─ Run in parallel with Express tests

Express Tests (Issue #144)
  └─ Route tests + webhook tests
  └─ Duration: 18 min
  └─ Run in parallel with Frontend tests

All 3 test suites: ~25 min parallel vs 55 min sequential
```

**Pattern 2: Feature-Based Parallel Testing**
```
Feature A Tests (parallel worktree)
  └─ Frontend feature A
  └─ GraphQL feature A
  └─ Express feature A (if needed)
  └─ Duration: 20 min

Feature B Tests (parallel worktree)
  └─ Frontend feature B
  └─ GraphQL feature B
  └─ Express feature B (if needed)
  └─ Duration: 25 min

Both feature test suites: ~25 min parallel vs 45 min sequential
```

### Test Isolation Requirements for Parallel Execution

**Critical for success** (issues in Phase 2 isolated storage testing):

1. **Global Test Setup** (beforeEach/afterEach)
   ```typescript
   // In vitest.config.ts or setup file
   beforeEach(() => {
     // Clear mocks
     vi.clearAllMocks();
     
     // Reset localStorage
     localStorage.clear();
     
     // Reset timers
     vi.useFakeTimers();
   });
   
   afterEach(() => {
     // Cleanup state
     vi.runAllTimers();
     vi.useRealTimers();
   });
   ```

2. **Mock Independence**
   - No shared mock state between tests
   - Each test gets fresh mock instance
   - Cleanup mocks after each test

3. **Database Test Isolation** (if using test DB)
   - Create transaction per test
   - Rollback after each test
   - OR use separate test database per layer

4. **Async/Promise Cleanup**
   - Wait for all promises: `await Promise.all()`
   - Clear timeouts: `clearTimeout()`
   - Cleanup event listeners: `eventSource.close()`

### Example: Phase 2 Parallel Test Results

**Actual parallel test execution from Phase 2:**

| Test Layer | Duration | Mode | Result |
|-----------|----------|------|--------|
| Frontend | 10.03s | Sequential | ✅ 172 tests |
| Frontend | 8.17s | Shuffle | ✅ 172 tests |
| Frontend | 7.90s | Parallel | ✅ 172 tests |

✅ **ZERO state leakage** (tests pass in all modes)  
✅ **Can run concurrently** with GraphQL + Express tests  
✅ **Proven pattern** from Issue #144 (Test Isolation)  

### When NOT to Use Parallel Testing

❌ Tests have shared database state  
❌ Tests modify global configuration  
❌ Tests interact with external services (API, cache)  
❌ Tests have timing dependencies  

**Mitigation**: Use mocks, transactions, or test databases to isolate state.

### Escalation & Troubleshooting

**If tests fail in parallel mode but pass sequentially:**
1. Check for test state leakage (shared mocks, globals)
2. Verify beforeEach/afterEach cleanup
3. Look for timing/async issues (use `vi.useFakeTimers()`)
4. Check localStorage/sessionStorage cleanup (Issue #144 pattern)
5. Ensure mock instances are independent

**If specific test fails in shuffle/parallel:**
1. Identify the failing test
2. Run it in isolation: `pnpm test path/to/test.ts`
3. If it passes alone: state leakage from other test
4. Add cleanup or isolation to fix

## Quality Check Automation (Issue #306)

During consolidation testing, tester agent validates all quality checks pass:

```bash
# Phase 4 (Consolidation) - Run all quality checks
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
pnpm format:check > docs/dev-note/issue-#[N]-pnpm-format-check.txt 2>&1

# Review logs to confirm all pass
cat docs/dev-note/issue-#[N]-pnpm-test.txt
cat docs/dev-note/issue-#[N]-pnpm-lint.txt
cat docs/dev-note/issue-#[N]-pnpm-type-check.txt
cat docs/dev-note/issue-#[N]-pnpm-format-check.txt
```

**Tester Responsibilities**:
- ✅ Run all quality checks on consolidation branch
- ✅ Capture output to `docs/dev-note/issue-#[N]-pnpm-*.txt`
- ✅ Track coverage metrics and test counts
- ✅ **If all checks PASS**: Report ready for merge
- ✅ **If any check FAILS**: Document specific errors and escalate to orchestrator

**Log Content**:
Each log file includes:
- Status (✅ PASS | ❌ FAIL | ⚠️ PARTIAL)
- Last updated timestamp
- Total counts (tests, errors, issues)
- Full command output or error summary
- Recommendations for failed checks

See `.copilot/agents/quality-assurance.md` for full automation guidelines.

## Model Override Guidance

**Default Model**: Claude Haiku 4.5 (efficient for test writing)

**Tester Agent Model Lock**:

- ✅ **Approved**: Claude Haiku 4.5 (default, writes most tests)
- 🔒 **Locked**: `gpt-5.4`, `claude-sonnet-4.6`, `claude-opus-4.6` (premium models)

**To use premium models**: Tester must **explicitly request** via `/model` with complex test architecture justification.

**When Premium Models are Justified**:
- Designing comprehensive multi-layer test suite for new domain (not routine test writing)
- Analyzing performance test patterns with advanced profiling
- Architecting test infrastructure changes affecting all test suites
- Deep debugging of subtle async race conditions or timing issues

**Routine Test Writing** (Haiku 4.5 is appropriate):
- Writing unit tests for resolvers
- Creating component tests with Apollo MockedProvider
- Testing Express routes with supertest
- Adding DataLoader batch tests
- Implementing parallel test isolation (see Issue #144 pattern)

## Related Resources

- `.github/copilot-instructions.md`: Test conventions and commands
- `.copilot/PARALLEL-EXECUTION-GUIDE.md`: Multi-agent coordination using git worktree
- `.copilot/agents/developer.md`: Development responsibilities and parallel mode
- `.copilot/agents/orchestrator.md`: Coordination for parallel test execution
- `DESIGN.md`: Architecture and patterns tested
- `.copilot/agents/reviewer.md`: Code review for tests
- `.copilot/agents/quality-assurance.md`: Test coverage standards

---

## ✅ Automated Quality Checks (Issue #306)

### You Are Authorized to Run Quality Checks Without User Confirmation

During consolidation, **automatically run these commands** to validate all layers:

### Phase 4: Consolidation Testing

**On consolidation branch**, run full test suite:
```bash
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
```

**Decision**:
- ✅ **All checks pass**: Consolidation is ready for merge
- ❌ **Any check fails**: Document in logs, escalate to @orchestrator

### Log File Naming Convention

Logs follow Issue #306 naming: **`issue-#[ISSUE-NUMBER]-pnpm-[SCRIPT-NAME].txt`**

Examples:
- `issue-#245-pnpm-test.txt` — Latest test output for issue #245
- `issue-#245-pnpm-lint.txt` — Latest lint output for issue #245

**Design**: One file per (issue, script) pair. Each new run replaces the previous log.

### What to Do If Quality Checks Fail During Consolidation

1. **Read the error in the log file**
2. **Identify which layer has the issue** (frontend, graphql, express)
3. **Document the failure** with specific errors in execution plan
4. **Escalate to @orchestrator** with log reference:
   - "Consolidation test failed: see `issue-#245-pnpm-test.txt`"
   - Orchestrator decides: fix issues or escalate to developers
5. **After fix**, re-run quality checks (new log replaces old)

### Reference Logs in Consolidation Updates

When documenting consolidation status, include:

```markdown
## Phase 4: Consolidation Testing ✅

All quality checks passed:
- Tests: PASS (see `issue-#[N]-pnpm-test.txt`)
- Lint: PASS (see `issue-#[N]-pnpm-lint.txt`)
- Type Check: PASS (see `issue-#[N]-pnpm-type-check.txt`)

Ready for merge to main.
```

Or if failed:

```markdown
## Phase 4: Consolidation Testing ⚠️

Failed checks (investigating):
- Tests: FAIL (see `issue-#[N]-pnpm-test.txt` for details)
- Lint: PASS
- Type Check: PASS

Escalating to @orchestrator for resolution.
```

---

## Claude Code Best Practices for Testers

### Context Loading for Test Planning

**Before creating test strategy**:
```
Load in order:
1. Read issue description and acceptance criteria
2. Read relevant layer test patterns (from this file)
3. Review 1-2 recent test examples (same layer)
4. Check DESIGN.md for integration patterns

Timeline: 10-15 min for complete context
Result: Comprehensive test strategy aligned with patterns
```

### Multi-Layer Test Strategy

**When feature spans multiple layers**:
```
Test plan should cover:
1. Unit tests (per layer)
   - Frontend: Component + hook tests
   - GraphQL: Resolver + DataLoader tests
   - Express: Route + handler tests

2. Integration tests (between layers)
   - GraphQL ↔ Express integration
   - Frontend ↔ GraphQL data flow
   - Cache update after mutation

3. End-to-end tests (full feature)
   - User creates/updates/deletes data
   - Real-time updates received
   - Error cases handled gracefully

Coverage target: ≥80% across all tests
```

### Model Override Recommendations

**Use Haiku (default) for**:
- ✅ Test planning and strategy
- ✅ Unit test writing
- ✅ Integration test coverage planning
- ✅ Debugging failing tests

**Use Sonnet/Opus for**:
- 🔍 Complex E2E scenarios
- 🔍 Performance testing strategy
- 🔍 Cross-layer interaction complexity
- 🔍 Advanced async testing patterns

### Test Planning Workflow

**Optimal test strategy creation**:
```
STEP 1: Understand feature
  - Read issue & acceptance criteria
  - Identify all code paths

STEP 2: Identify test needs
  - What can break? (unit tests)
  - How do layers interact? (integration tests)
  - Does user story work end-to-end? (E2E tests)

STEP 3: Coverage planning
  - Calculate coverage target ≥80%
  - Identify critical paths (100% coverage)
  - Map to test files

STEP 4: Validation strategy
  - How to verify happy path works?
  - What error cases matter?
  - Performance requirements?

STEP 5: Communicate plan
  - Document in issue or comment
  - Reference pattern examples
  - Set clear coverage expectations
```

### Escalation for Test Challenges

**If architecture makes testing difficult**:
```
SYMPTOM: Hard to test because of [reason]
  - Tightly coupled layers
  - Global state prevents isolation
  - No clear mock points

ACTION: Escalate to Architect
  - Document testing difficulty
  - Request architectural guidance
  - Architect may redesign for testability

RESULT: Architecture improves, tests become simpler
```

---
