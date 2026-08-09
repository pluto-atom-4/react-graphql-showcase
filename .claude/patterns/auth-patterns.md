# Authentication & Authorization Patterns

User identification, permission checks, and protected resolvers.

## Authentication Flow
```
Browser → JWT in Authorization Header → GraphQL Context → currentUser
```

## 1. Extract User from JWT

```typescript
// backend-graphql/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const createContext = async ({ req }) => {
  let currentUser = null;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUser = await db.user.findUnique({
        where: { id: decoded.userId }
      });
    } catch (err) {
      console.error('Invalid token:', err.message);
    }
  }
  
  return { currentUser, db, loaders: ... };
};
```

## 2. Protect Resolvers

```typescript
// backend-graphql/resolvers/Query.ts
export const resolvers = {
  Query: {
    me: (_, __, { currentUser }) => {
      if (!currentUser) throw new Error('UNAUTHENTICATED');
      return currentUser;
    },
    
    builds: (_, __, { currentUser }) => {
      if (!currentUser) throw new Error('UNAUTHENTICATED');
      return db.build.findMany({ where: { userId: currentUser.id } });
    }
  }
};
```

## 3. Authorization Checks

```typescript
// Field-level authorization
export const resolvers = {
  Build: {
    owner: (build, _, { currentUser }) => {
      if (build.userId !== currentUser?.id) throw new Error('FORBIDDEN');
      return build.owner;
    }
  },
  
  Mutation: {
    updateBuild: (_, { id, ...input }, { currentUser }) => {
      const build = db.build.findUnique({ where: { id } });
      if (build.userId !== currentUser.id) {
        throw new Error('FORBIDDEN: Not build owner');
      }
      return db.build.update({ where: { id }, data: input });
    }
  }
};
```

## 4. Client-Side Token Management

```typescript
// frontend/lib/apollo.ts
const link = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

export const client = new ApolloClient({
  link: link.concat(httpLink),
  cache: new InMemoryCache()
});
```

## Key Rules
1. **Verify JWT in context creation** (before resolvers run)
2. **Check auth in every protected resolver**
3. **Throw UNAUTHENTICATED for missing token**
4. **Throw FORBIDDEN for insufficient permissions**
5. **Store token in secure httpOnly cookie** (production)
6. **Refresh token before expiry**

## Testing
```typescript
it('rejects unauthenticated requests', async () => {
  const result = await query(GET_ME, {}, { currentUser: null });
  expect(result.errors[0].message).toMatch('UNAUTHENTICATED');
});
```

## Links
- GraphQL Resolvers: `backend-graphql/src/resolvers/`
- Frontend Apollo: `frontend/lib/apollo.ts`
