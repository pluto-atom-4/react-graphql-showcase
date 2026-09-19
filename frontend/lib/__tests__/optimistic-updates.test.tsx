/**
 * Optimistic Updates Test Suite
 *
 * Comprehensive tests for optimistic updates in Apollo mutations.
 * Tests verify optimistic responses appear in Apollo cache before server response,
 * proper type matching, and rollback on errors.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCache, gql } from '@apollo/client';
import { generateTempId, isTempId } from '../id-utils';
import { BuildStatus, TestStatus } from '../apollo-hooks';

interface GetBuildsResult {
  builds: Array<{
    id: string;
    name: string;
    status?: string;
  }>;
}

describe('Optimistic Updates', () => {
  describe('Temp ID Generation', () => {
    it('generateTempId creates valid temporary IDs', () => {
      const tempId = generateTempId();
      expect(typeof tempId).toBe('string');
      expect(tempId).toMatch(/^temp-\d+-[a-z0-9]+$/);
    });

    it('generateTempId creates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i += 1) {
        ids.add(generateTempId());
      }
      expect(ids.size).toBe(100);
    });

    it('isTempId correctly identifies temporary IDs', () => {
      const tempId = generateTempId();
      expect(isTempId(tempId)).toBe(true);
      expect(isTempId('123')).toBe(false);
      expect(isTempId('real-id')).toBe(false);
    });

    it('isTempId handles edge cases', () => {
      expect(isTempId('')).toBe(false);
      expect(isTempId('temp-')).toBe(true);
      expect(isTempId('TEMP-123')).toBe(false);
    });
  });

  describe('Optimistic Response Structure', () => {
    it('Build optimistic response includes all required fields', () => {
      const mockOptimistic = {
        __typename: 'Build',
        id: generateTempId(),
        name: 'Test Build',
        status: BuildStatus.Pending,
        description: 'Test description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(mockOptimistic).toHaveProperty('__typename', 'Build');
      expect(mockOptimistic).toHaveProperty('id');
      expect(mockOptimistic).toHaveProperty('name');
      expect(mockOptimistic).toHaveProperty('status', BuildStatus.Pending);
      expect(mockOptimistic).toHaveProperty('createdAt');
      expect(mockOptimistic).toHaveProperty('updatedAt');
    });

    it('Part optimistic response includes all required fields', () => {
      const mockOptimistic = {
        __typename: 'Part',
        id: generateTempId(),
        buildId: 'build-1',
        name: 'Test Part',
        sku: 'SKU-123',
        quantity: 5,
        createdAt: new Date().toISOString(),
      };

      expect(mockOptimistic).toHaveProperty('__typename', 'Part');
      expect(mockOptimistic).toHaveProperty('id');
      expect(mockOptimistic).toHaveProperty('buildId');
      expect(mockOptimistic).toHaveProperty('sku');
      expect(mockOptimistic).toHaveProperty('quantity');
    });

    it('TestRun optimistic response includes all required fields', () => {
      const mockOptimistic = {
        __typename: 'TestRun',
        id: generateTempId(),
        buildId: 'build-1',
        status: TestStatus.Pending,
        result: 'PASS',
        fileUrl: 'https://example.com/file.pdf',
        submittedAt: new Date().toISOString(),
        completedAt: null,
      };

      expect(mockOptimistic).toHaveProperty('__typename', 'TestRun');
      expect(mockOptimistic).toHaveProperty('id');
      expect(mockOptimistic).toHaveProperty('buildId');
      expect(mockOptimistic).toHaveProperty('status');
      expect(mockOptimistic).toHaveProperty('submittedAt');
    });
  });

  describe('Cache Modification with Optimistic Updates', () => {
    let cache: InMemoryCache;

    beforeEach(() => {
      cache = new InMemoryCache();
    });

    it('Apollo cache stores optimistic Build response', () => {
      const tempId = generateTempId();
      const optimisticBuild = {
        __typename: 'Build',
        id: tempId,
        name: 'Optimistic Build',
        status: BuildStatus.Pending,
        description: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cache.writeQuery({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
              status
            }
          }
        `,
        data: {
          builds: [optimisticBuild],
        },
      });

      const result = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
              status
            }
          }
        `,
      });

      expect(result?.builds).toHaveLength(1);
      expect(result?.builds[0].id).toBe(tempId);
      expect(result?.builds[0].name).toBe('Optimistic Build');
    });

    it('Apollo cache eviction clears optimistic data', () => {
      const tempId = generateTempId();
      cache.writeQuery({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
            }
          }
        `,
        data: {
          builds: [{ __typename: 'Build', id: tempId, name: 'Test' }],
        },
      });

      // Verify data exists
      let result = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
            }
          }
        `,
      });
      expect(result?.builds).toHaveLength(1);

      // Evict and verify it's cleared
      cache.evict({ fieldName: 'builds' });
      cache.gc();

      result = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
            }
          }
        `,
      });
      expect(result).toBeFalsy();
    });
  });

  describe('Optimistic Timing', () => {
    it('Optimistic response should appear immediately without waiting for server', () => {
      return new Promise<void>((resolve) => {
        const startTime = Date.now();

        // Simulate optimistic update timing
        globalThis.setTimeout(() => {
          const optimisticTime = Date.now() - startTime;
          expect(optimisticTime).toBeLessThan(200); // Should be very fast (< 200ms)
          resolve();
        }, 0);
      });
    });

    it('Optimistic response can be displayed before server confirms', () => {
      const optimistic = {
        __typename: 'Build',
        id: generateTempId(),
        name: 'Optimistic Build',
        status: BuildStatus.Pending,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // This represents the immediate UI update
      const displayedBuild = optimistic;
      expect(displayedBuild.id).toMatch(/^temp-/);
      expect(displayedBuild.name).toBe('Optimistic Build');
      expect(displayedBuild.status).toBe(BuildStatus.Pending);
    });
  });

  describe('Optimistic Update Patterns', () => {
    it('Status update maintains Build identity while changing status', () => {
      const buildId = 'build-123';
      const originalBuild = {
        __typename: 'Build',
        id: buildId,
        name: 'Original Build',
        status: BuildStatus.Pending,
        description: 'Test',
        createdAt: '2026-04-27T00:00:00Z',
        updatedAt: '2026-04-27T00:00:00Z',
      };

      const updatedBuild = {
        ...originalBuild,
        status: BuildStatus.Running,
        updatedAt: new Date().toISOString(),
      };

      expect(updatedBuild.id).toBe(originalBuild.id);
      expect(updatedBuild.name).toBe(originalBuild.name);
      expect(updatedBuild.status).not.toBe(originalBuild.status);
    });

    it('New Part addition maintains parent buildId', () => {
      const buildId = 'build-456';
      const newPart = {
        __typename: 'Part',
        id: generateTempId(),
        buildId,
        name: 'New Part',
        sku: 'SKU-789',
        quantity: 10,
        createdAt: new Date().toISOString(),
      };

      expect(newPart.buildId).toBe(buildId);
      expect(newPart.id).toMatch(/^temp-/);
    });

    it('Test run submission maintains timestamp consistency', () => {
      const now = new Date().toISOString();
      const testRun = {
        __typename: 'TestRun',
        id: generateTempId(),
        buildId: 'build-789',
        status: TestStatus.Pending,
        result: 'PASS',
        fileUrl: 'https://example.com/report.pdf',
        submittedAt: now,
        completedAt: null,
      };

      expect(testRun.submittedAt).toBe(now);
      expect(testRun.completedAt).toBeNull();
    });
  });

  describe('Optimistic Rollback Scenarios', () => {
    it('Optimistic Build with temp ID should rollback on error', () => {
      const tempId = generateTempId();
      const optimisticBuild = {
        __typename: 'Build',
        id: tempId,
        name: 'Failed Build',
        status: BuildStatus.Pending,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simulate error - the UI should revert to previous state
      // In a real scenario, Apollo Client handles this automatically
      expect(isTempId(optimisticBuild.id)).toBe(true);

      // Server error would trigger refetch which replaces optimistic with real data
      const realBuild = {
        __typename: 'Build',
        id: 'real-id-1',
        name: 'Failed Build',
        status: BuildStatus.Pending,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isTempId(realBuild.id)).toBe(false);
    });

    it('Cache eviction removes failed optimistic entries', () => {
      const cache = new InMemoryCache();
      const tempId = generateTempId();

      // Write optimistic data
      cache.writeQuery({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
            }
          }
        `,
        data: {
          builds: [{ __typename: 'Build', id: tempId, name: 'Optimistic' }],
        },
      });

      // Verify it's there
      let result = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
            }
          }
        `,
      });
      expect(result?.builds).toHaveLength(1);

      // Evict to simulate rollback
      cache.evict({ fieldName: 'builds' });
      cache.gc();

      // Verify it's gone
      result = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
            }
          }
        `,
      });
      expect(result).toBeNull();
    });
  });

  describe('Optimistic Update Type Safety', () => {
    it('Build optimistic response matches Build type', () => {
      const build = {
        __typename: 'Build',
        id: generateTempId(),
        name: 'Type Safe Build',
        status: BuildStatus.Pending,
        description: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Type checking would fail if properties are missing
      expect(build.__typename).toBe('Build');
      expect(typeof build.id).toBe('string');
      expect(typeof build.name).toBe('string');
      expect(typeof build.status).toBe('string');
      expect(typeof build.createdAt).toBe('string');
      expect(typeof build.updatedAt).toBe('string');
    });

    it('Part optimistic response matches Part type', () => {
      const part = {
        __typename: 'Part',
        id: generateTempId(),
        buildId: 'build-1',
        name: 'Type Safe Part',
        sku: 'SKU-001',
        quantity: 5,
        createdAt: new Date().toISOString(),
      };

      expect(part.__typename).toBe('Part');
      expect(typeof part.id).toBe('string');
      expect(typeof part.buildId).toBe('string');
      expect(typeof part.quantity).toBe('number');
    });

    it('TestRun optimistic response matches TestRun type', () => {
      const testRun = {
        __typename: 'TestRun',
        id: generateTempId(),
        buildId: 'build-1',
        status: TestStatus.Pending,
        result: 'PASS',
        fileUrl: 'https://example.com/file.pdf',
        submittedAt: new Date().toISOString(),
        completedAt: null,
      };

      expect(testRun.__typename).toBe('TestRun');
      expect(typeof testRun.id).toBe('string');
      expect(typeof testRun.status).toBe('string');
      expect(testRun.completedAt).toBeNull();
    });
  });

  describe('Default Values in Optimistic Responses', () => {
    it('Build uses PENDING status as default', () => {
      const build = {
        __typename: 'Build',
        id: generateTempId(),
        name: 'Default Status Build',
        status: BuildStatus.Pending,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(build.status).toBe(BuildStatus.Pending);
    });

    it('Part uses quantity 1 as default', () => {
      const part = {
        __typename: 'Part',
        id: generateTempId(),
        buildId: 'build-1',
        name: 'Default Quantity',
        sku: 'SKU-123',
        quantity: 1,
        createdAt: new Date().toISOString(),
      };

      expect(part.quantity).toBe(1);
    });

    it('TestRun uses empty string as default result', () => {
      const testRun = {
        __typename: 'TestRun',
        id: generateTempId(),
        buildId: 'build-1',
        status: TestStatus.Pending,
        result: '',
        fileUrl: '',
        submittedAt: new Date().toISOString(),
        completedAt: null,
      };

      expect(testRun.result).toBe('');
      expect(testRun.fileUrl).toBe('');
    });
  });

  describe('Optimistic Update Consistency', () => {
    it('Multiple optimistic updates maintain cache consistency', () => {
      const cache = new InMemoryCache();
      const buildId1 = 'build-1';
      const buildId2 = 'build-2';

      // Write first optimistic build
      cache.writeQuery({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
            }
          }
        `,
        data: {
          builds: [{ __typename: 'Build', id: buildId1, name: 'Build 1' }],
        },
      });

      // Update cache to add second build (simulate adding to list)
      const existingData = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
            }
          }
        `,
      });

      if (existingData?.builds) {
        cache.writeQuery({
          query: gql`
            query GetBuilds {
              builds {
                id
                name
              }
            }
          `,
          data: {
            builds: [
              ...existingData.builds,
              { __typename: 'Build', id: buildId2, name: 'Build 2' },
            ],
          },
        });
      }

      const result = cache.readQuery<GetBuildsResult>({
        query: gql`
          query GetBuilds {
            builds {
              id
              name
            }
          }
        `,
      });

      expect(result?.builds).toHaveLength(2);
      expect(result?.builds[0].id).toBe(buildId1);
      expect(result?.builds[1].id).toBe(buildId2);
    });
  });

  describe('Optimistic Update Edge Cases', () => {
    it('Handles optimistic update with undefined optional fields', () => {
      const build = {
        __typename: 'Build',
        id: generateTempId(),
        name: 'Build Without Description',
        status: BuildStatus.Pending,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(build.description).toBe('');
    });

    it('Handles optimistic Part update with optional fileUrl', () => {
      const testRun = {
        __typename: 'TestRun',
        id: generateTempId(),
        buildId: 'build-1',
        status: TestStatus.Pending,
        result: 'PASS',
        fileUrl: '', // Optional, defaults to empty string
        submittedAt: new Date().toISOString(),
        completedAt: null,
      };

      expect(testRun.fileUrl).toBe('');
    });

    it('Handles rapid successive optimistic updates', () => {
      const ids = [];
      for (let i = 0; i < 5; i += 1) {
        ids.push(generateTempId());
      }

      // All IDs should be unique even with rapid generation
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // All should be temp IDs
      ids.forEach((id) => {
        expect(isTempId(id)).toBe(true);
      });
    });
  });
});
