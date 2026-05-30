import bcrypt from 'bcrypt';
import type { GraphQLResolveInfo } from 'graphql';
import { BuildStatus, TestStatus } from '@prisma/client';
import { wrapResolvers } from '../lib/field-span-wrapper';
import { withPrismaSpan } from '../lib/prisma-span-bridge';
import { generateToken } from '../middleware/auth';
import { emitEvent } from '../services/event-bus';
import type { BuildContext } from '../types';
import { EVENT_TYPES, createEventEnvelope } from '../types/events';

const mutationFields = {
      async login(
        _parent: unknown,
        args: { email: string; password: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!args.email || args.email.trim().length === 0) {
          throw new Error('email is required');
        }
        if (!args.password || args.password.length === 0) {
          throw new Error('password is required');
        }

        const user = await withPrismaSpan('User.findUnique', () =>
          context.prisma.user.findUnique({
            where: { email: args.email.toLowerCase() },
          })
        );

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(args.password, user.passwordHash);
        if (!passwordMatch) {
          throw new Error('Invalid email or password');
        }

        return {
          token: generateToken(user.id),
          user: {
            id: user.id,
            email: user.email,
          },
        };
      },

      async createBuild(
        _parent: unknown,
        args: { name: string; description?: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        if (!args.name || args.name.trim().length === 0) {
          throw new Error('name is required');
        }

        const build = await withPrismaSpan('Build.create', () =>
          context.prisma.build.create({
            data: {
              name: args.name.trim(),
              description: args.description?.trim(),
            },
          })
        );

        const event = createEventEnvelope(EVENT_TYPES.BUILD_CREATED, 'graphql', context.user.id);
        Object.assign(event, {
          buildId: build.id,
          build: {
            id: build.id,
            name: build.name,
            description: build.description,
            status: build.status,
            createdAt: build.createdAt.toISOString(),
          },
        });

        emitEvent('buildCreated', {
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
          sourceLayer: event.sourceLayer,
          userId: event.userId,
          buildId: build.id,
          build: {
            id: build.id,
            name: build.name,
            description: build.description,
            status: build.status,
            createdAt: build.createdAt.toISOString(),
          },
        }).catch((err) => {
          console.error('Failed to emit BUILD_CREATED event:', err);
        });

        return build;
      },

      async updateBuildStatus(
        _parent: unknown,
        args: { id: string; status: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const validStatuses = ['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'];
        if (!validStatuses.includes(args.status)) {
          throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
        }

        const build = await withPrismaSpan('Build.findUnique', () =>
          context.prisma.build.findUnique({
            where: { id: args.id },
          })
        );
        if (!build) {
          throw new Error(`Build with id ${args.id} not found`);
        }

        const updated = await withPrismaSpan('Build.update', () =>
          context.prisma.build.update({
            where: { id: args.id },
            data: { status: args.status as BuildStatus },
          })
        );

        const event = createEventEnvelope(
          EVENT_TYPES.BUILD_STATUS_CHANGED,
          'graphql',
          context.user.id
        );
        Object.assign(event, {
          buildId: updated.id,
          oldStatus: build.status,
          newStatus: updated.status,
          build: {
            id: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
        });

        emitEvent('buildStatusChanged', {
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
          sourceLayer: event.sourceLayer,
          userId: event.userId,
          buildId: updated.id,
          oldStatus: build.status,
          newStatus: updated.status,
          build: {
            id: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
        }).catch((err) => {
          console.error('Failed to emit BUILD_STATUS_CHANGED event:', err);
        });

        return updated;
      },

      async addPart(
        _parent: unknown,
        args: { buildId: string; name: string; sku: string; quantity: number },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        if (!args.name || args.name.trim().length === 0) {
          throw new Error('name is required');
        }
        if (!args.sku || args.sku.trim().length === 0) {
          throw new Error('sku is required');
        }
        if (args.quantity < 1) {
          throw new Error('quantity must be >= 1');
        }

        const build = await withPrismaSpan('Build.findUnique', () =>
          context.prisma.build.findUnique({
            where: { id: args.buildId },
          })
        );
        if (!build) {
          throw new Error(`Build with id ${args.buildId} not found`);
        }

        const part = await withPrismaSpan('Part.create', () =>
          context.prisma.part.create({
            data: {
              buildId: args.buildId,
              name: args.name.trim(),
              sku: args.sku.trim(),
              quantity: args.quantity,
            },
          })
        );

        const event = createEventEnvelope(EVENT_TYPES.PART_ADDED, 'graphql', context.user.id);
        Object.assign(event, {
          buildId: args.buildId,
          partId: part.id,
          part: {
            id: part.id,
            buildId: part.buildId,
            name: part.name,
            sku: part.sku,
            quantity: part.quantity,
            createdAt: part.createdAt.toISOString(),
          },
        });

        emitEvent('partAdded', {
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
          sourceLayer: event.sourceLayer,
          userId: event.userId,
          buildId: args.buildId,
          partId: part.id,
          part: {
            id: part.id,
            buildId: part.buildId,
            name: part.name,
            sku: part.sku,
            quantity: part.quantity,
            createdAt: part.createdAt.toISOString(),
          },
        }).catch((err) => {
          console.error('Failed to emit PART_ADDED event:', err);
        });

        return part;
      },

      async submitTestRun(
        _parent: unknown,
        args: {
          buildId: string;
          status: string;
          result?: string;
          fileUrl?: string;
        },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const validStatuses = ['PENDING', 'RUNNING', 'PASSED', 'FAILED'];
        if (!validStatuses.includes(args.status)) {
          throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
        }

        const build = await withPrismaSpan('Build.findUnique', () =>
          context.prisma.build.findUnique({
            where: { id: args.buildId },
          })
        );
        if (!build) {
          throw new Error(`Build with id ${args.buildId} not found`);
        }

        const testRun = await withPrismaSpan('TestRun.create', () =>
          context.prisma.testRun.create({
            data: {
              buildId: args.buildId,
              status: args.status as TestStatus,
              result: args.result,
              fileUrl: args.fileUrl,
              completedAt: args.status === 'RUNNING' ? null : new Date(),
            },
          })
        );

        const event = createEventEnvelope(
          EVENT_TYPES.TEST_RUN_SUBMITTED,
          'graphql',
          context.user.id
        );
        Object.assign(event, {
          buildId: args.buildId,
          testRunId: testRun.id,
          testRun: {
            id: testRun.id,
            buildId: testRun.buildId,
            status: testRun.status,
            result: testRun.result,
            fileUrl: testRun.fileUrl,
            completedAt: testRun.completedAt?.toISOString(),
            createdAt: testRun.createdAt.toISOString(),
          },
        });

        emitEvent('testRunSubmitted', {
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
          sourceLayer: event.sourceLayer,
          userId: event.userId,
          buildId: args.buildId,
          testRunId: testRun.id,
          testRun: {
            id: testRun.id,
            buildId: testRun.buildId,
            status: testRun.status,
            result: testRun.result,
            fileUrl: testRun.fileUrl,
            completedAt: testRun.completedAt?.toISOString(),
            createdAt: testRun.createdAt.toISOString(),
          },
        }).catch((err) => {
          console.error('Failed to emit TEST_RUN_SUBMITTED event:', err);
        });

        return testRun;
      },
};

export const mutationResolver = {
  Mutation: wrapResolvers(mutationFields, 'Mutation') as typeof mutationFields,
};
