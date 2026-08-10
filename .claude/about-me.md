# About This Project

## Interview Context

**Role**: Senior Full Stack Software Developer  
**Company**: Stoke Space  
**Platform**: Boltline (cloud-based Iterative Hardware Engineering)  
**Practice Duration**: 7-day intensive

---

## What is Boltline?

Boltline is a commercial SaaS product helping hardware teams (aerospace, biotech, energy) manage manufacturing workflows with reliability. It integrates:

- **Parts Library & Inventory**: Full traceability via QR codes and Bills of Materials (BoMs)
- **Work Plans**: Digital instructions capturing real-time shop floor data
- **Automated Workflows**: No-code automation for supply chain and engineering
- **Real-time Updates**: Critical for multi-day manufacturing processes

---

## Domain Model (Simplified)

**Build**: Top-level manufacturing work item
- Status: PENDING → RUNNING → COMPLETE or FAILED
- Parts: Components used in build
- TestRuns: Quality assurance executions
- Metadata: Timestamps, technician notes

**Part**: Individual components
- Name, SKU, quantity
- Inventory tracking, traceability
- Revisions and history

**TestRun**: Test execution results
- Status: PENDING → RUNNING → PASSED or FAILED
- Metrics, file uploads, test reports
- Technician notes

---

## Key Interview Themes

- **Traceability**: Track "as-built" reality across manufacturing
- **Data Integrity**: Multi-day workflows without losing state
- **Real-time Collaboration**: Live shop floor updates
- **Scalability**: Handle sensor data and manufacturing events
- **Type Safety**: End-to-end TypeScript
- **User Experience**: Optimistic updates for spotty WiFi
- **Separation of Concerns**: GraphQL (data) + Express (auxiliary)

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Next.js 16 |
| GraphQL | Apollo Server 4, DataLoader, PostgreSQL |
| Auxiliary | Express.js (uploads, webhooks, SSE) |
| Database | PostgreSQL |
| Testing | Vitest |

---

## Related Docs

- [CLAUDE.md](../CLAUDE.md) — Setup and commands
- [DESIGN.md](../DESIGN.md) — Architecture and patterns
- [docs/start-from-here.md](../docs/start-from-here.md) — 7-day practice plan
