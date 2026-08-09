# Security Patterns

Protect against common web vulnerabilities in GraphQL and Express services.

## 1. CSRF Protection

```typescript
// backend-graphql/middleware/csrf.ts
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: false });

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: {
    didResolveOperation: (ctx) => {
      const token = ctx.req.headers['x-csrf-token'];
      if (!token) throw new Error('CSRF token required');
      // Verify token
    }
  }
});
```

## 2. Input Validation

```typescript
// backend-graphql/resolvers/Mutation.ts
import { z } from 'zod';

const CreateBuildInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10)
});

export const createBuild = async (_, { input }, ctx) => {
  const validated = CreateBuildInput.parse(input); // Throws on invalid
  return db.build.create({ data: validated });
};
```

## 3. Rate Limiting

```typescript
// backend-express/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/graphql', limiter);
app.use('/api/', limiter);
```

## 4. SQL Injection Prevention

```typescript
// Use parameterized queries (Prisma handles this)
// BAD: `SELECT * FROM builds WHERE id = '${id}'`
// GOOD:
const build = await db.build.findUnique({ where: { id } });
```

## 5. XSS Prevention

```typescript
// Escape HTML in resolvers
import DOMPurify from 'isomorphic-dompurify';

export const resolvers = {
  Query: {
    search: async (_, { query }) => {
      const safe = DOMPurify.sanitize(query);
      return db.build.findMany({
        where: { name: { contains: safe } }
      });
    }
  }
};
```

## 6. Environment Secrets

```typescript
// Use .env.local, never commit secrets
// backend-graphql/.env.local
JWT_SECRET=your_secret_here
DATABASE_URL=postgres://...
UPLOAD_KEY=api_key_here

// Access in code
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET required');
```

## Key Rules
1. Always validate input (schema, length, type)
2. Sanitize user-facing output
3. Use HTTPS in production
4. Rotate secrets periodically
5. Log security events
6. Never log sensitive data

## Audit Checklist
- [ ] All mutations require auth
- [ ] All inputs validated with Zod
- [ ] Secrets in environment variables
- [ ] Rate limiting enabled
- [ ] CORS configured restrictively
- [ ] SQL injection tests pass

## Links
- Auth Patterns: `auth-patterns.md`
- Backend GraphQL Instructions: `.github/instructions/backend-graphql.instructions.md`
