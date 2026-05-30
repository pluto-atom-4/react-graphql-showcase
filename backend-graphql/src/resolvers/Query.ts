import type { GraphQLResolveInfo } from 'graphql';
import { withPrismaSpan } from '../lib/prisma-span-bridge';
import { wrapResolvers } from '../lib/field-span-wrapper';
import type { BuildContext, PaginationArgs } from '../types';

const queryFields = {
      async builds(
        _parent: unknown,
        args: PaginationArgs,
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        if (args.limit < 1 || args.limit > 100) {
          throw new Error('limit must be between 1 and 100');
        }
        if (args.offset < 0) {
          throw new Error('offset must be >= 0');
        }

        const totalCount = await withPrismaSpan('Build.count', () => context.prisma.build.count());
        const items = await withPrismaSpan('Build.findMany', () =>
          context.prisma.build.findMany({
            take: args.limit,
            skip: args.offset,
            orderBy: { createdAt: 'desc' },
          })
        );

        return {
          items,
          totalCount,
          hasNextPage: args.offset + args.limit < totalCount,
          hasPreviousPage: args.offset > 0,
        };
      },

      async build(
        _parent: unknown,
        args: { id: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        return withPrismaSpan('Build.findUnique', () =>
          context.prisma.build.findUnique({
            where: { id: args.id },
          })
        );
      },

      async testRuns(
        _parent: unknown,
        args: { buildId: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        return withPrismaSpan('TestRun.findMany', () =>
          context.prisma.testRun.findMany({
            where: { buildId: args.buildId },
            orderBy: { createdAt: 'desc' },
          })
        );
      },
};

export const queryResolver = {
  Query: wrapResolvers(queryFields, 'Query') as typeof queryFields,
};
