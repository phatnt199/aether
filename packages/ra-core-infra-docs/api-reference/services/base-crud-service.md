# BaseCrudService

Base class for creating domain services with full CRUD (Create, Read, Update, Delete) operations using LoopBack filters.

## Import

```typescript
import { BaseCrudService } from '@minimaltech/ra-core-infra';
import type { Filter, Where } from '@loopback/filter';
```

## Signature

```typescript
class BaseCrudService<E extends { id: IdType; [extra: string | symbol]: any }>
  extends BaseService
  implements ICrudService<E>

interface ICrudServiceOptions {
  basePath: string;
}

constructor(opts: {
  scope: string;
  dataProvider: IDataProvider;
  serviceOptions: ICrudServiceOptions;
})
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `E` | Entity type (must have `id` property of type `IdType`) |

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts.scope` | `string` | Service name for logging |
| `opts.dataProvider` | `IDataProvider` | Data provider for API calls |
| `opts.serviceOptions` | `ICrudServiceOptions` | Service configuration |
| `opts.serviceOptions.basePath` | `string` | Base API path (e.g., `"users"`) |

## Description

`BaseCrudService` provides a complete CRUD abstraction layer for domain entities. It encapsulates data access logic using LoopBack filter syntax and delegates HTTP requests to a data provider.

**When to use**:
- Create domain-specific services (UserService, ProductService, etc.)
- Encapsulate business logic alongside data access
- Use type-safe LoopBack filters for querying
- Maintain separation between UI and data layers

**Key features**:
- 9 CRUD methods covering all common operations
- LoopBack filter support (where, fields, include, order, limit, skip)
- TypeScript generics for type safety
- Promise-based async API
- Built-in logging via BaseService

## Methods

### find()

Retrieve multiple records with optional filtering.

**Signature**:
```typescript
find(filter: Filter<E>): Promise<(E & EntityRelationType)[]>
```

**Parameters**:
- `filter` - LoopBack filter (where, fields, include, order, limit, skip)

**Returns**: Array of entities matching the filter

**Example**:
```typescript
// Get all active users, sorted by name
const users = await userService.find({
  where: { status: 'active' },
  order: ['name ASC'],
  limit: 10,
  fields: { id: true, name: true, email: true },
});
```

---

### findById()

Retrieve a single record by ID.

**Signature**:
```typescript
findById(id: IdType, filter: Filter<E>): Promise<E & EntityRelationType>
```

**Parameters**:
- `id` - Record ID
- `filter` - LoopBack filter (for including relations, selecting fields)

**Returns**: Single entity

**Example**:
```typescript
// Get user with their posts included
const user = await userService.findById('user-123', {
  include: [{ relation: 'posts' }],
});
```

---

### findOne()

Retrieve the first record matching a filter.

**Signature**:
```typescript
findOne(filter: Filter<E>): Promise<(E & EntityRelationType) | null>
```

**Parameters**:
- `filter` - LoopBack filter

**Returns**: First matching entity or `null`

**Example**:
```typescript
// Get the most recent post
const latestPost = await postService.findOne({
  order: ['createdAt DESC'],
  limit: 1,
});
```

---

### count()

Count records matching a condition.

**Signature**:
```typescript
count(where: Where<E>): Promise<{ count: number }>
```

**Parameters**:
- `where` - LoopBack where filter

**Returns**: Object with `count` property

**Example**:
```typescript
// Count active users
const result = await userService.count({ status: 'active' });
console.log(result.count); // 42
```

---

### create()

Create a new record.

**Signature**:
```typescript
create(data: Omit<E, 'id'>): Promise<E>
```

**Parameters**:
- `data` - Entity data (without `id`)

**Returns**: Created entity (with generated `id`)

**Example**:
```typescript
const newUser = await userService.create({
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active',
});
console.log(newUser.id); // Generated ID
```

---

### updateAll()

Update multiple records matching a condition.

**Signature**:
```typescript
updateAll(data: Partial<E>, where: Where<E>): Promise<{ count: number }>
```

**Parameters**:
- `data` - Partial entity data (fields to update)
- `where` - LoopBack where filter (which records to update)

**Returns**: Object with `count` of updated records

**Example**:
```typescript
// Deactivate all inactive users
const result = await userService.updateAll(
  { status: 'archived' },
  { lastLoginAt: { lt: '2023-01-01' } }
);
console.log(`Updated ${result.count} users`);
```

---

### updateById()

Update a single record by ID (partial update).

**Signature**:
```typescript
updateById(id: IdType, data: Partial<E>): Promise<E>
```

**Parameters**:
- `id` - Record ID
- `data` - Partial entity data (fields to update)

**Returns**: Updated entity

**HTTP Method**: PATCH

**Example**:
```typescript
// Update user's email
const updated = await userService.updateById('user-123', {
  email: 'newemail@example.com',
});
```

---

### replaceById()

Replace a single record by ID (full replacement).

**Signature**:
```typescript
replaceById(id: IdType, data: E): Promise<E>
```

**Parameters**:
- `id` - Record ID
- `data` - Complete entity data (all required fields)

**Returns**: Replaced entity

**HTTP Method**: PUT

**Example**:
```typescript
// Replace entire user object
const replaced = await userService.replaceById('user-123', {
  id: 'user-123',
  name: 'John Updated',
  email: 'john@example.com',
  status: 'active',
  // ... all other required fields
});
```

---

### deleteById()

Delete a single record by ID.

**Signature**:
```typescript
deleteById(id: IdType): Promise<{ id: IdType }>
```

**Parameters**:
- `id` - Record ID

**Returns**: Object with deleted record's `id`

**Example**:
```typescript
await userService.deleteById('user-123');
```

## Complete Example

### Creating a Custom Service

```typescript
import { injectable } from '@venizia/ignis-inversion';
import { BaseCrudService } from '@minimaltech/ra-core-infra';
import type { IDataProvider, IdType } from '@minimaltech/ra-core-infra';

// Define your entity
interface User {
  id: IdType;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Create service
@injectable()
export class UserService extends BaseCrudService<User> {
  constructor(dataProvider: IDataProvider) {
    super({
      scope: 'UserService',
      dataProvider,
      serviceOptions: {
        basePath: 'users', // API endpoint: /users
      },
    });
  }

  // Add custom methods
  async findActiveUsers() {
    return this.find({
      where: { status: 'active' },
      order: ['createdAt DESC'],
    });
  }

  async activateUser(id: IdType) {
    return this.updateById(id, { status: 'active' });
  }

  async deactivateUser(id: IdType) {
    return this.updateById(id, { status: 'inactive' });
  }

  async searchByEmail(email: string) {
    return this.findOne({
      where: { email: { like: `%${email}%` } },
    });
  }
}
```

### Registering the Service

```typescript
import { BaseRaApplication } from '@minimaltech/ra-core-infra';
import { UserService } from '@/services/UserService';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register service
    this.service(UserService);
  }
}
```

### Using in Components

```typescript
import React from 'react';
import { useInjectable } from '@minimaltech/ra-core-infra';
import { UserService } from '@/services/UserService';

function UserList() {
  const userService = useInjectable<UserService>({ key: 'UserService' });
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    userService.findActiveUsers().then(setUsers);
  }, [userService]);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## LoopBack Filter Examples

### Basic Filtering

```typescript
// Exact match
userService.find({
  where: { status: 'active' }
});

// Multiple conditions (AND)
userService.find({
  where: {
    status: 'active',
    role: 'admin',
  }
});

// OR conditions
userService.find({
  where: {
    or: [
      { status: 'active' },
      { role: 'admin' },
    ],
  }
});
```

### Comparison Operators

```typescript
// Greater than
userService.find({
  where: { age: { gt: 18 } }
});

// Less than or equal
userService.find({
  where: { age: { lte: 65 } }
});

// Between (range)
userService.find({
  where: {
    createdAt: {
      gte: '2024-01-01',
      lte: '2024-12-31',
    },
  }
});

// In array
userService.find({
  where: { status: { inq: ['active', 'pending'] } }
});

// Like (pattern matching)
userService.find({
  where: { email: { like: '%@example.com' } }
});
```

### Sorting and Pagination

```typescript
// Sort ascending
userService.find({
  order: ['name ASC']
});

// Sort descending
userService.find({
  order: ['createdAt DESC']
});

// Multiple sort fields
userService.find({
  order: ['status ASC', 'name ASC']
});

// Pagination
userService.find({
  limit: 10,
  skip: 20, // Page 3 (assuming 10 per page)
  order: ['createdAt DESC'],
});
```

### Field Selection

```typescript
// Include specific fields only
userService.find({
  fields: { id: true, name: true, email: true },
});

// Exclude specific fields
userService.find({
  fields: { password: false, internalNotes: false },
});
```

### Including Relations

```typescript
// Include related entities
userService.findById('user-123', {
  include: [
    { relation: 'posts' },
    { relation: 'comments' },
  ],
});

// Include with filter
userService.findById('user-123', {
  include: [
    {
      relation: 'posts',
      scope: {
        where: { published: true },
        order: ['createdAt DESC'],
        limit: 5,
      },
    },
  ],
});
```

## Related APIs

- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Data provider used by service
- [BaseService](/api-reference/services/base-service) - Parent class with logging
- [useInjectable](/api-reference/hooks/use-injectable) - Inject service in components
- [LoopBack Filter](https://loopback.io/doc/en/lb4/Querying-data.html) - Filter syntax documentation

## Common Issues

### TypeScript: Generic type errors

**Cause**: Entity type doesn't extend `{ id: IdType }`.

**Solution**: Ensure your entity has an `id` property:

```typescript
interface User {
  id: IdType;  // Required!
  name: string;
  // ... other fields
}
```

### create() expects id in data

**Cause**: Passing `id` field when creating (use `Omit<E, 'id'>`).

**Solution**: Don't include `id` when creating:

```typescript
// ❌ Wrong
userService.create({ id: '123', name: 'John' });

// ✅ Correct
userService.create({ name: 'John' });
```

### replaceById() vs updateById()

**Confusion**: When to use PUT vs PATCH?

**Answer**:
- **updateById (PATCH)**: Partial update - only send changed fields
- **replaceById (PUT)**: Full replacement - send all required fields

```typescript
// Partial update (only email)
await service.updateById('123', { email: 'new@example.com' });

// Full replacement (must include all fields)
await service.replaceById('123', {
  id: '123',
  name: 'John',
  email: 'new@example.com',
  status: 'active',
  // ... all other required fields
});
```

### LoopBack filter syntax errors

**Cause**: Invalid filter object structure.

**Solution**: Use TypeScript types from `@loopback/filter`:

```typescript
import type { Filter, Where } from '@loopback/filter';

// Type-safe filter
const filter: Filter<User> = {
  where: { status: 'active' },
  order: ['name ASC'],
};
```

## Best Practices

### 1. Extend for Domain Logic

Add business logic methods to your custom services:

```typescript
@injectable()
export class UserService extends BaseCrudService<User> {
  // Domain-specific methods
  async promoteToAdmin(userId: IdType) {
    const user = await this.findById(userId, {});
    if (user.role !== 'user') {
      throw new Error('Only regular users can be promoted');
    }
    return this.updateById(userId, { role: 'admin' });
  }

  async getUserStats(userId: IdType) {
    const user = await this.findById(userId, {
      include: [{ relation: 'posts' }, { relation: 'comments' }],
    });
    return {
      totalPosts: user.posts?.length ?? 0,
      totalComments: user.comments?.length ?? 0,
    };
  }
}
```

### 2. Use Type-Safe Filters

Leverage TypeScript for filter type safety:

```typescript
// Define filter type
type UserFilter = Filter<User>;

const activeUsersFilter: UserFilter = {
  where: { status: 'active' },
  order: ['name ASC'],
};

// Use in method
async function getActiveUsers(service: UserService) {
  return service.find(activeUsersFilter);
}
```

### 3. Handle Errors Gracefully

Wrap service calls in try-catch:

```typescript
async function deleteUser(id: IdType) {
  try {
    await userService.deleteById(id);
    console.log('User deleted');
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new Error('Could not delete user');
  }
}
```

### 4. Extract Common Filters

Define reusable filter constants:

```typescript
// constants/filters.ts
export const FILTERS = {
  ACTIVE_USERS: {
    where: { status: 'active' },
  },
  RECENT_POSTS: {
    order: ['createdAt DESC'],
    limit: 10,
  },
} as const;

// Usage
userService.find(FILTERS.ACTIVE_USERS);
```

### 5. Combine with TanStack Query

Integrate with React Query for caching:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useInjectable } from '@minimaltech/ra-core-infra';

function useUsers() {
  const userService = useInjectable<UserService>({ key: 'UserService' });

  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.find({}),
  });
}
```

## Performance Tips

1. **Use field selection**: Only fetch fields you need with `fields` filter
2. **Paginate large datasets**: Use `limit` and `skip` for pagination
3. **Index where filters**: Ensure database indexes match your `where` conditions
4. **Batch operations**: Use `updateAll` instead of multiple `updateById` calls
5. **Cache aggressively**: Combine with TanStack Query for client-side caching

## See Also

- [CRUD Operations Guide](/guides/data-providers/crud-operations) - Detailed CRUD guide
- [LoopBack Filters Guide](/guides/data-providers/loopback-filters) - Filter syntax guide
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Data provider API
- [LoopBack Documentation](https://loopback.io/doc/en/lb4/Querying-data.html) - Official filter docs

---

**Next**: Learn about [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) to understand the underlying data layer.
