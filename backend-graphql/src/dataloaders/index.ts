import DataLoader from 'dataloader';
import type { Part, PrismaClient, TestRun } from '@prisma/client';
import { withPrismaSpan } from '../lib/prisma-span-bridge';

export function createBuildPartLoader(prisma: PrismaClient) {
  return new DataLoader(async (buildIds: readonly string[]) => {
    const parts = await withPrismaSpan(
      'DataLoader.Part.findMany',
      () =>
        prisma.part.findMany({
          where: { buildId: { in: buildIds as string[] } },
        }),
      {
        'db.batch.size': buildIds.length,
      }
    );

    const partsByBuildId: Record<string, typeof parts> = {};
    parts.forEach((part) => {
      if (!partsByBuildId[part.buildId]) {
        partsByBuildId[part.buildId] = [];
      }
      partsByBuildId[part.buildId].push(part);
    });

    return buildIds.map((buildId) => partsByBuildId[buildId] || []);
  });
}

export function createBuildTestRunLoader(prisma: PrismaClient) {
  return new DataLoader(async (buildIds: readonly string[]) => {
    const testRuns = await withPrismaSpan(
      'DataLoader.TestRun.findMany',
      () =>
        prisma.testRun.findMany({
          where: { buildId: { in: buildIds as string[] } },
          orderBy: { createdAt: 'desc' },
        }),
      {
        'db.batch.size': buildIds.length,
      }
    );

    const testRunsByBuildId: Record<string, typeof testRuns> = {};
    testRuns.forEach((testRun) => {
      if (!testRunsByBuildId[testRun.buildId]) {
        testRunsByBuildId[testRun.buildId] = [];
      }
      testRunsByBuildId[testRun.buildId].push(testRun);
    });

    return buildIds.map((buildId) => testRunsByBuildId[buildId] || []);
  });
}

export interface DataLoaders {
  buildPartLoader: DataLoader<string, Part[]>;
  buildTestRunLoader: DataLoader<string, TestRun[]>;
}

export function createLoaders(prisma: PrismaClient): DataLoaders {
  return {
    buildPartLoader: createBuildPartLoader(prisma),
    buildTestRunLoader: createBuildTestRunLoader(prisma),
  };
}
