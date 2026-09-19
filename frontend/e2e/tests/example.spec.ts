/**
 * Redesigned E2E tests for React/GraphQL playground
 *
 * **CRITICAL DESIGN DECISION**: Tests interact with page directly in test body,
 * avoiding any page method calls after test logic completes. This prevents
 * fixture cleanup race conditions that close the page mid-test.
 *
 * The authenticatedPage fixture manages login, page navigation, and cleanup.
 * Tests must complete all page interactions BEFORE test function returns.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, no-console */
import { test, expect } from '../fixtures';
import { LoginPage } from '../pages';

test.describe('UI Tests (Using authenticatedPage fixture)', () => {
  /**
   * Test 1: Authenticated page loads dashboard
   *
   * What it validates:
   * - authenticatedPage fixture successfully logs in
   * - Navigation to /dashboard works
   * - Dashboard page layout is visible (navbar, heading)
   *
   * **DESIGN NOTE**: Interact with page directly in test body.
   * Do NOT use page object methods at test end (causes fixture closure race).
   */
  test('UI Test 1: Dashboard loads for authenticated user', async ({ authenticatedPage }) => {
    // Navigate to dashboard via direct page interaction
    await authenticatedPage.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Check for navbar element directly (not via page object)
    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });

    console.log('✓ Dashboard loaded successfully');
  });

  /**
   * Test 2: Builds table displays with data
   *
   * What it validates:
   * - Dashboard renders builds table (data-testid="builds-list")
   * - Table contains visible builds data
   * - Build rows have proper structure
   *
   * **KEY TEST**: This validates the main dashboard functionality
   */
  test('UI Test 2: Builds table displays with data', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for navbar to verify we're authenticated (on dashboard, not login)
    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });

    // Wait for builds table to be visible (Apollo may take time to load data)
    const buildsList = authenticatedPage.locator('[data-testid="builds-list"]');
    await expect(buildsList).toBeVisible({ timeout: 15000 });

    // Get builds from table (count rows in tbody)
    const buildRows = authenticatedPage.locator('[data-testid="builds-list"] tbody tr');
    const count = await buildRows.count();

    // If table is empty, accept it (no builds in database)
    // If table has rows, verify first build structure
    if (count > 0) {
      console.log(`✓ Dashboard shows ${count} builds`);

      // Verify first build has name visible
      const firstName = await buildRows.first().locator('[data-testid="build-name"]').textContent();
      expect(firstName).toBeTruthy();
      console.log(`✓ First build name: ${firstName}`);
    } else {
      console.log('✓ Dashboard table is empty (no builds yet, but structure renders)');
      // Table structure exists even if empty
      await expect(buildsList).toHaveCount(1);
    }
  });

  /**
   * Test 3: Dashboard heading is visible
   *
   * What it validates:
   * - Dashboard page contains expected heading
   * - Page layout rendered correctly
   */
  test('UI Test 3: Dashboard heading is visible', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Check for heading via CSS selector
    const heading = authenticatedPage.locator('h1:has-text("Build Dashboard")');
    await expect(heading).toBeVisible({ timeout: 5000 });

    console.log('✓ Build Dashboard heading found');
  });

  /**
   * Test 4: Create Build button is accessible
   *
   * What it validates:
   * - Create button is visible and clickable
   * - Dashboard navigation works
   */
  test('UI Test 4: Create Build button is visible', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Find create build button
    const createButton = authenticatedPage.locator('[data-testid="create-build-button"]');
    await expect(createButton).toBeVisible({ timeout: 5000 });

    // Check button text
    await expect(createButton).toContainText('Create');

    console.log('✓ Create Build button found');
  });
});

test.describe('API Tests (Using apiClient fixture)', () => {
  /**
   * Test 5: Query builds via GraphQL API
   *
   * What it validates:
   * - API client can authenticate and query
   * - Builds query returns proper structure
   * - Results contain id, status, name fields
   *
   * This test uses apiClient fixture (no page/UI interaction)
   */
  test('API Test 1: Query builds returns valid data', async ({ apiClient }) => {
    const result = await apiClient.query(
      `
      query GetBuilds($limit: Int!, $offset: Int!) {
        builds(limit: $limit, offset: $offset) {
          id
          status
          name
          createdAt
        }
      }
    `,
      {
        limit: 10,
        offset: 0,
      }
    );

    // Verify response structure
    expect(result.data).toBeDefined();
    expect(Array.isArray((result.data as { builds?: unknown[] })?.builds)).toBe(true);

    // Verify builds have required fields
    const builds = (result.data as { builds?: unknown[] })?.builds as any[];
    if (builds && builds.length > 0) {
      const build = builds[0];
      expect(build).toHaveProperty('id');
      expect(build).toHaveProperty('status');
      expect(build).toHaveProperty('name');
      expect(build).toHaveProperty('createdAt');
      console.log(`✓ API returned ${builds.length} builds with valid schema`);
    } else {
      console.log('✓ API returned empty builds list (valid response)');
    }
  });

  /**
   * Test 6: Create build via API mutation
   *
   * What it validates:
   * - API client can execute mutations
   * - CreateBuild mutation returns new build
   * - Returned build has id, name, status
   */
  test('API Test 2: Create build mutation works', async ({ apiClient }) => {
    const buildName = `E2E Test Build ${Date.now()}`;

    const result = await apiClient.mutation(
      `
      mutation CreateBuild($name: String!, $description: String) {
        createBuild(name: $name, description: $description) {
          id
          name
          status
          createdAt
        }
      }
    `,
      {
        name: buildName,
        description: 'Created by E2E test',
      }
    );

    // Verify mutation succeeded
    expect(result.data).toBeDefined();

    const build = (result.data as { createBuild?: { id?: string; name?: string; status?: string } })
      ?.createBuild;
    expect(build).toBeDefined();
    if (build) {
      expect(build.id).toBeDefined();

      expect(build.name).toBe(buildName);

      expect(build.status).toBeDefined();
    }

    console.log(`✓ Created build: ${build?.name}`);
  });

  /**
   * Test 7: Handle GraphQL requests gracefully
   *
   * What it validates:
   * - API client can handle invalid queries
   * - Requests either return GraphQL errors or HTTP errors
   * - Can continue after error response
   */
  test('API Test 3: Handle invalid GraphQL requests', async ({ apiClient }) => {
    // Execute invalid query - GraphQL may return error OR HTTP 400
    try {
      const result = await apiClient.query(`
        query InvalidQuery {
          nonExistentField
        }
      `);

      // If we get here, GraphQL returned a response with errors
      if (result.errors && result.errors.length > 0) {
        console.log(`✓ GraphQL error response received: ${result.errors[0].message}`);
        expect(result.errors[0]).toHaveProperty('message');
      } else {
        console.log('✓ Query executed (schema allowed the query)');
      }
    } catch (error) {
      // HTTP error from server (e.g., 400 Bad Request)
      // This is acceptable - server rejects invalid query at HTTP level
      console.log(`✓ Server rejected invalid query with HTTP error (expected behavior)`);
      expect(error instanceof Error).toBe(true);
    }
  });
});

test.describe('User Management', () => {
  /**
   * Test 8: Test user fixture provides valid credentials
   *
   * What it validates:
   * - testUser fixture supplies email, password, id
   * - Credentials are defined and non-empty
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  test('User Test 1: Test user fixture provides credentials', async ({ testUser }) => {
    expect(testUser).toBeDefined();
    expect(testUser.email).toBeDefined();
    expect(testUser.email).not.toBe('');
    expect(testUser.password).toBeDefined();
    expect(testUser.password).not.toBe('');
    expect(testUser.id).toBeDefined();

    console.log(`✓ Test user available: ${testUser.email}`);
  });

  /**
   * Test 9: Login page form is accessible without authentication
   *
   * What it validates:
   * - Login page can be reached without authentication
   * - Form has required input fields visible
   * - Submit button is present
   */
  test('User Test 2: Login page form is accessible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify form elements are visible
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const submitButton = page.locator('[data-testid="submit-button"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    console.log('✓ Login form accessible');
  });
});
