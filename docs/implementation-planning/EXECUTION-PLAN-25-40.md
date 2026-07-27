# Execution Plan: GitHub Issues #25-40
**React-GraphQL Showcase - Full-Stack Interview Prep**

**Date**: April 18, 2026  
**Scope**: 16 frontend + full-stack issues  
**Total Effort**: ~28-30 hours  
**Critical Path**: 14-16 hours  
**Team Size**: 1-2 developers

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Issues** | 16 (#25-40) |
| **Frontend Issues** | 14 |
| **Backend Issues** | 1 (#27 JWT) |
| **Testing Issues** | 2 (#36, #37) |
| **Scope** | Type safety, auth, error handling, UX, real-time, testing |
| **Estimated Total Effort** | 28-30 hours |
| **Critical Path Duration** | 14-16 hours (parallel execution) |
| **Quick Wins** | #31, #39, #35 (4-5 hours combined) |
| **High Risk** | #29 (CORS/SSE), #37 (integration tests) |
| **Blocking Issues** | #25 (blocks 6 others), #27 (blocks 5 others) |

### Primary Goals
1. **Type Safety**: Auto-generate GraphQL types (#25) → eliminate 7 TypeScript errors
2. **Authentication**: JWT auth (#27) → secure all endpoints
3. **Error Handling**: Global error boundaries + graceful degradation (#28, #29, #31)
4. **Real-Time**: CORS/SSE fixes + retry logic (#29, #32)
5. **UX Polish**: Optimistic updates, loading skeletons, pagination (#30, #35, #34)
6. **Quality**: Comprehensive testing (#36, #37)

---

## Dependency Analysis

### Critical Path Chain (Must Complete in Order)
```
#25 (GraphQL CodeGen)
  ↓
  ├→ #26 (Server Components)  [parallel]
  ├→ #27 (JWT Auth)           [parallel]
  └→ #30 (Optimistic Updates) [depends on types]
      ↓
      └→ #37 (Integration Tests) [tests #30]
```

### Blocking Relationships

| Issue | Blocks | Reason |
|-------|--------|--------|
| #25 | #26, #27, #30, #36, #37 | Needs TypeScript types |
| #27 | #24 (not in scope), #28, #31 | Auth required for secure features |
| #28 | #31, #38 | Error boundary foundation |
| #29 | #38 | CORS/SSE must work before edge cases |
| #30 | #37 | Integration tests verify optimistic updates |
| #31 | — | Can run after #28 (error handling) |

### Independent (Can Start Anytime)
- #33 (FileUploader) - independent of other work
- #34 (Pagination) - independent UI component
- #35 (Skeletons) - independent UI component
- #39 (Tailwind) - styling refactor, no deps
- #40 (Accessibility) - applies to all components

### Suggested Parallel Work Streams
- **Stream A (Core)**: #25 → #26 → #27 → #30 → #37
- **Stream B (UX)**: #28 → #31 → #35 → #40
- **Stream C (Polish)**: #29 → #32 → #38 → #34 → #33 → #39

---

## Execution Phases

### Phase 1: Foundation (Critical Path - Days 1-2)
**Duration**: 6-8 hours | **Effort**: High | **Risk**: Medium

Must complete before other work. Establishes type safety and authentication.

| Issue | Title | Type | Effort | Owner | Notes |
|-------|-------|------|--------|-------|-------|
| #25 | GraphQL Code Generation | Feature | 2h | Dev 1 | **BLOCKER**: Creates graphql-codegen setup |
| #26 | Server Component Pattern | Feature | 1h | Dev 1 | SEO + performance improvement |
| #27 | JWT Authentication | Feature | 3h | Dev 1 or 2 | Backend + Frontend integration |

**Why First?**
- TypeScript errors prevent builds (#25)
- JWT required for secure endpoints (#27)
- Server Components enable performance (#26)
- All other features depend on these

**Verification**
```bash
# Phase 1 Complete Checklist:
pnpm type-check          # All 7 TypeScript errors resolved
pnpm test:frontend       # No type-related test failures
pnpm dev                 # App starts without errors
pnpm test:graphql        # Auth middleware working
```

**Risks & Mitigations**
| Risk | Mitigation |
|------|-----------|
| GraphQL server not responding during codegen | Pre-start GraphQL before running codegen |
| JWT secret not configured | Use default 'secret' for dev, document in .env.example |
| Auth middleware breaks existing queries | Implement allowlist for unauthenticated queries |

---

### Phase 2: Error Handling & Resilience (Days 2-3)
**Duration**: 5-6 hours | **Effort**: Medium | **Risk**: Low

Implement global error handling, retry logic, and CORS fixes.

| Issue | Title | Type | Effort | Owner | Notes |
|-------|-------|------|--------|-------|-------|
| #28 | Global Error Boundaries | Feature | 2h | Dev 1 | ErrorBoundary + error.tsx |
| #29 | CORS & SSE Errors | Bug | 2h | Dev 1 | Critical for real-time |
| #32 | Timeouts & Retry Logic | Enhancement | 1.5h | Dev 1 | Apollo + fetch with backoff |

**Parallel Opportunity**: #28 and #29 independent, can assign to separate developers.

**Why After Phase 1?**
- Error handling improves UX for auth failures (#27)
- Retry logic helps with network issues during development
- CORS fixes SSE for real-time events

**Verification**
```bash
# Phase 2 Complete Checklist:
DevTools Console     # No CORS errors, proper error logs
Throttle → Slow 3G   # App recovers from timeouts
Stop GraphQL         # Error boundary shows gracefully
```

---

### Phase 3: User Experience (Days 3-4)
**Duration**: 6-8 hours | **Effort**: Medium | **Risk**: Low

Implement optimistic updates, loading states, and enhanced error UI.

| Issue | Title | Type | Effort | Owner | Notes |
|-------|-------|------|--------|-------|-------|
| #30 | Optimistic Updates | Feature | 2h | Dev 1 | Apollo cache + mutations |
| #31 | Toast Notifications | Enhancement | 1.5h | Dev 1 or 2 | Replace alerts with toasts |
| #35 | Loading Skeletons | Enhancement | 1.5h | Dev 1 or 2 | Placeholder UI during loads |
| #34 | Pagination UI | Feature | 1.5h | Dev 2 | Builds table pagination |

**Parallel Opportunities**: #31, #35, #34 can run independently.

**Why After Phase 2?**
- Error boundaries needed for graceful error display (#28)
- Optimistic updates depend on solid error handling (#30)
- Toast notifications replace alerts once error handling is solid (#31)

**Verification**
```bash
# Phase 3 Complete Checklist:
pnpm dev                     # No visual regressions
Slow 3G → Create Build      # Optimistic update visible immediately
Build fails → Toast shown    # Error UI professional
Skeleton loading→Data        # No layout shift
```

---

### Phase 4: Quality & Polish (Days 4-5)
**Duration**: 6-8 hours | **Effort**: Medium-High | **Risk**: Low

Testing, accessibility, styling, and edge cases.

| Issue | Title | Type | Effort | Owner | Notes |
|-------|-------|------|--------|-------|-------|
| #36 | GraphQL Code Gen Tests | Feature | 1h | Dev 1 | Verify types don't break |
| #37 | Integration Tests | Feature | 2-3h | Dev 2 | E2E workflow testing |
| #38 | SSE Edge Cases | Enhancement | 1.5h | Dev 1 | Heartbeat, cleanup, etc |
| #33 | FileUploader Component | Feature | 2h | Dev 2 | Drag-drop, progress bar |
| #40 | Accessibility | Enhancement | 2-3h | Dev 1 or 2 | ARIA, keyboard nav |
| #39 | Tailwind CSS Migration | Enhancement | 1-2h | Dev 1 | Remove custom CSS |

**Parallel Opportunities**: All independent. Assign based on skill/availability.

**Why Last?**
- Tests verify earlier features work (#36, #37)
- Edge cases require stable SSE from #29 (#38)
- Polish issues don't block core functionality (#39, #40)
- FileUploader works better after error handling (#33)

**Verification**
```bash
# Phase 4 Complete Checklist:
pnpm test                    # 80%+ tests passing
pnpm test:frontend           # Component tests green
pnpm test:graphql            # Hook type tests green
DevTools Accessibility       # No WCAG violations
npm run build                # Build succeeds
```

---

## Critical Path Visualization

```
START
  │
  ├─→ [#25] GraphQL CodeGen (2h) ─→ TypeScript ✓
  │     │
  │     ├─→ [#26] Server Components (1h) ────┐
  │     ├─→ [#27] JWT Auth (3h) ─────────────┤
  │     └─→ [#30] Optimistic Updates (2h) ───┤
  │           │                              │
  │           └─→ [#37] Integration Tests ────┤ PHASE 1-3
  │                                           │ (6-8 hours)
  │                                           │
  └─→ [#28] Error Boundaries (2h) ───────────┤
        │                                    │
        ├─→ [#29] CORS/SSE (2h) ────────────┤ PHASE 2
        │     │                             │ (5-6 hours)
        │     └─→ [#38] SSE Edge Cases (1.5h)┤
        │                                    │
        └─→ [#32] Retry Logic (1.5h) ───────┤
              │
              └─→ [PARALLEL]
                  ├─→ [#31] Toasts (1.5h)
                  ├─→ [#35] Skeletons (1.5h)
                  ├─→ [#34] Pagination (1.5h)
                  ├─→ [#33] FileUploader (2h)
                  ├─→ [#40] Accessibility (2-3h)
                  └─→ [#39] Tailwind (1-2h)
                      │
                      └─→ PHASE 3-4
                          (6-8 hours)
                          
  TOTAL: ~28-30 hours sequential
  CRITICAL PATH: ~14-16 hours (with parallel)
```

---

## Issues Summary Table

| Phase | Issue | Title | Type | Effort | Deps | Blocks | Priority | Risk |
|-------|-------|-------|------|--------|------|--------|----------|------|
| 1 | #25 | GraphQL Code Generation | Feature | 2h | — | 6 issues | 🔴 CRITICAL | 🟢 Low |
| 1 | #26 | Server Component Pattern | Feature | 1h | #25 | — | 🟡 High | 🟡 Medium |
| 1 | #27 | JWT Authentication | Feature | 3h | #25 | 5 issues | 🔴 CRITICAL | 🟡 Medium |
| 2 | #28 | Global Error Boundaries | Enhancement | 2h | — | 4 issues | 🟡 High | 🟢 Low |
| 2 | #29 | CORS & SSE Errors | Bug | 2h | #24 | #38 | 🔴 CRITICAL | 🔴 High |
| 2 | #32 | Timeouts & Retry Logic | Enhancement | 1.5h | #25 | — | 🟡 High | 🟢 Low |
| 3 | #30 | Optimistic Updates | Feature | 2h | #25, #28 | #37 | 🟡 High | 🟢 Low |
| 3 | #31 | Enhance Error UI | Enhancement | 1.5h | #28 | — | 🟡 High | 🟢 Low |
| 3 | #35 | Loading Skeletons | Enhancement | 1.5h | #25 | — | 🟡 Medium | 🟢 Low |
| 3 | #34 | Pagination UI | Feature | 1.5h | #25 | — | 🟡 Medium | 🟢 Low |
| 4 | #36 | GraphQL Code Gen Tests | Feature | 1h | #25 | — | 🟡 Medium | 🟢 Low |
| 4 | #37 | Integration Tests | Feature | 2-3h | #30 | — | 🟡 Medium | 🟡 Medium |
| 4 | #38 | SSE Edge Cases | Enhancement | 1.5h | #29 | — | 🟡 Medium | 🟢 Low |
| 4 | #33 | FileUploader Component | Feature | 2h | #31 | — | 🟡 Medium | 🟢 Low |
| 4 | #40 | Accessibility | Enhancement | 2-3h | — | — | 🟡 Medium | 🟢 Low |
| 4 | #39 | Tailwind CSS Migration | Enhancement | 1-2h | — | — | 🟢 Low | 🟢 Low |

---

## Effort Estimates by Phase

### Phase 1: Foundation
- **#25 GraphQL CodeGen**: 2h
- **#26 Server Components**: 1h
- **#27 JWT Auth**: 3h
- **Subtotal**: 6h (sequential, no parallelization opportunity)

### Phase 2: Error Handling
- **#28 Error Boundaries**: 2h
- **#29 CORS/SSE**: 2h
- **#32 Retry Logic**: 1.5h
- **Subtotal**: 5.5h (can parallelize #28 + #29 = 2h, then #32)

### Phase 3: UX Improvements
- **#30 Optimistic Updates**: 2h
- **#31 Toast Notifications**: 1.5h
- **#35 Skeletons**: 1.5h
- **#34 Pagination**: 1.5h
- **Subtotal**: 6.5h (can parallelize: 2 developers × 3.25h each)

### Phase 4: Quality & Polish
- **#36 Code Gen Tests**: 1h
- **#37 Integration Tests**: 2-3h
- **#38 SSE Edge Cases**: 1.5h
- **#33 FileUploader**: 2h
- **#40 Accessibility**: 2-3h
- **#39 Tailwind**: 1-2h
- **Subtotal**: 10-12h (can parallelize across 2 developers)

### Total Effort
- **Sequential (1 dev)**: ~28-30 hours
- **With 2 devs (optimal parallelization)**: ~15-18 hours
- **Critical Path (must-do first)**: ~14-16 hours

---

## Parallel Execution Strategy

### Option 1: Single Developer (28-30 hours)
Execute phases sequentially. Simple but slower.

### Option 2: Two Developers (Recommended - 15-18 hours)

**Dev 1 (Core Path)**: #25 → #26 → #27 → #28 → #32 → #30 → #36 → #37  
- Focus: TypeScript, Auth, Error Handling, Optimistic Updates, Testing  
- Effort: ~14-16h

**Dev 2 (Parallel Path)**: #29 → #31 → #35 → #34 → #33 → #40 → #39 → #38  
- Focus: CORS/Real-Time, UX, Polish, Accessibility  
- Effort: ~15-17h

**Sync Points**:
- After #25: Share TypeScript types with Dev 2
- After #28: Dev 2 uses error handling in #31 toast
- After #30: Dev 2 tests optimistic updates in #35-36
- After #37: Review integration tests together

### Option 3: Three Developers (Parallel from Start)
- **Dev 1**: Core (#25-27-30-37)
- **Dev 2**: Error Handling (#28-29-32-38)
- **Dev 3**: UX/Polish (#31-35-34-33-40-39-36)
- **Total Time**: ~8-10h (max parallelization)

---

## Risk Assessment

### High-Risk Issues

#### #29: CORS & SSE Error Handling 🔴
**Risk**: CORS misconfiguration breaks real-time completely  
**Impact**: Real-time updates don't work  
**Mitigation**:
- Pre-test with curl before modifying
- Keep CORS config in one place (middleware.ts)
- Use browser DevTools to verify headers
- Test both localhost and Docker environments

**Success Criteria**:
- SSE connects without CORS errors
- Reconnects on disconnect within 1-2 seconds
- Console shows clean logs (no 403 errors)

#### #37: Integration Tests 🟡
**Risk**: Tests too fragile, become maintenance burden  
**Impact**: Test suite ignored by team  
**Mitigation**:
- Use React Testing Library (user-centric, not implementation-centric)
- Test user workflows, not internal state
- Mock Apollo properly (MockedProvider)
- Start with happy path, add edge cases later

**Success Criteria**:
- Tests don't break when internals change
- 60%+ component coverage
- All tests green on first run

#### #27: JWT Authentication 🟡
**Risk**: Auth breaks existing unauthenticated queries  
**Impact**: App unusable after merge  
**Mitigation**:
- Create allowlist for unauthenticated queries (e.g., health check)
- Add auth context with fallback (anonymous user)
- Test with GraphiQL before deploying

**Success Criteria**:
- Unauthenticated users see login page
- Authenticated users see dashboard
- Logout clears token and redirects

---

## Quick Wins (Start Here for Momentum)

### 30-Minute Wins
1. **#39 Tailwind Migration** (1-2h)
   - Simple refactor, low risk
   - Immediate visual feedback
   - No new functionality

### 1-Hour Wins
1. **#35 Loading Skeletons** (1.5h)
   - Improves perceived performance
   - Easy to test visually
   - No backend changes

2. **#36 Code Gen Tests** (1h)
   - Very straightforward
   - Validates earlier work (#25)
   - High confidence

### 2-Hour Wins
1. **#31 Toast Notifications** (1.5h)
   - Improves user experience
   - Works independently
   - Easy to verify

2. **#34 Pagination** (1.5h)
   - Well-defined scope
   - Frontend-only
   - Good learning opportunity

---

## Interview Talking Points

### Architecture & Design Decisions

#### 1. GraphQL Code Generation (#25)
> "I use GraphQL Code Generator to auto-generate TypeScript types from the backend schema. This ensures frontend types always match what the API returns, catching type mismatches at compile time instead of crashing at runtime. When the schema changes, types update automatically."

#### 2. Server Components for Performance (#26)
> "I use Next.js Server Components to fetch data server-side before rendering. The Apollo query runs in parallel with JS bundling, making the page 30-40% faster. Initial HTML already contains the dashboard data, eliminating client-side loading spinners and improving First Contentful Paint."

#### 3. JWT Authentication Architecture (#27)
> "I implement JWT authentication across the stack. Frontend stores the JWT, attaches it to Apollo headers automatically. Backend middleware validates the token on every query, with user context available in resolvers. This enables fine-grained authorization like row-level security per user."

#### 4. Error Boundaries & Resilience (#28, #29, #32)
> "I implement error boundaries at multiple levels: React ErrorBoundary for component crashes, Next.js error.tsx for page errors, and Apollo errorLink for network failures. For resilience, I add 10-second timeouts with automatic retry using exponential backoff. On unreliable networks, the app recovers transparently."

#### 5. Optimistic Updates (#30)
> "I use Apollo optimistic responses to show changes immediately before the server confirms. When a user updates a build status, they see the change instantly. If the mutation fails, Apollo automatically reverts the cache. On 3G networks, this changes perceived performance from 2-3 seconds to instant."

#### 6. Real-Time Event Handling (#29, #38)
> "For real-time updates, I implement Server-Sent Events with exponential backoff reconnection. When the network drops, the client automatically reconnects with increasing delays (1s, 2s, 4s...) to avoid overwhelming the server. After 5 attempts, it gives up gracefully. Heartbeat monitoring detects stale connections."

#### 7. Testing Strategy (#36, #37)
> "I write integration tests that verify complete user workflows: create build → add parts → submit test run → see updates. I use React Testing Library (user-centric, not implementation-focused) and MockedProvider for Apollo mocks. This prevents regressions when refactoring internals."

#### 8. Type Safety End-to-End
> "Type safety is a first-class concern. I use TypeScript strict mode, auto-generate types from the GraphQL schema, and avoid 'any' types. Tests also verify that generated types match runtime behavior. This catches bugs at compile time, not production."

---

## Team Recommendations

### For 1 Developer
- **Duration**: ~28-30 hours
- **Strategy**: Execute phases sequentially
- **Recommendation**: Start with Phase 1 (#25-27) to unblock others

### For 2 Developers (Recommended)
- **Duration**: ~15-18 hours
- **Strategy**: Dev 1 core path, Dev 2 parallel path
- **Recommendation**: 
  - Dev 1 (strongest): Handles #25-27-30 (complex)
  - Dev 2 (strong): Handles #29-32-38 (also complex, but independent)
  - Daily sync to share learnings

### For 3+ Developers
- **Duration**: ~8-10 hours (max parallelization)
- **Strategy**: Assign phases to separate developers
- **Recommendation**:
  - Dev 1: Core (#25-27-30-37)
  - Dev 2: Error Handling (#28-29-32-38)
  - Dev 3: UX/Polish (#31-35-34-33-40-39-36)

---

## Implementation Timeline (2-Developer Team)

### Day 1 (4 hours)
- **#25** (2h): GraphQL CodeGen setup
- **#26** (1h): Server Components pattern
- **#27** (3h): JWT Auth (start, may carry over)

### Day 2 (4 hours)
- **#27** (1h): JWT Auth (finish)
- **#28** (2h): Error Boundaries (Dev 1)
- **#29** (2h): CORS/SSE (Dev 2, parallel)

### Day 3 (4 hours)
- **#32** (1.5h): Retry Logic
- **#30** (2h): Optimistic Updates
- **#31** (1.5h): Toasts (Dev 2, parallel)
- **#35** (1.5h): Skeletons (Dev 2, parallel)

### Day 4 (4 hours)
- **#36** (1h): Code Gen Tests
- **#34** (1.5h): Pagination (Dev 2)
- **#33** (2h): FileUploader (Dev 2)
- **#40** (2-3h): Accessibility (starts)

### Day 5 (2-3 hours)
- **#37** (2-3h): Integration Tests
- **#38** (1.5h): SSE Edge Cases
- **#39** (1-2h): Tailwind Migration
- **#40** (finish): Accessibility

---

## Deployment Checklist

Before merging to main:

### Phase 1 Gate
- [ ] `pnpm type-check` passes (0 errors)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:frontend` passes
- [ ] Auth context works (login/logout)
- [ ] Apollo client attaches JWT headers

### Phase 2 Gate
- [ ] Error boundaries catch crashes
- [ ] SSE connects without CORS errors
- [ ] Retry logic retries on timeout
- [ ] No console errors on refresh

### Phase 3 Gate
- [ ] Optimistic updates appear instantly
- [ ] Toast notifications show (not alerts)
- [ ] Skeleton loading UI works
- [ ] Pagination controls page navigation

### Phase 4 Gate
- [ ] `pnpm test` passes (80%+ coverage)
- [ ] Lighthouse accessibility score ≥90
- [ ] No layout shift when skeleton→data
- [ ] FileUploader validates file types
- [ ] Tailwind classes replace all CSS files

---

## Metrics & Success Criteria

### Quality Metrics
| Metric | Target | Current |
|--------|--------|---------|
| TypeScript Errors | 0 | 7 |
| Test Coverage | 80% | TBD |
| ESLint Issues | 0 | 0 ✓ |
| Lighthouse Score | 90+ | TBD |
| WCAG AA Compliance | 100% | TBD |

### Performance Metrics (From #26 & #30)
| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| First Contentful Paint | 2-3s | 1-1.5s | 30-50% faster |
| Time to Interactive | 3-4s | 2-2.5s | 35% faster |
| Mutation Latency (Perceived) | 2-3s | <100ms | 95% faster |
| SSE Reconnect Time | ∞ (fails) | 1-2s | Critical fix |

### User Experience Metrics
| Feature | Before | After |
|---------|--------|-------|
| Error Messages | Browser alert (blocking) | Toast (non-blocking) |
| Loading States | Text "Loading..." | Skeleton (visual) |
| Build Creation | Wait 2s, see result | Instant, then confirm |
| Network Reliability | Fails on any error | Auto-retries, works on flaky networks |

---

## FAQ & Troubleshooting

### "Where should I start if I have 2 hours?"
Start with **Phase 1** (#25-27). These 6 hours unblock all other work. If less time:
1. **#25 (2h)**: GraphQL CodeGen - fixes TypeScript errors

### "What if GraphQL code generation fails?"
1. Ensure GraphQL server running: `pnpm dev:graphql`
2. Check codegen.yml schema URL: `http://localhost:4000/graphql`
3. Try manual generation: `rm frontend/lib/graphql-generated.ts && pnpm codegen`
4. Check Apollo server exports schema correctly

### "How do I test real-time updates locally?"
1. Start all services: `pnpm dev`
2. Open DevTools → Network → Filter "events"
3. Should see persistent EventSource connection
4. Create a build in one browser tab
5. Should see update in another tab within 100ms

### "Should I use TypeScript strict mode?"
Yes. It's already enabled in tsconfig.json. This is non-negotiable for type safety.

### "Can I skip testing and go straight to features?"
Not recommended. Testing (#36, #37) validates that earlier features work. Integration tests catch regressions. ~1-2 hours of testing saves 5+ hours of debugging.

---

## Related Issues (Out of Scope)

These issues are referenced but not in #25-40:
- **#23**: Apollo Client singleton (dependency)
- **#24**: Real-time Event Bus (dependency)
- **#5**: Backend file upload (dependency for #33)

Ensure these are completed before Phase 1.

---

## Success Story: End-to-End User Flow

After all phases complete:

**User Journey**:
1. ✅ Visit app (Server Component loads initial data instantly)
2. ✅ Login (JWT auth redirects if not authenticated)
3. ✅ Create build (Optimistic update shows immediately, toast confirms)
4. ✅ Add parts (Skeleton loading, error if fails, toast shows)
5. ✅ Upload test (Drag-drop file, progress bar, success toast)
6. ✅ Real-time updates (Another user's actions appear instantly)
7. ✅ Network drops (Auto-reconnects within 1-2s, no action needed)
8. ✅ Error occurs (Friendly error boundary, retry button available)
9. ✅ Pagination (Browse 100+ builds with pagination)
10. ✅ Keyboard nav (Tab through all, Esc closes modals, fully accessible)

**Developer Experience**:
- Full TypeScript type safety end-to-end
- Comprehensive tests verify everything works
- Error handling catches edge cases
- Performance optimized for slow networks
- Accessible to all users (WCAG AA)

---

## Appendix: Issue Descriptions

### Phase 1: Foundation

#### #25: Fix TypeScript Compilation & GraphQL Code Generation (2h)
Set up graphql-codegen to auto-generate TypeScript types from GraphQL schema, resolving 7 TypeScript errors.

#### #26: Implement Server Component Pattern (1h)
Convert page.tsx to async Server Component for 30-40% faster page loads and better SEO.

#### #27: Add JWT Authentication (3h)
Implement JWT auth: AuthContext, Apollo auth header, backend validation, login/logout flow.

---

### Phase 2: Error Handling & Resilience

#### #28: Add Global Error Handling & Error Boundaries (2h)
Implement ErrorBoundary, error.tsx, Apollo errorLink for graceful error handling at all levels.

#### #29: Fix CORS & SSE Error Handling (2h)
Fix CORS headers for SSE, implement exponential backoff reconnection (1s, 2s, 4s...).

#### #32: Add Timeouts & Retry Logic (1.5h)
Add 10-second timeouts and automatic retry for transient failures.

---

### Phase 3: User Experience

#### #30: Implement Optimistic Updates (2h)
Use Apollo optimisticResponse to show changes instantly, auto-revert on error.

#### #31: Enhance Error UI (1.5h)
Replace alert() with toast notifications (success/error/warning/info).

#### #35: Add Loading Skeletons (1.5h)
Show skeleton placeholders matching content shape instead of "Loading..." text.

#### #34: Implement Pagination UI (1.5h)
Add prev/next buttons to builds table, limit 10 per page.

---

### Phase 4: Quality & Polish

#### #36: Add GraphQL Code Generation Tests (1h)
Test that generated types don't break, verify query/mutation signatures.

#### #37: Add Integration Tests (2-3h)
End-to-end tests: create build → add parts → submit test run → verify updates.

#### #38: Handle SSE Edge Cases (1.5h)
Heartbeat monitoring, malformed JSON handling, proper cleanup.

#### #33: Add FileUploader Component (2h)
Drag-drop file upload, size/MIME validation, progress bar, success/error toasts.

#### #40: Add Accessibility Improvements (2-3h)
ARIA labels, keyboard navigation, focus management, screen reader support.

#### #39: Replace Custom CSS with Tailwind (1-2h)
Remove .css files, convert all styles to Tailwind classes.

---

## Version & Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-18 | 1.0 | Initial comprehensive execution plan for issues #25-40 |

---

**Plan Created By**: Copilot  
**Last Updated**: April 18, 2026  
**Status**: Ready for Implementation ✅
