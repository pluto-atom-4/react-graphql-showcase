# Phase B - Issue #301 Orchestration Plan
## W3C Distributed Tracing - Express/SSE Context Propagation

**Date**: 2026-05-19  
**Phase**: B (Express/SSE Layer)  
**Effort**: 2-3 days  
**Assigned**: @developer (feature branch: `feat/issue-#301-express-tracing`)

---

## 🎯 Objective

Implement W3C trace context extraction and propagation across the Express.js backend and Server-Sent Events (SSE) layer. This is **Phase B** of the full-stack distributed tracing feature (#299).

**Scope**: Express middleware + SSE handler only (GraphQL/Prisma in Phase C)

---

## 📋 Acceptance Criteria

- [ ] Express middleware extracts W3C traceparent/tracestate headers
- [ ] `backend-express/src/lib/tracing.ts` created with tracer + context manager
- [ ] SSE handler preserves trace context via AsyncLocalStorage
- [ ] All SSE events include trace metadata in custom headers
- [ ] Unit tests: 90%+ coverage (middleware extraction, context propagation)
- [ ] Integration tests: full request→SSE flow with trace ID verification
- [ ] Quality checks pass: `pnpm test:express --run`, `pnpm lint`, `pnpm type-check`
- [ ] PR created and ready for review

---

## 📐 Task Breakdown

### Task 1: Tracing Setup (Day 1, 2-3 hours)
**What**: Create tracer and context management infrastructure

**Subtasks**:
- [ ] Install dependencies: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/auto`
- [ ] Create `backend-express/src/lib/tracing.ts` with:
  - NodeSDK initialization
  - Tracer instance export
  - Context propagation utilities
  - W3C traceparent/tracestate parser
- [ ] Create `backend-express/src/lib/context-manager.ts` with:
  - AsyncLocalStorage for trace context
  - getTraceContext() getter
  - setTraceContext() setter
  - clearTraceContext() cleanup
- [ ] Unit tests: 90%+ coverage for tracer setup

**Acceptance**: `backend-express/src/lib/tracing.ts` and context-manager.ts implemented with passing tests

---

### Task 2: Express Middleware (Day 1, 2-3 hours)
**What**: Extract W3C headers and initialize trace spans

**Subtasks**:
- [ ] Create `backend-express/src/middleware/tracing-middleware.ts` with:
  - Extract traceparent header from request
  - Extract tracestate header (vendor-specific data)
  - Initialize root span for the HTTP request
  - Store trace context in AsyncLocalStorage
  - Add traceId to `req.traceContext` for downstream access
- [ ] Register middleware in Express app (early in middleware chain)
- [ ] Add TypeScript types for extended Request object
- [ ] Unit tests:
  - Missing traceparent (should generate new trace ID)
  - Valid traceparent (should extract trace ID)
  - Invalid traceparent format (should handle gracefully)
  - tracestate propagation

**Acceptance**: Middleware extracts headers and stores in request context

---

### Task 3: SSE Handler Integration (Day 2, 2-3 hours)
**What**: Preserve trace context across SSE async operations

**Subtasks**:
- [ ] Update `backend-express/src/routes/events.ts` to:
  - Extract trace context from request headers at SSE connection
  - Store trace context in AsyncLocalStorage per connection
  - Pass trace context to broadcastEvent function
  - Include trace metadata in SSE custom headers (optional)
  - Clean up trace context on connection close
- [ ] Create helper: `backend-express/src/lib/sse-trace-helper.ts`
  - `wrapEventWithTrace(event, traceContext)` — adds trace metadata
  - `broadcastEventWithTrace(eventName, data, traceContext)` — broadcasts with context
- [ ] Update event emission to include trace context
- [ ] Unit tests:
  - Trace context preserved during event emission
  - Async operations maintain trace context (AsyncLocalStorage)
  - Connection cleanup removes trace context
- [ ] Integration tests:
  - Full flow: client request → SSE connection → event broadcast
  - Trace ID persists through entire lifecycle
  - Multiple concurrent connections have separate trace contexts

**Acceptance**: SSE events carry trace context without loss

---

### Task 4: Testing & Quality Checks (Day 2-3, 3-4 hours)
**What**: Comprehensive testing and quality validation

**Subtasks**:
- [ ] Unit tests (90%+ coverage):
  - `backend-express/src/__tests__/lib/tracing.test.ts` — tracer setup
  - `backend-express/src/__tests__/lib/context-manager.test.ts` — context isolation
  - `backend-express/src/__tests__/middleware/tracing-middleware.test.ts` — header extraction
  - `backend-express/src/__tests__/routes/events.test.ts` — SSE trace propagation
- [ ] Integration tests:
  - Full request→SSE flow test
  - Multiple concurrent connections test
  - Trace context cleanup test
- [ ] Quality checks:
  - `pnpm test:express --run` — all tests pass
  - `pnpm lint` — 0 ESLint violations
  - `pnpm type-check` — 0 TypeScript strict errors
  - Coverage report: ≥90% for tracing code
- [ ] Capture logs:
  - `docs/dev-note/issue-#301-pnpm-test-express.txt`
  - `docs/dev-note/issue-#301-pnpm-lint.txt`
  - `docs/dev-note/issue-#301-pnpm-type-check.txt`

**Acceptance**: All tests pass, coverage ≥90%, quality logs captured

---

### Task 5: PR Preparation & Documentation (End of Day 3, 1-2 hours)
**What**: Create PR and document changes

**Subtasks**:
- [ ] Commit all changes to feature branch: `feat/issue-#301-express-tracing`
- [ ] Run final quality checks (all pass)
- [ ] Create PR #302 (or auto-assigned number) with:
  - Title: "feat(#301): W3C Distributed Tracing - Express/SSE Context Propagation"
  - Description: Link to #301, list acceptance criteria (all checked), quality logs
  - Reference quality logs in PR description
  - Link Issue #301 (auto-closes on merge)
- [ ] Push to remote
- [ ] PR ready for code review

**Acceptance**: PR created, quality logs captured, ready for review

---

## 🔗 Dependencies

**Blocking**: None (Phase B has no hard blocking dependencies)  
**Depends On**: Issue #299 parent issue (context only, not blocking)

**Phase B Ordering**:
- Phase B Issues: #301 (Express/SSE)
- Can run in parallel with: Any future Phase B issues
- Blocks Phase C: #302 (GraphQL/Prisma tracing)

---

## 📊 Effort Estimate

| Task | Time | Status |
|------|------|--------|
| 1: Tracing Setup | 2-3h | Pending |
| 2: Express Middleware | 2-3h | Pending |
| 3: SSE Handler | 2-3h | Pending |
| 4: Testing & QA | 3-4h | Pending |
| 5: PR Prep | 1-2h | Pending |
| **Total** | **2-3 days** | **Ready** |

---

## 🎯 Success Criteria

✅ All acceptance criteria checked  
✅ Quality checks: 100% pass  
✅ Test coverage: ≥90%  
✅ PR created and ready for review  
✅ No quality check failures  
✅ Clean feature branch (no merge conflicts)  

---

## 📝 Implementation Notes

### W3C Trace Context Standard

**traceparent Header Format**:
```
traceparent: 00-TRACE_ID-PARENT_SPAN_ID-TRACE_FLAGS
           00: version (always 00)
         TRACE_ID: unique ID (32 hex chars)
    PARENT_SPAN_ID: parent span ID (16 hex chars)
       TRACE_FLAGS: sampling + other flags (2 hex chars)
```

**Example**:
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

### AsyncLocalStorage Best Practice

Use AsyncLocalStorage for trace context to ensure:
- Each async operation maintains its own trace context
- Concurrent connections don't interfere
- Proper cleanup prevents memory leaks

```typescript
const traceContextStorage = new AsyncLocalStorage<TraceContext>()

// Store context
traceContextStorage.run(traceContext, () => {
  // Context available in all async operations
  broadcastEvent(...)
})

// Retrieve context
const context = traceContextStorage.getStore()
```

### Testing Strategy

**Unit Tests**: Isolated component testing
- Middleware receives valid/invalid headers → extracts correctly
- Context manager isolates traces between calls
- Trace context not leaked between tests (use global setup cleanup)

**Integration Tests**: Full flow testing
- Express server + SSE connection → trace persists
- Multiple concurrent connections → separate contexts
- Connection cleanup → context cleared

---

## 🚀 Ready for Implementation

This plan is ready for @developer agent to execute. The developer will:
1. Follow this task breakdown sequentially
2. Run quality checks after each task
3. Capture logs to `docs/dev-note/issue-#301-pnpm-*.txt`
4. Create PR when all tasks complete
5. Commit with Issue #301 reference

---

**Next Steps**: Delegate to @developer for implementation

