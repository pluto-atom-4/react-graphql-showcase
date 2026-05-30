import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express, { type Request } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { parseTraceparent, tracingMiddleware } from '@repo/shared-tracing';
import { prisma } from './db/client';
import { createLoaders } from './dataloaders';
import { extractUserFromToken } from './middleware/auth';
import { tracingPlugin } from './plugins/tracing-plugin';
import { buildResolver } from './resolvers/Build';
import { mutationResolver } from './resolvers/Mutation';
import { queryResolver } from './resolvers/Query';
import type { BuildContext } from './types';

const PORT = parseInt(process.env.GRAPHQL_PORT || '4000', 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, 'schema.graphql');

export const typeDefs = fs.readFileSync(schemaPath, 'utf-8');
export const resolvers = [queryResolver, mutationResolver, buildResolver];

export function createApolloGraphQLServer(): ApolloServer<BuildContext> {
  return new ApolloServer<BuildContext>({
    typeDefs,
    resolvers,
    plugins: [tracingPlugin],
  });
}

export async function buildGraphQLContext(req: Request): Promise<BuildContext> {
  let user = null;
  try {
    user = extractUserFromToken(req.headers.authorization as string | string[] | undefined);
  } catch (error) {
    console.error(
      'Failed to extract user from token:',
      error instanceof Error ? error.message : error
    );
  }

  const loaders = createLoaders(prisma);
  const traceContext = req.traceContext ?? parseTraceparent(req.get('traceparent'));

  return {
    user,
    prisma,
    buildPartLoader: loaders.buildPartLoader,
    buildTestRunLoader: loaders.buildTestRunLoader,
    traceContext,
  };
}

export async function createGraphQLApp(): Promise<{
  app: express.Express;
  server: ApolloServer<BuildContext>;
}> {
  const server = createApolloGraphQLServer();
  await server.start();

  const app = express();
  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'traceparent', 'tracestate'],
    })
  );

  app.use(
    '/graphql',
    tracingMiddleware,
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => buildGraphQLContext(req),
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'graphql', port: PORT });
  });

  return { app, server };
}

export async function main(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.warn('✅ Database connection verified');

    const { app, server } = await createGraphQLApp();
    const listener = app.listen(PORT, () => {
      console.warn(`
╔════════════════════════════════════════╗
║   🚀 Apollo GraphQL Server Running    ║
╠════════════════════════════════════════╣
║ Server: http://localhost:${PORT}
║ GraphQL: http://localhost:${PORT}/graphql
║ Port: ${PORT}
║ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'postgresql://...'}
╚════════════════════════════════════════╝
      `);
    });

    process.on('SIGTERM', async () => {
      console.warn('SIGTERM received, shutting down gracefully');
      listener.close();
      await server.stop();
      await prisma.$disconnect();
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  void main();
}
