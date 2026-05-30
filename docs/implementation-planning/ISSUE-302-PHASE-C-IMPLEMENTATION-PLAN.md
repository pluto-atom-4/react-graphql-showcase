# Issue #302 - Detailed Implementation Plan
## W3C Distributed Tracing - Apollo GraphQL & Prisma ORM Integration

**Date**: 2026-05-26  
**Phase**: C (Backend GraphQL/ORM Layer)  
**Feature Branch**: `feat/issue-#302-graphql-prisma-tracing`  
**Effort**: 3-4 days  
**Status**: Planning → Implementation

---

## 📋 Overview

Implement W3C trace context propagation through Apollo GraphQL resolvers and Prisma ORM database queries. Phase C completes the backend tracing infrastructure by connecting GraphQL operations to database queries, creating a unified trace from Express layer down to SQL queries.

**Foundation**: Phase B (Express/SSE middleware) already provides AsyncLocalStorage context and W3C header extraction  
**Scope**: Apollo GraphQL plugin + Prisma ORM tracing only  
**Out of Scope**: Frontend tracing (Phase A), APM visualization (Phase D), trace sampling/filtering (Phase D+)

---

## 🎯 Numbered Implementation Steps

### Step 1: Install Dependencies (15 min)
**What**: Add OpenTelemetry GraphQL and Prisma instrumentation packages

**Commands**:
```bash
cd backend-graphql
pnpm add @opentelemetry/instrumentation-graphql @opentelemetry/instrumentation-prisma

cd ../backend-express
# Already has core OTel packages from Phase B
# Just need to add instrumentation packages
pnpm add @opentelemetry/instrumentation-prisma
```

**Expected**: All packages installed, lock file updated, no peer dependency conflicts

**Verification**: 
```bash
pnpm list | grep "@opentelemetry"
# Should show instrumentation-graphql and instrumentation-prisma
```

---

### Step 2: Create Apollo GraphQL Tracing Plugin (60 min)
**File**: `backend-graphql/src/plugins/tracing-plugin.ts`

**Purpose**: Hook into Apollo Server lifecycle to create spans for GraphQL operations

**Responsibilities**:
- Hook: `didResolveOperation` → start resolver span with operation name
- Hook: `willSendResponse` → end resolver span with success/error status
- Hook: `didEncounterErrors` → capture error details in span attributes
- Extract trace context from incoming request headers
- Link spans to parent trace context from Express middleware
- Record operation type (query, mutation, subscription) and name
- Record resolver duration and errors

**Code Structure**:
```typescript
import { ApolloServerPlugin } from '@apollo/server'
import { trace } from '@opentelemetry/api'
import { getTraceContext } from '../../shared/tracing'

export const tracingPlugin: ApolloServerPlugin = {
  async didResolveOperation(requestContext) {
    // Extract trace context from Express middleware (stored in AsyncLocalStorage)
    const parentContext = getTraceContext()
    
    // Create span for this GraphQL operation
    const tracer = trace.getTracer('apollo-graphql', '1.0.0')
    const span = tracer.startSpan(
      `graphql.${requestContext.operation.operation}`,
      { 
        attributes: {
          'graphql.operation.name': requestContext.operationName || 'unnamed',
          'graphql.operation.type': requestContext.operation.operation,
          'trace.parent_span_id': parentContext?.parentSpanId,
          'trace.id': parentContext?.traceId,
        }
      },
      parentContext
    )
    
    // Store span in request context for access in resolvers
    requestContext.context.span = span
    requestContext.context.tracer = tracer
    requestContext.context.parentTraceContext = parentContext
  },

  async willSendResponse(requestContext) {
    // End span with response status
    const span = requestContext.context.span
    if (span) {
      span.end()
    }
  },

  async didEncounterErrors(requestContext) {
    // Capture errors in span
    const span = requestContext.context.span
    if (span && requestContext.errors) {
      requestContext.errors.forEach(error => {
        span.recordException(error)
      })
    }
  }
}
```

**Test Cases**:
- Plugin initializes without errors
- didResolveOperation creates span with correct operation name
- willSendResponse ends span
- Span includes trace context attributes
- Errors recorded in span

---

### Step 3: Create Resolver Field Span Wrapper (45 min)
**File**: `backend-graphql/src/lib/field-span-wrapper.ts`

**Purpose**: Wrap individual field resolvers to create nested spans for detailed tracing

**Responsibilities**:
- Wrap resolver functions to create spans
- Record field name, parent type, and execution time
- Capture resolver errors in span
- Maintain span hierarchy (operation → field → subfield)
- Handle async and sync resolvers

**Code Structure**:
```typescript
import { trace, context } from '@opentelemetry/api'

export function wrapFieldResolver(resolve: any, fieldName: string, typeName: string) {
  return async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.tracer) {
      // No tracer available (tracing disabled), call resolver normally
      return resolve(parent, args, ctx, info)
    }

    const span = ctx.tracer.startSpan(
      `graphql.field.${typeName}.${fieldName}`,
      {
        attributes: {
          'graphql.field.name': fieldName,
          'graphql.type.name': typeName,
          'graphql.args': JSON.stringify(args), // Optional: redact sensitive args
        }
      }
    )

    try {
      const result = await context.with(
        context.active().setValue('span', span),
        () => resolve(parent, args, ctx, info)
      )
      return result
    } catch (error) {
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  }
}

// Export helper to apply wrapper to all resolvers
export function wrapResolvers(resolvers: any, typeName: string): any {
  return Object.keys(resolvers).reduce((wrapped, fieldName) => {
    wrapped[fieldName] = wrapFieldResolver(resolvers[fieldName], fieldName, typeName)
    return wrapped
  }, {})
}
```

**Test Cases**:
- Wrapped resolver executes normally
- Span created with correct field/type names
- Errors recorded in span
- Async resolvers handled correctly
- Span hierarchy maintained

---

### Step 4: Update Apollo Server Setup (30 min)
**File**: `backend-graphql/src/server.ts`

**Purpose**: Register tracing plugin with Apollo Server

**Changes**:
```typescript
import { ApolloServer } from '@apollo/server'
import { tracingPlugin } from './plugins/tracing-plugin'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    tracingPlugin,  // Add tracing plugin to plugin array
    // ... other plugins
  ]
})
```

**Expected**: Apollo Server initializes with tracing plugin active

**Verification**: 
```bash
# Start server and check logs for plugin initialization
pnpm dev:graphql 2>&1 | grep -i "tracing"
```

---

### Step 5: Enable Prisma ORM Tracing (20 min)
**File**: `.env.local` (or similar environment config)

**Purpose**: Enable OpenTelemetry tracing in Prisma client

**Changes**:
```env
# Prisma ORM Tracing
PRISMA_TRACE_CONTEXT=true
OTEL_SDK_DISABLED=false
```

**Alternative**: Configure in Prisma client initialization:
```typescript
// backend-graphql/src/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  // Prisma v6+ supports OTel tracing flag
  // Enable via environment or constructor
})

// Alternatively, use Prisma instrumentation wrapper
import { PrismaInstrumentation } from '@opentelemetry/instrumentation-prisma'

const prismaInstrumentation = new PrismaInstrumentation()
prismaInstrumentation.enable()
```

**Expected**: Prisma logs ORM traces to OpenTelemetry

**Verification**:
```bash
# Query with debugging enabled
DEBUG=prisma:* pnpm dev:graphql
```

---

### Step 6: Create Integration Bridge (Trace Context → Prisma) (45 min)
**File**: `backend-graphql/src/lib/prisma-span-bridge.ts`

**Purpose**: Link Prisma ORM spans to parent GraphQL resolver spans

**Responsibilities**:
- Extract current span from context before Prisma query
- Record Prisma operation metadata (query type, table, duration)
- Link Prisma span to parent resolver span
- Handle transaction contexts

**Code Structure**:
```typescript
import { trace, context } from '@opentelemetry/api'

export function getPrismaTraceContext() {
  const span = context.active().getValue('span')
  const tracer = context.active().getValue('tracer')
  return { span, tracer }
}

export function createPrismaSpan(operation: string, metadata: any) {
  const { tracer, span: parentSpan } = getPrismaTraceContext()
  
  if (!tracer || !parentSpan) {
    return null // No tracing context
  }

  const prismaSpan = tracer.startSpan(
    `prisma.${operation}`,
    {
      attributes: {
        'db.operation': operation,
        'db.system': 'postgresql',
        ...metadata
      }
    },
    parentSpan // Link to parent resolver span
  )

  return prismaSpan
}

// Usage in resolver:
export async function getBuilds() {
  const span = createPrismaSpan('query', { 'db.collection': 'builds' })
  
  try {
    return await prisma.build.findMany()
  } catch (error) {
    if (span) span.recordException(error as Error)
    throw error
  } finally {
    if (span) span.end()
  }
}
```

**Test Cases**:
- Prisma span created with correct operation name
- Span linked to parent resolver span
- DB metadata recorded in span
- Errors captured in span

---

### Step 7: Create Unit Tests for Apollo Plugin (60 min)
**File**: `backend-graphql/src/__tests__/plugins/tracing-plugin.test.ts`

**Purpose**: Test Apollo plugin span lifecycle

**Test Cases**:
```typescript
describe('Tracing Plugin', () => {
  describe('didResolveOperation', () => {
    it('creates span with operation name', () => {
      // Mock Apollo context
      // Call plugin hook
      // Verify span created with correct attributes
    })

    it('extracts trace context from AsyncLocalStorage', () => {
      // Setup trace context in AsyncLocalStorage
      // Call plugin hook
      // Verify span includes parent trace context
    })
  })

  describe('willSendResponse', () => {
    it('ends span on response', () => {
      // Setup mock span
      // Call plugin hook
      // Verify span.end() called
    })
  })

  describe('didEncounterErrors', () => {
    it('records errors in span', () => {
      // Setup mock span with errors
      // Call plugin hook
      // Verify span.recordException() called for each error
    })
  })

  describe('Field span wrapper', () => {
    it('wraps resolver and creates field span', () => {
      // Mock resolver
      // Wrap with wrapFieldResolver
      // Execute wrapped resolver
      // Verify span created with field/type names
    })

    it('handles resolver errors', () => {
      // Mock resolver that throws
      // Wrap and execute
      // Verify error recorded in span
    })
  })
})
```

**Expected**: All tests pass, 90%+ coverage of plugin code

**Verification**:
```bash
pnpm test:graphql -- src/__tests__/plugins/tracing-plugin.test.ts
```

---

### Step 8: Create Unit Tests for Prisma Bridge (45 min)
**File**: `backend-graphql/src/__tests__/lib/prisma-span-bridge.test.ts`

**Purpose**: Test Prisma span creation and linking

**Test Cases**:
```typescript
describe('Prisma Span Bridge', () => {
  describe('getPrismaTraceContext', () => {
    it('retrieves context from AsyncLocalStorage', () => {
      // Setup context
      // Call getPrismaTraceContext
      // Verify returns correct tracer and span
    })

    it('returns null when no context available', () => {
      // Clear context
      // Call getPrismaTraceContext
      // Verify returns null/undefined
    })
  })

  describe('createPrismaSpan', () => {
    it('creates span with operation metadata', () => {
      // Setup tracer context
      // Call createPrismaSpan
      // Verify span attributes include operation, db.system, etc.
    })

    it('links span to parent resolver span', () => {
      // Setup parent span in context
      // Create Prisma span
      // Verify span linked to parent
    })
  })
})
```

**Expected**: All tests pass, 90%+ coverage

---

### Step 9: Create Integration Tests (Full Trace Chain) (90 min)
**File**: `backend-graphql/src/__tests__/integration/graphql-trace-chain.test.ts`

**Purpose**: Test complete trace chain: Query → Resolver → Prisma DB

**Test Cases**:
```typescript
describe('GraphQL Trace Chain Integration', () => {
  describe('Complete trace flow', () => {
    it('traces single query through resolver to DB', async () => {
      // Setup: Initialize tracer with test context
      // Execute: GraphQL query via Apollo
      // Verify:
      //   - Query operation span created
      //   - Resolver span nested under query span
      //   - Prisma span nested under resolver span
      //   - All spans linked correctly
      //   - Trace IDs consistent across chain
    })

    it('maintains trace context across async boundaries', async () => {
      // Execute: Async resolver with DB query
      // Verify: Trace context not lost across await
    })

    it('traces nested resolvers with separate field spans', async () => {
      // Execute: Query with nested fields (e.g., builds { parts { id } })
      // Verify: Hierarchical span structure matches query structure
    })

    it('captures resolver errors in span', async () => {
      // Execute: Query that triggers resolver error
      // Verify: Error recorded in resolver span
      // Verify: Error status reflected in span attributes
    })

    it('traces mutations and complex operations', async () => {
      // Execute: Mutation (createBuild, updateStatus, etc.)
      // Verify: Mutation span created with correct operation type
      // Verify: DB transaction spans nested correctly
    })
  })

  describe('Trace context propagation', () => {
    it('inherits trace context from Express middleware', async () => {
      // Simulate: Express middleware sets trace context in AsyncLocalStorage
      // Execute: GraphQL query
      // Verify: Apollo spans include trace context from middleware
      // Verify: Trace IDs match between Express and GraphQL layers
    })

    it('propagates context through DataLoader batches', async () => {
      // Execute: Query that triggers DataLoader batch (multiple builds)
      // Verify: All Prisma queries in batch include correct trace context
    })
  })

  describe('Performance & overhead', () => {
    it('tracing overhead < 2%', () => {
      // Execute: Query without tracing (disabled)
      // Measure: Query duration
      // Execute: Query with tracing (enabled)
      // Measure: Query duration
      // Assert: overhead < 2% of baseline
    })
  })

  describe('Error scenarios', () => {
    it('handles DB connection errors gracefully', () => {
      // Simulate: DB connection failure
      // Execute: Query
      // Verify: Error recorded in span
      // Verify: No uncaught exceptions
    })

    it('handles malformed queries', () => {
      // Execute: Invalid GraphQL query
      // Verify: Parse error recorded in span
    })

    it('handles missing trace context gracefully', () => {
      // Clear AsyncLocalStorage
      // Execute: Query
      // Verify: Query executes normally (no tracer available)
      // Verify: No null reference errors
    })
  })
})
```

**Expected**: All tests pass, full trace chain verified

**Verification**:
```bash
pnpm test:graphql -- src/__tests__/integration/graphql-trace-chain.test.ts
```

---

### Step 10: Quality Checks (45 min)
**What**: Run all linters, type-checkers, and tests

**Commands**:
```bash
# Run all tests for backend-graphql
pnpm test:graphql --run

# Run linting
pnpm lint

# Run type-check
pnpm type-check

# Generate coverage report
pnpm test:graphql --run --coverage
```

**Expected Outcomes**:
- ✅ All 150+ tests passing (existing + new tracing tests)
- ✅ 0 lint violations
- ✅ 0 TypeScript errors
- ✅ 90%+ code coverage for new tracing code

**Capture Logs**:
```bash
pnpm test:graphql --run > docs/dev-note/issue-#302-pnpm-test-graphql.txt 2>&1
pnpm lint > docs/dev-note/issue-#302-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#302-pnpm-type-check.txt 2>&1
```

---

### Step 11: Create Technical Documentation (30 min)
**File**: `docs/TRACING_APOLLO_PRISMA.md`

**Content**:
```markdown
# GraphQL & Prisma ORM Tracing

## Overview
This document describes how W3C distributed tracing flows through Apollo GraphQL resolvers and Prisma ORM database queries.

## Architecture

### Trace Flow
1. Express middleware (Phase B) extracts trace context from incoming request headers
2. Trace context stored in AsyncLocalStorage for request lifetime
3. Apollo plugin retrieves trace context and creates operation span
4. Field resolvers create nested spans for each resolved field
5. Prisma queries create DB spans linked to parent resolver span
6. All spans include trace context (trace ID, span ID, flags)

### Span Hierarchy
```
operation (query/mutation)
├── field: Build
│   └── field: parts
│       └── prisma: SELECT * FROM parts
└── field: testRuns
    └── prisma: SELECT * FROM test_runs
```

## Implementation Details

### Apollo Plugin Hooks
- `didResolveOperation`: Create operation span, extract trace context
- `willSendResponse`: End operation span
- `didEncounterErrors`: Record errors in span

### Field Span Wrapping
Resolvers wrapped to create spans for each field, enabling detailed field-level latency analysis.

### Prisma Integration
Prisma ORM tracing flag enabled in .env. Prisma automatically creates DB spans that appear as child spans of resolver spans in the trace.

## Trace Context Format
All spans include:
- `trace.id`: 32-character hex trace ID (consistent across request)
- `span.id`: 16-character hex span ID (unique per span)
- `trace.flags`: 2-character hex (01 = sampled, 00 = not sampled)
- `parent_span.id`: Parent span ID for span hierarchy

## Usage Examples

### Viewing Traces
Traces visible in local Jaeger/Zipkin instance or exported to APM backend.

Query example trace: Open Jaeger UI → Search → Select service → View spans

### Interpreting Traces
- **Operation span duration**: Total GraphQL operation time
- **Field span duration**: Time to resolve specific field (including nested fields)
- **Prisma span duration**: Database query time
- **Span error status**: Indicates errors during execution

## Performance Considerations
- Tracing overhead: < 2% (verified in integration tests)
- Span creation: O(1) per operation/field/query
- Memory impact: Spans cleaned up automatically after request

## Debugging with Traces
Example: Slow dashboard query
1. Find trace in APM tool
2. Identify longest span (e.g., prisma: SELECT builds takes 500ms)
3. Optimize that specific query (add index, cache, etc.)
4. Re-run query and compare traces

## Testing
Tracing tested with:
- Unit tests: Plugin hooks, span creation
- Integration tests: Full query → resolver → DB trace
- Performance tests: Overhead < 2%
- Error handling: Graceful degradation when tracing unavailable
```

---

### Step 12: Create PR and Documentation Summary (30 min)
**What**: Commit, push, and create PR with comprehensive description

**Commit**:
```bash
git add -A
git commit -m "feat(#302): W3C Distributed Tracing - Apollo GraphQL & Prisma ORM

- Implement Apollo GraphQL plugin for operation/field span creation
- Hook into didResolveOperation, willSendResponse, didEncounterErrors
- Create nested field spans for detailed resolver tracing
- Enable Prisma ORM tracing with OpenTelemetry instrumentation
- Link Prisma DB spans to parent resolver spans via context
- Add 150+ unit and integration tests (90%+ coverage)
- Trace full chain: Express → Apollo → Prisma DB
- Zero performance regression (< 2% overhead verified)
- Comprehensive documentation and APM integration guide

Resolves #302

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

**Push**:
```bash
git push origin feat/issue-#302-graphql-prisma-tracing
```

**Create PR**:
```bash
gh pr create \
  --title "feat: #302 W3C Distributed Tracing - Apollo GraphQL & Prisma ORM Integration" \
  --body "$(cat <<EOF
## Issue
Resolves #302

## Summary
Implementation of W3C distributed tracing for Apollo GraphQL resolvers and Prisma ORM database layer.

## What's Changed
- Apollo plugin for operation/field span creation
- Prisma ORM integration with OpenTelemetry
- Full trace chain: Express → Apollo → Prisma
- 150+ unit and integration tests

## Quality Checks
✅ Tests: All passing (150+)
✅ Lint: 0 violations
✅ Type-check: 0 errors
✅ Coverage: 90%+
✅ Performance: < 2% overhead

Quality check logs:
- docs/dev-note/issue-#302-pnpm-test-graphql.txt
- docs/dev-note/issue-#302-pnpm-lint.txt
- docs/dev-note/issue-#302-pnpm-type-check.txt

## Files Changed
- backend-graphql/src/plugins/tracing-plugin.ts (Apollo plugin)
- backend-graphql/src/lib/field-span-wrapper.ts (Field spans)
- backend-graphql/src/lib/prisma-span-bridge.ts (Prisma integration)
- backend-graphql/src/__tests__/ (150+ tests)
- docs/TRACING_APOLLO_PRISMA.md (Technical documentation)
EOF
)"
```

---

## 📁 Files to Create/Modify

### New Files Created

| File | Purpose | Lines | Tests |
|------|---------|-------|-------|
| `backend-graphql/src/plugins/tracing-plugin.ts` | Apollo plugin for span lifecycle | 150 | 40+ |
| `backend-graphql/src/lib/field-span-wrapper.ts` | Wrap resolvers with field spans | 100 | 30+ |
| `backend-graphql/src/lib/prisma-span-bridge.ts` | Link Prisma to parent spans | 80 | 25+ |
| `backend-graphql/src/__tests__/plugins/tracing-plugin.test.ts` | Plugin unit tests | 120 | 8 suites |
| `backend-graphql/src/__tests__/lib/prisma-span-bridge.test.ts` | Bridge unit tests | 100 | 6 suites |
| `backend-graphql/src/__tests__/integration/graphql-trace-chain.test.ts` | End-to-end trace tests | 200 | 10 suites |
| `docs/TRACING_APOLLO_PRISMA.md` | Technical documentation | 150 | N/A |

### Files Modified

| File | Change | Impact |
|------|--------|--------|
| `backend-graphql/src/server.ts` | Register tracing plugin | Add plugin to Apollo config |
| `backend-graphql/package.json` | Add dependencies | +2 packages (@opentelemetry/*) |
| `.env.local` or config | Enable Prisma tracing flag | Environment configuration |

---

## ✅ Acceptance Criteria Checklist

- [ ] Step 1: Dependencies installed (2 packages: @opentelemetry/instrumentation-*)
- [ ] Step 2: Apollo plugin created (tracing-plugin.ts - 150 lines)
- [ ] Step 3: Field span wrapper created (field-span-wrapper.ts - 100 lines)
- [ ] Step 4: Apollo Server updated with plugin registration
- [ ] Step 5: Prisma ORM tracing enabled (flag in .env)
- [ ] Step 6: Prisma span bridge created (prisma-span-bridge.ts - 80 lines)
- [ ] Step 7: Unit tests written for Apollo plugin (8 test suites, 40+ tests)
- [ ] Step 8: Unit tests written for Prisma bridge (6 test suites, 25+ tests)
- [ ] Step 9: Integration tests written for full trace chain (10 test suites, 50+ tests)
- [ ] Step 10: Quality checks pass (test, lint, type-check)
- [ ] Step 11: Technical documentation written (TRACING_APOLLO_PRISMA.md)
- [ ] Step 12: PR created, linked to #302

---

## 🔗 Integration with Phase B

### Phase B Foundation
Phase B (merged to main) provides:
- ✅ AsyncLocalStorage context manager (context-manager.ts)
- ✅ W3C trace context parser (trace-context.ts)
- ✅ Express middleware (tracing-middleware.ts)
- ✅ Trace context extraction from incoming headers
- ✅ Trace context propagation to downstream handlers

### Phase C Build-On
Phase C leverages Phase B by:
- Accessing trace context via AsyncLocalStorage (already setup by Express middleware)
- Creating GraphQL operation spans within that context
- Creating Prisma DB spans as children of resolver spans
- Maintaining trace context across async operations (Express already handles this)

### Backward Compatibility
- ✅ No breaking changes to existing resolvers
- ✅ Tracing is additive (can be disabled by environment variable)
- ✅ Existing tests continue to pass
- ✅ No performance regression on non-tracing code paths

---

## ⏱️ Time Estimates

| Step | Task | Estimate |
|------|------|----------|
| 1 | Install dependencies | 15 min |
| 2 | Apollo plugin | 60 min |
| 3 | Field span wrapper | 45 min |
| 4 | Update Apollo Server | 30 min |
| 5 | Enable Prisma tracing | 20 min |
| 6 | Prisma span bridge | 45 min |
| 7 | Unit tests (Apollo) | 60 min |
| 8 | Unit tests (Prisma) | 45 min |
| 9 | Integration tests | 90 min |
| 10 | Quality checks | 45 min |
| 11 | Documentation | 30 min |
| 12 | PR preparation | 30 min |
| **Total** | | **~11-12 hours** |

**Effort**: 2 days intensive or 3-4 days with breaks

---

## 🎯 Success Criteria

✅ All 12 steps completed  
✅ Quality checks: 100% pass (test, lint, type-check)  
✅ Test coverage: 90%+ for new tracing code  
✅ 0 broken tests in existing code  
✅ Full trace chain works end-to-end (Express → Apollo → Prisma)  
✅ Trace context properly linked across layers  
✅ PR created and ready for review  
✅ Feature branch clean (ready to merge)  

---

## 📝 Notes

- **Build on Phase B**: Use AsyncLocalStorage context from Phase B middleware
- **Span Hierarchy**: Maintain proper span nesting (operation → field → DB query)
- **Error Handling**: Capture errors in spans without breaking resolver flow
- **Type Safety**: All code TypeScript strict mode compliant
- **Performance**: Measure and verify < 2% overhead
- **Integration**: Phase C integrates with Phase B middleware (no circular deps)
- **Testing**: Integration tests verify complete trace chain

---

**Ready for implementation! Follow steps 1-12 sequentially.**

