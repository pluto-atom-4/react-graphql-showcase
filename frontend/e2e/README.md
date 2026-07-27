# Playwright E2E Tests - Setup & Troubleshooting

## Quick Start

```bash
# Ensure all services are running
pnpm dev

# In another terminal, run tests
pnpm e2e              # Run all tests
pnpm e2e:headed       # Run with visual browser window
pnpm e2e:debug        # Debug mode (interactive)
pnpm e2e:report       # View HTML report from last run
```

## System Architecture

The project has three integration layers that tests verify:

```
Frontend (Next.js 3000)
    ↓ (Apollo Client)
GraphQL Backend (Apollo Server 4000)
    ↓
PostgreSQL Database
    ↓
Express Server (5000) - Files, webhooks, real-time
```

**E2E tests verify the complete flow**: Login → Dashboard → Builds → Operations

---

## Common Issues & Solutions

### Issue 1: Missing System Libraries (Debian/Linux)

**Symptom:**

```
Host system is missing dependencies to run browsers.
Missing libraries:
    libmanette-0.2.so.0
```

**Root Cause:**
Playwright browsers (Chromium, Firefox, WebKit) need system libraries that may not be installed on Linux. This is a **system-level dependency**, not a Node.js/npm issue.

**Solution (if you have sudo):**

```bash
# Install individual missing library
sudo apt-get install libmanette-0.2-0

# OR: Install all Playwright browser dependencies (comprehensive)
sudo apt-get install -y \
  libmanette-0.2-0 \
  libglib2.0-0 \
  libwayland-client0 \
  libxkbcommon0 \
  libdbus-1-3 \
  libfontconfig1 \
  libfreetype6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libpangocairo-1.0-0 \
  libpango-1.0-0 \
  libpangoft2-1.0-0
```

After installing, verify:

```bash
pnpm exec playwright install
```

**Solution (if you DON'T have sudo):**

⚠️ **You will need system administrator help to run E2E tests locally.**

Contact your system administrator and request installation of:

```
Playwright Browser Dependencies for Debian/Linux
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Missing package: libmanette-0.2-0 (and other graphics/browser libraries)

Reason: Required for browser automation testing (Playwright E2E tests)
Used by: Chromium, Firefox, WebKit browser engines
Impact: Enables E2E test execution on this system
Project: React GraphQL Showcase (full-stack development)

Complete list of required packages for apt-get:
  libmanette-0.2-0, libglib2.0-0, libwayland-client0, libxkbcommon0,
  libdbus-1-3, libfontconfig1, libfreetype6, libx11-6, libx11-xcb1,
  libxcb1, libxext6, libxfixes3, libxi6, libxrandr2, libxrender1,
  libxss1, libxtst6, libnss3, libnspr4, libatk1.0-0, libatk-bridge2.0-0,
  libcups2, libdrm2, libgbm1, libpangocairo-1.0-0, libpango-1.0-0,
  libpangoft2-1.0-0
```

**Workaround (Temporary Development Only):**

Use Docker to run tests in a container with all dependencies pre-installed:

```bash
# Option A: Use official Playwright Docker image
docker run -it \
  -v $(pwd):/workspace \
  -w /workspace \
  --net host \
  mcr.microsoft.com/playwright:v1.48-jammy \
  bash -c "pnpm install && pnpm e2e"

# Option B: Build custom Docker image (persistent)
# Create Dockerfile
FROM mcr.microsoft.com/playwright:v1.48-jammy
WORKDIR /workspace
COPY . .
RUN pnpm install

# Then run
docker build -t my-test-env .
docker run -it -v $(pwd):/workspace --net host my-test-env pnpm e2e
```

---

### Issue 2: Wayland Display Server Compatibility

**Symptom:**

```
Tests fail or hang with Chromium on Wayland (KDE Plasma)
```

**Root Cause:**
Chromium headless mode has limited support for Wayland protocol. Playwright works better with X11.

**Solution: Use Xvfb (X11 Virtual Display)**

See [`WAYLAND_SETUP.md`](./WAYLAND_SETUP.md) for detailed instructions.

```bash
# Install Xvfb (requires sudo)
sudo apt-get install xvfb xauth

# Run tests through X11 virtual display
pnpm e2e:wayland
```

**Alternative: Use Firefox (better Wayland support)**

```bash
# Firefox has native Wayland support in headless mode
pnpm e2e --project=firefox
```

---

### Issue 3: Services Not Running

**Symptom:**

```
Error: Service connectivity check failed
Frontend is not available: Failed to fetch http://localhost:3000
```

**Solution:**

Ensure all services are running:

```bash
# Terminal 1: Start all services
pnpm dev

# Wait 5-10 seconds for services to fully start, then:

# Terminal 2: Run tests
pnpm e2e
```

**Check services manually:**

```bash
# Frontend
curl http://localhost:3000

# GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Express
curl http://localhost:5000/health
```

---

### Issue 4: Port Already in Use

**Symptom:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

Kill stale processes:

```bash
# Find processes on dev ports
lsof -i :3000 -i :4000 -i :5000

# Kill by PID
kill -9 <PID>

# Then restart
pnpm dev
```

---

### Issue 5: Database Connection Errors

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

Ensure PostgreSQL is running:

```bash
# Start Docker container
docker-compose up -d

# Verify
docker-compose ps

# Run migrations
pnpm migrate

# Seed data
pnpm seed
```

---

### Issue 6: Tests Timeout

**Symptom:**

```
Timeout: 30000ms exceeded during test execution
```

**Solution:**

Increase timeout or reduce parallel workers:

```bash
# Run with higher timeout
pnpm e2e -- --timeout=60000

# Run with fewer workers
pnpm e2e -- --workers=1

# Run specific test only
pnpm e2e auth.spec.ts
```

**Or adjust in `playwright.config.ts`:**

```typescript
export default defineConfig({
  timeout: 60000, // Increase from 30000
  navigationTimeout: 15000,
  // ...
});
```

---

### Issue 7: "Could not connect to Wayland display"

**Symptom:**

```
Could not connect to Wayland display
Error: Failed to initialize Wayland display
```

**Solution:**

This is normal on Wayland! Use Xvfb:

```bash
pnpm e2e:wayland  # Uses X11 virtual display
```

Or use Firefox:

```bash
pnpm e2e --project=firefox
```

---

## Directory Structure

```
e2e/
├── fixtures/              # Custom fixtures for tests
│   ├── base.fixture.ts
│   ├── index.ts
│   └── README.md
├── pages/                 # Page objects for UI interactions
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── index.ts
│   └── README.md
├── helpers/               # Test utilities and helpers
│   ├── api-client.ts
│   ├── seed-data.ts
│   ├── wait-helpers.ts
│   ├── test-user.ts
│   ├── index.ts
│   └── README.md
├── tests/                 # Test files organized by feature
│   ├── auth/              # Authentication tests
│   ├── builds/            # Build management tests
│   ├── integration/       # Cross-feature integration tests
│   ├── example.spec.ts    # Example test
│   └── README.md
├── utils/                 # Utilities and common functions
├── WAYLAND_SETUP.md       # Wayland-specific setup
├── README.md              # This file
├── playwright.config.ts   # Playwright configuration
├── playwright.global-setup.ts  # Global setup
└── .gitignore
```

## Getting Started

### Install Dependencies

```bash
cd frontend
pnpm add -D @playwright/test
pnpm exec playwright install
```

### Configure Environment

Create `.env.local` in project root:

```env
# Test credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=TestPassword123!

# Service URLs
GRAPHQL_URL=http://localhost:4000
EXPRESS_URL=http://localhost:5000
BASE_URL=http://localhost:3000
```

### Run Tests

```bash
# Start all services
pnpm dev

# In another terminal
# Run all tests
pnpm e2e

# Run with browser visible
pnpm e2e:headed

# Run debug mode
pnpm e2e:debug

# View test report
pnpm e2e:report

# Run specific test file
pnpm e2e tests/auth/login.spec.ts

# Run tests matching pattern
pnpm e2e -g "login"
```

## Testing Patterns

### Using Fixtures

```typescript
import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test('authenticated user can view dashboard', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  expect(await dashboard.isDashboardReady()).toBeTruthy();
});
```

### API Testing with GraphQL Client

```typescript
test('query builds via API', async ({ apiClient }) => {
  const result = await apiClient.query(`
    query GetBuilds {
      builds { id status }
    }
  `);
  expect(result.data.builds).toBeDefined();
});
```

### Seeding Test Data

```typescript
test('create and delete build', async ({ apiClient }) => {
  const { buildIds } = await seedTestData(apiClient);

  // Test something

  await cleanupTestData(apiClient, { buildIds });
});
```

## Writing Tests

### Test File Naming

- `tests/auth/login.spec.ts` - Authentication tests
- `tests/builds/create.spec.ts` - Build creation tests
- `tests/integration/workflows.spec.ts` - Cross-feature tests

### Test Structure

```typescript
import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test.describe('Dashboard', () => {
  test('loads builds', async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);

    // Act
    await dashboard.goto();
    const builds = await dashboard.getBuilds();

    // Assert
    expect(Array.isArray(builds)).toBeTruthy();
  });

  test('creates new build', async ({ authenticatedPage }) => {
    // Your test here
  });
});
```

### Best Practices

1. **Use Page Objects** - Avoid directly accessing selectors in tests
2. **Use Fixtures** - Pre-authenticate or provide test data via fixtures
3. **Wait Properly** - Always wait for elements/network before assertions
4. **Isolate Tests** - Each test should be independent
5. **Describe Groups** - Use `test.describe()` to group related tests
6. **Meaningful Names** - Test names should describe what is being tested
7. **Clean Up** - Use fixture cleanup to remove test data

## Debugging

### View Test Report

```bash
pnpm e2e:report
```

### Run in Debug Mode

```bash
pnpm e2e:debug
```

### Pause Test Execution

```typescript
await page.pause();
```

### View Network Requests

Enable in playwright.config.ts:

```typescript
use: {
  trace: 'on-first-retry',
}
```

### Print Debug Info

```typescript
console.log('Current URL:', page.url());
console.log('Page title:', await page.title());
```

## CI/CD Integration

Tests run in CI with:

- Single worker (no parallelization)
- 2 retries on failure
- HTML and JUnit reports
- Full traces and screenshots

Add to GitHub Actions:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: pnpm install
      - run: pnpm exec playwright install
      - run: pnpm build

      # Install system dependencies
      - run: sudo apt-get update && sudo apt-get install -y libmanette-0.2-0 xvfb

      # Run E2E tests with Xvfb
      - run: xvfb-run -a pnpm e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Tips

### Speed Up Test Execution

```bash
# Reduce workers (less contention)
pnpm e2e -- --workers=2

# Disable videos/traces (faster)
pnpm e2e -- --trace=off --video=off

# Disable screenshots on pass (faster)
pnpm e2e -- --screenshot=only-on-failure
```

### Reduce Flakiness

```typescript
// Increase timeouts for slow systems
test.setTimeout(60000);

// Use better selectors
// ❌ Bad: await page.click('button');
// ✅ Good: await page.locator('[data-testid="submit"]').click();

// Wait for network idle
await page.waitForLoadState('networkidle');
```

## Troubleshooting Matrix

| Issue             | Check                                              | Solution                              |
| ----------------- | -------------------------------------------------- | ------------------------------------- |
| Missing libraries | `ldd ~/.cache/ms-playwright/*/chrome-linux/chrome` | Ask sysadmin to install dependencies  |
| Wayland hanging   | `echo $XDG_SESSION_TYPE`                           | Use Xvfb or Firefox                   |
| Port in use       | `lsof -i :3000`                                    | Kill stale process                    |
| DB not available  | `psql ...`                                         | Start Docker: `docker-compose up -d`  |
| Tests timeout     | Check slow network                                 | Increase timeout, reduce workers      |
| Flaky assertions  | Look at trace                                      | Use explicit waits & better selectors |

## Additional Resources

- [Playwright Docs](https://playwright.dev)
- [Fixtures Guide](./fixtures/README.md)
- [Page Objects Guide](./pages/README.md)
- [Helpers Guide](./helpers/README.md)
- [Wayland Setup](./WAYLAND_SETUP.md)

## Quick Reference Commands

```bash
# Test execution
pnpm e2e                          # Run all tests
pnpm e2e:headed                   # Run with visual browser
pnpm e2e:debug                    # Debug mode
pnpm e2e:wayland                  # Run on Wayland with Xvfb
pnpm e2e:report                   # View HTML report
pnpm e2e -- --grep "keyword"      # Run tests matching pattern
pnpm e2e -- --project=firefox     # Run only Firefox

# Diagnostics
pnpm exec playwright install      # Install browser dependencies
pnpm e2e -- --trace=on            # Enable tracing
pnpm e2e -- --slow-mo=500         # Slow down execution
pnpm e2e -- --workers=1           # Single worker (no parallelism)
```

## Still Stuck?

1. ✅ Check this README for your error message
2. ✅ Check missing libraries issue above (requires sysadmin)
3. ✅ View [`WAYLAND_SETUP.md`](./WAYLAND_SETUP.md) for Wayland issues
4. ✅ Check Playwright reports: `pnpm e2e:report`
5. ✅ Run in debug mode: `pnpm e2e:debug`
6. ❓ Ask for help with:
   - System/library errors → System administrator
   - Test failures → Review trace report and logs
   - Configuration → Check `playwright.config.ts`
